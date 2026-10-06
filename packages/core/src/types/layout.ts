export interface ActualNode {
  type: "actual";
  id: string;
}

export interface SplitNode {
  type: "split";
  id: string;
  orientation: "H" | "V";
  first: LayoutNode;
  second: LayoutNode;
  size: number;
}

export type LayoutNode = ActualNode | SplitNode;
