import { calculateChildSizes } from "./calculateChildSizes.js";
import type { LayoutNode } from "../types/layout.js";
import type {
  DividerRect,
  LayoutRects,
  PanelRect,
  Point,
  Size,
} from "../types/geometry.js";
/**
 * 레이아웃 트리를 실제 패널 / 디바이더 좌표로 변환한다.
 */
export function calculateLayout(
  root: LayoutNode,
  size: Size,
  dividerSize = 10,
): LayoutRects {
  if (dividerSize < 0) {
    throw new RangeError("Divider size must be greater than or equal to 0.");
  }

  const panels: PanelRect[] = [];
  const dividers: DividerRect[] = [];

  /**
   * 레이아웃 트리를 재귀적으로 순회하며
   * 패널과 디바이더의 위치 / 크기를 계산한다.
   */
  function traverse(node: LayoutNode, size: Size, offset: Point): void {
    // 실제 패널
    if (node.type === "actual") {
      panels.push({
        type: "panel",
        id: node.id,
        top: offset.top,
        left: offset.left,
        width: size.width,
        height: size.height,
      });

      return;
    }

    // H = 좌 / 우 분할
    if (node.orientation === "H") {
      if (size.width <= dividerSize) {
        throw new RangeError(
          "Container width must be greater than divider size.",
        );
      }

      const { first: firstSize, second: secondSize } = calculateChildSizes(
        node,
        size,
        dividerSize,
      );

      const firstOffset: Point = {
        top: offset.top,
        left: offset.left,
      };

      const dividerOffset: Point = {
        top: offset.top,
        left: offset.left + firstSize.width,
      };

      const secondOffset: Point = {
        top: offset.top,
        left: dividerOffset.left + dividerSize,
      };

      dividers.push({
        type: "divider",
        id: node.id,
        orientation: node.orientation,
        top: dividerOffset.top,
        left: dividerOffset.left,
        width: dividerSize,
        height: size.height,
      });

      traverse(node.first, firstSize, firstOffset);

      traverse(node.second, secondSize, secondOffset);

      return;
    }

    // V = 상 / 하 분할
    if (size.height <= dividerSize) {
      throw new RangeError(
        "Container height must be greater than divider size.",
      );
    }

    const { first: firstSize, second: secondSize } = calculateChildSizes(
      node,
      size,
      dividerSize,
    );

    const firstOffset: Point = {
      top: offset.top,
      left: offset.left,
    };

    const dividerOffset: Point = {
      top: offset.top + firstSize.height,
      left: offset.left,
    };

    const secondOffset: Point = {
      top: dividerOffset.top + dividerSize,
      left: offset.left,
    };

    dividers.push({
      type: "divider",
      id: node.id,
      orientation: node.orientation,
      top: dividerOffset.top,
      left: dividerOffset.left,
      width: size.width,
      height: dividerSize,
    });

    traverse(node.first, firstSize, firstOffset);

    traverse(node.second, secondSize, secondOffset);
  }

  traverse(root, size, {
    top: 0,
    left: 0,
  });

  return {
    panels,
    dividers,
  };
}
