import { describe, expect, it, vi } from "vitest";
import { defineComponent, ref } from "vue";
import { mount } from "@vue/test-utils";

import { useExternalPanelDrop } from "./useExternalPanelDrop.js";

import type { DropTarget, PanelRect } from "@flexboard/core";
function createPanels(): PanelRect[] {
  return [
    {
      id: "panel-a",
      type: "panel",
      top: 0,
      left: 0,
      width: 495,
      height: 500,
    },
    {
      id: "panel-b",
      type: "panel",
      top: 0,
      left: 505,
      width: 495,
      height: 500,
    },
  ];
}
function createDragEvent(
  type: string,
  options: {
    clientX?: number;
    clientY?: number;
    relatedTarget?: EventTarget | null;
  } = {},
): DragEvent {
  const event = new MouseEvent(type, {
    clientX: options.clientX ?? 0,
    clientY: options.clientY ?? 0,
    bubbles: true,

    relatedTarget: options.relatedTarget ?? null,
  });

  Object.defineProperty(event, "dataTransfer", {
    value: {
      dropEffect: "none",
      effectAllowed: "all",
    },
    writable: true,
  });

  return event as DragEvent;
}
function mountComposable({
  enabled = true,
}: {
  enabled?: boolean;
} = {}) {
  const onDrop = vi.fn<(target: DropTarget) => void>();
  const boardElement = ref<HTMLElement | null>(document.createElement("div"));

  vi.spyOn(boardElement.value!, "getBoundingClientRect").mockReturnValue({
    x: 100,
    y: 50,

    top: 50,
    left: 100,

    right: 1100,
    bottom: 550,

    width: 1000,
    height: 500,

    toJSON: () => ({}),
  });

  let composable: ReturnType<typeof useExternalPanelDrop> | undefined;

  const wrapper = mount(
    defineComponent({
      setup() {
        composable = useExternalPanelDrop({
          boardElement,

          panels: () => createPanels(),

          enabled: () => enabled,

          margin: 0,
          splitRatio: 0.5,

          onDrop,
        });

        return () => null;
      },
    }),
  );

  if (!composable) {
    throw new Error("useExternalPanelDrop was not initialized.");
  }

  return {
    wrapper,
    boardElement,
    onDrop,
    ...composable,
  };
}

describe("useExternalPanelDrop", () => {
  it("dragover 시 board 좌표로 변환하여 drop target을 계산한다", () => {
    const { handleDragOver, dropTarget } = mountComposable();

    /**
     * board의 viewport 위치:
     * left = 100
     * top  = 50
     *
     * clientX = 650
     * clientY = 300
     *
     * board 내부 좌표:
     * left = 550
     * top  = 250
     *
     * 따라서 panel-b의 왼쪽 영역.
     */
    const event = createDragEvent("dragover", {
      clientX: 650,
      clientY: 300,
    });

    handleDragOver(event);

    expect(dropTarget.value).not.toBeNull();

    expect(dropTarget.value).toMatchObject({
      targetId: "panel-b",
      direction: "left",
    });
  });

  it("유효한 target이 있으면 external dragging 상태가 된다", () => {
    const { handleDragOver, isExternalDragging } = mountComposable();

    handleDragOver(
      createDragEvent("dragover", {
        clientX: 650,
        clientY: 300,
      }),
    );

    expect(isExternalDragging.value).toBe(true);
  });

  it("panel 영역 밖에서는 drop target을 생성하지 않는다", () => {
    const { handleDragOver, dropTarget, isExternalDragging } =
      mountComposable();

    /**
     * board 내부 좌표로:
     *
     * x = 1200 - 100 = 1100
     *
     * 모든 panel 밖.
     */
    handleDragOver(
      createDragEvent("dragover", {
        clientX: 1200,
        clientY: 300,
      }),
    );

    expect(dropTarget.value).toBeNull();

    expect(isExternalDragging.value).toBe(false);
  });

  it("drop 시 현재 target을 onDrop으로 전달한다", () => {
    const { handleDragOver, handleDrop, onDrop } = mountComposable();

    handleDragOver(
      createDragEvent("dragover", {
        clientX: 650,
        clientY: 300,
      }),
    );

    handleDrop(createDragEvent("drop", {}));

    expect(onDrop).toHaveBeenCalledTimes(1);

    expect(onDrop).toHaveBeenCalledWith(
      expect.objectContaining({
        targetId: "panel-b",
        direction: "left",
      }),
    );
  });

  it("drop 이후 상태를 초기화한다", () => {
    const { handleDragOver, handleDrop, dropTarget, isExternalDragging } =
      mountComposable();

    handleDragOver(
      createDragEvent("dragover", {
        clientX: 650,
        clientY: 300,
      }),
    );

    expect(dropTarget.value).not.toBeNull();

    handleDrop(createDragEvent("drop", {}));

    expect(dropTarget.value).toBeNull();

    expect(isExternalDragging.value).toBe(false);
  });

  it("target 없이 drop하면 onDrop을 호출하지 않는다", () => {
    const { handleDrop, onDrop } = mountComposable();

    handleDrop(createDragEvent("drop", {}));

    expect(onDrop).not.toHaveBeenCalled();
  });

  it("disabled 상태에서는 dragover를 처리하지 않는다", () => {
    const { handleDragOver, dropTarget, isExternalDragging } = mountComposable({
      enabled: false,
    });

    const event = createDragEvent("dragover", {
      clientX: 650,
      clientY: 300,
    });

    handleDragOver(event);

    expect(dropTarget.value).toBeNull();

    expect(isExternalDragging.value).toBe(false);

    /**
     * FlexBoard가 external DnD를 사용하지 않을 때는
     * native dragover 동작도 가로채지 않는다.
     */
    expect(event.defaultPrevented).toBe(false);
  });

  it("disabled 상태에서는 drop callback을 호출하지 않는다", () => {
    const { handleDrop, onDrop } = mountComposable({
      enabled: false,
    });

    const event = createDragEvent("drop", {});

    handleDrop(event);

    expect(onDrop).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("dragleave 시 상태를 초기화한다", () => {
    const { handleDragOver, handleDragLeave, dropTarget, isExternalDragging } =
      mountComposable();

    handleDragOver(
      createDragEvent("dragover", {
        clientX: 650,
        clientY: 300,
      }),
    );

    expect(dropTarget.value).not.toBeNull();

    handleDragLeave(createDragEvent("dragleave"));

    expect(dropTarget.value).toBeNull();

    expect(isExternalDragging.value).toBe(false);
  });
});
