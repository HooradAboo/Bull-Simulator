import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowClockwise16Regular,
  ArrowLeft16Regular,
  ArrowRight16Regular,
  LockClosed16Regular,
  MoreHorizontal20Regular,
} from "@fluentui/react-icons";
import { WindowControls } from "./WindowControls";
import "./browser.css";

const MAIL_TAB_ID = "mail";

function OutlookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 32 32" aria-hidden="true">
      <rect x="1" y="2" width="28" height="28" rx="5" fill="#0A2767" />
      <rect x="15.5" y="9" width="12.5" height="17" rx="2" fill="#2B88D8" />
      <polygon points="15.5,9 28,9 21.75,15" fill="#83C4F2" />
      <circle cx="13" cy="17" r="8.5" fill="#fff" />
      <circle cx="13" cy="17" r="5" fill="#0A2767" />
    </svg>
  );
}

interface BrowserTab {
  id: string;
  title: string;
  url: string;
  kind: "mail";
}

const DEFAULT_PRIMARY_TITLE = "Inbox - Outlook";
const DEFAULT_PRIMARY_URL = "outlook.office.com/mail/inbox";

interface Props {
  children: ReactNode;
  primaryTabTitle?: string;
  primaryTabUrl?: string;
}

export function BrowserChrome({ children, primaryTabTitle, primaryTabUrl }: Props) {
  const [tabs, setTabs] = useState<BrowserTab[]>([
    {
      id: MAIL_TAB_ID,
      title: primaryTabTitle ?? DEFAULT_PRIMARY_TITLE,
      url: primaryTabUrl ?? DEFAULT_PRIMARY_URL,
      kind: "mail",
    },
  ]);

  // The primary tab's title/url can be overridden (e.g. to show a login
  // page's URL before the participant signs in, then switch to Outlook's).
  useEffect(() => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === MAIL_TAB_ID
          ? { ...t, title: primaryTabTitle ?? DEFAULT_PRIMARY_TITLE, url: primaryTabUrl ?? DEFAULT_PRIMARY_URL }
          : t
      )
    );
  }, [primaryTabTitle, primaryTabUrl]);

  const activeTab = tabs[0];

  return (
    <div className="browser-shell">
      <div className="browser-titlebar">
        <div className="browser-tabstrip">
          {tabs.map((tab) => (
            <div key={tab.id} className="browser-tab active">
              <span className="browser-tab-favicon" aria-hidden="true">
                <OutlookIcon />
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

      <div className="browser-content">
        <div className="browser-tab-panel" style={{ display: "flex" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
