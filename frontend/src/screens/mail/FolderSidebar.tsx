import type { FolderName } from "../../types";

const RAIL_ICONS = [
  { icon: "📧", active: true },
  { icon: "📅", active: false },
  { icon: "👥", active: false },
  { icon: "✅", active: false },
  { icon: "☁️", active: false },
];

interface Props {
  currentFolder: FolderName;
  deletedCount: number;
  onSelectFolder: (folder: FolderName) => void;
}

export function FolderSidebar({ currentFolder, deletedCount, onSelectFolder }: Props) {
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
        <div
          className={`folder-row ${currentFolder === "inbox" ? "active" : ""}`}
          onClick={() => onSelectFolder("inbox")}
        >
          <span className="folder-icon" aria-hidden="true">
            📥
          </span>
          Inbox
        </div>
        <div className="folder-row" title="Not used in this study">
          <span className="folder-icon" aria-hidden="true">
            📤
          </span>
          Sent Items
        </div>
        <div className="folder-row" title="Not used in this study">
          <span className="folder-icon" aria-hidden="true">
            📝
          </span>
          Drafts
        </div>
        <div
          className={`folder-row ${currentFolder === "deleted" ? "active" : ""}`}
          onClick={() => onSelectFolder("deleted")}
        >
          <span className="folder-icon" aria-hidden="true">
            🗑️
          </span>
          Deleted Items{deletedCount > 0 ? ` (${deletedCount})` : ""}
        </div>

        <div className="account-row">study-participant@lab.local</div>
        <div className="groups-link">Go to Groups</div>
      </div>
    </>
  );
}
