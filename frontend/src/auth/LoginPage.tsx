import React, { useState, useEffect } from "react";
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
  Users,
} from "lucide-react";
import AuthBackground from "./AuthBackground";
import { login } from "../services/auth.api";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const DEMO_ACCOUNTS = [
  { email: "rep@dealflow360.com", role: "SALES_REP", label: "Sales Rep", color: "border-blue-800/60 bg-blue-950/30 text-blue-400 hover:bg-blue-900/40" },
  { email: "manager@dealflow360.com", role: "SALES_MANAGER", label: "Sales Manager", color: "border-purple-800/60 bg-purple-950/30 text-purple-400 hover:bg-purple-900/40" },
  { email: "finance@dealflow360.com", role: "FINANCE", label: "Finance", color: "border-amber-800/60 bg-amber-950/30 text-amber-400 hover:bg-amber-900/40" },
  { email: "admin@dealflow360.com", role: "ADMIN", label: "Admin", color: "border-rose-800/60 bg-rose-950/30 text-rose-400 hover:bg-rose-900/40" },
  { email: "ops@dealflow360.com", role: "OPERATIONS", label: "Operations", color: "border-emerald-800/60 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-900/40" },
  { email: "apex.buyer@dealflow360.com", role: "CUSTOMER", label: "Customer (Apex)", color: "border-orange-800/60 bg-orange-950/30 text-orange-400 hover:bg-orange-900/40" },
];

function getRoleRedirect(role?: string, defaultRoute?: string): string {
  if (defaultRoute && defaultRoute !== '/login') return defaultRoute;
  switch (role) {
    case 'CUSTOMER': return '/customer/dashboard';
    case 'SALES_REP': return '/sales/dashboard';
    case 'SALES_MANAGER': return '/management/dashboard';
    case 'FINANCE': return '/management/approvals';
    case 'ADMIN': return '/management/dashboard';
    case 'OPERATIONS': return '/operations/dashboard';
    default: return '/sales/dashboard';
  }
}

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
  const [showDemo, setShowDemo] = useState(false);

  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  useEffect(() => {
    // Clear any credentials auto-injected by browser password managers on page load
    setEmail("");
    setPassword("");
    const timer = setTimeout(() => {
      setEmail("");
      setPassword("");
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login({ email, password });
      authLogin(data.accessToken, data.refreshToken, data.user, data.portal, data.navigation, data.permissions);
      const redirectPath = getRoleRedirect(data.user?.role, data.portal?.route);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setError("");
    setLoading(true);
    setEmail(demoEmail);
    setPassword("demo1234");

    try {
      const data = await login({ email: demoEmail, password: "demo1234" });
      authLogin(data.accessToken, data.refreshToken, data.user, data.portal, data.navigation, data.permissions);
      const redirectPath = getRoleRedirect(data.user?.role, data.portal?.route);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo login failed");
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

      <form onSubmit={handleSubmit} autoComplete="off">
        {/* Hidden decoy fields to absorb aggressive browser autofill bots */}
        <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, width: 0, overflow: 'hidden' }} tabIndex={-1} aria-hidden="true">
          <input type="text" name="fake_username_autofill" tabIndex={-1} autoComplete="off" />
          <input type="password" name="fake_password_autofill" tabIndex={-1} autoComplete="off" />
        </div>

        <CardContent className="grid gap-4">
          {error && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/40 p-2.5 text-xs text-red-400 text-center">
              {error}
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="email" className="text-xs text-zinc-300">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                id="email"
                name="user_login_email"
                type="email"
                required
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="pl-10 bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-600 focus-visible:ring-zinc-700"
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="password" className="text-xs text-zinc-300">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                id="password"
                name="user_login_password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
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

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                className="border-zinc-700 data-[state=checked]:bg-zinc-50 data-[state=checked]:text-zinc-900"
              />
              <Label htmlFor="remember" className="text-zinc-400 text-xs cursor-pointer">
                Remember me
              </Label>
            </div>
            <button
              type="button"
              onClick={handleForgotPasswordClick}
              className="text-xs text-zinc-300 hover:text-zinc-100 transition-colors underline-offset-4 hover:underline"
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
            <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-zinc-900/90 px-2 text-[10px] uppercase tracking-widest text-zinc-500">
              or
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuth("github")}
              className="h-9 rounded-lg border-zinc-800 bg-zinc-950 text-zinc-50 text-xs hover:bg-zinc-900/80 transition-colors"
            >
              <Github className="h-3.5 w-3.5 mr-1.5" />
              GitHub
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuth("google")}
              className="h-9 rounded-lg border-zinc-800 bg-zinc-950 text-zinc-50 text-xs hover:bg-zinc-900/80 transition-colors"
            >
              <Chrome className="h-3.5 w-3.5 mr-1.5" />
              Google
            </Button>
          </div>

          {/* Demo Accounts Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowDemo(!showDemo)}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors py-1"
            >
              <Users className="h-3.5 w-3.5" />
              <span>{showDemo ? "Hide Demo Accounts" : "Quick Demo Logins"}</span>
            </button>

            {showDemo && (
              <div className="mt-2 space-y-1.5 border border-zinc-800/80 bg-zinc-950/60 p-2 rounded-lg">
                {DEMO_ACCOUNTS.map((demo) => (
                  <button
                    key={demo.email}
                    type="button"
                    onClick={() => handleDemoLogin(demo.email)}
                    disabled={loading}
                    className={`w-full flex items-center justify-between rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors ${demo.color}`}
                  >
                    <span className="font-medium">{demo.label}</span>
                    <span className="text-[10px] opacity-70 font-mono">{demo.email.split("@")[0]}</span>
                  </button>
                ))}
                <p className="text-[10px] text-center text-zinc-500 pt-0.5">Password: demo1234</p>
              </div>
            )}
          </div>
        </CardContent>
      </form>

      <CardFooter className="flex items-center justify-center text-xs text-zinc-400 pt-1 pb-4">
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
