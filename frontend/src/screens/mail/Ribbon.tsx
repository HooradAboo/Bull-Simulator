import type { ActionType } from "../../types";

interface Props {
  pendingAction: ActionType | null;
  disabled: boolean;
  onSelectAction: (action: ActionType) => void;
}

function DecorativeButton({ icon, label }: { icon: string; label: string }) {
  return (
    <button className="ribbon-btn" disabled title="Not used in this study">
      <span className="ribbon-icon" aria-hidden="true">
        {icon}
      </span>
      {label}
    </button>
  );
}

export function Ribbon({ pendingAction, disabled, onSelectAction }: Props) {
  const actionButton = (action: ActionType, icon: string, label: string) => (
    <button
      className={`ribbon-btn ${pendingAction === action ? "selected" : ""}`}
      disabled={disabled}
      onClick={() => onSelectAction(action)}
    >
      <span className="ribbon-icon" aria-hidden="true">
        {icon}
      </span>
      {label}
    </button>
  );

  return (
    <div className="mail-ribbon">
      <button className="ribbon-btn primary" disabled title="Not used in this study">
        ✉️ New mail
      </button>

      <div className="ribbon-divider" />

      {actionButton("delete", "🗑️", "Delete")}
      <DecorativeButton icon="📦" label="Archive" />
      {actionButton("report_phishing", "🚩", "Report")}
      <DecorativeButton icon="🧹" label="Sweep" />
      <DecorativeButton icon="📁" label="Move to" />
      {actionButton("ignore", "🚫", "Ignore")}

      <div className="ribbon-divider" />

      {actionButton("reply", "↩️", "Reply")}
      <DecorativeButton icon="↩️↩️" label="Reply all" />
      {actionButton("forward", "➡️", "Forward")}

      <div className="ribbon-divider" />

      <DecorativeButton icon="👥" label="Share to Teams" />
      <DecorativeButton icon="⚡" label="Quick steps" />
      <DecorativeButton icon="✅" label="Mark all as read" />
    </div>
  );
}
