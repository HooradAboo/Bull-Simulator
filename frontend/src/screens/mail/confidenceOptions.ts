// Shared by the decision-sureness rating (JudgmentPanel done-state label,
// ConfidenceModal step 1) and the action-sureness rating (ConfidenceModal
// step 1) - same 1-5 scale and wording for both, kept in one place so a
// future wording/scale change can't update one and silently miss the other.
export interface SurenessOption {
  value: number;
  label: string;
}

export const SURENESS_OPTIONS: SurenessOption[] = [
  { value: 1, label: "Not at all sure" },
  { value: 2, label: "Slightly sure" },
  { value: 3, label: "Somewhat sure" },
  { value: 4, label: "Sure" },
  { value: 5, label: "Extremely sure" },
];
