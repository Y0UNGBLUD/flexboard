import { onBeforeUnmount, type Ref } from "vue";

import {
  resizeSplit,
  type DividerRect,
  type LayoutNode,
  type Size,
} from "@flexboard/core";

export interface UseDividerResizeOptions {
  layout: () => LayoutNode;
  boardSize: Ref<Size>;
  dividerSize?: number;
  minRatio?: number;
  maxRatio?: number;
  onUpdate: (layout: LayoutNode) => void;
}

interface ResizeState {
  splitId: string;
  orientation: "H" | "V";
  pointerId: number;
  previousPosition: number;
}

export function useDividerResize({
  layout,
  boardSize,
  dividerSize = 10,
  minRatio = 0.1,
  maxRatio = 0.9,
  onUpdate,
}: UseDividerResizeOptions) {
  let state: ResizeState | null = null;

  /**
   * divider resize 시작
   */
  function startResize(divider: DividerRect, event: PointerEvent): void {
    // 다른 pointer로 resize 중이면 무시
    if (state) {
      return;
    }

    event.preventDefault();

    const position =
      divider.orientation === "H" ? event.clientX : event.clientY;

    state = {
      splitId: divider.id,
      orientation: divider.orientation,
      pointerId: event.pointerId,
      previousPosition: position,
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  }

  /**
   * pointer 이동량을 Core의 resize delta로 변환
   */
  function handlePointerMove(event: PointerEvent): void {
    if (!state || event.pointerId !== state.pointerId) {
      return;
    }

    const currentPosition =
      state.orientation === "H" ? event.clientX : event.clientY;

    const delta = currentPosition - state.previousPosition;

    if (delta === 0) {
      return;
    }

    const nextLayout = resizeSplit(
      layout(),
      state.splitId,
      delta,
      boardSize.value,
      {
        dividerSize,
        minRatio,
        maxRatio,
      },
    );

    state.previousPosition = currentPosition;

    if (nextLayout !== layout()) {
      onUpdate(nextLayout);
    }
  }

  /**
   * resize 종료
   */
  function handlePointerUp(event: PointerEvent): void {
    if (!state || event.pointerId !== state.pointerId) {
      return;
    }

    stopResize();
  }

  function stopResize(): void {
    state = null;

    window.removeEventListener("pointermove", handlePointerMove);

    window.removeEventListener("pointerup", handlePointerUp);

    window.removeEventListener("pointercancel", handlePointerUp);
  }

  onBeforeUnmount(() => {
    stopResize();
  });

  return {
    startResize,
    stopResize,
  };
}
