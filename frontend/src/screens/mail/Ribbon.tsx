import { useRef, useState, type ReactNode } from "react";
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

const ACTION_DESCRIPTIONS: Record<ActionType, string> = {
  delete: "Delete this message",
  report_phishing: "Report this message as phishing",
  reply: "Reply to this message",
  forward: "Forward this message",
  ignore: "Mark this message as read",
  verify_independently:
    "Confirm the sender or request through a separate, trusted channel before acting on it.",
  click_link: "Open a link contained in this email.",
  open_attachment: "Open a file attached to this email.",
};

const COMPOSE_DESCRIPTION = "Start a new email";

interface TooltipState {
  description: string;
  x: number;
  y: number;
}

function DecorativeButton({
  icon,
  label,
  dataTour,
}: {
  icon: ReactNode;
  label: string;
  dataTour: string;
}) {
  return (
    <button className="ribbon-btn" disabled title="Not used in this study" data-tour={dataTour}>
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
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = (e: React.MouseEvent<HTMLButtonElement>, description: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.bottom;
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    tooltipTimer.current = setTimeout(() => setTooltip({ description, x, y }), 500);
  };
  const hideTooltip = () => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    setTooltip(null);
  };

  const actionButton = (action: ActionType, icon: ReactNode, label: string) => (
    <button
      className={`ribbon-btn ${pendingAction === action ? "selected" : ""}`}
      disabled={disabled || disabledActions.includes(action)}
      onClick={() => onSelectAction(action)}
      onMouseEnter={(e) => showTooltip(e, ACTION_DESCRIPTIONS[action])}
      onMouseLeave={hideTooltip}
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
        onMouseEnter={(e) => showTooltip(e, COMPOSE_DESCRIPTION)}
        onMouseLeave={hideTooltip}
        data-tour="compose"
      >
        <MailAdd20Regular /> New mail
      </button>

      <div className="ribbon-divider" />

      {actionButton("delete", <Delete20Regular />, "Delete")}
      <DecorativeButton icon={<Archive20Regular />} label="Archive" dataTour="decorative-archive" />
      {actionButton("report_phishing", <ShieldError20Regular />, "Report")}
      <DecorativeButton icon={<Broom20Regular />} label="Sweep" dataTour="decorative-sweep" />
      <DecorativeButton icon={<Folder20Regular />} label="Move to" dataTour="decorative-move-to" />

      <div className="ribbon-divider" />

      {actionButton("reply", <ArrowReply20Regular />, "Reply")}
      <DecorativeButton
        icon={<ArrowReplyAll20Regular />}
        label="Reply all"
        dataTour="decorative-reply-all"
      />
      {actionButton("forward", <ArrowForward20Regular />, "Forward")}

      <div className="ribbon-divider" />

      <DecorativeButton
        icon={<PeopleTeam20Regular />}
        label="Share to Teams"
        dataTour="decorative-share-to-teams"
      />

      <div className="ribbon-divider" />

      <DecorativeButton icon={<Flash20Regular />} label="Quick steps" dataTour="decorative-quick-steps" />
      {actionButton("ignore", <MailRead20Regular />, "Mark as read")}

      <div className="ribbon-divider" />

      {actionButton("verify_independently", <ShieldCheckmark20Regular />, "Verify")}

      {tooltip && (
        <div className="ribbon-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          {tooltip.description}
        </div>
      )}
    </div>
  );
}
