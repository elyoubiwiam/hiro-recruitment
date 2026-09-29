import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in | Talentdesk" },
      { name: "description", content: "Sign in or create your private Talentdesk recruiting workspace." },
      { property: "og:title", content: "Sign in | Talentdesk" },
      { property: "og:description", content: "Access your private recruiting workspace." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/today", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/today", replace: true });
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/today" } });
        if (error) throw error;
        if (data.session) navigate({ to: "/today", replace: true });
        else setSent("Check your inbox and click the confirmation link to activate your workspace.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
        if (error) throw error;
        setSent("If an account exists for that email, you will receive a password reset link.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to complete your request. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-xl shadow-foreground/5">
        <Link to="/" className="mb-6 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <div className="h-3.5 w-3.5 rounded-sm border-2 border-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">Talentdesk</span>
        </Link>
        <h1 className="text-xl">{mode === "signin" ? "Sign in to Talentdesk" : mode === "signup" ? "Create your workspace" : "Reset your password"}</h1>
        <p className="mb-6 mt-1 text-sm text-muted-foreground">Your data is private to your account.</p>
        {sent ? (
          <div className="rounded-lg bg-accent p-4 text-sm text-accent-foreground">{sent}</div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            {mode !== "forgot" && (
              <div className="space-y-1.5"><Label htmlFor="pw">Password</Label><Input id="pw" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            )}
            <Button type="submit" className="w-full" disabled={busy}>
              {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
            </Button>
          </form>
        )}
        <div className="mt-6 space-y-1 text-center text-sm text-muted-foreground">
          {mode === "signin" ? (
            <>
              <button className="block w-full hover:text-foreground" onClick={() => { setMode("signup"); setSent(null); }}>Need an account? <span className="font-semibold text-primary">Create one</span></button>
              <button className="block w-full hover:text-foreground" onClick={() => { setMode("forgot"); setSent(null); }}>Forgot password?</button>
            </>
          ) : (
            <button className="hover:text-foreground" onClick={() => { setMode("signin"); setSent(null); }}>Back to <span className="font-semibold text-primary">sign in</span></button>
          )}
        </div>
      </div>
    </div>
  );
}
