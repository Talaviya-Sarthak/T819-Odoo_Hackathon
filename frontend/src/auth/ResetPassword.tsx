import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock, Eye, EyeOff, ArrowLeft, KeyRound, Loader2 } from "lucide-react";
import AuthBackground from "./AuthBackground";
import { resetPassword } from "../services/auth.api";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await resetPassword({ token, password });
      navigate("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password reset failed");
    } finally {
      setLoading(false);
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
            <KeyRound className="h-6 w-6 text-zinc-300" />
          </div>
          <CardTitle className="text-2xl font-semibold">Reset password</CardTitle>
          <CardDescription className="text-xs text-zinc-400">
            Enter your new password below
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4 pt-2">
            {error && (
              <div className="rounded-lg border border-red-900/50 bg-red-950/40 p-2.5 text-xs text-red-400 text-center">
                {error}
              </div>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="new-password" className="text-xs text-zinc-300">
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="h-9 pl-9 pr-9 text-xs bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-600 focus-visible:ring-zinc-700"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded text-zinc-400 hover:text-zinc-200"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="confirm-new-password" className="text-xs text-zinc-300">
                Confirm New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  id="confirm-new-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="h-9 pl-9 text-xs bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-600 focus-visible:ring-zinc-700"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-zinc-50 text-zinc-900 hover:bg-zinc-200 font-medium transition-colors flex items-center justify-center gap-2 mt-1"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Updating..." : "Reset password"}
            </Button>
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
