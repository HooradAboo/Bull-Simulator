import { DocumentEdit20Regular } from "@fluentui/react-icons";

interface Props {
  hasDraft: boolean;
  recipient: string;
  subject: string;
  onSelect: () => void;
}

export function DraftsPane({ hasDraft, recipient, subject, onSelect }: Props) {
  return (
    <div className="mail-list-pane">
      <div className="mail-list-header">Drafts</div>

      {hasDraft && (
        <div className="mail-row selected" onClick={onSelect}>
          <div className="mail-row-avatar" style={{ background: "#6b6bd6" }}>
            <DocumentEdit20Regular />
          </div>
          <div className="mail-row-body">
            <div className="mail-row-top">
              <div className="mail-row-sender">
                {recipient.trim() ? `To: ${recipient.trim()}` : "No recipient yet"}
              </div>
            </div>
            <div className="mail-row-subject">{subject.trim() || "(no subject)"}</div>
          </div>
        </div>
      )}
    </div>
  );
}
