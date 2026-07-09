import { useState } from "react";
import { LoginScreen } from "./LoginScreen";
import { ChangePasswordPrompt } from "./ChangePasswordPrompt";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { updateCredentialPassword } from "../../api";

type Step = "login" | "ask-change-password" | "change-password";

interface Props {
  credentialId: number;
  expectedEmail: string;
  expectedPassword: string;
  onComplete: () => void;
}

export function LoginFlow({ credentialId, expectedEmail, expectedPassword, onComplete }: Props) {
  const [step, setStep] = useState<Step>("login");

  return (
    <>
      <LoginScreen
        expectedEmail={expectedEmail}
        expectedPassword={expectedPassword}
        onSuccess={() => setStep("ask-change-password")}
      />

      {step === "ask-change-password" && (
        <ChangePasswordPrompt onYes={() => setStep("change-password")} onNo={onComplete} />
      )}

      {step === "change-password" && (
        <ChangePasswordForm
          onCancel={onComplete}
          onSubmit={async (newPassword) => {
            await updateCredentialPassword(credentialId, newPassword);
            onComplete();
          }}
        />
      )}
    </>
  );
}
