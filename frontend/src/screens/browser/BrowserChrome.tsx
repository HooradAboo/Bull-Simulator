import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowClockwise16Regular,
  ArrowLeft16Regular,
  ArrowRight16Regular,
  Dismiss12Regular,
  Globe16Regular,
  LockClosed16Regular,
  Mail16Filled,
  MoreHorizontal20Regular,
} from "@fluentui/react-icons";
import { WindowControls } from "./WindowControls";
import { FloatingTaskList } from "./FloatingTaskList";
import type { TaskConfig } from "../../types";
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
  tasks: TaskConfig[];
  primaryTabTitle?: string;
  primaryTabUrl?: string;
}

export function BrowserChrome({ children, tasks, primaryTabTitle, primaryTabUrl }: Props) {
  const [tabs, setTabs] = useState<BrowserTab[]>([
    {
      id: MAIL_TAB_ID,
      title: primaryTabTitle ?? DEFAULT_PRIMARY_TITLE,
      url: primaryTabUrl ?? DEFAULT_PRIMARY_URL,
      kind: "mail",
    },
  ]);
  const [activeTabId, setActiveTabId] = useState(MAIL_TAB_ID);

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
      value={{ openTab, isMailTabActive: activeTabId === MAIL_TAB_ID }}
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
                <span className="blank-page-placeholder">
                  {hostnameOf(tab.url)} — page content not yet designed
                </span>
              </div>
            ))}
        </div>

        <FloatingTaskList tasks={tasks} />
      </div>
    </BrowserTabsContext.Provider>
  );
}
