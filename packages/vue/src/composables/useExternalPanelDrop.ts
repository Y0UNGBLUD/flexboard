import { shallowRef, type Ref } from "vue";

import {
  detectDropTarget,
  type DropTarget,
  type PanelRect,
} from "@flexboard/core";

export interface UseExternalPanelDropOptions {
  boardElement: Ref<HTMLElement | null>;

  panels: () => PanelRect[];

  enabled?: () => boolean;

  margin?: number;
  splitRatio?: number;

  onDrop: (target: DropTarget) => void;
}

export function useExternalPanelDrop({
  boardElement,
  panels,
  enabled = () => true,
  margin = 0,
  splitRatio = 0.5,
  onDrop,
}: UseExternalPanelDropOptions) {
  const dropTarget = shallowRef<DropTarget | null>(null);

  const isExternalDragging = shallowRef(false);

  /**
   * 외부 drag source가 board 위에서 이동
   */
  function handleDragOver(event: DragEvent): void {
    if (!enabled()) {
      return;
    }

    const board = boardElement.value;

    if (!board) {
      return;
    }

    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }

    const boardRect = board.getBoundingClientRect();

    const point = {
      left: event.clientX - boardRect.left,
      top: event.clientY - boardRect.top,
    };

    const target = detectDropTarget(point, panels(), {
      margin,
      splitRatio,
    });

    dropTarget.value = target;
    isExternalDragging.value = target !== null;
  }

  /**
   * board에서 drag가 완전히 빠져나간 경우
   */
  function handleDragLeave(event: DragEvent): void {
    if (!enabled()) {
      return;
    }

    const board = boardElement.value;

    if (!board) {
      return;
    }

    const relatedTarget = event.relatedTarget as Node | null;

    /**
     * board의 자식 element 사이를 이동한 경우
     * dragleave가 발생해도 무시한다.
     */
    if (relatedTarget && board.contains(relatedTarget)) {
      return;
    }

    clear();
  }

  /**
   * 실제 drop
   *
   * 여기서는 layout을 변경하지 않는다.
   * drop 위치만 외부로 전달한다.
   */
  function handleDrop(event: DragEvent): void {
    if (!enabled()) {
      return;
    }

    event.preventDefault();

    const target = dropTarget.value;

    if (target) {
      onDrop(target);
    }

    clear();
  }

  function clear(): void {
    dropTarget.value = null;
    isExternalDragging.value = false;
  }

  return {
    dropTarget,
    isExternalDragging,

    handleDragOver,
    handleDragLeave,
    handleDrop,
    clear,
  };
}
