import { PageTemplate } from "./PageTemplate";

interface Props {
  onBegin: () => void;
  onSkipPractice: () => void;
}

export function InstructionsScreen({ onBegin, onSkipPractice }: Props) {
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
        <button className="page-button-secondary" onClick={onSkipPractice}>
          Skip Practice
        </button>
      </div>
    </PageTemplate>
  );
}
