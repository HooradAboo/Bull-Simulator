import type { DummyEmail, FolderName, ProcessedInfo } from "../../types";
import { avatarColor, initials, senderName } from "./avatar";

interface Props {
  folder: FolderName;
  emails: DummyEmail[];
  selectedId: string | null;
  processed: Map<string, ProcessedInfo>;
  onSelect: (email: DummyEmail) => void;
}

const FOLDER_TITLES: Record<FolderName, string> = {
  inbox: "Inbox",
  deleted: "Deleted Items",
};

function previewOf(body: string): string {
  return body.split("\n").find((line) => line.trim().length > 0) ?? "";
}

export function EmailListPane({ folder, emails, selectedId, processed, onSelect }: Props) {
  const remaining = emails.filter((e) => !processed.has(e.id)).length;

  return (
    <div className="mail-list-pane">
      <div className="mail-list-header">
        {FOLDER_TITLES[folder]} <span aria-hidden="true">★</span>
        {folder === "inbox" && <span className="count">{remaining} unread</span>}
      </div>

      {emails.map((email) => {
        const isProcessed = processed.has(email.id);
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
              <div className="mail-row-top">
                <div className="mail-row-sender">{senderName(email.sender)}</div>
              </div>
              <div className="mail-row-subject">{email.subject}</div>
              <div className="mail-row-preview">{previewOf(email.body)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
