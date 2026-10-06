import type { DropDirection } from "@flexboard/core";

export interface ExternalDropEvent {
  targetId: string;
  direction: DropDirection;
}
