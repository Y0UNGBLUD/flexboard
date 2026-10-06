import { describe, expect, it } from "vitest";
import { removePanel, insertPanelNear, movePanel } from "./operations.js";
import type { LayoutNode } from "../types/layout.js";

describe("removePanel", () => {
  it("대상 패널을 제거한다", () => {
    const layout: LayoutNode = {
      type: "split",
      id: "split-1",
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

    const result = removePanel(layout, "panel-a");

    expect(result).toEqual({
      type: "actual",
      id: "panel-b",
    });
  });
  it("원본 레이아웃을 변경하지 않는다", () => {
    const layout: LayoutNode = {
      type: "split",
      id: "split-1",
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

    const original = structuredClone(layout);

    removePanel(layout, "panel-a");

    expect(layout).toEqual(original);
  });
});

describe("insertPanelNear", () => {
  it("right 방향이면 기존 패널 오른쪽에 새 패널을 배치한다", () => {
    const layout: LayoutNode = {
      type: "actual",
      id: "panel-a",
    };

    const result = insertPanelNear(layout, "panel-a", "panel-b", "right");

    expect(result).toMatchObject({
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
  it.each([
    ["left", "H", "panel-b", "panel-a"],
    ["right", "H", "panel-a", "panel-b"],
    ["top", "V", "panel-b", "panel-a"],
    ["bottom", "V", "panel-a", "panel-b"],
  ] as const)(
    "%s 방향으로 패널을 삽입한다",
    (direction, orientation, firstId, secondId) => {
      const layout: LayoutNode = {
        type: "actual",
        id: "panel-a",
      };

      const result = insertPanelNear(layout, "panel-a", "panel-b", direction);

      expect(result).toMatchObject({
        type: "split",
        orientation,
        first: {
          id: firstId,
        },
        second: {
          id: secondId,
        },
      });
    },
  );
});
describe("movePanel", () => {
  const createLayout = (): LayoutNode => ({
    type: "split",
    id: "split-root",
    orientation: "H",
    size: 0.5,
    first: {
      type: "actual",
      id: "panel-a",
    },
    second: {
      type: "split",
      id: "split-right",
      orientation: "V",
      size: 0.5,
      first: {
        type: "actual",
        id: "panel-b",
      },
      second: {
        type: "actual",
        id: "panel-c",
      },
    },
  });

  it("source와 target이 같으면 원본을 그대로 반환한다", () => {
    const layout = createLayout();

    const result = movePanel(layout, "panel-a", "panel-a", "right");

    expect(result).toBe(layout);
  });

  it("source가 존재하지 않으면 원본을 그대로 반환한다", () => {
    const layout = createLayout();

    const result = movePanel(layout, "not-found", "panel-b", "right");

    expect(result).toBe(layout);
  });

  it("target이 존재하지 않으면 원본을 그대로 반환한다", () => {
    const layout = createLayout();

    const result = movePanel(layout, "panel-a", "not-found", "right");

    expect(result).toBe(layout);
  });

  it("source 패널을 target 패널의 오른쪽으로 이동한다", () => {
    const layout = createLayout();

    const result = movePanel(layout, "panel-a", "panel-b", "right");

    expect(result).toMatchObject({
      type: "split",
      orientation: "V",
      first: {
        type: "split",
        orientation: "H",
        first: {
          type: "actual",
          id: "panel-b",
        },
        second: {
          type: "actual",
          id: "panel-a",
        },
      },
      second: {
        type: "actual",
        id: "panel-c",
      },
    });
  });

  it("정상 이동 시 새로운 트리를 반환한다", () => {
    const layout = createLayout();

    const result = movePanel(layout, "panel-a", "panel-b", "right");

    expect(result).not.toBe(layout);
  });

  it("패널을 이동해도 원본 트리를 변경하지 않는다", () => {
    const layout = createLayout();
    const original = structuredClone(layout);

    movePanel(layout, "panel-a", "panel-b", "right");

    expect(layout).toEqual(original);
  });
});
