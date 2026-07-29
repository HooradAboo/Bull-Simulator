import {
  createContext,
  useContext,
  useEffect,
  useRef,
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
  MoreHorizontal20Regular,
} from "@fluentui/react-icons";
import { WindowControls } from "./WindowControls";
import { SearchTabPage } from "./SearchTabPage";
import "./browser.css";

const MAIL_TAB_ID = "mail";
const SEARCH_TAB_ID = "search";

function GoogleGIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12
        c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24
        c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657
        C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36
        c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      />
      <path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571
        c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </svg>
  );
}

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
  kind: "mail" | "blank" | "search";
}

export interface IndependentSearchTarget {
  id: string;
  label: string;
}

interface BrowserTabsApi {
  openTab: (url: string) => void;
  isMailTabActive: boolean;
  triggerDownload: (filename: string) => void;
  registerIndependentSearchHandler: (handler: ((query: string) => void) | null) => void;
  independentSearchTarget: IndependentSearchTarget | null;
  setIndependentSearchTarget: (target: IndependentSearchTarget | null) => void;
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
  showSearchTab?: boolean;
}

export function BrowserChrome({ children, primaryTabTitle, primaryTabUrl, showSearchTab }: Props) {
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
  const independentSearchHandler = useRef<((query: string) => void) | null>(null);
  const [independentSearchTarget, setIndependentSearchTarget] =
    useState<IndependentSearchTarget | null>(null);

  const registerIndependentSearchHandler = (handler: ((query: string) => void) | null) => {
    independentSearchHandler.current = handler;
  };

  // The Google tab only exists once the participant is signed in and in the
  // inbox (not on the login page) - added/removed here rather than always
  // present, since showSearchTab flips on the same long-lived BrowserChrome
  // instance as loggedIn changes.
  useEffect(() => {
    setTabs((prev) => {
      const hasSearchTab = prev.some((t) => t.id === SEARCH_TAB_ID);
      if (showSearchTab && !hasSearchTab) {
        const mailIndex = prev.findIndex((t) => t.id === MAIL_TAB_ID);
        const next = [...prev];
        next.splice(mailIndex + 1, 0, {
          id: SEARCH_TAB_ID,
          title: "Google",
          url: "https://www.google.com",
          kind: "search",
        });
        return next;
      }
      if (!showSearchTab && hasSearchTab) {
        return prev.filter((t) => t.id !== SEARCH_TAB_ID);
      }
      return prev;
    });
  }, [showSearchTab]);

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
      value={{
        openTab,
        isMailTabActive: activeTabId === MAIL_TAB_ID,
        triggerDownload,
        registerIndependentSearchHandler,
        independentSearchTarget,
        setIndependentSearchTarget,
      }}
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
                  {tab.kind === "mail" ? (
                    <OutlookIcon />
                  ) : tab.kind === "search" ? (
                    <GoogleGIcon />
                  ) : (
                    <Globe16Regular />
                  )}
                </span>
                <span className="browser-tab-title">{tab.title}</span>
                {tab.kind === "blank" && (
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
          {tabs.some((t) => t.id === SEARCH_TAB_ID) && (
            <div
              className="browser-tab-panel search-page"
              style={{ display: activeTabId === SEARCH_TAB_ID ? "flex" : "none" }}
            >
              <SearchTabPage
                target={independentSearchTarget}
                onSearch={(query) => independentSearchHandler.current?.(query)}
                onReturnToMail={() => setActiveTabId(MAIL_TAB_ID)}
              />
            </div>
          )}
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
