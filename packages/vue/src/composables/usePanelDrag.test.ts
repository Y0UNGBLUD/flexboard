import { describe, expect, it, vi } from "vitest";
import { defineComponent, ref } from "vue";
import { mount } from "@vue/test-utils";

import { usePanelDrag } from "./usePanelDrag.js";

import type { LayoutNode, PanelRect } from "@flexboard/core";

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

function createPanels(): PanelRect[] {
  return [
    {
      type: "panel",
      id: "panel-a",
      top: 0,
      left: 0,
      width: 495,
      height: 500,
    },
    {
      type: "panel",
      id: "panel-b",
      top: 0,
      left: 505,
      width: 495,
      height: 500,
    },
  ];
}

function mountComposable(onUpdate = vi.fn()) {
  const layout = ref<LayoutNode>(createLayout());

  const boardElement = ref<HTMLElement | null>(document.createElement("div"));

  /**
   * client 좌표 → board 내부 좌표 변환이
   * 예측 가능하도록 고정한다.
   */
  vi.spyOn(boardElement.value!, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 1000,
    bottom: 500,
    width: 1000,
    height: 500,
    toJSON: () => ({}),
  });

  let composable: ReturnType<typeof usePanelDrag> | undefined;

  const wrapper = mount(
    defineComponent({
      setup() {
        composable = usePanelDrag({
          boardElement,

          layout: () => layout.value,

          panels: () => createPanels(),

          threshold: 5,
          margin: 0,
          splitRatio: 0.5,

          onUpdate: (nextLayout) => {
            layout.value = nextLayout;
            onUpdate(nextLayout);
          },
        });

        return () => null;
      },
    }),
  );

  if (!composable) {
    throw new Error("usePanelDrag was not initialized.");
  }

  return {
    wrapper,
    layout,
    boardElement,
    onUpdate,
    ...composable,
  };
}

describe("usePanelDrag", () => {
  it("threshold 미만의 이동은 drag를 시작하지 않는다", () => {
    const { startDrag, isDragging, dropTarget } = mountComposable();

    startDrag(
      "panel-a",
      new PointerEvent("pointerdown", {
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        button: 0,
      }),
    );

    // 이동거리 4px
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        pointerId: 1,
        clientX: 104,
        clientY: 100,
      }),
    );

    expect(isDragging.value).toBe(false);
    expect(dropTarget.value).toBeNull();
  });

  it("threshold 이상 이동하면 drag를 시작한다", () => {
    const { startDrag, isDragging } = mountComposable();

    startDrag(
      "panel-a",
      new PointerEvent("pointerdown", {
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        button: 0,
      }),
    );

    window.dispatchEvent(
      new PointerEvent("pointermove", {
        pointerId: 1,
        clientX: 110,
        clientY: 100,
      }),
    );

    expect(isDragging.value).toBe(true);
  });

  it("다른 패널 위로 이동하면 drop target을 계산한다", () => {
    const { startDrag, dropTarget } = mountComposable();

    startDrag(
      "panel-a",
      new PointerEvent("pointerdown", {
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        button: 0,
      }),
    );

    /**
     * panel-b:
     *
     * left   = 505
     * width  = 495
     *
     * x=550이면 panel-b의 왼쪽 영역.
     */
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        pointerId: 1,
        clientX: 550,
        clientY: 250,
      }),
    );

    expect(dropTarget.value).not.toBeNull();

    expect(dropTarget.value).toMatchObject({
      targetId: "panel-b",
      direction: "left",
    });
  });

  it("source 패널 자신은 drop target에서 제외한다", () => {
    const { startDrag, dropTarget } = mountComposable();

    startDrag(
      "panel-a",
      new PointerEvent("pointerdown", {
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        button: 0,
      }),
    );

    // threshold는 넘지만 여전히 panel-a 내부
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        pointerId: 1,
        clientX: 200,
        clientY: 100,
      }),
    );

    expect(dropTarget.value).toBeNull();
  });

  it("pointerup 시 현재 drop target으로 패널을 이동한다", () => {
    const { startDrag, onUpdate, layout } = mountComposable();

    startDrag(
      "panel-a",
      new PointerEvent("pointerdown", {
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        button: 0,
      }),
    );

    // panel-b 왼쪽에 drop preview 생성
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        pointerId: 1,
        clientX: 550,
        clientY: 250,
      }),
    );

    window.dispatchEvent(
      new PointerEvent("pointerup", {
        pointerId: 1,
        clientX: 550,
        clientY: 250,
      }),
    );

    expect(onUpdate).toHaveBeenCalledTimes(1);

    /**
     * panel-a 제거
     *   ↓
     * panel-b만 남음
     *   ↓
     * panel-b의 left에 panel-a 삽입
     */
    expect(layout.value).toMatchObject({
      type: "split",
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
  });

  it("drop target이 없으면 pointerup 시 layout을 변경하지 않는다", () => {
    const { startDrag, onUpdate } = mountComposable();

    startDrag(
      "panel-a",
      new PointerEvent("pointerdown", {
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        button: 0,
      }),
    );

    // board 바깥
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        pointerId: 1,
        clientX: 1200,
        clientY: 700,
      }),
    );

    window.dispatchEvent(
      new PointerEvent("pointerup", {
        pointerId: 1,
      }),
    );

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("pointercancel 시 drop하지 않고 drag 상태를 정리한다", () => {
    const { startDrag, isDragging, dropTarget, onUpdate } = mountComposable();

    startDrag(
      "panel-a",
      new PointerEvent("pointerdown", {
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        button: 0,
      }),
    );

    window.dispatchEvent(
      new PointerEvent("pointermove", {
        pointerId: 1,
        clientX: 550,
        clientY: 250,
      }),
    );

    expect(isDragging.value).toBe(true);
    expect(dropTarget.value).not.toBeNull();

    window.dispatchEvent(
      new PointerEvent("pointercancel", {
        pointerId: 1,
      }),
    );

    expect(isDragging.value).toBe(false);
    expect(dropTarget.value).toBeNull();
    expect(onUpdate).not.toHaveBeenCalled();
  });
});
