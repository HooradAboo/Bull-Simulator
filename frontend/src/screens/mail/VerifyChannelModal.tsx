interface Props {
  senderName: string;
  onContinue: () => void;
  onCancel: () => void;
}

export function VerifyChannelModal({ senderName, onContinue, onCancel }: Props) {
  return (
    <div className="modal-backdrop">
      <div className="confirm-action-box">
        <h3>Verifying independently</h3>
        <p>
          Instead of relying on anything in the email itself, you look up {senderName} through
          a separate channel - the company's official website, a listed phone number, or someone
          you know - to check whether this request is legitimate.
        </p>
        <div className="confirm-action-buttons">
          <button className="confirm-action-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="confirm-action-confirm" onClick={onContinue}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
