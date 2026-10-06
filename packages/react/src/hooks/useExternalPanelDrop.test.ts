import { act, renderHook } from "@testing-library/react";

import { describe, expect, it, vi } from "vitest";

import type { DropTarget, PanelRect } from "@flexboard/core";

import { useExternalPanelDrop } from "./useExternalPanelDrop.js";

/**
 * 테스트용 panel geometry.
 *
 * board 내부 좌표 기준:
 *
 * panel-a: x = 0 ~ 495
 * panel-b: x = 505 ~ 1000
 */
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

/**
 * jsdom의 native DragEvent 구현에 의존하지 않기 위한
 * 테스트용 React DragEvent mock.
 */
function createDragEvent(
  options: {
    clientX?: number;
    clientY?: number;
    relatedTarget?: EventTarget | null;
  } = {},
) {
  return {
    clientX: options.clientX ?? 0,
    clientY: options.clientY ?? 0,

    relatedTarget: options.relatedTarget ?? null,

    preventDefault: vi.fn(),

    dataTransfer: {
      dropEffect: "none",
      effectAllowed: "all",
    },
  } as unknown as React.DragEvent<HTMLElement>;
}

function setup({
  enabled = true,
}: {
  enabled?: boolean;
} = {}) {
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

  const onDrop = vi.fn<(target: DropTarget) => void>();

  const { result } = renderHook(() =>
    useExternalPanelDrop({
      boardElement,

      panels: () => createPanels(),

      enabled,

      margin: 0,
      splitRatio: 0.5,

      onDrop,
    }),
  );

  return {
    result,
    board,
    onDrop,
  };
}

describe("useExternalPanelDrop", () => {
  it("dragover 시 board 좌표로 변환하여 drop target을 계산한다", () => {
    const { result } = setup();

    const event = createDragEvent({
      /**
       * board viewport 위치:
       * left = 100
       * top  = 50
       *
       * client:
       * x = 650
       * y = 300
       *
       * board 내부:
       * x = 550
       * y = 250
       *
       * panel-b의 왼쪽 영역.
       */
      clientX: 650,
      clientY: 300,
    });

    act(() => {
      result.current.handleDragOver(event);
    });

    expect(result.current.dropTarget).toMatchObject({
      targetId: "panel-b",
      direction: "left",
    });
  });

  it("dragover 시 기본 브라우저 동작을 막고 copy dropEffect를 설정한다", () => {
    const { result } = setup();

    const event = createDragEvent({
      clientX: 650,
      clientY: 300,
    });

    act(() => {
      result.current.handleDragOver(event);
    });

    expect(event.preventDefault).toHaveBeenCalledTimes(1);

    expect(event.dataTransfer.dropEffect).toBe("copy");
  });

  it("panel 영역 밖에서는 drop target을 생성하지 않는다", () => {
    const { result } = setup();

    const event = createDragEvent({
      /**
       * board 내부:
       *
       * x = 1200 - 100 = 1100
       *
       * 모든 panel의 오른쪽 바깥.
       */
      clientX: 1200,
      clientY: 300,
    });

    act(() => {
      result.current.handleDragOver(event);
    });

    expect(result.current.dropTarget).toBeNull();
  });

  it("drop 시 현재 target을 onDrop으로 전달한다", () => {
    const { result, onDrop } = setup();

    act(() => {
      result.current.handleDragOver(
        createDragEvent({
          clientX: 650,
          clientY: 300,
        }),
      );
    });

    expect(result.current.dropTarget).toMatchObject({
      targetId: "panel-b",
      direction: "left",
    });

    act(() => {
      result.current.handleDrop(createDragEvent());
    });

    expect(onDrop).toHaveBeenCalledTimes(1);

    expect(onDrop).toHaveBeenCalledWith(
      expect.objectContaining({
        targetId: "panel-b",
        direction: "left",
      }),
    );
  });

  it("drop 이후 target을 초기화한다", () => {
    const { result } = setup();

    act(() => {
      result.current.handleDragOver(
        createDragEvent({
          clientX: 650,
          clientY: 300,
        }),
      );
    });

    expect(result.current.dropTarget).not.toBeNull();

    act(() => {
      result.current.handleDrop(createDragEvent());
    });

    expect(result.current.dropTarget).toBeNull();
  });

  it("target 없이 drop하면 onDrop을 호출하지 않는다", () => {
    const { result, onDrop } = setup();

    act(() => {
      result.current.handleDrop(createDragEvent());
    });

    expect(onDrop).not.toHaveBeenCalled();
  });

  it("dragleave 시 target을 초기화한다", () => {
    const { result } = setup();

    act(() => {
      result.current.handleDragOver(
        createDragEvent({
          clientX: 650,
          clientY: 300,
        }),
      );
    });

    expect(result.current.dropTarget).not.toBeNull();

    act(() => {
      result.current.handleDragLeave(createDragEvent());
    });

    expect(result.current.dropTarget).toBeNull();
  });

  it("board 내부 자식으로 이동하는 dragleave는 무시한다", () => {
    const { result, board } = setup();

    const child = document.createElement("div");

    board.appendChild(child);

    act(() => {
      result.current.handleDragOver(
        createDragEvent({
          clientX: 650,
          clientY: 300,
        }),
      );
    });

    const before = result.current.dropTarget;

    expect(before).not.toBeNull();

    act(() => {
      result.current.handleDragLeave(
        createDragEvent({
          relatedTarget: child,
        }),
      );
    });

    expect(result.current.dropTarget).toEqual(before);
  });

  it("disabled 상태에서는 dragover를 처리하지 않는다", () => {
    const { result } = setup({
      enabled: false,
    });

    const event = createDragEvent({
      clientX: 650,
      clientY: 300,
    });

    act(() => {
      result.current.handleDragOver(event);
    });

    expect(result.current.dropTarget).toBeNull();

    expect(event.preventDefault).not.toHaveBeenCalled();

    expect(event.dataTransfer.dropEffect).toBe("none");
  });

  it("disabled 상태에서는 drop을 처리하지 않는다", () => {
    const { result, onDrop } = setup({
      enabled: false,
    });

    const event = createDragEvent();

    act(() => {
      result.current.handleDrop(event);
    });

    expect(onDrop).not.toHaveBeenCalled();

    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("clear 호출 시 target을 초기화한다", () => {
    const { result } = setup();

    act(() => {
      result.current.handleDragOver(
        createDragEvent({
          clientX: 650,
          clientY: 300,
        }),
      );
    });

    expect(result.current.dropTarget).not.toBeNull();

    act(() => {
      result.current.clear();
    });

    expect(result.current.dropTarget).toBeNull();
  });
});
