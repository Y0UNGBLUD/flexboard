import { useState } from "react";

import {
  addPanelToLayout,
  insertPanelNear,
  removePanel,
  type ExternalDropEvent,
  type LayoutNode,
} from "@flexboard/react";

import "./App.css";

import { BoardArea } from "./components/BoardArea";
import { Header } from "./components/Header";
import { LayoutTreeViewer } from "./components/LayoutTreeViewer";
import { PanelLibrary, type PanelType } from "./components/PanelLibrary";
const initialLayout: LayoutNode = {
  type: "split",
  id: "root",
  orientation: "H",
  size: 0.6,

  first: {
    type: "actual",
    id: "chart",
  },

  second: {
    type: "split",
    id: "right",
    orientation: "V",
    size: 0.5,

    first: {
      type: "actual",
      id: "orders",
    },

    second: {
      type: "actual",
      id: "counter",
    },
  },
};

function App() {
  const [layout, setLayout] = useState<LayoutNode>(initialLayout);
  const [nextPanelId, setNextPanelId] = useState(1);
  const [draggedPanelType, setDraggedPanelType] = useState<PanelType | null>(
    null,
  );
  const [nextExternalPanelId, setNextExternalPanelId] = useState(1);

  function handleAddPanel() {
    const id = `info-${nextPanelId}`;

    setLayout((current) => addPanelToLayout(current, id));

    setNextPanelId((current) => current + 1);
  }

  function handleRemovePanel(id: string) {
    setLayout((current) => {
      const next = removePanel(current, id);

      return next ?? current;
    });
  }

  function handleResetLayout() {
    setLayout(initialLayout);
    setNextPanelId(1);
  }
  function handleExternalDrop(event: ExternalDropEvent) {
    if (!draggedPanelType) return;

    const panelId = `${draggedPanelType}-${nextExternalPanelId}`;

    setLayout((current) => {
      const next = insertPanelNear(
        current,
        event.targetId,
        panelId,
        event.direction,
      );

      return next ?? current;
    });

    setNextExternalPanelId((current) => current + 1);
    setDraggedPanelType(null);
  }
  return (
    <div className="demo">
      <Header onAddPanel={handleAddPanel} onResetLayout={handleResetLayout} />

      <main className="demo__workspace">
        <aside className="demo__sidebar">
          <PanelLibrary
            onPanelDragStart={setDraggedPanelType}
            onPanelDragEnd={() => setDraggedPanelType(null)}
          />
        </aside>

        <section className="demo__board">
          <BoardArea
            layout={layout}
            onLayoutChange={setLayout}
            onRemovePanel={handleRemovePanel}
            onExternalDrop={handleExternalDrop}
          />
        </section>

        <aside className="demo__tree">
          <LayoutTreeViewer layout={layout} />
        </aside>
      </main>
    </div>
  );
}

export default App;
