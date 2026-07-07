import type { ActionType, DummyEmail, ProcessedInfo } from "../../types";
import { avatarColor, initials, senderName } from "./avatar";

const ACTION_LABELS: Record<ActionType, string> = {
  click_link: "Click Link",
  reply: "Reply",
  forward: "Forward",
  report_phishing: "Report as Phishing",
  delete: "Delete",
  ignore: "Ignore",
};

interface Props {
  email: DummyEmail | null;
  processedInfo: ProcessedInfo | null;
  onLinkClick: () => void;
  onLinkHoverStart: () => void;
  onLinkHoverEnd: () => void;
}

export function ReadingPane({
  email,
  processedInfo,
  onLinkClick,
  onLinkHoverStart,
  onLinkHoverEnd,
}: Props) {
  if (!email) {
    return (
      <div className="mail-reading-pane">
        <div className="reading-empty">
          <div className="envelope" aria-hidden="true">
            ✉️
          </div>
          <div className="primary">Select an item to read</div>
          <div className="secondary">Nothing is selected</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mail-reading-pane">
      <div className="reading-content">
        <div className="reading-subject">{email.subject}</div>
        <div className="reading-sender-row">
          <div
            className="reading-sender-avatar"
            style={{ background: avatarColor(email.sender) }}
          >
            {initials(email.sender)}
          </div>
          <div>
            <div className="reading-sender-name">{senderName(email.sender)}</div>
            <div className="reading-sender-meta">{email.sender}</div>
          </div>
        </div>

        {processedInfo && (
          <div className="processed-banner">
            ✅ You responded: <strong>{ACTION_LABELS[processedInfo.action]}</strong>
            {processedInfo.recipient ? <> to {processedInfo.recipient}</> : null}{" "}
            (confidence {processedInfo.confidence})
          </div>
        )}

        <div className="reading-body">{email.body}</div>

        {email.link && (
          <p>
            <span
              className="reading-link"
              onClick={(e) => {
                e.preventDefault();
                if (!processedInfo) onLinkClick();
              }}
              onMouseEnter={onLinkHoverStart}
              onMouseLeave={onLinkHoverEnd}
            >
              {email.link}
            </span>
          </p>
        )}

        {email.attachment && (
          <p>
            <span className="reading-attachment" onClick={(e) => e.preventDefault()}>
              📎 {email.attachment}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
