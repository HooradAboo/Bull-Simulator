import { Attach20Regular, MailInbox48Regular } from "@fluentui/react-icons";
import type { SentItem } from "../../types";

interface Props {
  item: SentItem | null;
}

export function SentItemReadingPane({ item }: Props) {
  if (!item) {
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

  return (
    <div className="mail-reading-pane">
      <div className="reading-content">
        <div className="reading-subject">{item.subject}</div>
        <div className="reading-sender-meta">
          To: {item.recipient} — sent {new Date(item.sentAt).toLocaleTimeString()}
        </div>

        <hr />

        <div className="reading-body">{item.body}</div>

        {item.link && <p className="reading-link">{item.link}</p>}
        {item.attachment && (
          <p className="reading-attachment">
            <Attach20Regular /> {item.attachment}
          </p>
        )}
      </div>
    </div>
  );
}
