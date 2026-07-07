interface Props {
  confidenceValue: number;
  onConfidenceChange: (value: number) => void;
  onSubmit: () => void;
}

export function ConfidenceModal({ confidenceValue, onConfidenceChange, onSubmit }: Props) {
  return (
    <div className="modal-backdrop">
      <div className="confidence-box">
        <h3>How confident are you that this was the right response?</h3>
        <input
          type="range"
          min={0}
          max={100}
          value={confidenceValue}
          onChange={(e) => onConfidenceChange(Number(e.target.value))}
        />
        <div className="value">{confidenceValue}</div>
        <button onClick={onSubmit}>Submit</button>
      </div>
    </div>
  );
}
