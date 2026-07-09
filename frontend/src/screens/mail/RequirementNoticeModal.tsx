interface Props {
  neededLabels: string[];
  onDismiss: () => void;
}

export function RequirementNoticeModal({ neededLabels, onDismiss }: Props) {
  return (
    <div className="modal-backdrop">
      <div className="confirm-action-box">
        <h3>You still need to complete your tasks</h3>
        <p>
          Before you finish, you still need to: <strong>{neededLabels.join(", ")}</strong>.
          Please choose one of these for this email.
        </p>
        <div className="confirm-action-buttons">
          <button className="confirm-action-confirm" onClick={onDismiss}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
