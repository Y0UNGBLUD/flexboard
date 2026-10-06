import { useCallback, useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { resizeSplit, type LayoutNode, type Size } from "@flexboard/core";

export interface UseDividerResizeOptions {
  layout: LayoutNode;

  containerSize: Size;

  dividerSize?: number;
  minRatio?: number;
  maxRatio?: number;

  onLayoutChange: (layout: LayoutNode) => void;
}

interface ResizeState {
  splitId: string;
  orientation: "H" | "V";

  startX: number;
  startY: number;

  /**
   * resize 시작 당시의 layout.
   *
   * pointermove마다 직전 결과를 다시 resize하지 않고,
   * 시작 layout + 누적 delta로 계산한다.
   */
  layout: LayoutNode;
}

export function useDividerResize({
  layout,
  containerSize,
  dividerSize = 10,
  minRatio = 0.1,
  maxRatio = 0.9,
  onLayoutChange,
}: UseDividerResizeOptions) {
  const resizeState = useRef<ResizeState | null>(null);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const state = resizeState.current;

      if (!state) {
        return;
      }

      const delta =
        state.orientation === "H"
          ? event.clientX - state.startX
          : event.clientY - state.startY;

      const nextLayout = resizeSplit(
        state.layout,
        state.splitId,
        delta,
        containerSize,
        {
          dividerSize,
          minRatio,
          maxRatio,
        },
      );

      onLayoutChange(nextLayout);
    },
    [containerSize, dividerSize, minRatio, maxRatio, onLayoutChange],
  );

  const handlePointerUp = useCallback(() => {
    resizeState.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove);

    window.addEventListener("pointerup", handlePointerUp);

    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);

      window.removeEventListener("pointerup", handlePointerUp);

      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  function startResize(
    splitId: string,
    orientation: "H" | "V",
    event: ReactPointerEvent,
  ): void {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();

    resizeState.current = {
      splitId,
      orientation,

      startX: event.clientX,
      startY: event.clientY,

      layout,
    };
  }

  return {
    startResize,
  };
}
