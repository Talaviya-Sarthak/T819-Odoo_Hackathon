import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, ShieldCheck, Loader2, RotateCw } from "lucide-react";
import AuthBackground from "./AuthBackground";
import { verifyEmail, resendOtp } from "../services/auth.api";
import { useAuth } from "../context/AuthContext";

export default function VerifyOTP() {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const email = (location.state as { email?: string })?.email || "";

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    // Handle paste of multiple characters
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length > 1) {
      const newDigits = [...digits];
      for (let i = 0; i < 6; i++) {
        if (index + i < 6 && cleaned[i]) {
          newDigits[index + i] = cleaned[i]!;
        }
      }
      setDigits(newDigits);
      const nextIndex = Math.min(index + cleaned.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const digit = cleaned.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const otp = digits.join("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      setError("Please enter all 6 digits of the code");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const data = await verifyEmail({ email, otp });
      if (data.accessToken && data.refreshToken) {
        authLogin(data.accessToken, data.refreshToken, data.user, data.portal, data.navigation, data.permissions);
      }
      const redirectPath = data.portal?.route || "/login";
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Email address not found. Please sign up again.");
      return;
    }
    setError("");
    setResending(true);
    try {
      await resendOtp({ email });
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthBackground
      onTabChange={(tab) => {
        if (tab === "login") navigate("/login");
        if (tab === "signup") navigate("/register");
        if (tab === "forgot-password") navigate("/forgot-password");
      }}
    >
      <Card className="card-animate w-full max-w-sm border-zinc-800 bg-zinc-900/70 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/60 shadow-2xl">
        <CardHeader className="space-y-2 text-center pb-2">
          <div className="mx-auto h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-100 border border-zinc-700">
            <ShieldCheck className="h-6 w-6 text-zinc-300" />
          </div>
          <CardTitle className="text-2xl font-semibold">Verify your email</CardTitle>
          <CardDescription className="text-xs text-zinc-400">
            We sent a 6-digit verification code to
            <br />
            <span className="font-medium text-zinc-200">{email || "your email address"}</span>
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-5 pt-2">
            {error && (
              <div className="rounded-lg border border-red-900/50 bg-red-950/40 p-2.5 text-xs text-red-400 text-center">
                {error}
              </div>
            )}

            {resent && (
              <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/40 p-2.5 text-xs text-emerald-400 text-center flex items-center justify-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>A new verification code has been sent!</span>
              </div>
            )}

            {/* 6-Digit OTP inputs */}
            <div className="flex items-center justify-center gap-2">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onFocus={(e) => e.target.select()}
                  className="h-12 w-11 rounded-lg border border-zinc-800 bg-zinc-950 text-center font-mono text-xl font-semibold text-zinc-50 shadow-sm focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-700/50 transition-all"
                />
              ))}
            </div>

            <Button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full h-10 rounded-lg bg-zinc-50 text-zinc-900 hover:bg-zinc-200 font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Verifying..." : "Verify Code"}
            </Button>

            <div className="text-center text-xs text-zinc-400">
              Didn't receive the code?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || resent}
                className="text-zinc-200 hover:underline font-medium inline-flex items-center gap-1 disabled:opacity-50"
              >
                {resending && <RotateCw className="h-3 w-3 animate-spin" />}
                Resend code
              </button>
            </div>
          </CardContent>
        </form>

        <CardFooter className="flex items-center justify-center text-xs text-zinc-400 pt-1 pb-4">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="inline-flex items-center text-zinc-300 hover:text-zinc-100 transition-colors font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Back to Sign in
          </button>
        </CardFooter>
      </Card>
    </AuthBackground>
  );
}
