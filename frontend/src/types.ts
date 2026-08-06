export type ActionType =
  | "click_link"
  | "open_attachment"
  | "reply"
  | "forward"
  | "report_phishing"
  | "delete"
  | "ignore"
  | "verify_independently";

export interface DummyEmail {
  id: string;
  sender: string;
  subject: string;
  body: string;
  link: string | null;
  attachment: string | null;
  receivedAt: number | null;
}

export interface ProcessedInfo {
  action: ActionType;
  // null in practice mode, where no confidence rating is ever collected.
  confidence: number | null;
  recipient?: string | null;
  // Carries the trust/suspicious judgment forward so the judgment panel can
  // still show it after reselecting an already-processed email, not just
  // the action taken. Optional/nullable since resumed sessions (hydrated
  // from the backend after a crash) don't currently carry this back.
  perceivedLegitimacy?: "trust" | "suspicious" | null;
  judgmentConfidenceRating?: number | null;
}

export type FolderName = "inbox" | "deleted" | "junk" | "sent" | "drafts";

export interface Contact {
  name: string;
  email: string;
}

export interface SentItem {
  id: string;
  originalEmailId: string;
  kind: "forward" | "reply" | "compose";
  subject: string;
  body: string;
  originalSender: string;
  link: string | null;
  attachment: string | null;
  recipient: string;
  sentAt: number;
}

export interface Credential {
  id: number;
  website: string;
  email: string;
  password: string;
  mfaEnabled: boolean;
}

export interface SelfEfficacyRatings {
  recognizeLinks: number;
  verifyLegitimacy: number;
  avoidSuspicious: number;
  verifyTrustedSource: number;
  reportPhishing: number;
  recoverySteps: number;
}
