import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — Talentdesk" },
      { name: "description", content: "Choose a new password for your Talentdesk account." },
      { property: "og:title", content: "Set a new password — Talentdesk" },
      { property: "og:description", content: "Choose a new password for your account." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <form
        className="w-full max-w-sm space-y-4 rounded-2xl border bg-card p-8 shadow-xl shadow-foreground/5"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const { error } = await supabase.auth.updateUser({ password });
          setBusy(false);
          if (error) return toast.error(error.message);
          toast.success("Password updated");
          navigate({ to: "/today", replace: true });
        }}
      >
        <h1 className="text-xl">Set a new password</h1>
        <div className="space-y-1.5"><Label htmlFor="pw">New password</Label><Input id="pw" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <Button type="submit" className="w-full" disabled={busy}>Update password</Button>
      </form>
    </div>
  );
}
