// Used for the action-sureness rating (ConfidenceModal step 1) - a 1-5
// scale kept in one place so a future wording/scale change has one spot
// to update.
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
