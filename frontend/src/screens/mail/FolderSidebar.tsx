const RAIL_ICONS = [
  { icon: "📧", active: true },
  { icon: "📅", active: false },
  { icon: "👥", active: false },
  { icon: "✅", active: false },
  { icon: "☁️", active: false },
];

export function FolderSidebar() {
  return (
    <>
      <div className="mail-icon-rail">
        {RAIL_ICONS.map((item, i) => (
          <div key={i} className={`rail-icon ${item.active ? "active" : ""}`} aria-hidden="true">
            {item.icon}
          </div>
        ))}
      </div>

      <div className="mail-folder-sidebar">
        <div className="folder-section-title">▾ Favorites</div>
        <div className="folder-row active">
          <span className="folder-icon" aria-hidden="true">
            📥
          </span>
          Inbox
        </div>
        <div className="folder-row">
          <span className="folder-icon" aria-hidden="true">
            📤
          </span>
          Sent Items
        </div>
        <div className="folder-row">
          <span className="folder-icon" aria-hidden="true">
            📝
          </span>
          Drafts
        </div>
        <div className="folder-row">
          <span className="folder-icon" aria-hidden="true">
            🗑️
          </span>
          Deleted Items
        </div>

        <div className="account-row">study-participant@lab.local</div>
        <div className="groups-link">Go to Groups</div>
      </div>
    </>
  );
}
