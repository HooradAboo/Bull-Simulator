import { Attach20Regular, Pin16Filled, Pin16Regular, Star20Regular } from "@fluentui/react-icons";
import type { DummyEmail, FolderName, ProcessedInfo } from "../../types";
import { avatarColor, initials, senderName } from "./avatar";

interface Props {
  folder: FolderName;
  emails: DummyEmail[];
  selectedId: string | null;
  processed: Map<string, ProcessedInfo>;
  pinnedIds: Set<string>;
  onSelect: (email: DummyEmail) => void;
  onTogglePin: (emailId: string) => void;
}

const FOLDER_TITLES: Record<FolderName, string> = {
  inbox: "Inbox",
  deleted: "Deleted Items",
  junk: "Junk Email",
  sent: "Sent Items",
};

function decodeHtmlEntities(text: string): string {
  const el = document.createElement("textarea");
  el.innerHTML = text;
  return el.value;
}

const PREVIEW_MAX_LENGTH = 120;

function previewOf(body: string): string {
  const withLineBreaks = body.replace(/<\/(p|div|br)\s*\/?>/gi, "\n");
  const plainText = withLineBreaks.replace(/<[^>]+>/g, "");
  const lines = plainText
    .split("\n")
    .map((line) => decodeHtmlEntities(line).trim())
    // Skip lines that are just a lone icon/symbol glyph (e.g. an inline
    // SVG-free pencil icon rendered as an HTML entity) rather than real text.
    .filter((line) => /\w{2}/.test(line));
  // Join across line breaks (rather than stopping at the first one, which is
  // usually just "Hi,") so the preview shows more than a two-word greeting;
  // the CSS ellipsis still clips it to a single visual line.
  return lines.join(" ").slice(0, PREVIEW_MAX_LENGTH);
}

export function EmailListPane({
  folder,
  emails,
  selectedId,
  processed,
  pinnedIds,
  onSelect,
  onTogglePin,
}: Props) {
  const remaining = emails.filter((e) => !processed.has(e.id)).length;

  return (
    <div className="mail-list-pane">
      <div className="mail-list-header">
        {FOLDER_TITLES[folder]} <Star20Regular aria-hidden="true" />
        {folder === "inbox" && <span className="count">{remaining} unread</span>}
      </div>

      {emails.map((email) => {
        const isProcessed = processed.has(email.id);
        const isPinned = pinnedIds.has(email.id);
        return (
          <div
            key={email.id}
            className={`mail-row ${!isProcessed ? "unread" : ""} ${
              selectedId === email.id ? "selected" : ""
            }`}
            onClick={() => onSelect(email)}
          >
            <div
              className="mail-row-avatar"
              style={{ background: avatarColor(email.sender) }}
            >
              {initials(email.sender)}
            </div>
            <div className="mail-row-body">
              <div className="mail-row-subject">
                <span className="mail-row-subject-text">{email.subject}</span>
                {email.attachment && (
                  <Attach20Regular className="mail-row-attachment-icon" aria-hidden="true" />
                )}
              </div>
              <div className="mail-row-sender">{senderName(email.sender)}</div>
              <div className="mail-row-preview">{previewOf(email.body)}</div>
            </div>
            <span
              className={`mail-row-pin-btn ${isPinned ? "pinned" : ""}`}
              title={isPinned ? "Unpin" : "Pin"}
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(email.id);
              }}
            >
              {isPinned ? <Pin16Filled /> : <Pin16Regular />}
            </span>
          </div>
        );
      })}
    </div>
  );
}
