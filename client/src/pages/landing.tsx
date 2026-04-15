import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, BookOpen, Brain, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type View = "login" | "signup" | "forgot" | "verify";

export default function LandingPage() {
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = view === "login" ? "/api/login" : "/api/signup";
      const body = view === "login"
        ? { email, password }
        : { email, password, firstName, lastName };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      if (response.ok) {
        window.location.href = "/";
      } else {
        const data = await response.json();
        toast({ title: "Error", description: data.message || "Authentication failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "OTP Sent", description: "Check your email for the 6-digit code." });
        setView("verify");
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Password Reset!", description: "You can now sign in." });
        setView("login");
        setOtp(""); setNewPassword(""); setEmail("");
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const headings: Record<View, { title: string; sub: string }> = {
    login:  { title: "Welcome Back",    sub: "Sign in to continue your learning journey" },
    signup: { title: "Get Started",     sub: "Create an account to start learning" },
    forgot: { title: "Forgot Password", sub: "Enter your email to receive a 6-digit OTP" },
    verify: { title: "Verify OTP",      sub: `Enter the code sent to ${email}` },
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-20 py-12 lg:py-0 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-100 rounded-full blur-[100px] opacity-50 z-0 pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-100 rounded-full blur-[100px] opacity-50 z-0 pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-8">
            <div className="p-2 bg-primary/10 rounded-lg">
              <GraduationCap className="w-8 h-8 text-primary" />
            </div>
            <span className="text-xl font-bold font-serif tracking-tight">EduBot</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6 text-foreground">
            Your Personal AI <br/>
            <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              Learning Companion
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed max-w-lg">
            Master new subjects with an intelligent tutor that adapts to your learning style. Instant answers, deep explanations, and structured guidance.
          </p>

          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            <div className="flex flex-col gap-3 p-4 rounded-xl bg-white/50 border border-white/20 shadow-sm backdrop-blur-sm">
              <BookOpen className="w-6 h-6 text-emerald-500" />
              <h3 className="font-semibold">Interactive Lessons</h3>
              <p className="text-sm text-muted-foreground">Engage with topics deeply, not just passively reading.</p>
            </div>
            <div className="flex flex-col gap-3 p-4 rounded-xl bg-white/50 border border-white/20 shadow-sm backdrop-blur-sm">
              <Brain className="w-6 h-6 text-blue-500" />
              <h3 className="font-semibold">Smart Explanations</h3>
              <p className="text-sm text-muted-foreground">Complex concepts broken down into simple terms.</p>
            </div>
            <div className="flex flex-col gap-3 p-4 rounded-xl bg-white/50 border border-white/20 shadow-sm backdrop-blur-sm">
              <Sparkles className="w-6 h-6 text-purple-500" />
              <h3 className="font-semibold">24/7 Availability</h3>
              <p className="text-sm text-muted-foreground">Learn whenever inspiration strikes, day or night.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:w-[45%] bg-slate-50 border-l border-border/50 flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-12">
        <div className="max-w-md w-full mx-auto space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold mb-2">{headings[view].title}</h2>
            <p className="text-muted-foreground">{headings[view].sub}</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg border border-border/50">

            {/* Login / Signup */}
            {(view === "login" || view === "signup") && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {view === "signup" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                  {loading ? "Loading..." : view === "login" ? "Sign In" : "Sign Up"}
                </Button>
                {view === "login" && (
                  <p className="text-sm text-center">
                    <button type="button" onClick={() => setView("forgot")} className="text-muted-foreground hover:text-primary hover:underline">
                      Forgot password?
                    </button>
                  </p>
                )}
                <p className="text-sm text-center text-muted-foreground">
                  {view === "login" ? "Don't have an account? " : "Already have an account? "}
                  <button type="button" onClick={() => setView(view === "login" ? "signup" : "login")} className="text-primary hover:underline font-medium">
                    {view === "login" ? "Sign up" : "Sign in"}
                  </button>
                </p>
              </form>
            )}

            {/* Forgot Password — send OTP */}
            {view === "forgot" && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold">
                  {loading ? "Sending..." : "Send OTP"}
                </Button>
                <p className="text-sm text-center">
                  <button type="button" onClick={() => setView("login")} className="text-primary hover:underline font-medium">
                    Back to Sign In
                  </button>
                </p>
              </form>
            )}

            {/* Verify OTP + new password */}
            {view === "verify" && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">6-Digit OTP</Label>
                  <Input id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} placeholder="123456" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold">
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
                <p className="text-sm text-center">
                  <button type="button" onClick={() => setView("forgot")} className="text-primary hover:underline font-medium">
                    Resend OTP
                  </button>
                </p>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
