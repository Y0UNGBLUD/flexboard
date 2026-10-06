import { describe, expect, it } from "vitest";
import { resizeSplit } from "./resizeSplit.js";
import type { LayoutNode } from "../types/layout.js";

describe("resizeSplit", () => {
  it("H split을 가로 크기를 기준으로 resize한다", () => {
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

    const result = resizeSplit(layout, "split-1", 100, {
      width: 1000,
      height: 800,
    });

    // 100 / 1000 = 0.1
    // 0.5 + 0.1 = 0.6
    expect(result).toMatchObject({
      type: "split",
      id: "split-1",
      size: 0.6,
    });
  });

  it("V split을 세로 크기를 기준으로 resize한다", () => {
    const layout: LayoutNode = {
      type: "split",
      id: "split-1",
      orientation: "V",
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

    const result = resizeSplit(layout, "split-1", 80, {
      width: 1000,
      height: 800,
    });

    // 80 / 800 = 0.1
    expect(result).toMatchObject({
      type: "split",
      size: 0.6,
    });
  });

  it("음수 delta이면 first 영역을 줄인다", () => {
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

    const result = resizeSplit(layout, "split-1", -100, {
      width: 1000,
      height: 800,
    });

    expect(result).toMatchObject({
      type: "split",
      size: 0.4,
    });
  });

  it("size가 기본 minRatio보다 작아지지 않는다", () => {
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

    const result = resizeSplit(layout, "split-1", -1000, {
      width: 1000,
      height: 800,
    });

    expect(result).toMatchObject({
      type: "split",
      size: 0.1,
    });
  });

  it("size가 기본 maxRatio보다 커지지 않는다", () => {
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

    const result = resizeSplit(layout, "split-1", 1000, {
      width: 1000,
      height: 800,
    });

    expect(result).toMatchObject({
      type: "split",
      size: 0.9,
    });
  });

  it("사용자 지정 minRatio와 maxRatio를 적용한다", () => {
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

    const minResult = resizeSplit(
      layout,
      "split-1",
      -1000,
      {
        width: 1000,
        height: 800,
      },
      {
        minRatio: 0.2,
        maxRatio: 0.8,
      },
    );

    const maxResult = resizeSplit(
      layout,
      "split-1",
      1000,
      {
        width: 1000,
        height: 800,
      },
      {
        minRatio: 0.2,
        maxRatio: 0.8,
      },
    );

    expect(minResult).toMatchObject({
      size: 0.2,
    });

    expect(maxResult).toMatchObject({
      size: 0.8,
    });
  });

  it("splitId가 존재하지 않으면 원본을 그대로 반환한다", () => {
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

    const result = resizeSplit(layout, "not-found", 100, {
      width: 1000,
      height: 800,
    });

    expect(result).toBe(layout);
  });

  it("resize 과정에서 원본 트리를 변경하지 않는다", () => {
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

    const result = resizeSplit(layout, "split-1", 100, {
      width: 1000,
      height: 800,
    });

    expect(layout).toEqual(original);
    expect(result).not.toBe(layout);
  });

  it("resize 대상의 container size가 0 이하이면 RangeError를 던진다", () => {
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

    expect(() =>
      resizeSplit(layout, "split-1", 100, {
        width: 0,
        height: 800,
      }),
    ).toThrow(RangeError);
  });
  it("중첩된 split은 자신의 실제 영역 크기를 기준으로 resize한다", () => {
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
        type: "split",
        id: "split-child",
        orientation: "H",
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
    };

    const result = resizeSplit(
      layout,
      "split-child",
      49.5,
      {
        width: 1000,
        height: 800,
      },
      {
        dividerSize: 10,
      },
    );

    /*
     * root:
     *
     * availableWidth = 1000 - 10
     *                = 990
     *
     * second 영역:
     * 990 * 0.5
     * = 495
     *
     * 따라서 child의 totalSize는 495.
     *
     * deltaRatio:
     * 49.5 / 495
     * = 0.1
     *
     * child.size:
     * 0.5 + 0.1
     * = 0.6
     */

    expect(result).toMatchObject({
      type: "split",
      id: "split-root",
      size: 0.5,

      second: {
        type: "split",
        id: "split-child",
        size: 0.6,
      },
    });
  });
  it("변경되지 않은 branch의 reference를 유지한다", () => {
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
        type: "split",
        id: "split-child",
        orientation: "H",
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
    };

    const result = resizeSplit(layout, "split-child", 49.5, {
      width: 1000,
      height: 800,
    });

    if (result.type !== "split") {
      throw new Error("Expected split node");
    }

    expect(result).not.toBe(layout);

    // 변경되지 않은 왼쪽 branch
    expect(result.first).toBe(layout.first);

    // 변경된 오른쪽 branch
    expect(result.second).not.toBe(layout.second);
  });
});
