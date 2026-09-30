import { useEffect, useState } from "react";
import { Print20Regular } from "@fluentui/react-icons";
import "./page.css";
import { getPerformanceReport, type PerformanceReport } from "../api";
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

function ConfusionMatrix({ report }: { report: PerformanceReport }) {
  return (
    <div className="confusion-matrix-wrap">
      <table className="confusion-matrix">
        <thead>
          <tr>
            <th />
            <th>Suspected it</th>
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

const PX_PER_INCH = 96;
// Padding for anything the height measurement doesn't perfectly account for
// (font metrics, the small amount trimmed by hiding the print button/
// titlebar) - a little unused space at the bottom of the PDF is harmless,
// unlike being a little short and clipping content.
const PDF_HEIGHT_SAFETY_MARGIN_INCHES = 0.5;

export function ReportScreen({ participantId }: Props) {
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    getPerformanceReport(participantId).then(setReport);
  }, [participantId]);

  const handleExportPdf = async () => {
    // Only one PageTemplate is ever mounted at a time (App.tsx renders
    // exactly one screen conditionally), so this is safe without needing
    // PageTemplate to forward a ref just for this one caller.
    const shell = document.querySelector(".page-shell");
    const card = document.querySelector(".page-card");
    if (!shell || !card) return;

    setExportingPdf(true);
    // Add + measure + remove all happen synchronously (before the browser
    // gets a chance to paint), so the temporarily-unclipped layout is never
    // actually visible on screen.
    shell.classList.add("pdf-measuring");
    const heightPx = card.scrollHeight;
    shell.classList.remove("pdf-measuring");

    const heightInches = heightPx / PX_PER_INCH + PDF_HEIGHT_SAFETY_MARGIN_INCHES;
    const result = await window.electronAPI.exportReportPdf(heightInches);
    setExportingPdf(false);

    if (!result.success && !result.canceled) {
      alert(`Couldn't save the PDF${result.error ? `: ${result.error}` : "."}`);
    }
  };

  return (
    <PageTemplate
      title="Your Report"
      wide
      flush
      headerActions={
        report && (
          <button
            type="button"
            className="report-print-button"
            onClick={handleExportPdf}
            disabled={exportingPdf}
            title={exportingPdf ? "Saving PDF..." : "Save as PDF"}
            aria-label={exportingPdf ? "Saving PDF" : "Save as PDF"}
          >
            <Print20Regular />
          </button>
        )
      }
    >
      {report && (
        <>
          <hr className="page-divider" />
          <div className="report-scroll">
            <p className="page-subtitle">
              A look at how you handled these emails - something to learn from, not worry over.
            </p>

            <section className="report-section">
              <h2 className="report-section-title">Performance</h2>
              <p className="report-section-desc">
                How the emails you classified compared to what they actually were.
              </p>

              <p className="chart-intro">
                This shows how you classified each email compared to what it actually was.
              </p>
              <ConfusionMatrix report={report} />

              <p className="chart-intro">
                This shows which actions you took on legitimate emails versus phishing emails.
              </p>
              <ActionChart report={report} />
            </section>
          </div>
        </>
      )}
    </PageTemplate>
  );
}
