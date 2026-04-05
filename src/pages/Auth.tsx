import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User, Eye, EyeOff, Check, X, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(255),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().max(50).optional(),
  email: z.string().trim().email("Please enter a valid email address").max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be less than 72 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const forgotSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(255),
});

type Mode = "login" | "signup" | "forgot";

const passwordChecks = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function Auth() {
  const location = useLocation();
  const { user, loading, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>(location.state?.mode || "login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const strength = useMemo(() => {
    const passed = passwordChecks.filter((c) => c.test(password)).length;
    return passed;
  }, [password]);

  const strengthLabel = strength <= 1 ? "Weak" : strength <= 3 ? "Fair" : strength === 4 ? "Good" : "Strong";
  const strengthColor =
    strength <= 1 ? "bg-destructive" : strength <= 3 ? "bg-warning" : "bg-success";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setErrors({});
    setShowPassword(false);
    setShowConfirm(false);
  };

  const switchMode = (m: Mode) => {
    resetForm();
    setMode(m);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      if (mode === "forgot") {
        forgotSchema.parse({ email });
        setSubmitting(true);
        const { error } = await (await import("@/integrations/supabase/client")).supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({ title: "Reset email sent", description: "Check your inbox for a password reset link." });
        switchMode("login");
      } else if (mode === "signup") {
        signupSchema.parse({ firstName, lastName, email, password, confirmPassword });
        setSubmitting(true);
        await signUp(email, password, firstName, lastName);
        toast({ title: "Account created!", description: "Check your email to verify your account." });
      } else {
        loginSchema.parse({ email, password });
        setSubmitting(true);
        await signIn(email, password);
      }
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          const key = e.path.join(".");
          if (!fieldErrors[key]) fieldErrors[key] = e.message;
        });
        setErrors(fieldErrors);
      } else {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left — branding panel */}
      <div className="hidden lg:flex lg:w-[45%] items-center justify-center bg-muted/40 border-r border-border/50 relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center gap-6 px-12 text-center">
          <img src="/logo-light.png" alt="Aivants" className="h-16 object-contain" />
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            AI-Powered Business Cockpit
          </h2>
          <p className="text-muted-foreground max-w-sm leading-relaxed">
            Manage leads, automate outreach, track revenue, and close deals — all from one calm, focused interface.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-foreground">10x</div>
              <div className="text-xs text-muted-foreground mt-1">Faster Outreach</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">AI</div>
              <div className="text-xs text-muted-foreground mt-1">Powered Insights</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">360°</div>
              <div className="text-xs text-muted-foreground mt-1">Client View</div>
            </div>
          </div>
          

        </div>
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-primary/5" />
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/5" />
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex flex-col items-center gap-3 lg:hidden">
            <img src="/logo-light.png" alt="Aivants" className="h-12 object-contain" />
          </div>

          <div className="space-y-2 text-center lg:text-left">
            {mode === "forgot" && (
              <button onClick={() => switchMode("login")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </button>
            )}
            <h1 className="text-2xl font-bold tracking-tight">
              {mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Welcome back"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "signup"
                ? "Get started with Aivants — it only takes a minute"
                : mode === "forgot"
                ? "Enter your email and we'll send you a reset link"
                : "Sign in to continue to your dashboard"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Name fields for signup */}
            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      className="pl-9"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      autoComplete="given-name"
                    />
                  </div>
                  {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  className="pl-9"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            {/* Password */}
            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="pl-9 pr-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}

                {/* Password strength meter — signup only */}
                {mode === "signup" && password.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
                          style={{ width: `${(strength / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium w-12">{strengthLabel}</span>
                    </div>
                    <ul className="grid grid-cols-1 gap-0.5">
                      {passwordChecks.map((c) => (
                        <li key={c.label} className="flex items-center gap-1.5 text-xs">
                          {c.test(password) ? (
                            <Check className="h-3 w-3 text-success shrink-0" />
                          ) : (
                            <X className="h-3 w-3 text-muted-foreground shrink-0" />
                          )}
                          <span className={c.test(password) ? "text-foreground" : "text-muted-foreground"}>
                            {c.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Confirm password — signup only */}
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    className="pl-9 pr-10"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
              </div>
            )}

            <Button type="submit" className="w-full h-11" disabled={submitting}>
              {submitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Please wait...</>
              ) : mode === "signup" ? (
                "Create Account"
              ) : mode === "forgot" ? (
                "Send Reset Link"
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {mode !== "forgot" && (
            <div className="text-center text-sm text-muted-foreground">
              {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => switchMode(mode === "signup" ? "login" : "signup")}
                className="text-primary hover:underline font-medium"
              >
                {mode === "signup" ? "Sign in" : "Sign up"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
