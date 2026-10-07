# @flexboard/react

React adapter for the FlexBoard recursive split-layout engine.

Build resizable and draggable panel layouts using a recursive split-tree model.

## Installation

```bash
pnpm add @flexboard/react
```

```bash
npm install @flexboard/react
```

`@flexboard/core` is installed automatically as a dependency.

## Quick Start

```tsx
import { useState } from "react";

import { FlexBoard, type LayoutNode } from "@flexboard/react";

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
      id: "info",
    },
  },
};

export default function App() {
  const [layout, setLayout] = useState<LayoutNode>(initialLayout);

  return (
    <div style={{ width: "100%", height: "600px" }}>
      <FlexBoard
        layout={layout}
        onLayoutChange={setLayout}
        renderPanel={({ id }) => (
          <div
            style={{
              width: "100%",
              height: "100%",
              padding: 16,
              boxSizing: "border-box",
            }}
          >
            <strong>{id}</strong>
          </div>
        )}
      />
    </div>
  );
}
```

`FlexBoard` is controlled by the `layout` prop. When the user resizes dividers or moves panels, the updated layout is passed to `onLayoutChange`.

## Recursive Layout Model

FlexBoard represents layouts as recursive split trees.

A panel is an `ActualNode`, while a `SplitNode` divides its available area into two children:

```text
SplitNode
├── first
└── second
    ├── first
    └── second
```

This makes deeply nested layouts possible without defining a fixed row or column structure.

For example:

```text
┌──────────────────────┬────────────────┐
│                      │     orders     │
│        chart         ├────────────────┤
│                      │      info      │
└──────────────────────┴────────────────┘
```

is represented by the recursive `LayoutNode` used in the Quick Start example.

## Adding Panels

`addPanelToLayout` is re-exported from `@flexboard/core`, so it can be used directly from the React package.

```tsx
import { addPanelToLayout, FlexBoard, type LayoutNode } from "@flexboard/react";
```

Use it when your application needs to add a new panel to the current layout.

```tsx
function handleAddPanel() {
  setLayout((current) => addPanelToLayout(current, "new-panel"));
}
```

## Removing Panels

`removePanel` removes a panel from the recursive layout tree.

```tsx
import { removePanel, type LayoutNode } from "@flexboard/react";

function removeOrders() {
  setLayout((current) => {
    const next = removePanel(current, "orders");

    return next ?? current;
  });
}
```

When a panel is removed, the surrounding split structure is collapsed as necessary.

## Panel State

Panels are identified by their `id`.

When the layout changes because another panel is removed or panels are moved, surviving panels retain their React component identity.

This means local component state can live naturally inside your panel components:

```tsx
function CounterPanel({ id }: { id: string }) {
  const [count, setCount] = useState(0);

  return (
    <div>
      <strong>{id}</strong>

      <p>{count}</p>

      <button
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => setCount((value) => value + 1)}
      >
        Increment
      </button>
    </div>
  );
}
```

```tsx
<FlexBoard
  layout={layout}
  onLayoutChange={setLayout}
  renderPanel={({ id }) => <CounterPanel id={id} />}
/>
```

Moving the panel or changing the surrounding layout does not reset the surviving panel's local state.

## External Panel Drop

FlexBoard can also detect panels dragged into the board from outside.

Enable external drop handling with:

```tsx
<FlexBoard
  layout={layout}
  onLayoutChange={setLayout}
  externalDrop
  onExternalDrop={(event) => {
    console.log(event.targetId);
    console.log(event.direction);
  }}
  renderPanel={({ id }) => <div>{id}</div>}
/>
```

The event is exposed as:

```ts
type ExternalDropEvent = {
  targetId: string;
  direction: DropDirection;
};
```

Your application decides what panel should be created and how its data should be managed.

## FlexBoard Props

### Required

| Prop             | Description                              |
| ---------------- | ---------------------------------------- |
| `layout`         | Current recursive layout tree            |
| `onLayoutChange` | Called when FlexBoard changes the layout |
| `renderPanel`    | Renders the contents of each panel       |

### Optional

| Prop             | Description                                            |
| ---------------- | ------------------------------------------------------ |
| `dividerSize`    | Size of split dividers                                 |
| `minRatio`       | Minimum resize ratio                                   |
| `maxRatio`       | Maximum resize ratio                                   |
| `dragThreshold`  | Pointer movement required before panel dragging starts |
| `dropMargin`     | Margin used during drop-target detection               |
| `dropSplitRatio` | Split ratio used for dropped panels                    |
| `externalDrop`   | Enables external drag-and-drop                         |
| `onExternalDrop` | Called when an external item is dropped                |
| `className`      | Additional class name for the board                    |
| `style`          | Additional React styles for the board                  |

## Public API

### Components

```ts
FlexBoard;
```

### Tree Operations

```ts
addPanelToLayout;
removePanel;
insertPanelNear;
movePanel;
```

These operations are re-exported from `@flexboard/core`.

### Types

```ts
FlexBoardProps;
FlexBoardRenderPanelProps;
ExternalDropEvent;

ActualNode;
SplitNode;
LayoutNode;
```

## Styling

FlexBoard includes its base styles automatically when importing `@flexboard/react`.

Panel content itself is controlled by your application through `renderPanel`, so application-specific styling can be applied normally using CSS, CSS modules, Tailwind, styled components, or other styling solutions.

The board must have measurable width and height in order to calculate its layout.

## Packages

FlexBoard is split into three packages:

- `@flexboard/core` — framework-agnostic recursive layout engine
- `@flexboard/react` — React adapter
- `@flexboard/vue` — Vue adapter

## License

MIT
