import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { LayoutNode, PanelRect } from "@flexboard/core";

import { usePanelDrag } from "./usePanelDrag.js";

const layout: LayoutNode = {
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

function createPanels(): PanelRect[] {
  return [
    {
      id: "panel-a",
      type: "panel",
      left: 0,
      top: 0,
      width: 495,
      height: 500,
    },
    {
      id: "panel-b",
      type: "panel",
      left: 505,
      top: 0,
      width: 495,
      height: 500,
    },
  ];
}

function createPointerEvent(
  type: string,
  options: {
    clientX?: number;
    clientY?: number;
    button?: number;
  } = {},
): PointerEvent {
  return new MouseEvent(type, {
    clientX: options.clientX ?? 0,
    clientY: options.clientY ?? 0,
    button: options.button ?? 0,
    bubbles: true,
    cancelable: true,
  }) as PointerEvent;
}

function createReactPointerEvent(
  options: {
    clientX?: number;
    clientY?: number;
    button?: number;
  } = {},
) {
  return {
    clientX: options.clientX ?? 0,
    clientY: options.clientY ?? 0,
    button: options.button ?? 0,
  } as React.PointerEvent;
}

function setup() {
  const board = document.createElement("div");

  vi.spyOn(board, "getBoundingClientRect").mockReturnValue({
    x: 100,
    y: 50,

    left: 100,
    top: 50,
    right: 1100,
    bottom: 550,

    width: 1000,
    height: 500,

    toJSON: () => ({}),
  });

  const boardElement = {
    current: board,
  };

  const onLayoutChange = vi.fn<(layout: LayoutNode) => void>();

  const { result } = renderHook(() =>
    usePanelDrag({
      layout,

      boardElement,

      panels: () => createPanels(),

      threshold: 5,
      margin: 0,
      splitRatio: 0.5,

      onLayoutChange,
    }),
  );

  return {
    result,
    board,
    onLayoutChange,
  };
}

describe("usePanelDrag", () => {
  it("pointerdown만으로는 drag가 시작되지 않는다", () => {
    const { result } = setup();

    act(() => {
      result.current.startDrag(
        "panel-a",
        createReactPointerEvent({
          clientX: 200,
          clientY: 200,
        }),
      );
    });

    expect(result.current.isDragging).toBe(false);

    expect(result.current.dropTarget).toBeNull();
  });

  it("threshold 미만으로 이동하면 drag가 시작되지 않는다", () => {
    const { result } = setup();

    act(() => {
      result.current.startDrag(
        "panel-a",
        createReactPointerEvent({
          clientX: 200,
          clientY: 200,
        }),
      );
    });

    act(() => {
      window.dispatchEvent(
        createPointerEvent("pointermove", {
          clientX: 202,
          clientY: 202,
        }),
      );
    });

    expect(result.current.isDragging).toBe(false);

    expect(result.current.dropTarget).toBeNull();
  });

  it("threshold 이상 이동하면 drag가 시작된다", () => {
    const { result } = setup();

    act(() => {
      result.current.startDrag(
        "panel-a",
        createReactPointerEvent({
          clientX: 200,
          clientY: 200,
        }),
      );
    });

    act(() => {
      window.dispatchEvent(
        createPointerEvent("pointermove", {
          /**
           * board 기준:
           *
           * x = 650 - 100 = 550
           * y = 300 - 50 = 250
           *
           * panel-b 내부
           */
          clientX: 650,
          clientY: 300,
        }),
      );
    });

    expect(result.current.isDragging).toBe(true);

    expect(result.current.dropTarget).not.toBeNull();
  });

  it("source panel은 drop target에서 제외한다", () => {
    const { result } = setup();

    act(() => {
      result.current.startDrag(
        "panel-a",
        createReactPointerEvent({
          clientX: 200,
          clientY: 200,
        }),
      );
    });

    act(() => {
      window.dispatchEvent(
        createPointerEvent("pointermove", {
          /**
           * board 기준:
           *
           * x = 250 - 100 = 150
           * y = 200 - 50 = 150
           *
           * panel-a 내부지만
           * source이므로 제외되어야 한다.
           */
          clientX: 250,
          clientY: 200,
        }),
      );
    });

    expect(result.current.isDragging).toBe(true);

    expect(result.current.dropTarget).toBeNull();
  });

  it("다른 패널 위에서는 drop target을 계산한다", () => {
    const { result } = setup();

    act(() => {
      result.current.startDrag(
        "panel-a",
        createReactPointerEvent({
          clientX: 200,
          clientY: 200,
        }),
      );
    });

    act(() => {
      window.dispatchEvent(
        createPointerEvent("pointermove", {
          clientX: 650,
          clientY: 300,
        }),
      );
    });

    expect(result.current.dropTarget).toMatchObject({
      targetId: "panel-b",
      direction: "left",
    });
  });

  it("유효한 target에서 pointerup하면 layout을 이동한다", () => {
    const { result, onLayoutChange } = setup();

    // panel-a에서 drag 시작
    act(() => {
      result.current.startDrag(
        "panel-a",
        createReactPointerEvent({
          clientX: 200,
          clientY: 200,
        }),
      );
    });

    // panel-b의 오른쪽 영역으로 이동
    act(() => {
      window.dispatchEvent(
        createPointerEvent("pointermove", {
          /**
           * board:
           * left = 100
           *
           * clientX = 1050
           * → board 내부 x = 950
           *
           * panel-b:
           * left = 505
           * width = 495
           *
           * 따라서 panel-b의 오른쪽 영역.
           */
          clientX: 1050,
          clientY: 300,
        }),
      );
    });

    // 제대로 right target이 잡혔는지 먼저 확인
    expect(result.current.dropTarget).toMatchObject({
      targetId: "panel-b",
      direction: "right",
    });

    // drop
    act(() => {
      window.dispatchEvent(createPointerEvent("pointerup"));
    });

    expect(onLayoutChange).toHaveBeenCalledTimes(1);

    /**
     * 기존:
     *
     * panel-a | panel-b
     *
     * panel-a를 panel-b의 right로 이동했으므로:
     *
     * panel-b | panel-a
     */
    expect(onLayoutChange).toHaveBeenCalledWith({
      type: "split",
      id: expect.any(String),
      orientation: "H",
      size: 0.5,

      first: {
        type: "actual",
        id: "panel-b",
      },

      second: {
        type: "actual",
        id: "panel-a",
      },
    });
  });

  it("drop target 없이 pointerup하면 layout을 변경하지 않는다", () => {
    const { result, onLayoutChange } = setup();

    act(() => {
      result.current.startDrag(
        "panel-a",
        createReactPointerEvent({
          clientX: 200,
          clientY: 200,
        }),
      );
    });

    act(() => {
      window.dispatchEvent(
        createPointerEvent("pointermove", {
          /**
           * source panel 영역이므로
           * target 없음.
           */
          clientX: 250,
          clientY: 200,
        }),
      );
    });

    act(() => {
      window.dispatchEvent(createPointerEvent("pointerup"));
    });

    expect(onLayoutChange).not.toHaveBeenCalled();
  });

  it("pointerup 이후 drag 상태를 초기화한다", () => {
    const { result } = setup();

    act(() => {
      result.current.startDrag(
        "panel-a",
        createReactPointerEvent({
          clientX: 200,
          clientY: 200,
        }),
      );
    });

    act(() => {
      window.dispatchEvent(
        createPointerEvent("pointermove", {
          clientX: 650,
          clientY: 300,
        }),
      );
    });

    expect(result.current.isDragging).toBe(true);

    expect(result.current.dropTarget).not.toBeNull();

    act(() => {
      window.dispatchEvent(createPointerEvent("pointerup"));
    });

    expect(result.current.isDragging).toBe(false);

    expect(result.current.dropTarget).toBeNull();
  });

  it("pointercancel 시 drag 상태를 초기화하고 layout은 변경하지 않는다", () => {
    const { result, onLayoutChange } = setup();

    act(() => {
      result.current.startDrag(
        "panel-a",
        createReactPointerEvent({
          clientX: 200,
          clientY: 200,
        }),
      );
    });

    act(() => {
      window.dispatchEvent(
        createPointerEvent("pointermove", {
          clientX: 650,
          clientY: 300,
        }),
      );
    });

    expect(result.current.isDragging).toBe(true);

    act(() => {
      window.dispatchEvent(createPointerEvent("pointercancel"));
    });

    expect(result.current.isDragging).toBe(false);

    expect(result.current.dropTarget).toBeNull();

    expect(onLayoutChange).not.toHaveBeenCalled();
  });

  it("왼쪽 버튼이 아니면 drag를 시작하지 않는다", () => {
    const { result } = setup();

    act(() => {
      result.current.startDrag(
        "panel-a",
        createReactPointerEvent({
          clientX: 200,
          clientY: 200,

          // right click
          button: 2,
        }),
      );
    });

    act(() => {
      window.dispatchEvent(
        createPointerEvent("pointermove", {
          clientX: 650,
          clientY: 300,
        }),
      );
    });

    expect(result.current.isDragging).toBe(false);

    expect(result.current.dropTarget).toBeNull();
  });
});
