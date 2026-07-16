import { Navigation20Regular } from "@fluentui/react-icons";

export function TabBar() {
  return (
    <div className="mail-tabbar">
      <Navigation20Regular aria-hidden="true" />
      <div className="tab">File</div>
      <div className="tab active">Home</div>
      <div className="tab">View</div>
      <div className="tab">Help</div>
      <div className="spacer" />
    </div>
  );
}
