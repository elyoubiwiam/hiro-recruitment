import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Briefcase, CalendarCheck, FileSearch, LogOut, MessagesSquare, PhoneCall, ShieldCheck, Users } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";
import { bucketOf } from "@/lib/tracking";

const NAV = [
  { to: "/today", label: "Today", icon: CalendarCheck },
  { to: "/jobs", label: "Clients & Jobs", icon: Briefcase },
  { to: "/candidates", label: "Candidates", icon: Users },
  { to: "/screening", label: "Match Scorecard", icon: FileSearch },
  { to: "/outreach", label: "Outreach", icon: MessagesSquare },
  { to: "/calls", label: "Call Synthesizer", icon: PhoneCall },
] as const;

export const PUBLIC = ["/", "/auth", "/reset-password"];

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { tracks, email, isAdmin, loading } = useStore();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const due = tracks.filter((t) => ["overdue", "today"].includes(bucketOf(t))).length;
  const reminded = useRef(false);

  useEffect(() => {
    if (loading || reminded.current || !email) return;
    reminded.current = true;
    if (due > 0) toast(`${due} candidate${due > 1 ? "s" : ""} to contact today`, { description: "Open Today to see personalized drafts." });
  }, [loading, due, email]);

  if (PUBLIC.includes(path)) return <>{children}</>;

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-sidebar p-5 md:flex">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <div className="h-3.5 w-3.5 rounded-sm border-2 border-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">Talentdesk</span>
        </div>
        <nav className="flex flex-col gap-0.5">
          {NAV.map((n) => {
            const active = path.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-muted"}`}
              >
                <n.icon className="h-4 w-4" />
                <span className="flex-1">{n.label}</span>
                {n.to === "/today" && due > 0 && (
                  <span className="rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">{due}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-3 rounded-xl border bg-muted/50 p-3 text-xs">
          <div className="truncate font-medium text-foreground">{email}</div>
          {isAdmin && (
            <div className="flex items-center gap-1 text-accent-foreground"><ShieldCheck className="h-3.5 w-3.5" />Owner · sees all accounts</div>
          )}
          <button onClick={signOut} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
            <LogOut className="h-3.5 w-3.5" />Sign out
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <nav className="flex gap-1 overflow-x-auto border-b bg-card p-2 md:hidden">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground">
              {n.label}
            </Link>
          ))}
        </nav>
        <main className="mx-auto w-full max-w-6xl flex-1 p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
