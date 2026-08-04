import type { ReactNode } from "react";
import {
  Archive20Regular,
  ArrowForward20Regular,
  ArrowReply20Regular,
  ArrowReplyAll20Regular,
  Broom20Regular,
  Delete20Regular,
  Flash20Regular,
  Folder20Regular,
  MailAdd20Regular,
  MailRead20Regular,
  PeopleTeam20Regular,
  ShieldCheckmark20Regular,
  ShieldError20Regular,
} from "@fluentui/react-icons";
import type { ActionType } from "../../types";

interface Props {
  pendingAction: ActionType | null;
  disabled: boolean;
  composeDisabled: boolean;
  // Individually disabled regardless of `disabled` - used by the practice
  // tutorial to take an action out of scope entirely.
  disabledActions?: ActionType[];
  onSelectAction: (action: ActionType) => void;
  onCompose: () => void;
}

function DecorativeButton({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button className="ribbon-btn" disabled title="Not used in this study">
      <span className="ribbon-icon" aria-hidden="true">
        {icon}
      </span>
      {label}
    </button>
  );
}

export function Ribbon({
  pendingAction,
  disabled,
  composeDisabled,
  disabledActions = [],
  onSelectAction,
  onCompose,
}: Props) {
  const actionButton = (action: ActionType, icon: ReactNode, label: string) => (
    <button
      className={`ribbon-btn ${pendingAction === action ? "selected" : ""}`}
      disabled={disabled || disabledActions.includes(action)}
      onClick={() => onSelectAction(action)}
      data-tour={action}
    >
      <span className="ribbon-icon" aria-hidden="true">
        {icon}
      </span>
      {label}
    </button>
  );

  return (
    <div className="mail-ribbon">
      <button
        className="ribbon-btn primary"
        disabled={composeDisabled}
        onClick={onCompose}
        data-tour="compose"
      >
        <MailAdd20Regular /> New mail
      </button>

      <div className="ribbon-divider" />

      {actionButton("delete", <Delete20Regular />, "Delete")}
      {actionButton("archive", <Archive20Regular />, "Archive")}
      {actionButton("report_phishing", <ShieldError20Regular />, "Report")}
      <DecorativeButton icon={<Broom20Regular />} label="Sweep" />
      <DecorativeButton icon={<Folder20Regular />} label="Move to" />

      <div className="ribbon-divider" />

      {actionButton("reply", <ArrowReply20Regular />, "Reply")}
      <DecorativeButton icon={<ArrowReplyAll20Regular />} label="Reply all" />
      {actionButton("forward", <ArrowForward20Regular />, "Forward")}

      <div className="ribbon-divider" />

      <DecorativeButton icon={<PeopleTeam20Regular />} label="Share to Teams" />

      <div className="ribbon-divider" />

      <DecorativeButton icon={<Flash20Regular />} label="Quick steps" />
      {actionButton("ignore", <MailRead20Regular />, "Mark as read")}

      <div className="ribbon-divider" />

      {actionButton("verify_independently", <ShieldCheckmark20Regular />, "Verify")}
    </div>
  );
}
