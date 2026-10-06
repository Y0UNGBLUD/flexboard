import {
  useCallback,
  useState,
  type DragEvent as ReactDragEvent,
  type RefObject,
} from "react";

import {
  detectDropTarget,
  type DropTarget,
  type PanelRect,
} from "@flexboard/core";

export interface UseExternalPanelDropOptions {
  boardElement: RefObject<HTMLElement | null>;

  panels: () => PanelRect[];

  enabled?: boolean;

  margin?: number;
  splitRatio?: number;

  onDrop: (target: DropTarget) => void;
}

export function useExternalPanelDrop({
  boardElement,
  panels,
  enabled = true,
  margin = 0,
  splitRatio = 0.5,
  onDrop,
}: UseExternalPanelDropOptions) {
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  /**
   * 외부 drag source가 board 위에서 이동할 때 호출한다.
   *
   * viewport 좌표를 board 내부 좌표로 변환한 뒤
   * Core의 detectDropTarget()으로 drop 위치를 계산한다.
   */
  const handleDragOver = useCallback(
    (event: ReactDragEvent<HTMLElement>) => {
      if (!enabled) {
        return;
      }

      const board = boardElement.current;

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

      setDropTarget(target);
    },
    [boardElement, enabled, margin, panels, splitRatio],
  );

  /**
   * board 바깥으로 drag source가 빠져나가면
   * preview를 제거한다.
   *
   * 자식 element 사이를 이동할 때도 dragleave가
   * 발생할 수 있으므로 relatedTarget이 board 내부라면
   * 상태를 유지한다.
   */
  const handleDragLeave = useCallback(
    (event: ReactDragEvent<HTMLElement>) => {
      if (!enabled) {
        return;
      }

      const board = boardElement.current;

      if (!board) {
        return;
      }

      const relatedTarget = event.relatedTarget as Node | null;

      if (relatedTarget && board.contains(relatedTarget)) {
        return;
      }

      setDropTarget(null);
    },
    [boardElement, enabled],
  );

  /**
   * 실제 drop.
   *
   * 여기서는 layout을 변경하지 않는다.
   * FlexBoard는 어디에 drop되었는지만 알려준다.
   *
   * 실제 패널 생성 / insertPanelNear() 호출은
   * 라이브러리 사용자의 책임이다.
   */
  const handleDrop = useCallback(
    (event: ReactDragEvent<HTMLElement>) => {
      if (!enabled) {
        return;
      }

      event.preventDefault();

      if (dropTarget) {
        onDrop(dropTarget);
      }

      setDropTarget(null);
    },
    [dropTarget, enabled, onDrop],
  );

  /**
   * 외부에서 dragend가 발생하는 등
   * 명시적으로 상태를 제거해야 할 때 사용할 수 있다.
   */
  const clear = useCallback(() => {
    setDropTarget(null);
  }, []);

  return {
    dropTarget,

    handleDragOver,
    handleDragLeave,
    handleDrop,

    clear,
  };
}
