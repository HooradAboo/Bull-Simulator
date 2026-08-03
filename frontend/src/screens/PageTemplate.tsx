import type { ReactNode } from "react";
import "./page.css";

interface Props {
  title: string;
  subtitle?: ReactNode;
  wide?: boolean;
  // Pins the card to the available viewport height instead of letting the
  // page grow past it - used by the debrief so only its inner
  // `.report-scroll` panel scrolls, not the whole screen.
  flush?: boolean;
  // Rendered next to the title (e.g. a "Print" button) - excluded from
  // print output via .page-header-actions' @media print rule.
  headerActions?: ReactNode;
  children?: ReactNode;
}

// Shared shell for every screen that isn't the simulated mail/browser
// experience - researcher setup, consent, instructions, self-efficacy
// surveys, and the debrief/report. Keeps a single, wide, light-card look
// across all of them instead of each screen inventing its own layout.
export function PageTemplate({ title, subtitle, wide, flush, headerActions, children }: Props) {
  const shellClass = [
    "page-shell",
    wide && "page-shell-wide",
    flush && "page-shell-flush",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={shellClass}>
      <div className="page-card">
        {headerActions ? (
          <div className="page-header-row">
            <h1 className="page-title">{title}</h1>
            <div className="page-header-actions">{headerActions}</div>
          </div>
        ) : (
          <h1 className="page-title">{title}</h1>
        )}
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
