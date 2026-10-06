import { onBeforeUnmount, shallowRef, type Ref } from "vue";

import {
  detectDropTarget,
  movePanel,
  type DropTarget,
  type LayoutNode,
  type PanelRect,
} from "@flexboard/core";

export interface UsePanelDragOptions {
  boardElement: Ref<HTMLElement | null>;

  layout: () => LayoutNode;
  panels: () => PanelRect[];

  threshold?: number;
  margin?: number;
  splitRatio?: number;

  onUpdate: (layout: LayoutNode) => void;
}

interface DragState {
  sourcePanelId: string;
  pointerId: number;

  startX: number;
  startY: number;

  dragging: boolean;
}

export function usePanelDrag({
  boardElement,
  layout,
  panels,
  threshold = 5,
  margin = 0,
  splitRatio = 0.5,
  onUpdate,
}: UsePanelDragOptions) {
  const dropTarget = shallowRef<DropTarget | null>(null);

  const isDragging = shallowRef(false);

  let state: DragState | null = null;

  /**
   * 패널 drag 시작 후보 등록
   *
   * 아직 실제 drag 상태로 전환하지 않는다.
   * threshold 이상 이동해야 dragging = true가 된다.
   */
  function startDrag(panelId: string, event: PointerEvent): void {
    if (state) {
      return;
    }

    // 기본 버튼이 아닌 마우스 입력은 무시
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    state = {
      sourcePanelId: panelId,
      pointerId: event.pointerId,

      startX: event.clientX,
      startY: event.clientY,

      dragging: false,
    };

    window.addEventListener("pointermove", handlePointerMove);

    window.addEventListener("pointerup", handlePointerUp);

    window.addEventListener("pointercancel", handlePointerCancel);
  }

  function handlePointerMove(event: PointerEvent): void {
    if (!state || event.pointerId !== state.pointerId) {
      return;
    }

    /**
     * 아직 drag가 시작되지 않았다면
     * 시작점과 현재 위치 사이의 거리를 검사한다.
     */
    if (!state.dragging) {
      const deltaX = event.clientX - state.startX;

      const deltaY = event.clientY - state.startY;

      const distance = Math.hypot(deltaX, deltaY);

      if (distance < threshold) {
        return;
      }

      state.dragging = true;
      isDragging.value = true;
    }

    event.preventDefault();

    const board = boardElement.value;

    if (!board) {
      dropTarget.value = null;
      return;
    }

    /**
     * PointerEvent 좌표는 viewport 기준이고,
     * Core의 PanelRect는 FlexBoard 내부 기준이다.
     *
     * 따라서 board 좌표계로 변환한다.
     */
    const boardRect = board.getBoundingClientRect();

    const point = {
      left: event.clientX - boardRect.left,

      top: event.clientY - boardRect.top,
    };

    dropTarget.value = detectDropTarget(point, panels(), {
      excludeId: state.sourcePanelId,
      margin,
      splitRatio,
    });
  }

  function handlePointerUp(event: PointerEvent): void {
    if (!state || event.pointerId !== state.pointerId) {
      return;
    }

    const sourcePanelId = state.sourcePanelId;
    const target = dropTarget.value;

    // drag가 실제로 시작됐고
    // 유효한 drop target이 존재할 때만 이동
    if (state.dragging && target) {
      const nextLayout = movePanel(
        layout(),
        sourcePanelId,
        target.targetId,
        target.direction,
      );

      if (nextLayout !== layout()) {
        onUpdate(nextLayout);
      }
    }

    stopDrag();
  }

  function handlePointerCancel(event: PointerEvent): void {
    if (!state || event.pointerId !== state.pointerId) {
      return;
    }

    stopDrag();
  }

  function stopDrag(): void {
    state = null;

    isDragging.value = false;
    dropTarget.value = null;

    window.removeEventListener("pointermove", handlePointerMove);

    window.removeEventListener("pointerup", handlePointerUp);

    window.removeEventListener("pointercancel", handlePointerCancel);
  }

  onBeforeUnmount(() => {
    stopDrag();
  });

  return {
    isDragging,
    dropTarget,
    startDrag,
    stopDrag,
  };
}
