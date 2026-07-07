interface Props {
  onAccept: () => void;
}

export function ConsentScreen({ onAccept }: Props) {
  return (
    <div className="screen">
      <h1>Informed Consent</h1>
      <p>
        [Placeholder consent text — finalize wording with IRB before running any
        real sessions.] You are being asked to participate in a research study
        about how people respond to emails. Your interactions, timing, and
        input behavior during this task will be recorded.
      </p>
      <button onClick={onAccept}>I Consent, Begin</button>
    </div>
  );
}
