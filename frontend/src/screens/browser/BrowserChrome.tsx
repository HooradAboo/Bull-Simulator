import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowClockwise16Regular,
  ArrowDownload16Regular,
  ArrowLeft16Regular,
  ArrowRight16Regular,
  CheckmarkCircle48Regular,
  CheckmarkCircle16Filled,
  Dismiss12Regular,
  Globe16Regular,
  LockClosed16Regular,
  Mail16Filled,
  MoreHorizontal20Regular,
} from "@fluentui/react-icons";
import { WindowControls } from "./WindowControls";
import "./browser.css";

const MAIL_TAB_ID = "mail";

interface BrowserTab {
  id: string;
  title: string;
  url: string;
  kind: "mail" | "blank";
}

interface BrowserTabsApi {
  openTab: (url: string) => void;
  isMailTabActive: boolean;
  triggerDownload: (filename: string) => void;
}

const BrowserTabsContext = createContext<BrowserTabsApi | null>(null);

export function useBrowserTabs(): BrowserTabsApi {
  const ctx = useContext(BrowserTabsContext);
  if (!ctx) throw new Error("useBrowserTabs must be used within BrowserChrome");
  return ctx;
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
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
  const [activeTabId, setActiveTabId] = useState(MAIL_TAB_ID);
  const [downloadFile, setDownloadFile] = useState<string | null>(null);

  useEffect(() => {
    if (!downloadFile) return;
    const timer = setTimeout(() => setDownloadFile(null), 8000);
    return () => clearTimeout(timer);
  }, [downloadFile]);

  const triggerDownload = (filename: string) => {
    setDownloadFile(filename);
  };

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

  const openTab = (url: string) => {
    const id = crypto.randomUUID();
    setTabs((prev) => [...prev, { id, title: hostnameOf(url), url, kind: "blank" }]);
    setActiveTabId(id);
  };

  const closeTab = (id: string) => {
    setTabs((prev) => prev.filter((t) => t.id !== id));
    setActiveTabId(MAIL_TAB_ID);
  };

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  return (
    <BrowserTabsContext.Provider
      value={{ openTab, isMailTabActive: activeTabId === MAIL_TAB_ID, triggerDownload }}
    >
      <div className="browser-shell">
        <div className="browser-titlebar">
          <div className="browser-tabstrip">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`browser-tab ${tab.id === activeTabId ? "active" : ""}`}
                onClick={() => setActiveTabId(tab.id)}
              >
                <span className="browser-tab-favicon" aria-hidden="true">
                  {tab.kind === "mail" ? <Mail16Filled /> : <Globe16Regular />}
                </span>
                <span className="browser-tab-title">{tab.title}</span>
                {tab.kind !== "mail" && (
                  <span
                    className="browser-tab-close"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                  >
                    <Dismiss12Regular />
                  </span>
                )}
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

          <div className="download-indicator-wrap">
            <span
              className={`browser-nav-btn download-icon-btn ${downloadFile ? "active" : ""}`}
              title="Downloads"
            >
              <ArrowDownload16Regular />
            </span>
            {downloadFile && (
              <div className="download-popup">
                <div className="download-popup-row">
                  <ArrowDownload16Regular className="download-popup-icon" />
                  <span className="download-popup-filename">{downloadFile}</span>
                  <span className="download-popup-close" onClick={() => setDownloadFile(null)}>
                    <Dismiss12Regular />
                  </span>
                </div>
                <div className="download-popup-message">
                  <CheckmarkCircle16Filled className="download-popup-message-icon" /> This action
                  has been recorded. You can ignore this message and continue your tasks.
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="browser-content">
          <div
            className="browser-tab-panel"
            style={{ display: activeTabId === MAIL_TAB_ID ? "flex" : "none" }}
          >
            {children}
          </div>
          {tabs
            .filter((t) => t.kind === "blank")
            .map((tab) => (
              <div
                key={tab.id}
                className="browser-tab-panel blank-page"
                style={{ display: tab.id === activeTabId ? "flex" : "none" }}
              >
                <div className="blank-page-content">
                  <CheckmarkCircle48Regular className="blank-page-icon" />
                  <div className="blank-page-title">This action has been recorded</div>
                  <div className="blank-page-subtitle">
                    You can ignore this page and return to the Mail tab.
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </BrowserTabsContext.Provider>
  );
}
