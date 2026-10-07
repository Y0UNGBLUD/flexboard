export type PanelType = "chart" | "orders" | "watchlist" | "info" | "counter";
interface PanelLibraryProps {
  onPanelDragStart: (type: PanelType) => void;
  onPanelDragEnd: () => void;
}
interface PanelDefinition {
  type: PanelType;
  label: string;
  icon: string;
}

const panels: PanelDefinition[] = [
  { type: "chart", label: "Chart", icon: "📈" },
  { type: "orders", label: "Orders", icon: "🧾" },
  { type: "watchlist", label: "Watchlist", icon: "⭐" },
  { type: "info", label: "Info", icon: "💡" },
  { type: "counter", label: "Counter", icon: "🔢" },
];

const PANEL_DRAG_TYPE = "application/x-flexboard-panel";

export function PanelLibrary({
  onPanelDragStart,
  onPanelDragEnd,
}: PanelLibraryProps) {
  function handleDragStart(
    event: React.DragEvent<HTMLDivElement>,
    type: PanelType,
  ) {
    event.dataTransfer.effectAllowed = "copy";

    event.dataTransfer.setData(PANEL_DRAG_TYPE, type);

    onPanelDragStart(type);
  }

  return (
    <div className="panel-library">
      <div className="section-header">
        <h2>Panel Library</h2>
        <p>Drag a panel into the board</p>
      </div>

      <div className="panel-library__list">
        {panels.map((panel) => (
          <div
            key={panel.type}
            className="panel-library__item"
            draggable
            onDragStart={(event) => handleDragStart(event, panel.type)}
            onDragEnd={onPanelDragEnd}
          >
            <span className="panel-library__icon">{panel.icon}</span>

            <span>{panel.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export { PANEL_DRAG_TYPE };
