import type { DummyEmail } from "../types";

interface Props {
  emails: DummyEmail[];
  onOpenEmail: (email: DummyEmail) => void;
}

export function InboxScreen({ emails, onOpenEmail }: Props) {
  return (
    <div className="screen">
      <h1>Inbox</h1>
      <ul className="inbox-list">
        {emails.map((email) => (
          <li key={email.id} onClick={() => onOpenEmail(email)} className="inbox-item">
            <span className="inbox-sender">{email.sender}</span>
            <span className="inbox-subject">{email.subject}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
