export { default as FlexBoard } from "./components/FlexBoard.vue";

export type { ExternalDropEvent } from "./types/events.js";

export {
  addPanelToLayout,
  removePanel,
  insertPanelNear,
  movePanel,
} from "@flexboard/core";
export type { ActualNode, LayoutNode, SplitNode } from "@flexboard/core";
