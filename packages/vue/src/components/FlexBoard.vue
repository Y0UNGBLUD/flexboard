<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import { calculateLayout, type LayoutNode, type Size } from "@flexboard/core";
import { useDividerResize } from "../composables/useDividerResize.js";
import DropPreview from "./DropPreview.vue";
import { usePanelDrag } from "../composables/usePanelDrag.js";
import { useExternalPanelDrop } from "../composables/useExternalPanelDrop.js";
import type { ExternalDropEvent } from "../types/events.js";
const props = withDefaults(
  defineProps<{
    layout: LayoutNode;

    dividerSize?: number;
    minRatio?: number;
    maxRatio?: number;

    dragThreshold?: number;
    dropMargin?: number;
    dropSplitRatio?: number;

    externalDrop?: boolean;
  }>(),
  {
    dividerSize: 10,
    minRatio: 0.1,
    maxRatio: 0.9,

    dragThreshold: 5,
    dropMargin: 0,
    dropSplitRatio: 0.5,

    externalDrop: false,
  },
);
const emit = defineEmits<{
  "update:layout": [layout: LayoutNode];
  "external-drop": [event: ExternalDropEvent];
}>();
const boardRef = ref<HTMLElement | null>(null);

const boardSize = ref<Size>({
  width: 0,
  height: 0,
});

const resizeObserver = shallowRef<ResizeObserver | null>(null);

const { startResize } = useDividerResize({
  layout: () => props.layout,
  boardSize,
  dividerSize: props.dividerSize,
  minRatio: props.minRatio,
  maxRatio: props.maxRatio,

  onUpdate: (layout) => {
    emit("update:layout", layout);
  },
});
const {
  dropTarget: externalDropTarget,
  isExternalDragging,
  handleDragOver,
  handleDragLeave,
  handleDrop,
} = useExternalPanelDrop({
  boardElement: boardRef,

  panels: () => calculatedLayout.value.panels,

  enabled: () => props.externalDrop,

  margin: props.dropMargin,
  splitRatio: props.dropSplitRatio,

  onDrop: (target) => {
    emit("external-drop", {
      targetId: target.targetId,
      direction: target.direction,
    });
  },
});
/**
 * 현재 보드 크기를 기준으로
 * Core에서 실제 패널 / divider 좌표를 계산한다.
 */
const calculatedLayout = computed(() => {
  if (boardSize.value.width <= 0 || boardSize.value.height <= 0) {
    return {
      panels: [],
      dividers: [],
    };
  }

  return calculateLayout(props.layout, boardSize.value, props.dividerSize);
});

const { isDragging, dropTarget, startDrag } = usePanelDrag({
  boardElement: boardRef,
  layout: () => props.layout,
  panels: () => calculatedLayout.value.panels,

  threshold: props.dragThreshold,
  margin: props.dropMargin,
  splitRatio: props.dropSplitRatio,

  onUpdate: (layout) => {
    emit("update:layout", layout);
  },
});

onMounted(() => {
  if (!boardRef.value) {
    return;
  }

  resizeObserver.value = new ResizeObserver(([entry]) => {
    if (!entry) {
      return;
    }

    boardSize.value = {
      width: entry.contentRect.width,
      height: entry.contentRect.height,
    };
  });

  resizeObserver.value.observe(boardRef.value);
});

onBeforeUnmount(() => {
  resizeObserver.value?.disconnect();
});
</script>

<template>
  <div
    ref="boardRef"
    class="flexboard"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div
      v-for="panel in calculatedLayout.panels"
      :key="panel.id"
      class="flexboard__panel"
      :style="{
        top: `${panel.top}px`,
        left: `${panel.left}px`,
        width: `${panel.width}px`,
        height: `${panel.height}px`,
      }"
      @pointerdown="startDrag(panel.id, $event)"
    >
      <slot name="panel" :id="panel.id" :rect="panel" />
    </div>

    <div
      v-for="divider in calculatedLayout.dividers"
      :key="divider.id"
      class="flexboard__divider"
      :class="{
        'flexboard__divider--horizontal': divider.orientation === 'H',
        'flexboard__divider--vertical': divider.orientation === 'V',
      }"
      :style="{
        top: `${divider.top}px`,
        left: `${divider.left}px`,
        width: `${divider.width}px`,
        height: `${divider.height}px`,
      }"
      @pointerdown="startResize(divider, $event)"
    />
    <!-- 내부 패널 DnD preview -->
    <DropPreview v-if="dropTarget" :rect="dropTarget.preview" />
    <!-- 외부 → FlexBoard DnD preview -->
    <DropPreview v-if="externalDropTarget" :rect="externalDropTarget.preview" />
  </div>
</template>

<style scoped>
.flexboard {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.flexboard__panel {
  position: absolute;
  overflow: hidden;
  touch-action: none;
  border: 1px solid #ccc;
}

.flexboard__divider {
  position: absolute;
  touch-action: none;
  user-select: none;
}

.flexboard__divider--horizontal {
  cursor: col-resize;
}

.flexboard__divider--vertical {
  cursor: row-resize;
}
</style>
