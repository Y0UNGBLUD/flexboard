export interface Size {
  width: number;
  height: number;
}

export interface Point {
  top: number;
  left: number;
}

export interface PanelRect {
  type: "panel";
  id: string;
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface DividerRect {
  type: "divider";
  id: string;
  orientation: "H" | "V";
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface LayoutRects {
  panels: PanelRect[];
  dividers: DividerRect[];
}
