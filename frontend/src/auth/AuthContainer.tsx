import React, { useState } from "react";
import AuthBackground from "./AuthBackground";
import LoginPage from "./LoginPage";
import SignUpPage from "./SignUpPage";
import ForgotPasswordPage from "./ForgotPasswordPage";

export type AuthMode = "login" | "signup" | "forgot-password";

interface AuthContainerProps {
  initialMode?: AuthMode;
}

export default function AuthContainer({ initialMode = "login" }: AuthContainerProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  return (
    <AuthBackground activeTab={mode} onTabChange={(newMode) => setMode(newMode)}>
      {mode === "login" && (
        <LoginPage
          onNavigateSignUp={() => setMode("signup")}
          onNavigateForgotPassword={() => setMode("forgot-password")}
        />
      )}
      {mode === "signup" && (
        <SignUpPage onNavigateSignIn={() => setMode("login")} />
      )}
      {mode === "forgot-password" && (
        <ForgotPasswordPage onNavigateSignIn={() => setMode("login")} />
      )}
    </AuthBackground>
  );
}
