import { useEffect, type ReactNode, useState } from "react";
import {
  Attach20Regular,
  DocumentPdf20Filled,
  FolderZip20Filled,
} from "@fluentui/react-icons";
import {
  getActionReasons,
  getCueOptions,
  type ActionReasonOption,
  type CueOption,
  type EmailReview,
} from "../api";
import { avatarColor, initials, senderName } from "./mail/avatar";
import "./mail/mail.css";

function attachmentVisual(filename: string): { icon: ReactNode; color: string } {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return { icon: <DocumentPdf20Filled />, color: "#c8262f" };
  if (ext === "zip") return { icon: <FolderZip20Filled />, color: "#8a8886" };
  return { icon: <Attach20Regular />, color: "#605e5c" };
}

function formatReceivedTime(ts: number): string {
  const d = new Date(ts);
  const weekday = d.toLocaleDateString(undefined, { weekday: "short" });
  const date = d.toLocaleDateString(undefined, { month: "numeric", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${weekday} ${date} ${time}`;
}

const CONFIDENCE_LABELS: Record<number, string> = {
  1: "Not at all confident",
  2: "Slightly confident",
  3: "Somewhat confident",
  4: "Confident",
  5: "Extremely confident",
};

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Very easy",
  2: "Somewhat easy",
  3: "Neutral",
  4: "Somewhat difficult",
  5: "Very difficult",
};

const JUDGMENT_LABELS: Record<string, string> = {
  trust: "Trusted it",
  suspicious: "Flagged as suspicious",
};

const ACTION_LABELS: Record<string, string> = {
  click_link: "Clicked a link",
  open_attachment: "Opened an attachment",
  reply: "Replied",
  forward: "Forwarded",
  report_phishing: "Reported as phishing",
  delete: "Deleted",
  ignore: "Marked as read",
  verify_independently: "Verified independently",
  archive: "Archived",
};

function ratingLabel(labels: Record<number, string>, value: number | null): string {
  if (value == null) return "—";
  return labels[value] ?? String(value);
}

function optionLabels(keys: string[], options: { key: string; label: string }[]): string[] {
  return keys
    .filter((key) => key !== "other")
    .map((key) => options.find((o) => o.key === key)?.label ?? key);
}

interface Props {
  emailReviews: EmailReview[];
}

export function EmailReviewSlideshow({ emailReviews }: Props) {
  const [index, setIndex] = useState(0);
  const [cueOptions, setCueOptions] = useState<CueOption[]>([]);
  const [actionReasonOptions, setActionReasonOptions] = useState<
    Record<string, ActionReasonOption[]>
  >({});

  useEffect(() => {
    getCueOptions().then(setCueOptions);
    getActionReasons().then(setActionReasonOptions);
  }, []);

  if (emailReviews.length === 0) {
    return <p className="body">No processed emails to review yet.</p>;
  }

  const review = emailReviews[index];
  const signals = optionLabels(review.cuesNoticed, cueOptions);
  if (review.cuesNoticed.includes("other") && review.cuesOtherText) {
    signals.push(review.cuesOtherText);
  }
  const reasons = optionLabels(review.actionReasons, actionReasonOptions[review.actionTaken] ?? []);
  if (review.actionReasons.includes("other") && review.actionReasonsOtherText) {
    reasons.push(review.actionReasonsOtherText);
  }

  return (
    <div className="email-review-slideshow">
      <div className="email-review-nav">
        <button
          type="button"
          className="page-button-secondary email-review-nav-btn"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          ← Previous
        </button>
        <div className="email-review-counter">
          Email {index + 1} of {emailReviews.length}
        </div>
        <button
          type="button"
          className="page-button-secondary email-review-nav-btn"
          onClick={() => setIndex((i) => Math.min(emailReviews.length - 1, i + 1))}
          disabled={index === emailReviews.length - 1}
        >
          Next →
        </button>
      </div>

      <div className="email-review-columns">
        <div className="email-review-card">
          <div className="email-review-header">
            <div>
              <div className="email-review-subject">{review.subject}</div>
              <div className="email-review-sender">{review.sender}</div>
            </div>
            <div className={`email-review-truth-tag ${review.isPhishing ? "phishing" : "legit"}`}>
              {review.isPhishing ? "Actually phishing" : "Actually legitimate"}
            </div>
          </div>

          <div className="email-review-outcome">
            <span className={`email-review-outcome-tag ${review.wasCorrect ? "good" : "bad"}`}>
              {review.wasCorrect ? "Safe decision" : "Missed it"}
            </span>
          </div>

          <div className="email-review-grid">
            <div className="email-review-field">
              <div className="email-review-field-label">Your judgment</div>
              <div className="email-review-field-value">
                {review.perceivedLegitimacy ? JUDGMENT_LABELS[review.perceivedLegitimacy] : "—"}
                {review.judgmentConfidenceRating != null && (
                  <span className="email-review-sub">
                    {" "}
                    ({ratingLabel(CONFIDENCE_LABELS, review.judgmentConfidenceRating)})
                  </span>
                )}
              </div>
            </div>
            <div className="email-review-field">
              <div className="email-review-field-label">Your action</div>
              <div className="email-review-field-value">
                {ACTION_LABELS[review.actionTaken] ?? review.actionTaken}
                {review.recipient && (
                  <span className="email-review-sub"> to {review.recipient}</span>
                )}
              </div>
            </div>
            <div className="email-review-field">
              <div className="email-review-field-label">Confidence in that response</div>
              <div className="email-review-field-value">
                {ratingLabel(CONFIDENCE_LABELS, review.confidenceRating)}
              </div>
            </div>
            <div className="email-review-field">
              <div className="email-review-field-label">Difficulty</div>
              <div className="email-review-field-value">
                {ratingLabel(DIFFICULTY_LABELS, review.difficultyRating)}
              </div>
            </div>
          </div>

          <div className="email-review-field">
            <div className="email-review-field-label">Signals you noticed</div>
            <div className="email-review-field-value">
              {signals.length > 0 ? signals.join(", ") : "None selected"}
            </div>
          </div>

          <div className="email-review-field">
            <div className="email-review-field-label">Why you chose that response</div>
            <div className="email-review-field-value">
              {reasons.length > 0 ? reasons.join(", ") : "None selected"}
            </div>
          </div>
        </div>

        <div className="email-review-picture">
          <div className="email-review-mailview">
            <div className="reading-content">
              <div className="reading-subject">{review.subject}</div>
              <div className="reading-sender-row">
                <div className="reading-sender-left">
                  <div
                    className="reading-sender-avatar"
                    style={{ background: avatarColor(review.sender) }}
                  >
                    {initials(review.sender)}
                  </div>
                  <div>
                    <div className="reading-sender-name">{senderName(review.sender)}</div>
                    <div className="reading-sender-meta">{review.sender}</div>
                  </div>
                </div>
                {review.receivedAt != null && (
                  <div className="reading-received-time">
                    {formatReceivedTime(review.receivedAt)}
                  </div>
                )}
              </div>

              {review.attachment && (
                <div className="reading-attachment-top">
                  <span className="reading-attachment">
                    <span
                      className="reading-attachment-icon"
                      style={{ background: attachmentVisual(review.attachment).color }}
                    >
                      {attachmentVisual(review.attachment).icon}
                    </span>
                    <span className="reading-attachment-name">{review.attachment}</span>
                  </span>
                </div>
              )}

              <div className="reading-body" dangerouslySetInnerHTML={{ __html: review.body }} />

              {review.link && !review.body.includes("data-tracked-link") && (
                <p>
                  <span className="reading-link">{review.link}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
