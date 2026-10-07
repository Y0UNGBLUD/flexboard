const values = [38, 52, 44, 68, 58, 76, 64, 86];

export function ChartPanel() {
  return (
    <div className="chart-panel">
      <div className="chart-panel__summary">
        <div>
          <span>AAPL</span>
          <strong>$231.42</strong>
        </div>

        <span>+2.18%</span>
      </div>

      <div className="chart-panel__bars">
        {values.map((value, index) => (
          <div
            key={index}
            className="chart-panel__bar"
            style={{ height: `${value}%` }}
          />
        ))}
      </div>
    </div>
  );
}
