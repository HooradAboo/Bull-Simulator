import usfLogo from "../../assets/usf-logo.png";

export function TopBar() {
  return (
    <div className="mail-topbar">
      <div className="waffle" aria-hidden="true">
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} />
        ))}
      </div>

      <div className="mail-brand">
        <img src={usfLogo} alt="University of South Florida" className="crest-logo" />
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
