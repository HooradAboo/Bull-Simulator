import { useState } from "react";
import { PageTemplate } from "./PageTemplate";
import { ConfirmModal } from "./mail/ConfirmModal";

interface Props {
  onBegin: () => void;
  onSkipPractice: () => void;
}

export function InstructionsScreen({ onBegin, onSkipPractice }: Props) {
  const [confirmingSkip, setConfirmingSkip] = useState(false);

  return (
    <PageTemplate title="Quick Walkthrough">
      <p className="body">
        Before you start, we'll walk you through everything: how the inbox is laid out, 
        what actions you can take on an email, and how the decision and confidence steps 
        work. By the end, you'll know exactly what to do once the real task begins.
      </p>
      <p className="body">
        After the walkthrough, you'll have a chance to practice on a few emails. You can 
        skip the practice if you feel confident, but we recommend going through it first.
      </p>
      <div className="page-actions">
        <button className="page-button" onClick={onBegin}>
          Start Practice Round
        </button>
        <button className="page-button-secondary" onClick={() => setConfirmingSkip(true)}>
          Skip Practice
        </button>
      </div>

      {confirmingSkip && (
        <ConfirmModal
          title="Skip the practice round?"
          body="You'll go straight into the real task with no guided walkthrough or practice emails first. You won't be able to come back to practice once it starts."
          confirmLabel="Skip Practice"
          onConfirm={() => {
            setConfirmingSkip(false);
            onSkipPractice();
          }}
          onCancel={() => setConfirmingSkip(false)}
        />
      )}
    </PageTemplate>
  );
}
