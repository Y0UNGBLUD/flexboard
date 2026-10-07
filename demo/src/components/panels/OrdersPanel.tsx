const orders = [
  { symbol: "AAPL", side: "Buy", amount: "10" },
  { symbol: "NVDA", side: "Buy", amount: "5" },
  { symbol: "TSLA", side: "Sell", amount: "3" },
];

export function OrdersPanel() {
  return (
    <div className="orders-panel">
      {orders.map((order, index) => (
        <div key={`${order.symbol}-${index}`} className="orders-panel__row">
          <strong>{order.symbol}</strong>
          <span>{order.side}</span>
          <span>{order.amount}</span>
        </div>
      ))}
    </div>
  );
}
