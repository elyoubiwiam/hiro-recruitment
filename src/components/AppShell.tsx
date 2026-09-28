import { Link, useRouterState } from "@tanstack/react-router";
import { Briefcase, FileSearch, MessagesSquare, PhoneCall, Users } from "lucide-react";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Clients & Jobs", icon: Briefcase },
  { to: "/candidates", label: "Candidates", icon: Users },
  { to: "/screening", label: "Match Scorecard", icon: FileSearch },
  { to: "/outreach", label: "Outreach", icon: MessagesSquare },
  { to: "/calls", label: "Call Synthesizer", icon: PhoneCall },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-sidebar p-4 text-sidebar-foreground md:flex">
        <div className="mb-8 px-2 pt-2">
          <div className="font-display text-2xl">
            Talent<span className="text-sidebar-primary">desk</span>
          </div>
          <div className="text-xs opacity-60">AI recruiting workspace</div>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => {
            const active = n.to === "/" ? path === "/" || path.startsWith("/jobs") : path.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "opacity-75 hover:bg-sidebar-accent/60 hover:opacity-100"}`}
              >
                <n.icon className={`h-4 w-4 ${active ? "text-sidebar-primary" : ""}`} />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-md border border-sidebar-border p-3 text-xs opacity-70">
          Signed in as <b>Alex</b> · Meridian Talent Partners
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <nav className="flex gap-1 overflow-x-auto border-b bg-sidebar p-2 md:hidden">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="whitespace-nowrap rounded px-3 py-1.5 text-xs text-sidebar-foreground">
              {n.label}
            </Link>
          ))}
        </nav>
        <main className="mx-auto w-full max-w-7xl flex-1 p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
