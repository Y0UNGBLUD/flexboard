<script setup lang="ts">
import { ref } from "vue";

import {
  FlexBoard,
  type ExternalDropEvent,
  type LayoutNode,
} from "@flexboard/vue";

import {
  addPanelToLayout,
  insertPanelNear,
  removePanel,
} from "@flexboard/core";

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

const layout = ref<LayoutNode>({
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
});

let panelCount = 3;

/**
 * 외부 목록에서 현재 drag 중인 panel type
 *
 * FlexBoard는 어떤 종류의 패널을 drag 중인지 알 필요가 없다.
 * 애플리케이션에서만 관리한다.
 */
const draggingPanelType = ref<string | null>(null);

/**
 * 테스트용 단순 패널 추가
 */
function addPanel(): void {
  panelCount += 1;

  layout.value = addPanelToLayout(layout.value, `panel-${panelCount}`);
}

/**
 * 패널 삭제
 *
 * 마지막 패널 삭제 시 removePanel()은 null을 반환한다.
 * 현재 FlexBoard는 최소 하나의 패널을 유지한다.
 */
function removePanelById(id: string): void {
  const next = removePanel(layout.value, id);

  if (next) {
    layout.value = next;
  }
}

/**
 * 외부 패널 목록에서 drag 시작
 */
function handleExternalDragStart(event: DragEvent, type: string): void {
  draggingPanelType.value = type;

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "copy";

    event.dataTransfer.setData("text/plain", type);
  }
}

/**
 * drag가 취소되거나 정상 종료된 경우
 */
function handleExternalDragEnd(): void {
  draggingPanelType.value = null;
}

/**
 * FlexBoard에서 external-drop 발생
 *
 * FlexBoard는 targetId와 direction만 알려준다.
 * 실제로 어떤 패널을 생성할지는 애플리케이션이 결정한다.
 */
function handleExternalDrop(event: ExternalDropEvent): void {
  const type = draggingPanelType.value;

  if (!type) {
    return;
  }

  panelCount += 1;

  const newPanelId = `${type}-${panelCount}`;

  layout.value = insertPanelNear(
    layout.value,
    event.targetId,
    newPanelId,
    event.direction,
  );

  draggingPanelType.value = null;
}
</script>

<template>
  <main class="app">
    <header class="header">
      <div>
        <h1>FlexBoard Playground</h1>

        <p>Drag panels from the list into the board.</p>
      </div>

      <button type="button" @click="addPanel">➕ Add Panel</button>
    </header>

    <div class="playground">
      <!-- 외부 패널 목록 -->
      <aside class="sidebar">
        <h2>Available Panels</h2>

        <ul class="panel-list">
          <li
            v-for="item in availablePanels"
            :key="item.type"
            class="panel-item"
            draggable="true"
            @dragstart="handleExternalDragStart($event, item.type)"
            @dragend="handleExternalDragEnd"
          >
            {{ item.label }}
          </li>
        </ul>

        <p class="hint">Drag an item onto any side of an existing panel.</p>
      </aside>

      <!-- Board -->
      <section class="board-area">
        <FlexBoard
          v-model:layout="layout"
          external-drop
          :divider-size="8"
          @external-drop="handleExternalDrop"
        >
          <template #panel="{ id }">
            <div class="panel">
              <strong>{{ id }}</strong>

              <button
                class="remove-button"
                type="button"
                @pointerdown.stop
                @click="removePanelById(id)"
              >
                ✖️
              </button>
            </div>
          </template>
        </FlexBoard>
      </section>
    </div>
  </main>
</template>

<style scoped>
.app {
  min-height: 100vh;
  padding: 32px;

  background: #f5f6f8;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  max-width: 1400px;
  margin: 0 auto 24px;
}

.header h1 {
  margin: 0 0 6px;
}

.header p {
  margin: 0;
  color: #666;
}

.header button {
  padding: 10px 16px;

  border: 1px solid #ddd;

  background: white;

  cursor: pointer;
}

.playground {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 20px;

  max-width: 1400px;
  margin: 0 auto;
}

.sidebar {
  padding: 16px;

  border: 1px solid #ddd;
  border-radius: 4px;

  background: white;
}

.sidebar h2 {
  margin: 0 0 16px;

  font-size: 16px;
}

.panel-list {
  display: flex;
  flex-direction: column;
  gap: 8px;

  padding: 0;
  margin: 0;

  list-style: none;
}

.panel-item {
  padding: 12px 14px;

  border: 1px solid #ddd;

  background: #fafafa;

  cursor: grab;

  user-select: none;
}

.panel-item:hover {
  background: #f0f2f5;
}

.panel-item:active {
  cursor: grabbing;
}

.hint {
  margin: 16px 0 0;

  color: #888;
  font-size: 12px;
  line-height: 1.5;
}

.board-area {
  position: relative;

  width: 100%;
  height: 650px;

  border: 1px solid #ccc;

  background: white;

  overflow: hidden;
  padding: 10px;
}

.panel {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 20px;
  border: 1px solid #ddd;
  background: #f8f8f8;
  user-select: none;
}

.remove-button {
  position: absolute;

  top: 10px;
  right: 10px;

  width: 28px;
  height: 28px;

  padding: 0;

  border: 1px solid #ddd;

  background: white;

  cursor: pointer;
}
</style>
