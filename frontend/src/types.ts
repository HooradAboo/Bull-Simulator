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
  subject: string;
  body: string;
  originalSender: string;
  link: string | null;
  attachment: string | null;
  recipient: string;
  sentAt: number;
}
