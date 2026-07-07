import { useState } from "react";

interface Props {
  originalSender: string;
  originalSubject: string;
  onSubmit: (body: string) => void;
  onCancel: () => void;
}

export function ReplyModal({ originalSender, originalSubject, onSubmit, onCancel }: Props) {
  const [body, setBody] = useState("");

  return (
    <div className="modal-backdrop">
      <div className="reply-box">
        <h3>Reply</h3>
        <div className="reply-meta">To: {originalSender}</div>
        <div className="reply-meta">Subject: RE: {originalSubject}</div>
        <textarea
          id="reply-body"
          className="reply-textarea"
          placeholder="Type your reply..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
        />

        <div className="reply-actions">
          <button className="reply-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="reply-send"
            disabled={body.trim().length === 0}
            onClick={() => onSubmit(body.trim())}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
