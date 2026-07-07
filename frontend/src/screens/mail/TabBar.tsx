export function TabBar() {
  return (
    <div className="mail-tabbar">
      <span aria-hidden="true">☰</span>
      <div className="tab">File</div>
      <div className="tab active">Home</div>
      <div className="tab">View</div>
      <div className="tab">Help</div>
      <div className="spacer" />
      <div className="focus-note">
        <span aria-hidden="true">📅</span> Focus
      </div>
    </div>
  );
}
