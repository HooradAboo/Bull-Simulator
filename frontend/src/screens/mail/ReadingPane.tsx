import { useEffect, useState } from "react";
import {
  Attach20Regular,
  CheckmarkCircle20Filled,
  Delete20Regular,
  MailInbox48Regular,
  Send20Regular,
} from "@fluentui/react-icons";
import type { ActionType, Contact, DummyEmail, ProcessedInfo } from "../../types";
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
  forwardMode: boolean;
  contacts: Contact[];
  onLinkClick: () => void;
  onLinkHoverStart: () => void;
  onLinkHoverEnd: () => void;
  onReplySubmit: (body: string) => void;
  onReplyDiscard: () => void;
  onForwardSubmit: (recipient: string, note: string) => void;
  onForwardDiscard: () => void;
}

function QuotedMessage({ email }: { email: DummyEmail }) {
  return (
    <div className="quoted-message">
      <div className="quoted-header">
        <div>
          <strong>From:</strong> {email.sender}
        </div>
        <div>
          <strong>Subject:</strong> {email.subject}
        </div>
      </div>
      <div className="reading-body">{email.body}</div>
      {email.link && <p className="reading-link">{email.link}</p>}
      {email.attachment && (
        <p className="reading-attachment">
          <Attach20Regular /> {email.attachment}
        </p>
      )}
    </div>
  );
}

export function ReadingPane({
  email,
  processedInfo,
  replyMode,
  forwardMode,
  contacts,
  onLinkClick,
  onLinkHoverStart,
  onLinkHoverEnd,
  onReplySubmit,
  onReplyDiscard,
  onForwardSubmit,
  onForwardDiscard,
}: Props) {
  const [replyBody, setReplyBody] = useState("");
  const [forwardRecipient, setForwardRecipient] = useState("");
  const [forwardNote, setForwardNote] = useState("");

  useEffect(() => {
    if (replyMode) setReplyBody("");
  }, [replyMode]);

  useEffect(() => {
    if (forwardMode) {
      setForwardRecipient("");
      setForwardNote("");
    }
  }, [forwardMode]);

  if (!email) {
    return (
      <div className="mail-reading-pane">
        <div className="reading-empty">
          <div className="envelope" aria-hidden="true">
            <MailInbox48Regular />
          </div>
          <div className="primary">Select an item to read</div>
          <div className="secondary">Nothing is selected</div>
        </div>
      </div>
    );
  }

  if (replyMode) {
    return (
      <div className="mail-reading-pane">
        <div className="reading-content">
          <div className="compose-toolbar">
            <button
              className="inline-reply-send"
              disabled={replyBody.trim().length === 0}
              onClick={() => onReplySubmit(replyBody.trim())}
            >
              <Send20Regular /> Send
            </button>
            <button className="inline-reply-discard" onClick={onReplyDiscard}>
              <Delete20Regular /> Discard
            </button>
          </div>

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
          <div className="compose-subject">RE: {email.subject}</div>

          <textarea
            id="reply-body"
            className="inline-reply-textarea"
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            rows={4}
            autoFocus
          />

          <QuotedMessage email={email} />
        </div>
      </div>
    );
  }

  if (forwardMode) {
    return (
      <div className="mail-reading-pane">
        <div className="reading-content">
          <div className="compose-toolbar">
            <button
              className="inline-reply-send"
              disabled={forwardRecipient.trim().length === 0}
              onClick={() => onForwardSubmit(forwardRecipient.trim(), forwardNote.trim())}
            >
              <Send20Regular /> Send
            </button>
            <button className="inline-reply-discard" onClick={onForwardDiscard}>
              <Delete20Regular /> Discard
            </button>
          </div>

          <div className="inline-reply-row">
            <span className="inline-reply-label">From:</span> study-participant@lab.local
          </div>
          <div className="inline-reply-row inline-reply-to">
            <span className="inline-reply-label">To</span>
            <input
              type="text"
              id="forward-to"
              list="forward-contacts-list"
              className="inline-forward-to-input"
              placeholder="Type a name/email or pick a suggestion"
              value={forwardRecipient}
              onChange={(e) => setForwardRecipient(e.target.value)}
              autoFocus
            />
            <datalist id="forward-contacts-list">
              {contacts.map((contact) => (
                <option key={contact.email} value={contact.email}>
                  {contact.name}
                </option>
              ))}
            </datalist>
            <span className="inline-reply-cc">Cc  Bcc</span>
          </div>
          <div className="compose-subject">FW: {email.subject}</div>

          <textarea
            id="forward-note"
            className="inline-reply-textarea"
            placeholder="Add a message (optional)"
            value={forwardNote}
            onChange={(e) => setForwardNote(e.target.value)}
            rows={4}
          />

          <QuotedMessage email={email} />
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
            <CheckmarkCircle20Filled /> You responded:{" "}
            <strong>{ACTION_LABELS[processedInfo.action]}</strong>
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
              <Attach20Regular /> {email.attachment}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
