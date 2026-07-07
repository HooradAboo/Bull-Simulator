import type { SentItem } from "../../types";

interface Props {
  sentItems: SentItem[];
  selectedId: string | null;
  onSelect: (item: SentItem) => void;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function SentItemsPane({ sentItems, selectedId, onSelect }: Props) {
  return (
    <div className="mail-list-pane">
      <div className="mail-list-header">Sent Items</div>

      {sentItems.map((item) => (
        <div
          key={item.id}
          className={`mail-row ${selectedId === item.id ? "selected" : ""}`}
          onClick={() => onSelect(item)}
        >
          <div className="mail-row-avatar" style={{ background: "#498205" }}>
            ➡️
          </div>
          <div className="mail-row-body">
            <div className="mail-row-top">
              <div className="mail-row-sender">To: {item.recipient}</div>
              <div className="mail-row-time">{formatTime(item.sentAt)}</div>
            </div>
            <div className="mail-row-subject">FW: {item.subject}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
