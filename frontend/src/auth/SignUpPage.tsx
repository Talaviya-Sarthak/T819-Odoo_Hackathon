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
  User,
  Chrome,
  Loader2,
  Shield,
  ChevronDown,
} from "lucide-react";
import AuthBackground from "./AuthBackground";
import { register, getPublicRoles } from "../services/auth.api";
import type { RoleOption } from "../types";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" && window.location.hostname
    ? `${window.location.protocol}//${window.location.hostname}:5000`
    : "http://localhost:5000");

const DEFAULT_ROLES: RoleOption[] = [
  { id: "CUSTOMER", name: "CUSTOMER", displayName: "Customer", display_name: "Customer", description: "Request quotes and track orders" },
  { id: "SALES_REP", name: "SALES_REP", displayName: "Sales Representative", display_name: "Sales Representative", description: "Create quotes and manage customer deals" },
  { id: "OPS_FINANCE", name: "OPS_FINANCE", displayName: "Operations & Finance", display_name: "Operations & Finance", description: "Manage orders, invoices, and fulfillment" },
  { id: "MANAGER_ADMIN", name: "MANAGER_ADMIN", displayName: "Manager / Admin", display_name: "Manager / Admin", description: "Approvals, pricing rules, and analytics" },
];

interface SignUpPageProps {
  onNavigateSignIn?: () => void;
  standalone?: boolean;
}

export default function SignUpPage({
  onNavigateSignIn,
  standalone = true,
}: SignUpPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [roleId, setRoleId] = useState<string>("CUSTOMER");
  const [roles, setRoles] = useState<RoleOption[]>(DEFAULT_ROLES);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    getPublicRoles()
      .then((data) => {
        if (mounted && data.roles && data.roles.length > 0) {
          setRoles(data.roles);
          // Default to first role or customer
          const customerRole = data.roles.find((r) => r.name === "CUSTOMER");
          const first = customerRole || data.roles[0];
          if (first) {
            setRoleId(first.id || first.name);
          }
        }
      })
      .catch(() => {
        // Fallback to default roles
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    if (!agreeTerms) {
      setError("Please agree to the Terms of Service.");
      return;
    }

    setLoading(true);
    try {
      await register({ name, email, password, roleId });
      navigate("/verify-email", { state: { email } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider: string) => {
    window.location.href = `${API_URL}/api/auth/${provider}`;
  };

  const handleSignInClick = () => {
    if (onNavigateSignIn) {
      onNavigateSignIn();
    } else {
      navigate("/login");
    }
  };

  const cardContent = (
    <Card className="card-animate w-full max-w-sm border-zinc-800 bg-zinc-900/70 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/60 shadow-2xl">
      <CardHeader className="px-5 py-3 space-y-0.5">
        <CardTitle className="text-xl font-semibold">Create account</CardTitle>
        <CardDescription className="text-xs text-zinc-400">
          Get started with your free account
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="px-5 py-0 grid gap-2.5">
          {error && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/40 p-2 text-xs text-red-400 text-center">
              {error}
            </div>
          )}

          <div className="grid gap-1">
            <Label htmlFor="fullname" className="text-xs text-zinc-300">
              Full Name
            </Label>
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <Input
                id="fullname"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                className="h-8.5 pl-8 text-xs bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-600 focus-visible:ring-zinc-700"
              />
            </div>
          </div>

          <div className="grid gap-1">
            <Label htmlFor="signup-email" className="text-xs text-zinc-300">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <Input
                id="signup-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-8.5 pl-8 text-xs bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-600 focus-visible:ring-zinc-700"
              />
            </div>
          </div>

          {/* Role Selection Field */}
          <div className="grid gap-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="role-select" className="text-xs text-zinc-300">
                Account Role
              </Label>
              <span className="text-[10px] text-zinc-500 font-mono">Select portal access</span>
            </div>
            <div className="relative">
              <Shield className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <select
                id="role-select"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="h-8.5 w-full rounded-lg pl-8 pr-8 text-xs bg-zinc-950 border border-zinc-800 text-zinc-50 focus:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-700 appearance-none cursor-pointer"
              >
                {roles.map((r) => (
                  <option key={r.id || r.name} value={r.id || r.name} className="bg-zinc-950 text-zinc-50">
                    {r.displayName || r.display_name} {r.description ? `— ${r.description}` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <Label htmlFor="signup-password" className="text-xs text-zinc-300">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                <Input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-8.5 pl-8 pr-7 text-xs bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-600 focus-visible:ring-zinc-700"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded text-zinc-400 hover:text-zinc-200"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid gap-1">
              <Label htmlFor="confirm-password" className="text-xs text-zinc-300">
                Confirm
              </Label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-8.5 pl-8 pr-7 text-xs bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-600 focus-visible:ring-zinc-700"
                />
                <button
                  type="button"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded text-zinc-400 hover:text-zinc-200"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 py-0.5">
            <Checkbox
              id="terms"
              checked={agreeTerms}
              onCheckedChange={(checked) => setAgreeTerms(!!checked)}
              className="h-3.5 w-3.5 border-zinc-700 data-[state=checked]:bg-zinc-50 data-[state=checked]:text-zinc-900"
            />
            <Label htmlFor="terms" className="text-zinc-400 text-[11px] leading-none cursor-pointer">
              I agree to the{" "}
              <a href="#" className="text-zinc-200 hover:underline">
                Terms
              </a>{" "}
              and{" "}
              <a href="#" className="text-zinc-200 hover:underline">
                Privacy
              </a>
            </Label>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-8.5 rounded-lg bg-zinc-50 text-zinc-900 hover:bg-zinc-200 text-xs font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {loading ? "Creating account..." : "Create account"}
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
              className="h-8.5 rounded-lg border-zinc-800 bg-zinc-950 text-zinc-50 text-xs hover:bg-zinc-900/80 transition-colors"
            >
              <Github className="h-3.5 w-3.5 mr-1.5" />
              GitHub
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuth("google")}
              className="h-8.5 rounded-lg border-zinc-800 bg-zinc-950 text-zinc-50 text-xs hover:bg-zinc-900/80 transition-colors"
            >
              <Chrome className="h-3.5 w-3.5 mr-1.5" />
              Google
            </Button>
          </div>
        </CardContent>
      </form>

      <CardFooter className="px-5 py-3 flex items-center justify-center text-xs text-zinc-400">
        Already have an account?
        <button
          type="button"
          onClick={handleSignInClick}
          className="ml-1 text-zinc-200 hover:underline font-medium"
        >
          Sign in
        </button>
      </CardFooter>
    </Card>
  );

  if (standalone) {
    return (
      <AuthBackground
        activeTab="signup"
        onTabChange={(tab) => {
          if (tab === "login") navigate("/login");
          if (tab === "forgot-password") navigate("/forgot-password");
        }}
      >
        {cardContent}
      </AuthBackground>
    );
  }

  return cardContent;
}
