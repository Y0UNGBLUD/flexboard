import { useState } from "react";

export function CounterPanel() {
  const [count, setCount] = useState(0);

  return (
    <div className="counter-panel">
      <span className="counter-panel__label">Local React State</span>

      <strong className="counter-panel__value">{count}</strong>

      <button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => setCount((current) => current + 1)}
      >
        +1
      </button>

      <span className="counter-panel__hint">
        Increment, then move this panel.
      </span>
    </div>
  );
}
