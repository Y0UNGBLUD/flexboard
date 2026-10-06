import { describe, expect, it } from "vitest";
import { detectDropTarget } from "./target.js";
import type { PanelRect } from "../types/geometry.js";

describe("detectDropTarget", () => {
  const panels: PanelRect[] = [
    {
      type: "panel",
      id: "panel-a",
      top: 100,
      left: 100,
      width: 200,
      height: 200,
    },
  ];

  it("패널 내부의 포인터를 drop target으로 탐지한다", () => {
    const result = detectDropTarget(
      {
        top: 150,
        left: 150,
      },
      panels,
    );

    expect(result).not.toBeNull();
    expect(result?.targetId).toBe("panel-a");
  });

  it("어떤 패널에도 포함되지 않으면 null을 반환한다", () => {
    const result = detectDropTarget(
      {
        top: 500,
        left: 500,
      },
      panels,
    );

    expect(result).toBeNull();
  });

  it("excludeId로 지정된 패널은 target에서 제외한다", () => {
    const result = detectDropTarget(
      {
        top: 150,
        left: 150,
      },
      panels,
      {
        excludeId: "panel-a",
      },
    );

    expect(result).toBeNull();
  });

  it("margin 영역 안의 포인터도 target으로 탐지한다", () => {
    const result = detectDropTarget(
      {
        top: 200,
        left: 90,
      },
      panels,
      {
        margin: 20,
      },
    );

    expect(result?.targetId).toBe("panel-a");
  });

  it("margin 영역 밖의 포인터는 target으로 탐지하지 않는다", () => {
    const result = detectDropTarget(
      {
        top: 200,
        left: 79,
      },
      panels,
      {
        margin: 20,
      },
    );

    expect(result).toBeNull();
  });
  it.each([
    {
      name: "left",
      pointer: { top: 200, left: 120 },
      direction: "left",
      preview: {
        top: 100,
        left: 100,
        width: 100,
        height: 200,
      },
    },
    {
      name: "right",
      pointer: { top: 200, left: 280 },
      direction: "right",
      preview: {
        top: 100,
        left: 200,
        width: 100,
        height: 200,
      },
    },
    {
      name: "top",
      pointer: { top: 120, left: 200 },
      direction: "top",
      preview: {
        top: 100,
        left: 100,
        width: 200,
        height: 100,
      },
    },
    {
      name: "bottom",
      pointer: { top: 280, left: 200 },
      direction: "bottom",
      preview: {
        top: 200,
        left: 100,
        width: 200,
        height: 100,
      },
    },
  ] as const)(
    "$name 방향의 drop target과 preview를 계산한다",
    ({ pointer, direction, preview }) => {
      const result = detectDropTarget(pointer, panels);

      expect(result).not.toBeNull();

      expect(result).toMatchObject({
        targetId: "panel-a",
        direction,
        preview,
      });
    },
  );
  it("splitRatio에 따라 preview 크기를 계산한다", () => {
    const result = detectDropTarget(
      {
        top: 200,
        left: 280,
      },
      panels,
      {
        splitRatio: 0.3,
      },
    );

    expect(result).toMatchObject({
      targetId: "panel-a",
      direction: "right",
      preview: {
        top: 100,
        left: 240,
        width: 60,
        height: 200,
      },
    });
  });
  it("splitRatio가 0보다 작으면 0으로 보정한다", () => {
    const result = detectDropTarget(
      {
        top: 200,
        left: 280,
      },
      panels,
      {
        splitRatio: -1,
      },
    );

    expect(result?.preview.width).toBe(0);
  });

  it("splitRatio가 1보다 크면 1로 보정한다", () => {
    const result = detectDropTarget(
      {
        top: 200,
        left: 280,
      },
      panels,
      {
        splitRatio: 2,
      },
    );

    expect(result?.preview.width).toBe(200);
  });
});
