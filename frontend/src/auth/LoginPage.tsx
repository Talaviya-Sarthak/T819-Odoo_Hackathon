import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  EyeOff,
  Github,
  Lock,
  Mail,
  Chrome,
  Loader2,
} from "lucide-react";
import AuthBackground from "./AuthBackground";
import { login } from "../services/auth.api";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface LoginPageProps {
  onNavigateSignUp?: () => void;
  onNavigateForgotPassword?: () => void;
  standalone?: boolean;
}

export default function LoginPage({
  onNavigateSignUp,
  onNavigateForgotPassword,
  standalone = true,
}: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login({ email, password });
      authLogin(data.accessToken, data.refreshToken, data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider: string) => {
    window.location.href = `${API_URL}/api/auth/${provider}`;
  };

  const handleSignUpClick = () => {
    if (onNavigateSignUp) {
      onNavigateSignUp();
    } else {
      navigate("/register");
    }
  };

  const handleForgotPasswordClick = () => {
    if (onNavigateForgotPassword) {
      onNavigateForgotPassword();
    } else {
      navigate("/forgot-password");
    }
  };

  const cardContent = (
    <Card className="card-animate w-full max-w-sm border-zinc-800 bg-zinc-900/70 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/60 shadow-2xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold">Welcome back</CardTitle>
        <CardDescription className="text-zinc-400">
          Sign in to your account
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-5">
          {error && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/40 p-2.5 text-xs text-red-400 text-center">
              {error}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="email" className="text-zinc-300">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="pl-10 bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-600 focus-visible:ring-zinc-700"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password" className="text-zinc-300">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 pr-10 bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-600 focus-visible:ring-zinc-700"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-zinc-400 hover:text-zinc-200 transition-colors"
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

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                className="border-zinc-700 data-[state=checked]:bg-zinc-50 data-[state=checked]:text-zinc-900"
              />
              <Label htmlFor="remember" className="text-zinc-400 text-sm cursor-pointer">
                Remember me
              </Label>
            </div>
            <button
              type="button"
              onClick={handleForgotPasswordClick}
              className="text-sm text-zinc-300 hover:text-zinc-100 transition-colors underline-offset-4 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-lg bg-zinc-50 text-zinc-900 hover:bg-zinc-200 font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Signing in..." : "Continue"}
          </Button>

          <div className="relative">
            <Separator className="bg-zinc-800" />
            <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-zinc-900/90 px-2 text-[11px] uppercase tracking-widest text-zinc-500">
              or
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuth("github")}
              className="h-10 rounded-lg border-zinc-800 bg-zinc-950 text-zinc-50 hover:bg-zinc-900/80 transition-colors"
            >
              <Github className="h-4 w-4 mr-2" />
              GitHub
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuth("google")}
              className="h-10 rounded-lg border-zinc-800 bg-zinc-950 text-zinc-50 hover:bg-zinc-900/80 transition-colors"
            >
              <Chrome className="h-4 w-4 mr-2" />
              Google
            </Button>
          </div>
        </CardContent>
      </form>

      <CardFooter className="flex items-center justify-center text-sm text-zinc-400">
        Don't have an account?
        <button
          type="button"
          onClick={handleSignUpClick}
          className="ml-1.5 text-zinc-200 hover:underline font-medium"
        >
          Create one
        </button>
      </CardFooter>
    </Card>
  );

  if (standalone) {
    return (
      <AuthBackground
        activeTab="login"
        onTabChange={(tab) => {
          if (tab === "signup") navigate("/register");
          if (tab === "forgot-password") navigate("/forgot-password");
        }}
      >
        {cardContent}
      </AuthBackground>
    );
  }

  return cardContent;
}
