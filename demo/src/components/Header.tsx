interface HeaderProps {
  onAddPanel: () => void;
  onResetLayout: () => void;
}

export function Header({ onAddPanel, onResetLayout }: HeaderProps) {
  return (
    <header className="header">
      <div>
        <h1>FlexBoard</h1>
        <p>Interactive recursive split-layout demo</p>
      </div>

      <div className="header__actions">
        <span className="header__guide">
          Drag panels to rearrange · Drag dividers to resize
        </span>

        <button type="button" onClick={onAddPanel}>
          ➕ Add Panel
        </button>

        <button type="button" onClick={onResetLayout}>
          💫 Reset Layout
        </button>
      </div>
    </header>
  );
}
