import { useEffect, useState } from "react";
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
  replyMode: boolean;
  onLinkClick: () => void;
  onLinkHoverStart: () => void;
  onLinkHoverEnd: () => void;
  onReplySubmit: (body: string) => void;
  onReplyDiscard: () => void;
}

export function ReadingPane({
  email,
  processedInfo,
  replyMode,
  onLinkClick,
  onLinkHoverStart,
  onLinkHoverEnd,
  onReplySubmit,
  onReplyDiscard,
}: Props) {
  const [replyBody, setReplyBody] = useState("");

  useEffect(() => {
    if (replyMode) setReplyBody("");
  }, [replyMode]);

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

        {replyMode && (
          <div className="inline-reply">
            <div className="inline-reply-row">
              <span className="inline-reply-label">From:</span> study-participant@lab.local
            </div>
            <div className="inline-reply-row inline-reply-to">
              <span className="inline-reply-label">To</span>
              <span className="reply-chip">
                {senderName(email.sender)}
                <span className="reply-chip-x">×</span>
              </span>
              <span className="inline-reply-cc">Cc  Bcc</span>
            </div>
            <textarea
              id="reply-body"
              className="inline-reply-textarea"
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              rows={6}
              autoFocus
            />
            <div className="inline-reply-actions">
              <button
                className="inline-reply-send"
                disabled={replyBody.trim().length === 0}
                onClick={() => onReplySubmit(replyBody.trim())}
              >
                ➤ Send
              </button>
              <button className="inline-reply-discard" onClick={onReplyDiscard}>
                🗑 Discard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
