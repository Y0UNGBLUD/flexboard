import type { LayoutNode } from "@flexboard/react";

interface LayoutTreeViewerProps {
  layout: LayoutNode;
}

export function LayoutTreeViewer({ layout }: LayoutTreeViewerProps) {
  return (
    <div className="tree-viewer">
      <div className="section-header">
        <h2>Layout Tree</h2>
        <p>Current LayoutNode structure</p>
      </div>

      <pre className="tree-viewer__code">{JSON.stringify(layout, null, 2)}</pre>
    </div>
  );
}
