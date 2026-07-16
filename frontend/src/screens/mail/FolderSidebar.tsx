import {
  Calendar20Regular,
  ChevronDown12Regular,
  Cloud20Regular,
  Delete20Regular,
  DocumentEdit20Regular,
  Mail20Filled,
  MailInbox20Regular,
  People20Regular,
  Prohibited20Regular,
  Send20Regular,
  TaskListSquareLtr20Regular,
} from "@fluentui/react-icons";
import type { FolderName, TaskConfig } from "../../types";
import { TaskList } from "./TaskList";

const RAIL_ICONS = [
  { icon: <Mail20Filled />, active: true },
  { icon: <Calendar20Regular />, active: false },
  { icon: <People20Regular />, active: false },
  { icon: <TaskListSquareLtr20Regular />, active: false },
  { icon: <Cloud20Regular />, active: false },
];

interface Props {
  currentFolder: FolderName;
  unreadCount: number;
  deletedCount: number;
  junkCount: number;
  sentCount: number;
  participantEmail: string;
  tasks: TaskConfig[];
  onSelectFolder: (folder: FolderName) => void;
}

export function FolderSidebar({
  currentFolder,
  unreadCount,
  deletedCount,
  junkCount,
  sentCount,
  participantEmail,
  tasks,
  onSelectFolder,
}: Props) {
  return (
    <>
      <div className="mail-icon-rail">
        {RAIL_ICONS.map((item, i) => (
          <div key={i} className={`rail-icon ${item.active ? "active" : ""}`} aria-hidden="true">
            {item.icon}
          </div>
        ))}
      </div>

      <div className="mail-folder-sidebar">
        <div className="folder-section-title">
          <ChevronDown12Regular /> Favorites
        </div>
        <div
          className={`folder-row ${currentFolder === "inbox" ? "active" : ""}`}
          onClick={() => onSelectFolder("inbox")}
        >
          <span className="folder-icon" aria-hidden="true">
            <MailInbox20Regular />
          </span>
          Inbox{unreadCount > 0 ? ` (${unreadCount})` : ""}
        </div>
        <div
          className={`folder-row ${currentFolder === "junk" ? "active" : ""}`}
          onClick={() => onSelectFolder("junk")}
        >
          <span className="folder-icon" aria-hidden="true">
            <Prohibited20Regular />
          </span>
          Junk Email{junkCount > 0 ? ` (${junkCount})` : ""}
        </div>
        <div
          className={`folder-row ${currentFolder === "sent" ? "active" : ""}`}
          onClick={() => onSelectFolder("sent")}
        >
          <span className="folder-icon" aria-hidden="true">
            <Send20Regular />
          </span>
          Sent Items{sentCount > 0 ? ` (${sentCount})` : ""}
        </div>
        <div className="folder-row" title="Not used in this study">
          <span className="folder-icon" aria-hidden="true">
            <DocumentEdit20Regular />
          </span>
          Drafts
        </div>
        <div
          className={`folder-row ${currentFolder === "deleted" ? "active" : ""}`}
          onClick={() => onSelectFolder("deleted")}
        >
          <span className="folder-icon" aria-hidden="true">
            <Delete20Regular />
          </span>
          Deleted Items{deletedCount > 0 ? ` (${deletedCount})` : ""}
        </div>

        <div className="account-row">{participantEmail}</div>

        <TaskList tasks={tasks} />
      </div>
    </>
  );
}
