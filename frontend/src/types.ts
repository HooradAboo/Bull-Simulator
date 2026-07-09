export type ActionType =
  | "click_link"
  | "reply"
  | "forward"
  | "report_phishing"
  | "delete"
  | "ignore";

export interface DummyEmail {
  id: string;
  sender: string;
  subject: string;
  body: string;
  link: string | null;
  attachment: string | null;
}

export interface ProcessedInfo {
  action: ActionType;
  confidence: number;
  recipient?: string | null;
}

export type FolderName = "inbox" | "deleted" | "junk" | "sent";

export interface Contact {
  name: string;
  email: string;
}

export interface SentItem {
  id: string;
  originalEmailId: string;
  kind: "forward" | "reply";
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
