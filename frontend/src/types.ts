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
