import type { PanelRect } from "../types/geometry.js";

export type DropDirection = "left" | "right" | "top" | "bottom";
export interface DropTarget {
  targetId: string;
  direction: DropDirection;
  preview: PanelRect;
}
export interface DropTargetOptions {
  excludeId?: string;
  margin?: number;
  splitRatio?: number;
}
