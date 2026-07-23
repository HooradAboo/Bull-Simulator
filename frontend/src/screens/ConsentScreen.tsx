import { PageTemplate } from "./PageTemplate";

interface Props {
  onAccept: () => void;
}

export function ConsentScreen({ onAccept }: Props) {
  return (
    <PageTemplate title="Informed Consent">
      <p className="body">
        [Placeholder consent text — finalize wording with IRB before running any
        real sessions.] You are being asked to participate in a research study
        about how people respond to emails. Your interactions, timing, and
        input behavior during this task will be recorded.
      </p>
      <div className="page-actions">
        <button className="page-button" onClick={onAccept}>
          I Consent, Begin
        </button>
      </div>
    </PageTemplate>
  );
}
