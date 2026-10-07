import { ChartPanel } from "./ChartPanel";
import { CounterPanel } from "./CounterPanel";
import { InfoPanel } from "./InfoPanel";
import { OrdersPanel } from "./OrdersPanel";
import { WatchlistPanel } from "./WatchlistPanel";
interface DemoPanelProps {
  id: string;
  onRemove: () => void;
}

export function DemoPanel({ id, onRemove }: DemoPanelProps) {
  const type = id.split("-")[0];

  return (
    <div className="demo-panel">
      <div className="demo-panel__header">
        <span>{getPanelTitle(type)}</span>

        <button
          type="button"
          className="demo-panel__remove"
          aria-label={`Remove ${id}`}
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
        >
          ×
        </button>
      </div>

      <div className="demo-panel__content">{renderPanelContent(type)}</div>
    </div>
  );
}

function getPanelTitle(type: string) {
  switch (type) {
    case "chart":
      return "Chart";
    case "orders":
      return "Orders";
    case "counter":
      return "Counter";
    case "info":
      return "Info";
    case "watchlist":
      return "Watchlist";
    default:
      return idToTitle(type);
  }
}

function renderPanelContent(type: string) {
  switch (type) {
    case "chart":
      return <ChartPanel />;

    case "orders":
      return <OrdersPanel />;

    case "counter":
      return <CounterPanel />;

    case "info":
      return <InfoPanel />;
    case "watchlist":
      return <WatchlistPanel />;
    default:
      return <div>Panel</div>;
  }
}

function idToTitle(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
