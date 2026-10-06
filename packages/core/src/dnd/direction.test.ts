import { describe, expect, it } from "vitest";
import { getDropDirection } from "./direction.js";

describe("getDropDirection", () => {
  it("오른쪽 이동량이 가장 크면 right를 반환한다", () => {
    expect(getDropDirection(100, 20)).toBe("right");
  });

  it("왼쪽 이동량이 가장 크면 left를 반환한다", () => {
    expect(getDropDirection(-100, 20)).toBe("left");
  });

  it("아래쪽 이동량이 가장 크면 bottom을 반환한다", () => {
    expect(getDropDirection(20, 100)).toBe("bottom");
  });

  it("위쪽 이동량이 가장 크면 top을 반환한다", () => {
    expect(getDropDirection(20, -100)).toBe("top");
  });

  it("X와 Y 이동량의 절댓값이 같으면 vertical 방향을 우선한다", () => {
    expect(getDropDirection(100, 100)).toBe("bottom");
    expect(getDropDirection(100, -100)).toBe("top");
    expect(getDropDirection(-100, 100)).toBe("bottom");
    expect(getDropDirection(-100, -100)).toBe("top");
  });

  it("정확한 중앙이면 top을 반환한다", () => {
    expect(getDropDirection(0, 0)).toBe("top");
  });
});
