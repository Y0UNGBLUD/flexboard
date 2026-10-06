import { describe, expect, it, vi } from "vitest";
import { defineComponent, ref } from "vue";
import { mount } from "@vue/test-utils";

import { useDividerResize } from "./useDividerResize.js";

import type { DividerRect, LayoutNode, Size } from "@flexboard/core";

function createLayout(): LayoutNode {
  return {
    type: "split",
    id: "split-root",
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
}

const divider: DividerRect = {
  type: "divider",
  id: "split-root",
  orientation: "H",
  top: 0,
  left: 495,
  width: 10,
  height: 800,
};

function mountComposable(onUpdate = vi.fn()) {
  const layout = ref<LayoutNode>(createLayout());

  const boardSize = ref<Size>({
    width: 1000,
    height: 800,
  });

  let startResize:
    | ReturnType<typeof useDividerResize>["startResize"]
    | undefined;

  const wrapper = mount(
    defineComponent({
      setup() {
        const result = useDividerResize({
          layout: () => layout.value,
          boardSize,

          onUpdate: (nextLayout) => {
            layout.value = nextLayout;
            onUpdate(nextLayout);
          },
        });

        startResize = result.startResize;

        return () => null;
      },
    }),
  );

  if (!startResize) {
    throw new Error("useDividerResize was not initialized.");
  }

  return {
    wrapper,
    layout,
    boardSize,
    onUpdate,
    startResize,
  };
}
describe("useDividerResize", () => {
  it("pointer 이동량에 따라 layout을 resize한다", () => {
    const { layout, onUpdate, startResize } = mountComposable();

    startResize(
      divider,
      new PointerEvent("pointerdown", {
        pointerId: 1,
        clientX: 500,
        clientY: 0,
      }),
    );

    window.dispatchEvent(
      new PointerEvent("pointermove", {
        pointerId: 1,
        clientX: 600,
        clientY: 0,
      }),
    );

    expect(onUpdate).toHaveBeenCalledTimes(1);

    expect(layout.value).toMatchObject({
      type: "split",
      id: "split-root",
      size: 0.6,
    });
  });
  it("다른 pointerId의 이동은 무시한다", () => {
    const { onUpdate, startResize } = mountComposable();

    startResize(
      divider,
      new PointerEvent("pointerdown", {
        pointerId: 1,
        clientX: 500,
      }),
    );

    window.dispatchEvent(
      new PointerEvent("pointermove", {
        pointerId: 2,
        clientX: 600,
      }),
    );

    expect(onUpdate).not.toHaveBeenCalled();
  });
  it("pointerup 이후에는 resize하지 않는다", () => {
    const { onUpdate, startResize } = mountComposable();

    startResize(
      divider,
      new PointerEvent("pointerdown", {
        pointerId: 1,
        clientX: 500,
      }),
    );

    window.dispatchEvent(
      new PointerEvent("pointerup", {
        pointerId: 1,
      }),
    );

    window.dispatchEvent(
      new PointerEvent("pointermove", {
        pointerId: 1,
        clientX: 600,
      }),
    );

    expect(onUpdate).not.toHaveBeenCalled();
  });
  it("component가 unmount되면 event listener를 정리한다", () => {
    const { wrapper, onUpdate, startResize } = mountComposable();

    startResize(
      divider,
      new PointerEvent("pointerdown", {
        pointerId: 1,
        clientX: 500,
      }),
    );

    wrapper.unmount();

    window.dispatchEvent(
      new PointerEvent("pointermove", {
        pointerId: 1,
        clientX: 600,
      }),
    );

    expect(onUpdate).not.toHaveBeenCalled();
  });
});
