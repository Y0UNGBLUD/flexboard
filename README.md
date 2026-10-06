# FlexBoard

A headless, recursive panel layout engine for building resizable and draggable workspace UIs.

FlexBoard represents layouts as a recursive tree rather than a flat grid. It provides a framework-agnostic TypeScript core with Vue and React adapters for rendering interactive panel layouts.

## Features

- Recursive split-tree layout model
- Horizontal and vertical panel splitting
- Resizable dividers
- Drag-and-drop panel rearrangement
- Drop preview
- External drag-and-drop support
- Framework-agnostic TypeScript core
- Vue 3 adapter
- React adapter
- Headless panel rendering
- Customizable panel UI
- TypeScript support

## Packages

FlexBoard is organized as a monorepo with three main packages.

```text
@flexboard/core
├─ layout tree
├─ geometry calculation
├─ resize
├─ panel insertion / removal
└─ drag-and-drop calculation

@flexboard/vue
└─ Vue adapter

@flexboard/react
└─ React adapter
```

`@flexboard/core` contains the layout model and operations without depending on a UI framework.

The Vue and React packages translate the core layout into framework-specific components and interaction APIs.

## Recursive Layout Model

The central idea behind FlexBoard is `LayoutNode`.

Instead of storing panels as a flat array of rows and columns, a layout is represented as a recursive binary tree.

A node is either:

- an `actual` node representing a panel
- a `split` node containing two child nodes

For example:

```ts
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
      id: "news",
    },
  },
};
```

Conceptually, the tree looks like this:

```text
                 split(H)
                /        \
            chart        split(V)
                        /        \
                    orders       news
```

And produces a layout similar to:

```text
┌──────────────────────┬──────────────┐
│                      │    orders    │
│                      │              │
│        chart         ├──────────────┤
│                      │     news     │
│                      │              │
└──────────────────────┴──────────────┘
```

### Why a recursive tree?

Each split only needs to describe:

```text
orientation
split ratio
first child
second child
```

The children may themselves be another split.

This makes arbitrarily nested layouts possible without introducing special concepts for rows, columns, or nesting depth.

Layout calculation follows the same recursive structure:

```text
calculate current node
        │
        ├─ actual
        │    └─ emit panel rectangle
        │
        └─ split
             ├─ calculate child regions
             ├─ traverse first child
             └─ traverse second child
```

The same tree structure also makes operations such as panel insertion, removal, movement, and nested divider resizing natural recursive operations.

## Installation

Install the adapter for your framework together with the core package when core layout operations are needed.

### React

```bash
pnpm add @flexboard/react @flexboard/core
```

### Vue

```bash
pnpm add @flexboard/vue @flexboard/core
```

## React

```tsx
import { useState } from "react";

import { FlexBoard, type LayoutNode } from "@flexboard/react";

const initialLayout: LayoutNode = {
  type: "split",
  id: "root",
  orientation: "H",
  size: 0.5,

  first: {
    type: "actual",
    id: "panel-a",
  },

  second: {
    type: "actual",
    id: "panel-b",
  },
};

export default function App() {
  const [layout, setLayout] = useState<LayoutNode>(initialLayout);

  return (
    <div
      style={{
        width: "100%",
        height: 600,
      }}
    >
      <FlexBoard
        layout={layout}
        onLayoutChange={setLayout}
        renderPanel={({ id }) => <div>{id}</div>}
      />
    </div>
  );
}
```

FlexBoard is a controlled component.

```text
layout
   ↓
FlexBoard
   ↓
user interaction
   ↓
onLayoutChange(nextLayout)
   ↓
application state
```

Your application owns the `LayoutNode`; FlexBoard renders and interacts with it.

## Vue

```vue
<script setup lang="ts">
import { ref } from "vue";

import { FlexBoard, type LayoutNode } from "@flexboard/vue";

const layout = ref<LayoutNode>({
  type: "split",
  id: "root",
  orientation: "H",
  size: 0.5,

  first: {
    type: "actual",
    id: "panel-a",
  },

  second: {
    type: "actual",
    id: "panel-b",
  },
});
</script>

<template>
  <div
    style="
      width: 100%;
      height: 600px;
    "
  >
    <FlexBoard v-model:layout="layout">
      <template #panel="{ id }">
        <div>
          {{ id }}
        </div>
      </template>
    </FlexBoard>
  </div>
</template>
```

## Core Operations

Layout manipulation is provided by `@flexboard/core`.

For example:

```ts
import {
  addPanelToLayout,
  insertPanelNear,
  removePanel,
} from "@flexboard/core";
```

This keeps layout manipulation independent from React or Vue.

### Add a panel

```ts
const next = addPanelToLayout(layout, "panel-c");
```

### Insert near another panel

```ts
const next = insertPanelNear(layout, "panel-a", "panel-c", "right");
```

Insertion may fail when the target cannot be found, so handle the nullable result when necessary:

```ts
const next = insertPanelNear(layout, targetId, newPanelId, direction);

layout = next ?? layout;
```

### Remove a panel

```ts
const next = removePanel(layout, "panel-a");

if (next) {
  layout = next;
}
```

Applications can decide their own policy for the final remaining panel.

## Divider Resize

Split nodes contain a ratio:

```ts
{
  type: "split",
  orientation: "H",
  size: 0.6,
  // ...
}
```

The divider can be resized interactively through the Vue and React adapters.

The core remains responsible for calculating the updated split ratio while the adapters handle pointer events.

## Internal Drag and Drop

Panels can be rearranged by dragging them over another panel.

FlexBoard determines the closest drop direction:

```text
       top
        ↑
        │
left ← panel → right
        │
        ↓
      bottom
```

A drop preview is rendered before the layout is changed.

The actual tree operation is performed by the core layout engine.

## External Drag and Drop

FlexBoard also supports dragging application-defined items into the board.

The adapter intentionally does not decide what the dragged item represents.

Instead, it reports only the layout-related information:

```ts
interface ExternalDropEvent {
  targetId: string;
  direction: "left" | "right" | "top" | "bottom";
}
```

This keeps external drag-and-drop headless.

### React

```tsx
<FlexBoard
  layout={layout}
  onLayoutChange={setLayout}
  externalDrop
  onExternalDrop={(event) => {
    // Create whatever panel your
    // application needs here.
  }}
  renderPanel={({ id }) => <MyPanel id={id} />}
/>
```

For example:

```tsx
function handleExternalDrop(event: ExternalDropEvent) {
  setLayout((current) => {
    const next = insertPanelNear(
      current,
      event.targetId,
      createPanelId(),
      event.direction,
    );

    return next ?? current;
  });
}
```

This means FlexBoard does not need to know whether the external item is a chart, order book, editor, terminal, or anything else.

## Headless Panel Rendering

FlexBoard manages layout and interaction, not application UI.

In React:

```tsx
<FlexBoard
  layout={layout}
  onLayoutChange={setLayout}
  renderPanel={({ id }) => <MyPanel id={id} />}
/>
```

In Vue:

```vue
<FlexBoard v-model:layout="layout">
  <template #panel="{ id }">
    <MyPanel :id="id" />
  </template>
</FlexBoard>
```

The consumer owns the actual panel design and content.

This makes FlexBoard suitable for interfaces such as:

- dashboards
- trading terminals
- editors
- monitoring tools
- admin workspaces
- developer tools

## Styling

Base FlexBoard styles are included automatically by the framework packages.

Panel contents remain entirely controlled by the consumer.

```tsx
renderPanel={({ id }) => (
  <div className="my-panel">
    {id}
  </div>
)}
```

```css
.my-panel {
  width: 100%;
  height: 100%;

  padding: 16px;

  background: white;
}
```

FlexBoard's interaction styles can also be customized with CSS where needed.

## Architecture

FlexBoard separates layout logic from framework integration.

```text
                    LayoutNode
                        │
                        ↓
                @flexboard/core
               /        |        \
              /         |         \
     calculate       mutate       DnD
       layout         tree      detection
              \         |         /
               \        |        /
                        ↓
             framework adapters
                /             \
               ↓               ↓
        @flexboard/vue   @flexboard/react
               ↓               ↓
           application     application
```

The core package does not depend on Vue or React.

Framework packages are responsible primarily for:

- DOM measurement
- rendering
- pointer events
- drag events
- translating interactions into core operations

This separation allows the same recursive layout engine to power multiple UI frameworks.

## Development

Install dependencies:

```bash
pnpm install
```

Run all package type checks:

```bash
pnpm typecheck
```

Run all tests:

```bash
pnpm test
```

Build all library packages:

```bash
pnpm build
```

Run the complete package verification:

```bash
pnpm check
```

Build example applications:

```bash
pnpm examples:build
```

## Project Structure

```text
flexboard/
├─ packages/
│  ├─ core/
│  ├─ vue/
│  └─ react/
│
├─ examples/
│  ├─ vue/
│  └─ react/
│
├─ package.json
└─ pnpm-workspace.yaml
```

## Status

FlexBoard is currently under active development.

The API may change before the first stable release.

## License

ISC
