import { useRef, useState, type DragEvent } from "react";

import {
  FlexBoard,
  type ExternalDropEvent,
  type LayoutNode,
} from "@flexboard/react";

import { insertPanelNear } from "@flexboard/core";

interface AvailablePanel {
  type: string;
  label: string;
}

const availablePanels: AvailablePanel[] = [
  {
    type: "chart",
    label: "📈 Chart",
  },
  {
    type: "orders",
    label: "📋 Orders",
  },
  {
    type: "news",
    label: "📰 News",
  },
  {
    type: "watchlist",
    label: "⭐ Watchlist",
  },
];

const initialLayout: LayoutNode = {
  type: "split",
  id: "split-root",
  orientation: "H",
  size: 0.6,

  first: {
    type: "actual",
    id: "chart-1",
  },

  second: {
    type: "split",
    id: "split-right",
    orientation: "V",
    size: 0.5,

    first: {
      type: "actual",
      id: "orders-1",
    },

    second: {
      type: "actual",
      id: "info-1",
    },
  },
};

export default function App() {
  const [layout, setLayout] = useState<LayoutNode>(initialLayout);

  /**
   * 외부 목록에서 현재 drag 중인 panel type.
   *
   * 이 정보는 FlexBoard가 알 필요가 없고,
   * 애플리케이션에서만 관리한다.
   */
  const draggingPanelType = useRef<string | null>(null);

  const panelCount = useRef(3);

  function handleExternalDragStart(
    event: DragEvent<HTMLLIElement>,
    type: string,
  ): void {
    draggingPanelType.current = type;

    event.dataTransfer.effectAllowed = "copy";

    event.dataTransfer.setData("text/plain", type);
  }

  function handleExternalDragEnd(): void {
    draggingPanelType.current = null;
  }

  function handleExternalDrop(event: ExternalDropEvent): void {
    const type = draggingPanelType.current;

    if (!type) {
      return;
    }

    panelCount.current += 1;

    const newPanelId = `${type}-${panelCount.current}`;

    setLayout((currentLayout) => {
      const next = insertPanelNear(
        currentLayout,
        event.targetId,
        newPanelId,
        event.direction,
      );

      return next ?? currentLayout;
    });

    draggingPanelType.current = null;
  }

  return (
    <main className="app">
      <header className="header">
        <div>
          <h1>FlexBoard React</h1>

          <p>Resize, move panels, or drag a new panel into the board.</p>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <h2>Panels</h2>

          <p className="sidebar-description">Drag a panel into the board.</p>

          <ul className="panel-list">
            {availablePanels.map((item) => (
              <li
                key={item.type}
                className="panel-item"
                draggable
                onDragStart={(event) =>
                  handleExternalDragStart(event, item.type)
                }
                onDragEnd={handleExternalDragEnd}
              >
                {item.label}
              </li>
            ))}
          </ul>
        </aside>

        <section className="board">
          <FlexBoard
            layout={layout}
            onLayoutChange={setLayout}
            dividerSize={8}
            externalDrop
            onExternalDrop={handleExternalDrop}
            renderPanel={({ id }) => (
              <div className="panel">
                <strong>{id}</strong>

                <p>Drag this panel to move it.</p>
              </div>
            )}
          />
        </section>
      </div>
    </main>
  );
}
