interface Props {
  onBegin: () => void;
}

export function InstructionsScreen({ onBegin }: Props) {
  return (
    <div className="screen">
      <h1>Instructions</h1>
      <p>
        [Placeholder instructions text.] You will see a simulated inbox.
        Open each email, decide how you would respond, and rate how
        confident you are in that response. Treat each email as if it
        arrived in your own inbox.
      </p>
      <button onClick={onBegin}>Begin Task</button>
    </div>
  );
}
