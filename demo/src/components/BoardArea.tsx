import {
  FlexBoard,
  type ExternalDropEvent,
  type LayoutNode,
} from "@flexboard/react";
import { DemoPanel } from "./panels/DemoPanel";

interface BoardAreaProps {
  layout: LayoutNode;
  onLayoutChange: (layout: LayoutNode) => void;
  onRemovePanel: (id: string) => void;
  onExternalDrop: (event: ExternalDropEvent) => void;
}
export function BoardArea({
  layout,
  onLayoutChange,
  onRemovePanel,
  onExternalDrop,
}: BoardAreaProps) {
  return (
    <div className="board-area">
      <FlexBoard
        layout={layout}
        onLayoutChange={onLayoutChange}
        externalDrop
        onExternalDrop={onExternalDrop}
        renderPanel={({ id }) => (
          <DemoPanel id={id} onRemove={() => onRemovePanel(id)} />
        )}
      />
    </div>
  );
}
