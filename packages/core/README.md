# @flexboard/core

Headless recursive split-layout engine for FlexBoard.

`@flexboard/core` provides the framework-agnostic layout engine behind FlexBoard. It represents layouts as recursive split trees and provides utilities for geometry calculation, panel tree operations, drag-and-drop targeting, and divider resizing.

It has no dependency on React, Vue, or the DOM.

## Installation

```bash
pnpm add @flexboard/core
```

```bash
npm install @flexboard/core
```

## Layout Model

FlexBoard represents a layout as a recursive tree composed of two node types:

- `ActualNode` — a leaf node representing a panel.
- `SplitNode` — a branch that recursively divides an area into two child nodes.

For example:

```ts
import type { LayoutNode } from "@flexboard/core";

const layout: LayoutNode = {
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
      id: "info",
    },
  },
};
```

Conceptually, the tree above represents:

```text
┌─────────────────────┬───────────────┐
│                     │    orders     │
│        chart        ├───────────────┤
│                     │     info      │
└─────────────────────┴───────────────┘
```

Because the layout is recursive, nested split layouts can be represented without coupling the engine to a specific UI framework.

## Geometry

### `calculateLayout`

Calculates panel and divider rectangles from a layout tree and container size.

```ts
import { calculateLayout, type LayoutNode } from "@flexboard/core";

const result = calculateLayout(
  layout,
  {
    width: 1200,
    height: 800,
  },
  8,
);

console.log(result.panels);
console.log(result.dividers);
```

The resulting geometry can be consumed by any renderer.

Exported geometry types include:

```ts
Size;
Point;
PanelRect;
DividerRect;
LayoutRects;
```

## Tree Operations

FlexBoard provides immutable tree operations for manipulating layouts.

### `addPanelToLayout`

Adds a panel to a layout.

```ts
import { addPanelToLayout } from "@flexboard/core";
```

### `removePanel`

Removes a panel from the layout tree.

```ts
import { removePanel } from "@flexboard/core";

const nextLayout = removePanel(layout, "orders");

if (nextLayout) {
  // use nextLayout
}
```

Removing a panel may collapse its surrounding split structure as the recursive tree is rebuilt.

### `insertPanelNear`

Inserts a panel next to an existing target panel.

```ts
import { insertPanelNear } from "@flexboard/core";

const nextLayout = insertPanelNear(layout, "chart", "new-panel", "right");
```

This is useful for implementing panel insertion and external drag-and-drop.

### `movePanel`

Moves an existing panel to another position in the layout tree.

```ts
import { movePanel } from "@flexboard/core";
```

This operation can be used as the basis for internal panel drag-and-drop.

## Drag and Drop

### `getDropDirection`

Determines a drop direction.

```ts
import { getDropDirection } from "@flexboard/core";
```

### `detectDropTarget`

Detects a drop target from the current panel geometry.

```ts
import { detectDropTarget } from "@flexboard/core";
```

Exported drag-and-drop types include:

```ts
DropDirection;
DropTarget;
DropTargetOptions;
```

## Resize

### `resizeSplit`

Updates the ratio of a split node.

```ts
import { resizeSplit } from "@flexboard/core";
```

The associated options type is also exported:

```ts
import type { ResizeSplitOptions } from "@flexboard/core";
```

## Public API

### Layout

```ts
ActualNode;
SplitNode;
LayoutNode;
```

### Geometry

```ts
Size;
Point;
PanelRect;
DividerRect;
LayoutRects;

calculateLayout;
```

### Tree Operations

```ts
addPanelToLayout;
removePanel;
insertPanelNear;
movePanel;
```

### Drag and Drop

```ts
DropDirection;
DropTarget;
DropTargetOptions;

getDropDirection;
detectDropTarget;
```

### Resize

```ts
ResizeSplitOptions;

resizeSplit;
```

## Framework Adapters

Most application developers will want to use one of the framework adapters instead of interacting with the core engine directly:

```bash
pnpm add @flexboard/react
```

or:

```bash
pnpm add @flexboard/vue
```

The adapters provide framework-specific rendering and interaction while using `@flexboard/core` as the underlying layout engine.

Use `@flexboard/core` directly when building a custom renderer, integrating FlexBoard with another framework, or working with the layout tree independently of a UI.

## License

MIT
