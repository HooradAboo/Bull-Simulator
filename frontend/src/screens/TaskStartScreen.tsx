import { PageTemplate } from "./PageTemplate";

interface Props {
  onBegin: () => void;
}

export function TaskStartScreen({ onBegin }: Props) {
  return (
    <PageTemplate title="Ready to Begin">
      <p className="body">
        From this point forward, everything you do is part of the study, there's no more practice.
        Take your time. There's no timer pushing you.
      </p>
      <div className="page-actions">
        <button className="page-button" onClick={onBegin}>
          Begin Task
        </button>
      </div>
    </PageTemplate>
  );
}
