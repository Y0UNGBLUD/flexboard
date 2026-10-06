import "./style.css";

export {
  FlexBoard,
  type FlexBoardProps,
  type FlexBoardRenderPanelProps,
} from "./components/FlexBoard.js";

export type { ExternalDropEvent } from "./types/events.js";

export {
  addPanelToLayout,
  removePanel,
  insertPanelNear,
  movePanel,
} from "@flexboard/core";
export type { ActualNode, LayoutNode, SplitNode } from "@flexboard/core";
