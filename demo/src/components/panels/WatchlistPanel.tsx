const items = [
  { symbol: "AAPL", price: "$231.42" },
  { symbol: "NVDA", price: "$184.16" },
  { symbol: "TSLA", price: "$438.27" },
  { symbol: "MSFT", price: "$528.57" },
];

export function WatchlistPanel() {
  return (
    <div className="watchlist-panel">
      {items.map((item) => (
        <div key={item.symbol} className="watchlist-panel__row">
          <strong>{item.symbol}</strong>
          <span>{item.price}</span>
        </div>
      ))}
    </div>
  );
}
