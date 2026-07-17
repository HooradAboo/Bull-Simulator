import { useState } from "react";
import type { SelfEfficacyRatings } from "../types";

interface Props {
  onContinue: (ratings: SelfEfficacyRatings) => void;
  heading?: string;
  description?: string;
  continueLabel?: string;
}

const STATEMENTS: { key: keyof SelfEfficacyRatings; text: string }[] = [
  {
    key: "recognizeLinks",
    text: "I can recognize suspicious links in emails or text messages.",
  },
  {
    key: "verifyLegitimacy",
    text: "I can determine whether a message requesting personal information is legitimate.",
  },
  {
    key: "avoidSuspicious",
    text: "I can avoid clicking links or opening attachments when a message seems suspicious.",
  },
  {
    key: "verifyTrustedSource",
    text: "I can verify suspicious requests through a trusted source.",
  },
  {
    key: "reportPhishing",
    text: "I can report a suspected phishing attempt using the appropriate process.",
  },
  {
    key: "recoverySteps",
    text: "I know what steps to take if I accidentally click a suspicious link or enter information on a suspicious website.",
  },
];

const DEFAULT_RATING = 50;

export function SelfEfficacyScreen({
  onContinue,
  heading = "Rate Your Confidence",
  description = "For each statement below, rate your confidence in your ability to complete the following cybersecurity tasks.",
  continueLabel = "Continue",
}: Props) {
  const [ratings, setRatings] = useState<Record<keyof SelfEfficacyRatings, number>>({
    recognizeLinks: DEFAULT_RATING,
    verifyLegitimacy: DEFAULT_RATING,
    avoidSuspicious: DEFAULT_RATING,
    verifyTrustedSource: DEFAULT_RATING,
    reportPhishing: DEFAULT_RATING,
    recoverySteps: DEFAULT_RATING,
  });

  return (
    <div className="screen self-efficacy-screen">
      <h1>{heading}</h1>
      <p>{description}</p>
      {STATEMENTS.map((statement) => (
        <div key={statement.key} className="self-efficacy-item">
          <div className="self-efficacy-item-text">{statement.text}</div>
          <div className="self-efficacy-slider-wrap">
            <input
              type="range"
              min={0}
              max={100}
              value={ratings[statement.key]}
              onChange={(e) =>
                setRatings((prev) => ({
                  ...prev,
                  [statement.key]: Number(e.target.value),
                }))
              }
            />
            <div className="self-efficacy-scale-labels">
              <span>Cannot do at all</span>
              <span>Highly certain can do</span>
            </div>
            <div className="self-efficacy-value">{ratings[statement.key]}</div>
          </div>
        </div>
      ))}
      <button onClick={() => onContinue(ratings)}>{continueLabel}</button>
    </div>
  );
}
