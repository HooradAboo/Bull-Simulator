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
    <PageTemplate title="Instructions">
      <p className="body">
        [Placeholder instructions text.] You will see a simulated inbox.
        Open each email, decide how you would respond, and rate how
        confident you are in that response. Treat each email as if it
        arrived in your own inbox.
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
