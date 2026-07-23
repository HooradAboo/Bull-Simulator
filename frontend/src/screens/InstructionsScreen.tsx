import { PageTemplate } from "./PageTemplate";

interface Props {
  onBegin: () => void;
}

export function InstructionsScreen({ onBegin }: Props) {
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
          Begin Task
        </button>
      </div>
    </PageTemplate>
  );
}
