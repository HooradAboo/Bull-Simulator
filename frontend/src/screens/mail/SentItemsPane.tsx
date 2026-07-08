import type { ReactNode } from "react";
import { ArrowForward20Regular, ArrowReply20Regular } from "@fluentui/react-icons";
import type { SentItem } from "../../types";

interface Props {
  sentItems: SentItem[];
  selectedId: string | null;
  onSelect: (item: SentItem) => void;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const KIND_ICON: Record<SentItem["kind"], ReactNode> = {
  forward: <ArrowForward20Regular />,
  reply: <ArrowReply20Regular />,
};

const KIND_COLOR: Record<SentItem["kind"], string> = {
  forward: "#498205",
  reply: "#0078d4",
};

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
          <div className="mail-row-avatar" style={{ background: KIND_COLOR[item.kind] }}>
            {KIND_ICON[item.kind]}
          </div>
          <div className="mail-row-body">
            <div className="mail-row-top">
              <div className="mail-row-sender">To: {item.recipient}</div>
              <div className="mail-row-time">{formatTime(item.sentAt)}</div>
            </div>
            <div className="mail-row-subject">{item.subject}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
