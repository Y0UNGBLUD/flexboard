<script setup lang="ts">
import type { PanelRect } from "@flexboard/core";

defineProps<{
  rect: PanelRect;
}>();
</script>

<template>
  <div
    class="flexboard-drop-preview"
    :style="{
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    }"
  />
</template>

<style scoped>
.flexboard-drop-preview {
  position: absolute;

  pointer-events: none;

  background: rgb(0 120 255 / 15%);
  border: 2px solid rgb(0 120 255 / 50%);

  box-sizing: border-box;

  z-index: 10;
}
</style>
