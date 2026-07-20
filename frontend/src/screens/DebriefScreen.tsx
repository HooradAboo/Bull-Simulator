import { useEffect, useState } from "react";
import { getPerformanceReport, type PerformanceReport } from "../api";

interface Props {
  participantId: string;
}

const ACTION_LABELS: Record<string, string> = {
  mark_as_read: "marked as read",
  reply: "replied to",
  forward: "forwarded",
  forward_to_it: "forwarded to IT",
  delete: "deleted",
  report: "reported as phishing",
  click_link: "clicked a link in",
};

function scoreLabel(totalScore: number, maxPossibleScore: number): string {
  if (maxPossibleScore <= 0) return "";
  const pct = totalScore / maxPossibleScore;
  if (pct >= 0.85) return "Strong awareness";
  if (pct >= 0.6) return "Good, with room to grow";
  return "Needs improvement";
}

export function DebriefScreen({ participantId }: Props) {
  const [comments, setComments] = useState("");
  const [report, setReport] = useState<PerformanceReport | null>(null);

  useEffect(() => {
    getPerformanceReport(participantId).then(setReport);
  }, [participantId]);

  return (
    <div className="screen">
      <h1>Debrief</h1>
      <p>
        [Placeholder debrief text.] Thank you for participating. The emails
        you saw were part of a research study on phishing susceptibility.
      </p>

      {report && (
        <div className="performance-summary">
          <h2>Your Performance</h2>

          <div className="score-headline">
            <div className="score-headline-value">
              {report.totalScore} / {report.maxPossibleScore}
            </div>
            <div className="score-headline-tag">
              {scoreLabel(report.totalScore, report.maxPossibleScore)}
            </div>
          </div>

          <p>
            You made <strong>{report.correctCount}</strong> out of{" "}
            <strong>{report.totalCount}</strong> safe decisions.
          </p>

          <p>
            Of the {report.phishing.total} phishing emails, you caught{" "}
            <strong>{report.phishing.caught}</strong> and missed{" "}
            <strong>{report.phishing.missed}</strong>.
          </p>

          <p>
            Of the {report.legit.total} legitimate emails, you handled{" "}
            <strong>{report.legit.handledWell}</strong> appropriately
            {report.legit.falsePositive > 0 && (
              <>
                {" "}
                and mistakenly flagged <strong>{report.legit.falsePositive}</strong> as
                suspicious
              </>
            )}
            .
          </p>

          <ul>
            {Object.entries(report.actionBreakdown)
              .filter(([, counts]) => counts.legitCount + counts.phishingCount > 0)
              .map(([action, counts]) => (
                <li key={action}>
                  You {ACTION_LABELS[action] ?? action} {counts.legitCount} legitimate email
                  {counts.legitCount === 1 ? "" : "s"} and {counts.phishingCount} phishing email
                  {counts.phishingCount === 1 ? "" : "s"}.
                </li>
              ))}
            {(report.attachments.legitOpened > 0 || report.attachments.phishingOpened > 0) && (
              <li>
                You opened attachments in {report.attachments.legitOpened} legitimate email
                {report.attachments.legitOpened === 1 ? "" : "s"} and{" "}
                {report.attachments.phishingOpened} phishing email
                {report.attachments.phishingOpened === 1 ? "" : "s"}.
              </li>
            )}
          </ul>
        </div>
      )}

      <label htmlFor="debrief-comments">Any comments? (optional)</label>
      <textarea
        id="debrief-comments"
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        rows={4}
      />
    </div>
  );
}
