import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import {
  detectDropTarget,
  movePanel,
  type DropTarget,
  type LayoutNode,
  type PanelRect,
} from "@flexboard/core";

export interface UsePanelDragOptions {
  layout: LayoutNode;

  boardElement: React.RefObject<HTMLElement | null>;

  panels: () => PanelRect[];

  threshold?: number;
  margin?: number;
  splitRatio?: number;

  onLayoutChange: (layout: LayoutNode) => void;
}

interface DragState {
  sourcePanelId: string;

  startX: number;
  startY: number;
}

export function usePanelDrag({
  layout,
  boardElement,
  panels,
  threshold = 5,
  margin = 0,
  splitRatio = 0.5,
  onLayoutChange,
}: UsePanelDragOptions) {
  const dragState = useRef<DragState | null>(null);

  /**
   * pointerup 시 최신 layout을 사용하기 위한 ref.
   */
  const layoutRef = useRef(layout);

  layoutRef.current = layout;

  const [isDragging, setIsDragging] = useState(false);

  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  const clear = useCallback(() => {
    dragState.current = null;

    setIsDragging(false);
    setDropTarget(null);
  }, []);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const state = dragState.current;

      if (!state) {
        return;
      }

      const deltaX = event.clientX - state.startX;

      const deltaY = event.clientY - state.startY;

      const distance = Math.hypot(deltaX, deltaY);

      /**
       * 아직 실제 drag가 시작되지 않았다면
       * threshold를 넘어야 한다.
       */
      if (!isDragging && distance < threshold) {
        return;
      }

      const board = boardElement.current;

      if (!board) {
        return;
      }

      const boardRect = board.getBoundingClientRect();

      const point = {
        left: event.clientX - boardRect.left,

        top: event.clientY - boardRect.top,
      };

      const target = detectDropTarget(point, panels(), {
        excludeId: state.sourcePanelId,

        margin,
        splitRatio,
      });

      setIsDragging(true);
      setDropTarget(target);
    },
    [boardElement, isDragging, margin, panels, splitRatio, threshold],
  );

  const handlePointerUp = useCallback(() => {
    const state = dragState.current;

    if (state && isDragging && dropTarget) {
      const nextLayout = movePanel(
        layoutRef.current,
        state.sourcePanelId,
        dropTarget.targetId,
        dropTarget.direction,
      );

      onLayoutChange(nextLayout);
    }

    clear();
  }, [clear, dropTarget, isDragging, onLayoutChange]);

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove);

    window.addEventListener("pointerup", handlePointerUp);

    window.addEventListener("pointercancel", clear);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);

      window.removeEventListener("pointerup", handlePointerUp);

      window.removeEventListener("pointercancel", clear);
    };
  }, [clear, handlePointerMove, handlePointerUp]);

  function startDrag(panelId: string, event: ReactPointerEvent): void {
    if (event.button !== 0) {
      return;
    }

    dragState.current = {
      sourcePanelId: panelId,

      startX: event.clientX,
      startY: event.clientY,
    };
  }

  return {
    isDragging,
    dropTarget,
    startDrag,
    clear,
  };
}
