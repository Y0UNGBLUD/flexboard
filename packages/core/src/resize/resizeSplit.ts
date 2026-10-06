import type { LayoutNode } from "../types/layout.js";
import type { Size } from "../types/geometry.js";
import type { ResizeSplitOptions } from "./types.js";
import { calculateChildSizes } from "../geometry/calculateChildSizes.js";

export function resizeSplit(
  node: LayoutNode,
  splitId: string,
  delta: number,
  containerSize: Size,
  options: ResizeSplitOptions = {},
): LayoutNode {
  const { minRatio = 0.1, maxRatio = 0.9, dividerSize = 10 } = options;

  // ActualNode에는 resize할 split이 없음
  if (node.type === "actual") {
    return node;
  }

  // resize 대상 SplitNode를 찾음
  if (node.id === splitId) {
    const totalSize =
      node.orientation === "H" ? containerSize.width : containerSize.height;

    if (totalSize <= 0) {
      throw new RangeError("Container size must be greater than 0.");
    }

    const deltaRatio = delta / totalSize;

    const nextSize = Math.min(
      maxRatio,
      Math.max(minRatio, node.size + deltaRatio),
    );

    return {
      ...node,
      size: nextSize,
    };
  }

  // 현재 SplitNode가 차지하는 영역을 기준으로
  // 두 자식의 실제 크기를 계산
  const { first: firstSize, second: secondSize } = calculateChildSizes(
    node,
    containerSize,
    dividerSize,
  );

  // first subtree 탐색
  const first = resizeSplit(node.first, splitId, delta, firstSize, options);

  if (first !== node.first) {
    return {
      ...node,
      first,
    };
  }

  // second subtree 탐색
  const second = resizeSplit(node.second, splitId, delta, secondSize, options);

  if (second !== node.second) {
    return {
      ...node,
      second,
    };
  }

  // 대상 split을 찾지 못함
  return node;
}
