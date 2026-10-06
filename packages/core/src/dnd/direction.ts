import type { DropDirection } from "./types.js";

/**
 * 기준점으로부터의 이동량을 기반으로
 * 가장 가까운 드롭 방향을 계산한다.
 */
export function getDropDirection(
  deltaX: number,
  deltaY: number,
): DropDirection {
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return deltaX > 0 ? "right" : "left";
  }

  return deltaY > 0 ? "bottom" : "top";
}
