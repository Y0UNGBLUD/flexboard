import type { PanelRect } from "../types/geometry.js";
import type { Point } from "../types/geometry.js";
import type { DropTarget, DropTargetOptions, DropDirection } from "./types.js";
import { getDropDirection } from "./direction.js";

export function detectDropTarget(
  pointer: Point,
  panels: PanelRect[],
  options: DropTargetOptions = {},
): DropTarget | null {
  const { excludeId, margin = 0, splitRatio = 0.5 } = options;
  const ratio = Math.max(0, Math.min(1, splitRatio));
  for (const panel of panels) {
    // 현재 드래그 중인 패널은 target에서 제외
    if (panel.id === excludeId) {
      continue;
    }

    const withinX =
      pointer.left >= panel.left - margin &&
      pointer.left <= panel.left + panel.width + margin;

    const withinY =
      pointer.top >= panel.top - margin &&
      pointer.top <= panel.top + panel.height + margin;

    if (!withinX || !withinY) {
      continue;
    }

    const deltaX = pointer.left - (panel.left + panel.width / 2);

    const deltaY = pointer.top - (panel.top + panel.height / 2);

    const direction = getDropDirection(deltaX, deltaY);

    const preview = createDropPreview(panel, direction, ratio);

    return {
      targetId: panel.id,
      direction,
      preview,
    };
  }

  return null;
}

function createDropPreview(
  panel: PanelRect,
  direction: DropDirection,
  splitRatio: number,
): PanelRect {
  const isHorizontal = direction === "left" || direction === "right";

  const width = isHorizontal ? panel.width * splitRatio : panel.width;

  const height = isHorizontal ? panel.height : panel.height * splitRatio;

  const left =
    direction === "right" ? panel.left + panel.width - width : panel.left;

  const top =
    direction === "bottom" ? panel.top + panel.height - height : panel.top;

  return {
    type: "panel",
    id: "preview",
    top,
    left,
    width,
    height,
  };
}
