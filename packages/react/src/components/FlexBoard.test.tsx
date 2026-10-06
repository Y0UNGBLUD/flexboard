import { useEffect, useState } from "react";
import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LayoutNode } from "@flexboard/core";

import { FlexBoard } from "./FlexBoard.js";

/**
 * jsdom에는 ResizeObserver가 없으므로 테스트용 mock을 사용한다.
 */
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

/**
 * FlexBoard가 최초 렌더링할 layout.
 *
 * chart | orders
 *       | news
 */
const initialLayout: LayoutNode = {
  type: "split",
  id: "root",
  orientation: "H",
  size: 0.5,

  first: {
    type: "actual",
    id: "chart",
  },

  second: {
    type: "split",
    id: "right",
    orientation: "V",
    size: 0.5,

    first: {
      type: "actual",
      id: "orders",
    },

    second: {
      type: "actual",
      id: "news",
    },
  },
};

/**
 * React local state가 보존되는지 확인하기 위한 테스트용 panel.
 */
function StatefulPanel({
  id,
  onMount,
  onUnmount,
}: {
  id: string;
  onMount: (id: string) => void;
  onUnmount: (id: string) => void;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    onMount(id);

    return () => {
      onUnmount(id);
    };
  }, [id, onMount, onUnmount]);

  return (
    <div>
      <span data-testid={`count-${id}`}>{count}</span>

      <button
        type="button"
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        onClick={() => {
          setCount((current) => current + 1);
        }}
      >
        increment-{id}
      </button>
    </div>
  );
}

beforeEach(() => {
  /**
   * FlexBoard 내부에서 사용하는 browser API.
   */
  vi.stubGlobal("ResizeObserver", ResizeObserverMock);

  /**
   * jsdom에는 실제 layout 계산이 없기 때문에
   * FlexBoard container가 800x600이라고 가정한다.
   */
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,

    top: 0,
    left: 0,
    right: 800,
    bottom: 600,

    width: 800,
    height: 600,

    toJSON: () => ({}),
  });
});

afterEach(() => {
  cleanup();

  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("FlexBoard", () => {
  it("다른 패널이 삭제되어도 살아남은 패널의 state를 유지한다", () => {
    const onMount = vi.fn<(id: string) => void>();
    const onUnmount = vi.fn<(id: string) => void>();

    const onLayoutChange = vi.fn<(layout: LayoutNode) => void>();

    const { rerender, container } = render(
      <FlexBoard
        layout={initialLayout}
        onLayoutChange={onLayoutChange}
        renderPanel={({ id }) => (
          <StatefulPanel id={id} onMount={onMount} onUnmount={onUnmount} />
        )}
      />,
    );

    /**
     * document.body 전체가 아니라
     * 이번 render의 container 안에서만 검색한다.
     */
    const view = within(container);

    /**
     * chart의 local state를 1로 만든다.
     */
    const incrementChart = view.getByRole("button", {
      name: "increment-chart",
    });

    fireEvent.click(incrementChart);
    expect(view.getByTestId("count-chart").textContent).toBe("1");

    /**
     * orders를 제거한 layout.
     *
     * chart | news
     */
    const nextLayout: LayoutNode = {
      type: "split",
      id: "root",
      orientation: "H",
      size: 0.5,

      first: {
        type: "actual",
        id: "chart",
      },

      second: {
        type: "actual",
        id: "news",
      },
    };

    rerender(
      <FlexBoard
        layout={nextLayout}
        onLayoutChange={onLayoutChange}
        renderPanel={({ id }) => (
          <StatefulPanel id={id} onMount={onMount} onUnmount={onUnmount} />
        )}
      />,
    );

    /**
     * chart의 React local state가 유지되어야 한다.
     */

    expect(view.getByTestId("count-chart").textContent).toBe("1");

    /**
     * 실제로 제거된 orders만 unmount되어야 한다.
     */

    expect(onUnmount).toHaveBeenCalledWith("orders");

    expect(onUnmount).not.toHaveBeenCalledWith("chart");

    expect(onUnmount).not.toHaveBeenCalledWith("news");

    /**
     * chart가 다시 mount되지 않았는지도 확인한다.
     */
    expect(onMount.mock.calls.filter(([id]) => id === "chart")).toHaveLength(1);
  });

  it("패널 위치가 변경되어도 동일한 패널의 state를 유지한다", () => {
    const onMount = vi.fn<(id: string) => void>();
    const onUnmount = vi.fn<(id: string) => void>();

    const onLayoutChange = vi.fn<(layout: LayoutNode) => void>();

    const { rerender, container } = render(
      <FlexBoard
        layout={initialLayout}
        onLayoutChange={onLayoutChange}
        renderPanel={({ id }) => (
          <StatefulPanel id={id} onMount={onMount} onUnmount={onUnmount} />
        )}
      />,
    );

    const view = within(container);

    /**
     * chart의 local state를 3으로 만든다.
     */
    const incrementChart = view.getByRole("button", {
      name: "increment-chart",
    });

    fireEvent.click(incrementChart);

    expect(view.getByTestId("count-chart").textContent).toBe("1");

    /**
     * 동일한 panel id들을 유지하면서
     * layout tree상의 위치만 변경한다.
     *
     * news
     * --------
     * orders | chart
     */
    const movedLayout: LayoutNode = {
      type: "split",
      id: "root-moved",
      orientation: "V",
      size: 0.5,

      first: {
        type: "actual",
        id: "news",
      },

      second: {
        type: "split",
        id: "bottom",
        orientation: "H",
        size: 0.5,

        first: {
          type: "actual",
          id: "orders",
        },

        second: {
          type: "actual",
          id: "chart",
        },
      },
    };

    rerender(
      <FlexBoard
        layout={movedLayout}
        onLayoutChange={onLayoutChange}
        renderPanel={({ id }) => (
          <StatefulPanel id={id} onMount={onMount} onUnmount={onUnmount} />
        )}
      />,
    );

    /**
     * 위치가 변경되어도 chart의 state는 유지되어야 한다.
     */
    expect(view.getByTestId("count-chart").textContent).toBe("1");
    /**
     * chart가 unmount되었다가 다시 mount되는 것도
     * 허용하지 않는다.
     */
    expect(onUnmount).not.toHaveBeenCalledWith("chart");

    expect(onMount.mock.calls.filter(([id]) => id === "chart")).toHaveLength(1);
  });
});
