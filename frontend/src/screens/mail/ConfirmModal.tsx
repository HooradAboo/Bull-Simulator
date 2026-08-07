interface Props {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ title, body, confirmLabel, onConfirm, onCancel }: Props) {
  return (
    <div className="modal-backdrop">
      <div className="confirm-action-box">
        <h3>{title}</h3>
        <p>{body}</p>
        <div className="confirm-action-buttons">
          <button className="confirm-action-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="confirm-action-confirm" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
