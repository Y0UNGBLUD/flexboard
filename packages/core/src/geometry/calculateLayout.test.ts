import { describe, expect, it } from "vitest";
import { calculateLayout } from "./calculateLayout.js";
import type { LayoutNode } from "../types/layout.js";

describe("calculateLayout", () => {
  it("단일 패널은 전체 영역을 차지한다", () => {
    const layout: LayoutNode = {
      type: "actual",
      id: "panel-a",
    };

    const result = calculateLayout(layout, {
      width: 1000,
      height: 800,
    });

    expect(result.panels).toEqual([
      {
        type: "panel",
        id: "panel-a",
        top: 0,
        left: 0,
        width: 1000,
        height: 800,
      },
    ]);

    expect(result.dividers).toEqual([]);
  });

  it("H 50:50 레이아웃을 좌우로 계산한다", () => {
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

    const result = calculateLayout(
      layout,
      {
        width: 1000,
        height: 800,
      },
      10,
    );

    expect(result.panels).toEqual([
      {
        type: "panel",
        id: "panel-a",
        top: 0,
        left: 0,
        width: 495,
        height: 800,
      },
      {
        type: "panel",
        id: "panel-b",
        top: 0,
        left: 505,
        width: 495,
        height: 800,
      },
    ]);

    expect(result.dividers).toEqual([
      {
        type: "divider",
        id: "split-1",
        orientation: "H",
        top: 0,
        left: 495,
        width: 10,
        height: 800,
      },
    ]);
  });

  it("H 30:70 비율을 계산한다", () => {
    const layout: LayoutNode = {
      type: "split",
      id: "split-1",
      orientation: "H",
      size: 0.3,
      first: {
        type: "actual",
        id: "panel-a",
      },
      second: {
        type: "actual",
        id: "panel-b",
      },
    };

    const result = calculateLayout(
      layout,
      {
        width: 1000,
        height: 800,
      },
      10,
    );

    expect(result.panels[0]).toMatchObject({
      id: "panel-a",
      left: 0,
      width: 297,
    });

    expect(result.dividers[0]).toMatchObject({
      left: 297,
      width: 10,
    });

    expect(result.panels[1]).toMatchObject({
      id: "panel-b",
      left: 307,
      width: 693,
    });
  });

  it("V 50:50 레이아웃을 상하로 계산한다", () => {
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

    const result = calculateLayout(
      layout,
      {
        width: 1000,
        height: 800,
      },
      10,
    );

    // 사용 가능한 높이: 800 - 10 = 790
    // 50:50 → 395 / 395

    expect(result.panels).toEqual([
      {
        type: "panel",
        id: "panel-a",
        top: 0,
        left: 0,
        width: 1000,
        height: 395,
      },
      {
        type: "panel",
        id: "panel-b",
        top: 405,
        left: 0,
        width: 1000,
        height: 395,
      },
    ]);

    expect(result.dividers).toEqual([
      {
        type: "divider",
        id: "split-1",
        orientation: "V",
        top: 395,
        left: 0,
        width: 1000,
        height: 10,
      },
    ]);
  });

  it("중첩된 split 레이아웃을 재귀적으로 계산한다", () => {
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
    };

    const result = calculateLayout(
      layout,
      {
        width: 1000,
        height: 800,
      },
      10,
    );

    expect(result.panels).toEqual([
      {
        type: "panel",
        id: "panel-a",
        top: 0,
        left: 0,
        width: 495,
        height: 800,
      },
      {
        type: "panel",
        id: "panel-b",
        top: 0,
        left: 505,
        width: 495,
        height: 395,
      },
      {
        type: "panel",
        id: "panel-c",
        top: 405,
        left: 505,
        width: 495,
        height: 395,
      },
    ]);

    expect(result.dividers).toHaveLength(2);

    expect(result.dividers).toEqual([
      {
        type: "divider",
        id: "split-root",
        orientation: "H",
        top: 0,
        left: 495,
        width: 10,
        height: 800,
      },
      {
        type: "divider",
        id: "split-right",
        orientation: "V",
        top: 395,
        left: 505,
        width: 495,
        height: 10,
      },
    ]);
  });

  it("레이아웃 계산 과정에서 원본 트리를 변경하지 않는다", () => {
    const layout: LayoutNode = {
      type: "split",
      id: "split-1",
      orientation: "H",
      size: 0.3,
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

    calculateLayout(layout, {
      width: 1000,
      height: 800,
    });

    expect(layout).toEqual(original);
  });
  it("size가 0보다 작으면 0으로 보정한다", () => {
    const layout: LayoutNode = {
      type: "split",
      id: "split-1",
      orientation: "H",
      size: -0.5,
      first: {
        type: "actual",
        id: "panel-a",
      },
      second: {
        type: "actual",
        id: "panel-b",
      },
    };

    const result = calculateLayout(
      layout,
      {
        width: 1000,
        height: 800,
      },
      10,
    );

    expect(result.panels).toEqual([
      {
        type: "panel",
        id: "panel-a",
        top: 0,
        left: 0,
        width: 0,
        height: 800,
      },
      {
        type: "panel",
        id: "panel-b",
        top: 0,
        left: 10,
        width: 990,
        height: 800,
      },
    ]);

    expect(result.dividers[0]).toMatchObject({
      left: 0,
      width: 10,
    });
  });
  it("size가 1보다 크면 1로 보정한다", () => {
    const layout: LayoutNode = {
      type: "split",
      id: "split-1",
      orientation: "H",
      size: 1.5,
      first: {
        type: "actual",
        id: "panel-a",
      },
      second: {
        type: "actual",
        id: "panel-b",
      },
    };

    const result = calculateLayout(
      layout,
      {
        width: 1000,
        height: 800,
      },
      10,
    );

    expect(result.panels).toEqual([
      {
        type: "panel",
        id: "panel-a",
        top: 0,
        left: 0,
        width: 990,
        height: 800,
      },
      {
        type: "panel",
        id: "panel-b",
        top: 0,
        left: 1000,
        width: 0,
        height: 800,
      },
    ]);

    expect(result.dividers[0]).toMatchObject({
      left: 990,
      width: 10,
    });
  });
  it("dividerSize가 음수이면 RangeError를 던진다", () => {
    const layout: LayoutNode = {
      type: "actual",
      id: "panel-a",
    };

    expect(() =>
      calculateLayout(
        layout,
        {
          width: 1000,
          height: 800,
        },
        -10,
      ),
    ).toThrow(RangeError);
  });
  it("H split의 width가 dividerSize보다 작으면 RangeError를 던진다", () => {
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
      calculateLayout(
        layout,
        {
          width: 5,
          height: 800,
        },
        10,
      ),
    ).toThrow(RangeError);
  });
  it("H split의 width가 dividerSize와 같아도 RangeError를 던진다", () => {
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
      calculateLayout(
        layout,
        {
          width: 10,
          height: 800,
        },
        10,
      ),
    ).toThrow(RangeError);
  });
  it("V split의 height가 dividerSize 이하이면 RangeError를 던진다", () => {
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

    expect(() =>
      calculateLayout(
        layout,
        {
          width: 1000,
          height: 10,
        },
        10,
      ),
    ).toThrow(RangeError);
  });
  it("중첩된 split의 영역이 dividerSize 이하가 되면 RangeError를 던진다", () => {
    const layout: LayoutNode = {
      type: "split",
      id: "split-root",
      orientation: "H",
      size: 0.99,
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

    expect(() =>
      calculateLayout(
        layout,
        {
          width: 1000,
          height: 800,
        },
        10,
      ),
    ).toThrow(RangeError);
  });
});
