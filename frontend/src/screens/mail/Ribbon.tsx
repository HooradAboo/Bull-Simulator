import { useRef, useState, type ReactNode } from "react";
import {
  Archive20Regular,
  ArrowForward20Regular,
  ArrowReply20Regular,
  ArrowReplyAll20Regular,
  ArrowUndo20Regular,
  Broom20Regular,
  ChevronDown20Regular,
  Clock20Regular,
  Delete20Regular,
  Flag20Regular,
  Flash20Regular,
  Folder20Regular,
  Gift20Regular,
  Grid20Regular,
  MailAdd20Regular,
  MailArrowDoubleBack20Regular,
  MailProhibited20Regular,
  MailRead20Regular,
  MoreHorizontal20Regular,
  Pin20Regular,
  Print20Regular,
  ShieldError20Regular,
  Tag20Regular,
} from "@fluentui/react-icons";
import type { ActionType } from "../../types";

interface Props {
  pendingAction: ActionType | null;
  disabled: boolean;
  // Individually disabled regardless of `disabled` - used by the practice
  // tutorial to take an action out of scope entirely.
  disabledActions?: ActionType[];
  onSelectAction: (action: ActionType) => void;
}

const ACTION_DESCRIPTIONS: Record<ActionType, string> = {
  delete: "Delete this message",
  report_phishing: "Report this message as phishing",
  reply: "Reply to this message",
  forward: "Forward this message",
  ignore: "Mark this message as read",
  click_link: "Open a link contained in this email.",
  open_attachment: "Open a file attached to this email.",
};

interface TooltipState {
  description: string;
  x: number;
  y: number;
}

// Non-functional filler, present only so the toolbar reads as a full,
// real Outlook ribbon rather than a sparse set of just-the-actions-we-
// need buttons. `chevron` mimics the dropdown caret real Outlook shows on
// menu-style buttons (Delete, Move to, Forward, Quick steps, etc.);
// `iconOnly` drops the label, for the trailing cluster of buttons real
// Outlook also shows without text (tag/flag/pin/snooze/move-to-folder/
// print/undo/layout/overflow).
function DecorativeButton({
  icon,
  label,
  dataTour,
  chevron,
  iconOnly,
}: {
  icon: ReactNode;
  label?: string;
  dataTour: string;
  chevron?: boolean;
  iconOnly?: boolean;
}) {
  return (
    <button
      className={`ribbon-btn${iconOnly ? " icon-only" : ""}`}
      disabled
      title="Not used in this study"
      data-tour={dataTour}
    >
      <span className="ribbon-icon" aria-hidden="true">
        {icon}
      </span>
      {!iconOnly && label}
      {chevron && (
        <span className="ribbon-chevron" aria-hidden="true">
          <ChevronDown20Regular />
        </span>
      )}
    </button>
  );
}

export function Ribbon({
  pendingAction,
  disabled,
  disabledActions = [],
  onSelectAction,
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

  const actionButton = (
    action: ActionType,
    icon: ReactNode,
    label: string,
    chevron?: boolean
  ) => (
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
      {chevron && (
        <span className="ribbon-chevron" aria-hidden="true">
          <ChevronDown20Regular />
        </span>
      )}
    </button>
  );

  return (
    <div className="mail-ribbon">
      <button className="ribbon-btn primary" disabled title="Not used in this study">
        <span className="ribbon-icon" aria-hidden="true">
          <MailAdd20Regular />
        </span>
        New mail
        <span className="ribbon-chevron" aria-hidden="true">
          <ChevronDown20Regular />
        </span>
      </button>

      <div className="ribbon-divider" />

      {actionButton("delete", <Delete20Regular />, "Delete", true)}
      <DecorativeButton icon={<Archive20Regular />} label="Archive" dataTour="decorative-archive" />
      <DecorativeButton icon={<Broom20Regular />} label="Sweep" dataTour="decorative-sweep" />
      <DecorativeButton
        icon={<Folder20Regular />}
        label="Move to"
        dataTour="decorative-move-to"
        chevron
      />

      <div className="ribbon-divider" />

      <DecorativeButton
        icon={<MailProhibited20Regular />}
        label="Report junk"
        dataTour="decorative-report-junk"
      />
      {actionButton("report_phishing", <ShieldError20Regular />, "Report phishing")}

      <div className="ribbon-divider" />

      {actionButton("reply", <ArrowReply20Regular />, "Reply")}
      <DecorativeButton
        icon={<ArrowReplyAll20Regular />}
        label="Reply all"
        dataTour="decorative-reply-all"
      />
      {actionButton("forward", <ArrowForward20Regular />, "Forward", true)}

      <div className="ribbon-divider" />

      <DecorativeButton icon={<Gift20Regular />} dataTour="decorative-app-icon" iconOnly />
      <DecorativeButton
        icon={<Flash20Regular />}
        label="Quick steps"
        dataTour="decorative-quick-steps"
        chevron
      />

      <div className="ribbon-divider" />

      {actionButton("ignore", <MailRead20Regular />, "Read / Unread", true)}
      <DecorativeButton icon={<Tag20Regular />} dataTour="decorative-tag" iconOnly chevron />
      <DecorativeButton icon={<Flag20Regular />} dataTour="decorative-flag" iconOnly chevron />
      <DecorativeButton icon={<Pin20Regular />} dataTour="decorative-pin" iconOnly chevron />
      <DecorativeButton icon={<Clock20Regular />} dataTour="decorative-snooze" iconOnly chevron />
      <DecorativeButton
        icon={<MailArrowDoubleBack20Regular />}
        dataTour="decorative-move-to-folder"
        iconOnly
        chevron
      />

      <div className="ribbon-divider" />

      <DecorativeButton icon={<Print20Regular />} dataTour="decorative-print" iconOnly />
      <DecorativeButton icon={<ArrowUndo20Regular />} dataTour="decorative-undo" iconOnly />
      <DecorativeButton icon={<Grid20Regular />} dataTour="decorative-layout" iconOnly />
      <DecorativeButton icon={<MoreHorizontal20Regular />} dataTour="decorative-more" iconOnly />
      <DecorativeButton
        icon={<ChevronDown20Regular />}
        dataTour="decorative-collapse-ribbon"
        iconOnly
      />

      {tooltip && (
        <div className="ribbon-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          {tooltip.description}
        </div>
      )}
    </div>
  );
}
