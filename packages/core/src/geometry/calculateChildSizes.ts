import type { SplitNode } from "../types/layout.js";
import type { Size } from "../types/geometry.js";

export interface ChildSizes {
  first: Size;
  second: Size;
}

/**
 * SplitNode의 orientation과 size를 기준으로
 * 두 자식 영역의 크기를 계산한다.
 */
export function calculateChildSizes(
  node: SplitNode,
  containerSize: Size,
  dividerSize: number,
): ChildSizes {
  const ratio = Math.max(0, Math.min(1, node.size));

  // H = 좌 / 우
  if (node.orientation === "H") {
    const availableWidth = containerSize.width - dividerSize;

    return {
      first: {
        width: availableWidth * ratio,
        height: containerSize.height,
      },

      second: {
        width: availableWidth * (1 - ratio),
        height: containerSize.height,
      },
    };
  }

  // V = 상 / 하
  const availableHeight = containerSize.height - dividerSize;

  return {
    first: {
      width: containerSize.width,
      height: availableHeight * ratio,
    },

    second: {
      width: containerSize.width,
      height: availableHeight * (1 - ratio),
    },
  };
}
