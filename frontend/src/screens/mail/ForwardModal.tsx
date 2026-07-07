import { useState } from "react";
import type { Contact } from "../../types";

interface Props {
  contacts: Contact[];
  onSubmit: (recipient: string) => void;
  onCancel: () => void;
}

export function ForwardModal({ contacts, onSubmit, onCancel }: Props) {
  const [recipient, setRecipient] = useState("");

  return (
    <div className="modal-backdrop">
      <div className="forward-box">
        <h3>Forward to</h3>
        <input
          type="text"
          className="forward-input"
          placeholder="Enter email address"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />

        {contacts.length > 0 && (
          <div className="forward-contacts">
            {contacts.map((contact) => (
              <div
                key={contact.email}
                className="forward-contact-row"
                onClick={() => setRecipient(contact.email)}
              >
                <span className="forward-contact-name">{contact.name}</span>
                <span className="forward-contact-email">{contact.email}</span>
              </div>
            ))}
          </div>
        )}

        <div className="forward-actions">
          <button className="forward-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="forward-submit"
            disabled={recipient.trim().length === 0}
            onClick={() => onSubmit(recipient.trim())}
          >
            Forward
          </button>
        </div>
      </div>
    </div>
  );
}
