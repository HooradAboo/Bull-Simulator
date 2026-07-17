import { useEffect, useState } from "react";
import { getSelfEfficacyQuestions } from "../api";
import type { SelfEfficacyRatings } from "../types";

interface Props {
  onContinue: (ratings: SelfEfficacyRatings) => void;
  heading?: string;
  description?: string;
  continueLabel?: string;
}

const DEFAULT_RATING = 50;

export function SelfEfficacyScreen({
  onContinue,
  heading = "Rate Your Confidence",
  description = "For each statement below, rate your confidence in your ability to complete the following cybersecurity tasks.",
  continueLabel = "Continue",
}: Props) {
  const [statements, setStatements] = useState<{ key: string; text: string }[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    getSelfEfficacyQuestions().then(setStatements);
  }, []);

  const handleContinue = () => {
    // The config's question keys are expected to line up with the fixed
    // SelfEfficacyRatings fields the backend stores; fill in anything the
    // participant never touched with the slider default.
    const complete: Record<string, number> = { ...ratings };
    for (const s of statements) {
      if (complete[s.key] === undefined) complete[s.key] = DEFAULT_RATING;
    }
    onContinue(complete as unknown as SelfEfficacyRatings);
  };

  return (
    <div className="screen self-efficacy-screen">
      <h1>{heading}</h1>
      <p>{description}</p>
      {statements.map((statement) => (
        <div key={statement.key} className="self-efficacy-item">
          <div className="self-efficacy-item-text">{statement.text}</div>
          <div className="self-efficacy-slider-wrap">
            <input
              type="range"
              min={0}
              max={100}
              value={ratings[statement.key] ?? DEFAULT_RATING}
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
            <div className="self-efficacy-value">{ratings[statement.key] ?? DEFAULT_RATING}</div>
          </div>
        </div>
      ))}
      <button onClick={handleContinue}>{continueLabel}</button>
    </div>
  );
}
