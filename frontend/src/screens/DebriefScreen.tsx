import { useEffect, useState } from "react";
import "./page.css";
import {
  getPerformanceReport,
  type CalibrationBucket,
  type CalibrationState,
  type PerformanceReport,
} from "../api";
import { PageTemplate } from "./PageTemplate";

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
  "verify_independently",
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
  verify_independently: "Verify Independently",
};

const STATE_LABELS: Record<CalibrationState, string> = {
  in_sync: "In sync",
  undersold: "Undersold it",
  oversold: "Oversold it",
  no_data: "—",
};

function StateTag({ state }: { state: CalibrationState }) {
  if (state === "no_data") {
    return <span className="state-tag no-data">—</span>;
  }
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
    const counts = report.actionBreakdown[key] ?? { legitCount: 0, phishingCount: 0 };
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
  const protectiveKeys = ACTION_CHART_ORDER.filter((key) => confidence.byAction[key]?.isProtective);
  const engagementKeys = ACTION_CHART_ORDER.filter(
    (key) => confidence.byAction[key] && !confidence.byAction[key].isProtective
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
        Within about 10 points, confidence and accuracy count as "in sync"; beyond that,
        whichever one is higher determines "undersold" or "oversold."
      </p>
    </>
  );
}

const SELF_EFFICACY_SHORT_LABELS: Record<string, string> = {
  recognizeLinks: "Identifying indicators",
  verifyLegitimacy: "Evaluating legitimacy",
  avoidSuspicious: "Avoiding unsafe actions",
  verifyTrustedSource: "Verifying requests",
  reportPhishing: "Reporting attempts",
  recoverySteps: "Recovering after exposure",
};

const SHIFT_AXIS_TICKS = [0, 25, 50, 75, 100];

interface ShiftRow {
  key: string;
  label: string;
  pre: number;
  post: number;
  change: number;
}

function changeClass(change: number): string {
  if (change > 0) return "positive";
  if (change < 0) return "negative";
  return "";
}

function SelfEfficacyShift({ report }: { report: PerformanceReport }) {
  const { selfEfficacy } = report;
  const allAnswered = selfEfficacy.statements.every((s) => s.post != null);

  if (!allAnswered || selfEfficacy.postAverage == null) {
    return (
      <p className="body">
        The post-task confidence survey hasn't been completed yet, so a before/after comparison
        isn't available.
      </p>
    );
  }

  const rows: ShiftRow[] = selfEfficacy.statements.map((s) => ({
    key: s.key,
    label: SELF_EFFICACY_SHORT_LABELS[s.key] ?? s.text,
    pre: s.pre,
    post: s.post as number,
    change: Math.round(((s.post as number) - s.pre) * 10) / 10,
  }));

  const overallChange = Math.round((selfEfficacy.postAverage - selfEfficacy.preAverage) * 10) / 10;
  const overallSign = Math.sign(overallChange);
  const allSameDirection = rows.every((r) => r.change === 0 || Math.sign(r.change) === overallSign);

  const moveNote = allSameDirection
    ? overallChange > 0
      ? "Confidence grew across every area you rated."
      : overallChange < 0
        ? "Confidence dropped across every area you rated."
        : "Confidence stayed about the same across the board."
    : "The average moved, but the items underneath it did not move together - see below.";

  const minAbsChange = Math.min(...rows.map((r) => Math.abs(r.change)));
  const barelyMoved = rows.filter((r) => Math.abs(r.change) <= Math.max(3, minAbsChange));
  const footnote =
    barelyMoved.length > 0 && barelyMoved.length < rows.length
      ? `${barelyMoved.map((r) => r.label).join(" and ")} ${
          barelyMoved.length === 1 ? "is the item" : "are the items"
        } that barely moved. That's worth checking against whether the task actually gives
        participants a moment to practice ${
          barelyMoved.length === 1 ? "it" : "either one"
        } - a competency can't shift much if nothing in the session exercises it.`
      : "";

  return (
    <>
      <div className="shift-overall">
        <div className="shift-overall-label">Overall</div>
        <div className="shift-overall-values">
          {selfEfficacy.preAverage} <span className="shift-arrow">→</span>{" "}
          {selfEfficacy.postAverage}
        </div>
        <div className={`shift-overall-change ${changeClass(overallChange)}`}>
          {overallChange > 0 ? "+" : ""}
          {overallChange}
        </div>
      </div>
      <p className="chart-intro">{moveNote}</p>

      <div className="shift-legend">
        <span className="shift-legend-item">
          <span className="shift-legend-dot before" /> Before
        </span>
        <span className="shift-legend-item">
          <span className="shift-legend-dot after" /> After
        </span>
      </div>

      <div className="shift-rows">
        {rows.map((row) => (
          <div className="shift-row" key={row.key}>
            <div className="shift-row-label">{row.label}</div>
            <div className="shift-row-track">
              <div className="shift-track-line" />
              <div
                className="shift-connector"
                style={{
                  left: `${Math.min(row.pre, row.post)}%`,
                  width: `${Math.abs(row.post - row.pre)}%`,
                }}
              />
              <div className="shift-dot before" style={{ left: `${row.pre}%` }}>
                <span className="shift-dot-value">{row.pre}</span>
              </div>
              <div className="shift-dot after" style={{ left: `${row.post}%` }}>
                <span className="shift-dot-value">{row.post}</span>
              </div>
            </div>
            <div className={`shift-row-change ${changeClass(row.change)}`}>
              {row.change > 0 ? "+" : ""}
              {row.change}
            </div>
          </div>
        ))}
        <div className="shift-axis">
          <div className="shift-row-label" />
          <div className="shift-row-track">
            {SHIFT_AXIS_TICKS.map((t) => (
              <span className="shift-axis-tick" key={t} style={{ left: `${t}%` }}>
                {t}
              </span>
            ))}
          </div>
          <div className="shift-row-change" />
        </div>
      </div>

      {footnote && <p className="report-footnote">{footnote}</p>}
    </>
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
  const [report, setReport] = useState<PerformanceReport | null>(null);

  useEffect(() => {
    getPerformanceReport(participantId).then(setReport);
  }, [participantId]);

  return (
    <PageTemplate
      title="Debrief"
      subtitle="[Placeholder debrief text.] Thank you for participating. The emails
        you saw were part of a research study on phishing susceptibility."
      wide
      flush
    >
      {report && (
        <>
          <hr className="page-divider" />
          <div className="report-scroll">
            <p className="page-subtitle">
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

            <h2>How Confidence Shifted, By Competency</h2>
            <p className="chart-intro">
              Each item was asked with identical wording before the session and again after,
              in the same order as the questionnaire.
            </p>
            <SelfEfficacyShift report={report} />
          </div>
        </>
      )}
    </PageTemplate>
  );
}
