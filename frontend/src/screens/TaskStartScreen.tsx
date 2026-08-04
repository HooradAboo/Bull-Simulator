import { PageTemplate } from "./PageTemplate";

interface Props {
  onBegin: () => void;
}

export function TaskStartScreen({ onBegin }: Props) {
  return (
    <PageTemplate title="Ready to Begin">
      <p className="body">
        Practice is over - the real task starts now. Nothing from here on is practice, so take
        your time and treat each email as if it arrived in your own inbox.
      </p>
      <div className="page-actions">
        <button className="page-button" onClick={onBegin}>
          Begin Task
        </button>
      </div>
    </PageTemplate>
  );
}
