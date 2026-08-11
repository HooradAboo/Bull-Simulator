import { PageTemplate } from "./PageTemplate";

interface Props {
  onContinue: () => void;
}

export function WelcomeScreen({ onContinue }: Props) {
  return (
    <PageTemplate title="Welcome">
      <p className="body">
        Welcome, and thank you for taking part in this study. This study looks at how people 
        judge the trustworthiness of digital communication. You'll be working through a 
        simulated email inbox, similar to a normal email account, and deciding what you 
        trust and how you act on it.
      </p>
      <p className="body">
        Everything you do during this session will be recorded.
      </p>
      <p className="body">Let's start with a few quick questions about how 
        confident you currently feel handling situations like this.</p>
      <div className="page-actions">
        <button className="page-button" onClick={onContinue}>
          Continue
        </button>
      </div>
    </PageTemplate>
  );
}
