import type { ReactNode } from "react";
import {
  ArrowClockwise16Regular,
  ArrowLeft16Regular,
  ArrowRight16Regular,
  LockClosed16Regular,
  Mail16Filled,
  MoreHorizontal20Regular,
} from "@fluentui/react-icons";
import { WindowControls } from "./WindowControls";
import "./browser.css";

interface BrowserTab {
  id: string;
  title: string;
  url: string;
}

// Single fixed tab for now. Modeled as an array so opening additional
// tabs later (e.g. a fake page when a phishing link is clicked) is a
// small addition rather than a rework.
const TABS: BrowserTab[] = [
  { id: "mail", title: "Inbox - Outlook", url: "outlook.office.com/mail/inbox" },
];

interface Props {
  children: ReactNode;
}

export function BrowserChrome({ children }: Props) {
  const activeTab = TABS[0];

  return (
    <div className="browser-shell">
      <div className="browser-titlebar">
        <div className="browser-tabstrip">
          {TABS.map((tab) => (
            <div key={tab.id} className="browser-tab active">
              <span className="browser-tab-favicon" aria-hidden="true">
                <Mail16Filled />
              </span>
              <span className="browser-tab-title">{tab.title}</span>
            </div>
          ))}
        </div>
        <WindowControls />
      </div>

      <div className="browser-toolbar">
        <button className="browser-nav-btn" disabled title="Back">
          <ArrowLeft16Regular />
        </button>
        <button className="browser-nav-btn" disabled title="Forward">
          <ArrowRight16Regular />
        </button>
        <button className="browser-nav-btn" disabled title="Reload">
          <ArrowClockwise16Regular />
        </button>
        <div className="browser-address-bar">
          <LockClosed16Regular aria-hidden="true" />
          <span>{activeTab.url}</span>
        </div>
        <button className="browser-nav-btn" disabled title="More">
          <MoreHorizontal20Regular />
        </button>
      </div>

      <div className="browser-content">{children}</div>
    </div>
  );
}
