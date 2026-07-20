import { useEffect, useState } from "react";
import "./report.css";
import {
  getPerformanceReport,
  type CalibrationBucket,
  type CalibrationState,
  type PerformanceReport,
} from "../api";

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

const STATE_LABELS: Record<CalibrationState, string> = {
  in_sync: "In sync",
  undersold: "Undersold it",
  oversold: "Oversold it",
  not_enough_data: "Not enough data",
};

function StateTag({ state }: { state: CalibrationState }) {
  return (
    <span className={`state-tag ${state}`}>
      <span className="state-dot" style={{ background: "currentColor" }} />
      {STATE_LABELS[state]}
    </span>
  );
}

function fmtNum(value: number | null | undefined): string {
  return value == null ? "—" : String(value);
}

function ConfusionMatrix({ report }: { report: PerformanceReport }) {
  return (
    <div className="confusion-matrix-wrap">
      <table className="confusion-matrix">
        <thead>
          <tr>
            <th />
            <th>Flagged as suspicious</th>
            <th>Trusted it</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Actually phishing</th>
            <td className="confusion-cell good">
              <div className="confusion-cell-value">{report.phishing.caught}</div>
              <div className="confusion-cell-label">Caught</div>
            </td>
            <td className="confusion-cell bad">
              <div className="confusion-cell-value">{report.phishing.missed}</div>
              <div className="confusion-cell-label">Missed</div>
            </td>
          </tr>
          <tr>
            <th>Actually legitimate</th>
            <td className="confusion-cell warn">
              <div className="confusion-cell-value">{report.legit.falsePositive}</div>
              <div className="confusion-cell-label">False alarm</div>
            </td>
            <td className="confusion-cell good">
              <div className="confusion-cell-value">{report.legit.handledWell}</div>
              <div className="confusion-cell-label">Trusted correctly</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

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

function OverviewCard({ label, bucket }: { label: string; bucket: CalibrationBucket }) {
  return (
    <div className="ov-card">
      <div className="ov-label">{label}</div>
      <div className="ov-value">{fmtNum(bucket.confidence)}</div>
      <div className="ov-acc">accuracy {fmtNum(bucket.accuracy)}</div>
      <StateTag state={bucket.state} />
    </div>
  );
}

function insightNarrative(claimedPhishing: CalibrationBucket, claimedLegit: CalibrationBucket): string {
  if (claimedPhishing.confidence === null || claimedLegit.confidence === null) {
    return "There isn't enough data yet to compare these two patterns.";
  }
  if (claimedPhishing.confidence === claimedLegit.confidence) {
    return "You felt about equally sure whether you were flagging something as suspicious or trusting it. That's a good sign of even-handed judgment.";
  }
  const moreConfident = claimedLegit.confidence > claimedPhishing.confidence ? "trusting an email" : "flagging one as suspicious";
  const lessConfident = claimedLegit.confidence > claimedPhishing.confidence ? "flagging one as suspicious" : "trusting an email";
  return `You felt more sure when ${moreConfident} than when ${lessConfident}. That's a common pattern, not a personal flaw - it's part of why phishing works on almost everyone at some point.`;
}

function ConfidenceSection({ report }: { report: PerformanceReport }) {
  const { confidence } = report;
  const protectiveKeys = ACTION_CHART_ORDER.filter(
    (key) => key !== "open_attachment" && confidence.byAction[key]?.isProtective
  );
  const engagementKeys = ACTION_CHART_ORDER.filter(
    (key) => key !== "open_attachment" && confidence.byAction[key] && !confidence.byAction[key].isProtective
  );

  const renderActionTable = (keys: string[]) => (
    <div className="action-table">
      <div className="action-row header-row">
        <div>Action</div>
        <div>Confidence</div>
        <div className="col-n">n</div>
        <div>Accuracy</div>
        <div className="col-state">Pattern</div>
      </div>
      {keys.map((key) => {
        const bucket = confidence.byAction[key];
        return (
          <div className="action-row" key={key}>
            <div className="action-name">{ACTION_CHART_LABELS[key]}</div>
            <div className="action-conf">{fmtNum(bucket.confidence)}</div>
            <div className="action-n col-n">{bucket.n}</div>
            <div className="action-acc">{fmtNum(bucket.accuracy)}</div>
            <div className="col-state">
              <StateTag state={bucket.state} />
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <h2>Overview</h2>
      <div className="overview-grid">
        <OverviewCard label="Overall confidence" bucket={confidence.overall} />
        <OverviewCard label="On phishing emails" bucket={confidence.phishing} />
        <OverviewCard label="On legitimate emails" bucket={confidence.legit} />
      </div>

      <div className="insight">
        <div className="insight-title">The gap worth noticing</div>
        <div className="insight-compare">
          <div className="insight-stat">
            <div className="num-row">
              <span className="num">{fmtNum(confidence.claimedPhishing.confidence)}</span>
            </div>
            <div className="acc">accuracy {fmtNum(confidence.claimedPhishing.accuracy)}</div>
            <div className="lbl">
              When flagging
              <br />
              something suspicious
            </div>
            <div className="state">
              <StateTag state={confidence.claimedPhishing.state} />
            </div>
          </div>
          <div className="insight-arrow">vs</div>
          <div className="insight-stat">
            <div className="num-row">
              <span className="num">{fmtNum(confidence.claimedLegit.confidence)}</span>
            </div>
            <div className="acc">accuracy {fmtNum(confidence.claimedLegit.accuracy)}</div>
            <div className="lbl">
              When trusting
              <br />
              something
            </div>
            <div className="state">
              <StateTag state={confidence.claimedLegit.state} />
            </div>
          </div>
        </div>
        <p>{insightNarrative(confidence.claimedPhishing, confidence.claimedLegit)}</p>
      </div>

      <h2>How to Read the Labels</h2>
      <div className="legend-row">
        <div className="legend-chip">
          <div className="chip-title">
            <span className="state-dot" style={{ background: "var(--sync)" }} /> In sync
          </div>
          <div className="chip-desc">Confidence and accuracy are close. Your gut and the outcome agreed.</div>
        </div>
        <div className="legend-chip">
          <div className="chip-title">
            <span className="state-dot" style={{ background: "var(--undersold)" }} /> Undersold it
          </div>
          <div className="chip-desc">You were more often right than you felt. No downside here.</div>
        </div>
        <div className="legend-chip">
          <div className="chip-title">
            <span className="state-dot" style={{ background: "var(--oversold)" }} /> Oversold it
          </div>
          <div className="chip-desc">Confidence ran ahead of the outcome. Worth a second look.</div>
        </div>
        <div className="legend-chip">
          <div className="chip-title">
            <span className="state-dot" style={{ background: "var(--neutral)" }} /> Not enough data
          </div>
          <div className="chip-desc">Too few of this action to say anything meaningful yet.</div>
        </div>
      </div>

      <h2>By Action</h2>
      {protectiveKeys.length > 0 && (
        <>
          <div className="group-label">Protective actions</div>
          {renderActionTable(protectiveKeys)}
        </>
      )}
      {engagementKeys.length > 0 && (
        <>
          <div className="group-label">Engagement actions</div>
          {renderActionTable(engagementKeys)}
        </>
      )}
      <p className="report-footnote">
        Patterns are only shown once an action has been used at least 3 times - anything less
        stays labeled "Not enough data." Within about 10 points, confidence and accuracy count
        as "in sync"; beyond that, whichever one is higher determines "undersold" or "oversold."
      </p>
    </>
  );
}

function SelfEfficacyCompare({ report }: { report: PerformanceReport }) {
  const { selfEfficacy } = report;

  const changeCell = (pre: number, post: number | null | undefined) => {
    if (post == null) return <td className="self-efficacy-change">—</td>;
    const diff = post - pre;
    const sign = diff > 0 ? "+" : "";
    const cls = diff > 0 ? "positive" : diff < 0 ? "negative" : "";
    return (
      <td className={`self-efficacy-change ${cls}`}>
        {sign}
        {diff}
      </td>
    );
  };

  return (
    <table className="self-efficacy-compare">
      <thead>
        <tr>
          <th>Statement</th>
          <th>Before</th>
          <th>After</th>
          <th>Change</th>
        </tr>
      </thead>
      <tbody>
        {selfEfficacy.statements.map((s) => (
          <tr key={s.key}>
            <td className="self-efficacy-statement">{s.text}</td>
            <td>{s.pre}</td>
            <td>{s.post ?? "—"}</td>
            {changeCell(s.pre, s.post)}
          </tr>
        ))}
        <tr className="self-efficacy-total-row">
          <td className="self-efficacy-statement">Overall average</td>
          <td>{selfEfficacy.preAverage}</td>
          <td>{selfEfficacy.postAverage ?? "—"}</td>
          {changeCell(selfEfficacy.preAverage, selfEfficacy.postAverage)}
        </tr>
      </tbody>
    </table>
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
        <div className="report-card">
          <h1 className="report-title">Your Results</h1>
          <p className="report-subtitle">
            This isn't a score to judge yourself by. It's a look at how you handled these
            emails and how confident you felt along the way - something to learn from, not
            worry over.
          </p>

          <h2>Performance</h2>
          <div className="report-score-headline">
            <div className="report-score-value">
              {report.totalScore} / {report.maxPossibleScore}
            </div>
            <div className="report-score-tag">
              {scoreLabel(report.totalScore, report.maxPossibleScore)}
            </div>
          </div>
          <p className="body">
            You made <strong>{report.correctCount}</strong> out of{" "}
            <strong>{report.totalCount}</strong> safe decisions.
          </p>

          <p className="chart-intro">
            This shows how you classified each email compared to what it actually was.
          </p>
          <ConfusionMatrix report={report} />

          <p className="chart-intro">
            This shows which actions you took on legitimate emails versus phishing emails.
          </p>
          <ActionChart report={report} />

          <ConfidenceSection report={report} />

          <h2>Self-Efficacy: Before vs. After</h2>
          <p className="chart-intro">
            How your confidence in your own phishing-handling ability changed from before the
            task to after.
          </p>
          <SelfEfficacyCompare report={report} />
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
