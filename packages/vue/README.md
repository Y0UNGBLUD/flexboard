# @flexboard/vue

Vue adapter for the FlexBoard recursive split-layout engine.

Build resizable and draggable panel layouts using a recursive split-tree model.

## Installation

```bash
pnpm add @flexboard/vue
```

```bash
npm install @flexboard/vue
```

`@flexboard/core` is installed automatically as a dependency.

## Quick Start

```vue
<script setup lang="ts">
import { ref } from "vue";

import { FlexBoard, type LayoutNode } from "@flexboard/vue";

const layout = ref<LayoutNode>({
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
});
</script>

<template>
  <div class="board">
    <FlexBoard v-model:layout="layout">
      <template #panel="{ id }">
        <div class="panel">
          <strong>{{ id }}</strong>
        </div>
      </template>
    </FlexBoard>
  </div>
</template>

<style>
.board {
  width: 100%;
  height: 600px;
}

.panel {
  width: 100%;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
}
</style>
```

`FlexBoard` uses `v-model:layout` to keep the layout synchronized when the user resizes dividers or moves panels.

## Recursive Layout Model

FlexBoard represents layouts as recursive split trees.

A panel is an `ActualNode`, while a `SplitNode` divides its available area into two child nodes.

```text
SplitNode
├── first
└── second
    ├── first
    └── second
```

For example:

```text
┌──────────────────────┬────────────────┐
│                      │     orders     │
│        chart         ├────────────────┤
│                      │      info      │
└──────────────────────┴────────────────┘
```

This recursive structure allows FlexBoard to represent nested layouts without requiring a fixed row or column structure.

## Adding Panels

`addPanelToLayout` is re-exported from `@flexboard/core`, so Vue applications can use it directly from `@flexboard/vue`.

```vue
<script setup lang="ts">
import { ref } from "vue";

import { addPanelToLayout, FlexBoard, type LayoutNode } from "@flexboard/vue";

const layout = ref<LayoutNode>({
  type: "actual",
  id: "main",
});

function handleAddPanel() {
  layout.value = addPanelToLayout(layout.value, "new-panel");
}
</script>

<template>
  <button type="button" @click="handleAddPanel">Add panel</button>

  <FlexBoard v-model:layout="layout">
    <template #panel="{ id }">
      <div>{{ id }}</div>
    </template>
  </FlexBoard>
</template>
```

`addPanelToLayout` returns a new layout containing the newly added panel.

## Removing Panels

`removePanel` removes a panel from the recursive layout tree.

```vue
<script setup lang="ts">
import { removePanel, type LayoutNode } from "@flexboard/vue";

function handleRemovePanel(id: string) {
  const next = removePanel(layout.value, id);

  if (next) {
    layout.value = next;
  }
}
</script>
```

For example, a panel can provide its own remove button:

```vue
<template #panel="{ id }">
  <div class="panel">
    <strong>{{ id }}</strong>

    <button type="button" @pointerdown.stop @click="handleRemovePanel(id)">
      Remove
    </button>
  </div>
</template>
```

`removePanel` can return `null` when removing a panel would leave no layout, so the result should be checked before replacing `layout.value`.

When a panel is removed, the surrounding split structure is collapsed as necessary.

## Adding and Removing Panels Together

A common setup looks like this:

```vue
<script setup lang="ts">
import { ref } from "vue";

import {
  addPanelToLayout,
  FlexBoard,
  removePanel,
  type LayoutNode,
} from "@flexboard/vue";

const layout = ref<LayoutNode>({
  type: "actual",
  id: "panel-1",
});

let nextPanelId = 2;

function handleAddPanel() {
  layout.value = addPanelToLayout(layout.value, `panel-${nextPanelId++}`);
}

function handleRemovePanel(id: string) {
  const next = removePanel(layout.value, id);

  if (next) {
    layout.value = next;
  }
}
</script>

<template>
  <button type="button" @click="handleAddPanel">Add panel</button>

  <FlexBoard v-model:layout="layout">
    <template #panel="{ id }">
      <div class="panel">
        <strong>{{ id }}</strong>

        <button type="button" @pointerdown.stop @click="handleRemovePanel(id)">
          Remove
        </button>
      </div>
    </template>
  </FlexBoard>
</template>
```

The application owns the layout state, while FlexBoard handles layout rendering, divider resizing, and panel drag-and-drop.

## Panel State

Panels are identified by their `id`.

When panels move or the surrounding layout changes, surviving panel components retain their component identity and local Vue state.

This allows panel contents to manage their own state naturally:

```vue
<script setup lang="ts">
import { ref } from "vue";

defineProps<{
  id: string;
}>();

const count = ref(0);
</script>

<template>
  <div>
    <strong>{{ id }}</strong>

    <p>{{ count }}</p>

    <button type="button" @pointerdown.stop @click="count++">Increment</button>
  </div>
</template>
```

Moving the panel or removing another panel does not reset the surviving panel's local state.

## External Panel Drop

FlexBoard can detect items dragged into the board from outside.

Enable external drop handling with:

```vue
<FlexBoard
  v-model:layout="layout"
  external-drop
  @external-drop="handleExternalDrop"
>
  <template #panel="{ id }">
    <div>{{ id }}</div>
  </template>
</FlexBoard>
```

Your application decides which panel should be created and how its data should be managed when an external drop occurs.

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
ExternalDropEvent;

ActualNode;
SplitNode;
LayoutNode;
```

## Styling

FlexBoard includes its base styles automatically when importing `@flexboard/vue`.

Panel contents are provided through the `panel` slot, so application-specific styling remains fully controlled by the consuming application.

The board must have measurable width and height in order to calculate its layout.

## Packages

FlexBoard is split into three packages:

- `@flexboard/core` — framework-agnostic recursive layout engine
- `@flexboard/react` — React adapter
- `@flexboard/vue` — Vue adapter

## License

MIT
