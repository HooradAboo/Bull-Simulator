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
  confidence: number;
  recipient?: string | null;
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

export interface Subtask {
  id: string;
  label: string;
  type: "process_all_emails" | "action_used";
  action?: ActionType;
}

export interface TaskConfig {
  id: string;
  title: string;
  subtasks: Subtask[];
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
