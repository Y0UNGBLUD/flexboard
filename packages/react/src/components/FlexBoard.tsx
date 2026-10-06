import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  calculateLayout,
  type LayoutNode,
  type PanelRect,
  type DropTarget,
} from "@flexboard/core";
import { useDividerResize } from "../hooks/useDividerResize.js";
import { usePanelDrag } from "../hooks/usePanelDrag.js";
import { DropPreview } from "./DropPreview.js";
import { useExternalPanelDrop } from "../hooks/useExternalPanelDrop.js";
import type { ExternalDropEvent } from "../types/events.js";
export interface FlexBoardRenderPanelProps {
  id: string;
}

export interface FlexBoardProps {
  layout: LayoutNode;

  onLayoutChange: (layout: LayoutNode) => void;

  renderPanel: (props: FlexBoardRenderPanelProps) => ReactNode;

  dividerSize?: number;
  minRatio?: number;
  maxRatio?: number;

  dragThreshold?: number;
  dropMargin?: number;
  dropSplitRatio?: number;

  externalDrop?: boolean;
  onExternalDrop?: (event: ExternalDropEvent) => void;

  className?: string;
  style?: CSSProperties;
}

export function FlexBoard({
  layout,
  onLayoutChange,
  renderPanel,

  dividerSize = 10,
  minRatio = 0.1,
  maxRatio = 0.9,

  dragThreshold = 5,
  dropMargin = 0,
  dropSplitRatio = 0.5,

  externalDrop = false,
  onExternalDrop,

  className,
  style,
}: FlexBoardProps) {
  // DOM
  const boardRef = useRef<HTMLDivElement>(null);
  // container size
  const [size, setSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  // ResizeObserver
  useLayoutEffect(() => {
    const element = boardRef.current;

    if (!element) {
      return;
    }

    const updateSize = () => {
      const rect = element.getBoundingClientRect();

      setSize({
        width: rect.width,
        height: rect.height,
      });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);
  // core layout 계산
  const calculated =
    size && size.width > dividerSize && size.height > dividerSize
      ? calculateLayout(layout, size, dividerSize)
      : null;
  // divider hook
  const { startResize } = useDividerResize({
    layout,

    containerSize: size ?? {
      width: 0,
      height: 0,
    },

    dividerSize,
    minRatio,
    maxRatio,

    onLayoutChange,
  });
  // panel DnD hook
  const { isDragging, dropTarget, startDrag } = usePanelDrag({
    layout,
    boardElement: boardRef,

    panels: () => calculated?.panels ?? [],

    threshold: dragThreshold,
    margin: dropMargin,
    splitRatio: dropSplitRatio,

    onLayoutChange,
  });
  // 내부 Panel DnD
  const handleExternalDrop = useCallback(
    (target: DropTarget) => {
      onExternalDrop?.({
        targetId: target.targetId,
        direction: target.direction,
      });
    },
    [onExternalDrop],
  );
  // external DnD hook
  const {
    dropTarget: externalDropTarget,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useExternalPanelDrop({
    boardElement: boardRef,

    panels: () => calculated?.panels ?? [],

    enabled: externalDrop,

    margin: dropMargin,
    splitRatio: dropSplitRatio,

    onDrop: handleExternalDrop,
  });

  // render
  return (
    <div
      ref={boardRef}
      className={["flexboard", className].filter(Boolean).join(" ")}
      style={style}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {calculated?.panels.map((panel: PanelRect) => (
        <div
          key={panel.id}
          className="flexboard__panel"
          style={{
            position: "absolute",
            left: panel.left,
            top: panel.top,
            width: panel.width,
            height: panel.height,
          }}
          onPointerDown={(event) => startDrag(panel.id, event)}
        >
          {renderPanel({
            id: panel.id,
          })}
        </div>
      ))}

      {calculated?.dividers.map((divider) => (
        <div
          key={divider.id}
          className={[
            "flexboard__divider",
            `flexboard__divider--${divider.orientation.toLowerCase()}`,
          ].join(" ")}
          style={{
            position: "absolute",
            left: divider.left,
            top: divider.top,
            width: divider.width,
            height: divider.height,
          }}
          onPointerDown={(event) => {
            event.stopPropagation();
            startResize(divider.id, divider.orientation, event);
          }}
        />
      ))}
      {dropTarget && <DropPreview rect={dropTarget.preview} />}
      {externalDropTarget && <DropPreview rect={externalDropTarget.preview} />}
    </div>
  );
}
