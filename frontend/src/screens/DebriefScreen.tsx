import { useEffect, useState } from "react";
import { getPerformanceReport, type PerformanceReport } from "../api";

interface Props {
  participantId: string;
}

const ACTION_CHART_ORDER = [
  "mark_as_read",
  "reply",
  "forward",
  "forward_to_it",
  "delete",
  "report",
  "click_link",
  "open_attachment",
];

const ACTION_CHART_LABELS: Record<string, string> = {
  mark_as_read: "Mark as Read",
  reply: "Reply",
  forward: "Forward",
  forward_to_it: "Forward to IT",
  delete: "Delete",
  report: "Report",
  click_link: "Click Link",
  open_attachment: "Open Attachment",
};

interface ActionChartRow {
  key: string;
  label: string;
  legitCount: number;
  phishingCount: number;
}

function ActionChart({ report }: { report: PerformanceReport }) {
  const rows: ActionChartRow[] = ACTION_CHART_ORDER.map((key) => {
    const counts =
      key === "open_attachment"
        ? { legitCount: report.attachments.legitOpened, phishingCount: report.attachments.phishingOpened }
        : report.actionBreakdown[key] ?? { legitCount: 0, phishingCount: 0 };
    return { key, label: ACTION_CHART_LABELS[key], ...counts };
  }).filter((row) => row.legitCount + row.phishingCount > 0);

  if (rows.length === 0) return null;

  const max = Math.max(...rows.map((row) => Math.max(row.legitCount, row.phishingCount)), 1);

  return (
    <div className="action-chart">
      <div className="action-chart-legend">
        <span className="action-chart-legend-item">
          <span className="action-chart-swatch legit" /> Legitimate emails
        </span>
        <span className="action-chart-legend-item">
          <span className="action-chart-swatch phishing" /> Phishing emails
        </span>
      </div>
      <div className="action-chart-bars-row">
        {rows.map((row) => (
          <div className="action-chart-group" key={row.key}>
            <div className="action-chart-bar-pair">
              <div className="action-chart-bar-wrap">
                <span className="action-chart-bar-value">{row.legitCount}</span>
                <div
                  className="action-chart-bar legit"
                  style={{ height: `${(row.legitCount / max) * 100}%` }}
                />
              </div>
              <div className="action-chart-bar-wrap">
                <span className="action-chart-bar-value">{row.phishingCount}</span>
                <div
                  className="action-chart-bar phishing"
                  style={{ height: `${(row.phishingCount / max) * 100}%` }}
                />
              </div>
            </div>
            <div className="action-chart-label">{row.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

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

          <ActionChart report={report} />
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
