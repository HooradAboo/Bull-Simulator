export function TopBar() {
  return (
    <div className="mail-topbar">
      <div className="waffle" aria-hidden="true">
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} />
        ))}
      </div>

      <div className="mail-brand">
        <div className="crest" aria-hidden="true">
          USF
        </div>
        <div className="brand-text">
          <div className="line1">UNIVERSITY OF</div>
          <div className="line2">SOUTH FLORIDA</div>
        </div>
        <div className="outlook-word">Outlook</div>
      </div>

      <div className="mail-search">
        <span aria-hidden="true">🔍</span>
        <input placeholder="Search" disabled />
      </div>

      <div className="mail-topbar-icons">
        <span className="icon" aria-hidden="true">
          👥
        </span>
        <span className="icon" aria-hidden="true">
          💬
        </span>
        <span className="icon" aria-hidden="true">
          🔔
        </span>
        <span className="icon" aria-hidden="true">
          ⚙️
        </span>
        <div className="mail-avatar">P</div>
      </div>
    </div>
  );
}
