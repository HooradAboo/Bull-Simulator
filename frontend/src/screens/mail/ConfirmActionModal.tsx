import type { ActionType } from "../../types";

const CONFIRM_COPY: Partial<Record<ActionType, { title: string; body: string; confirmLabel: string }>> = {
  delete: {
    title: "Delete this email?",
    body: "This email will be moved to Deleted Items.",
    confirmLabel: "Delete",
  },
  report_phishing: {
    title: "Report this email as phishing?",
    body: "This email will be moved to Junk Email.",
    confirmLabel: "Report",
  },
};

interface Props {
  action: ActionType;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmActionModal({ action, onConfirm, onCancel }: Props) {
  const copy = CONFIRM_COPY[action];
  if (!copy) return null;

  return (
    <div className="modal-backdrop">
      <div className="confirm-action-box">
        <h3>{copy.title}</h3>
        <p>{copy.body}</p>
        <div className="confirm-action-buttons">
          <button className="confirm-action-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="confirm-action-confirm" onClick={onConfirm}>
            {copy.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
