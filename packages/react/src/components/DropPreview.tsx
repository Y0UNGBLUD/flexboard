import type { CSSProperties } from "react";
import type { PanelRect } from "@flexboard/core";

export interface DropPreviewProps {
  rect: PanelRect;
}

export function DropPreview({ rect }: DropPreviewProps) {
  const style: CSSProperties = {
    position: "absolute",
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    pointerEvents: "none",
  };

  return <div className="flexboard__drop-preview" style={style} />;
}
