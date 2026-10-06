import { generateId } from "../utils/id.js";
import type { LayoutNode, ActualNode, SplitNode } from "../types/layout.js";
import type { DropDirection } from "../dnd/types.js";
/**
 * 패널 추가
 */
export function addPanelToLayout(
  layout: LayoutNode,
  newPanelId: string,
): LayoutNode {
  const newNode: ActualNode = {
    type: "actual",
    id: newPanelId,
  };

  const wrappedLayout: SplitNode = {
    type: "split",
    id: generateId(),
    orientation: "H", // 기본 방향
    size: 0.8, // 기존 영역 유지 비율
    first: layout,
    second: newNode,
  };

  return wrappedLayout;
}

/**
 * 패널 삭제
 */
export function removePanel(
  node: LayoutNode,
  panelId: string,
): LayoutNode | null {
  if (node.type === "actual") {
    return node.id === panelId ? null : node;
  }

  const first = removePanel(node.first, panelId);

  // first가 삭제됨
  if (!first) {
    return node.second;
  }

  // first subtree에서 변화가 발생함
  if (first !== node.first) {
    return {
      ...node,
      first,
    };
  }

  const second = removePanel(node.second, panelId);

  // second가 삭제됨
  if (!second) {
    return node.first;
  }

  // second subtree에서 변화가 발생함
  if (second !== node.second) {
    return {
      ...node,
      second,
    };
  }

  // 어디에서도 삭제되지 않음
  return node;
}

/**
 * 패널을 대상 패널의 인접 영역에 추가한다.
 *
 * 원본 트리는 변경하지 않는다.
 */
export function insertPanelNear(
  node: LayoutNode,
  targetId: string,
  newPanelId: string,
  direction: DropDirection,
  splitRatio = 0.5,
): LayoutNode | null {
  if (node.type === "actual") {
    if (node.id !== targetId) {
      return null;
    }

    const isHorizontal = direction === "left" || direction === "right";

    const isBefore = direction === "left" || direction === "top";

    const newPanel: ActualNode = {
      type: "actual",
      id: newPanelId,
    };

    const ratio = Math.max(0, Math.min(1, splitRatio));

    return {
      type: "split",
      id: generateId(),
      orientation: isHorizontal ? "H" : "V",
      size: isBefore ? ratio : 1 - ratio,
      first: isBefore ? newPanel : node,
      second: isBefore ? node : newPanel,
    };
  }

  const first = insertPanelNear(
    node.first,
    targetId,
    newPanelId,
    direction,
    splitRatio,
  );

  if (first) {
    return {
      ...node,
      first,
    };
  }

  const second = insertPanelNear(
    node.second,
    targetId,
    newPanelId,
    direction,
    splitRatio,
  );

  if (second) {
    return {
      ...node,
      second,
    };
  }

  return null;
}

/**
 * 패널 이동
 */
export function movePanel(
  node: LayoutNode,
  sourcePanelId: string,
  targetPanelId: string,
  direction: DropDirection,
  splitRatio = 0.5,
): LayoutNode {
  if (sourcePanelId === targetPanelId) {
    return node;
  }

  const removed = removePanel(node, sourcePanelId);

  if (!removed || removed === node) {
    return node;
  }

  const moved = insertPanelNear(
    removed,
    targetPanelId,
    sourcePanelId,
    direction,
    splitRatio,
  );

  return moved ?? node;
}
