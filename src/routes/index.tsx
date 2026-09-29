import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, BriefcaseBusiness, CalendarClock, FileSearch, MessagesSquare, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Talentdesk | Recruitment workspace" },
      { name: "description", content: "Track every candidate touchpoint, get personalized drafts for each step, and match CVs to jobs with explainable AI." },
      { property: "og:title", content: "Talentdesk | Recruitment workspace" },
      { property: "og:description", content: "Outreach tracking, personalized drafts, CV matching and client submissions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const kpis = [
  { icon: BriefcaseBusiness, label: "Open roles", value: "4", context: "Across 3 clients" },
  { icon: CalendarClock, label: "Outreach due", value: "2", context: "1 overdue · 1 due today", emphasis: true },
  { icon: MessagesSquare, label: "Response rate", value: "50%", context: "2 replies of 4 contacted" },
  { icon: FileSearch, label: "Roles screened", value: "3/4", context: "Open roles with a scorecard" },
];

const nextActions = [
  { urgency: "High priority", title: "Contact 1 overdue candidate", detail: "Review the next message before sending to avoid further delay.", label: "Review outreach" },
  { urgency: "Coverage gap", title: "Screen candidates for 1 open role", detail: "This role has no saved match scorecard yet.", label: "Start screening" },
];

const pipeline = [
  { stage: "Sourced", count: 1 },
  { stage: "Screening", count: 1 },
  { stage: "Client review", count: 1 },
  { stage: "Interviewing", count: 1 },
];

function DashboardPreview() {
  return (
    <div aria-hidden="true" className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Dashboard</span>
        <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">Live example</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border bg-background/60 p-3.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <kpi.icon className={`h-3.5 w-3.5 ${kpi.emphasis ? "text-primary" : ""}`} />
              {kpi.label}
            </div>
            <div className={`mt-1.5 font-mono text-2xl font-semibold ${kpi.emphasis ? "text-primary" : ""}`}>{kpi.value}</div>
            <div className="mt-0.5 truncate text-xs text-muted-foreground">{kpi.context}</div>
          </div>
        ))}
      </div>
      <div className="mt-5">
        <div className="text-sm font-semibold">Recommended next actions</div>
        <div className="mt-2.5 space-y-2">
          {nextActions.map((action) => (
            <div key={action.title} className="flex items-start gap-3 rounded-xl border bg-background/60 p-3">
              <div className="min-w-0">
                <span className="text-xs font-semibold uppercase text-primary">{action.urgency}</span>
                <div className="text-sm font-medium leading-snug">{action.title}</div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground">{action.detail}</div>
              </div>
              <span className="ml-auto flex shrink-0 items-center gap-1 self-center rounded-lg border px-2.5 py-1.5 text-xs font-medium">
                {action.label}
                <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5">
        <div className="text-sm font-semibold">Role pipeline</div>
        <div className="mt-2.5 space-y-2.5">
          {pipeline.map((row) => (
            <div key={row.stage} className="grid grid-cols-[92px_minmax(0,1fr)_20px] items-center gap-2.5 text-xs">
              <span className="text-muted-foreground">{row.stage}</span>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${row.count * 25}%` }} /></div>
              <span className="text-right font-mono font-semibold">{row.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/today", replace: true });
    });
  }, [navigate]);

  const features = [
    { icon: CalendarClock, title: "Manage follow-ups on schedule", text: "Every candidate has a step, a due date and a draft ready for that step." },
    { icon: FileSearch, title: "Explainable matching", text: "Scorecards with evidence, gaps and interview questions." },
    { icon: MessagesSquare, title: "Personalized outreach", text: "Messages written from the candidate's actual background." },
    { icon: PhoneCall, title: "Client submission notes", text: "Prepare client submission notes from phone screens." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between p-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <div className="h-3.5 w-3.5 rounded-sm border-2 border-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">Talentdesk</span>
        </div>
        <Button asChild variant="outline"><Link to="/today">Open workspace</Link></Button>
      </header>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:pt-14">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />AI drafting for recruiters
          </span>
          <h1 className="mt-5 max-w-xl text-4xl leading-tight sm:text-5xl">Track, manage and optimise your recruiter process.</h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            The dashboard puts your priorities first: who needs a response today, which roles are missing coverage and what to do next.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg"><Link to="/today">Open the workspace <ArrowRight className="h-4 w-4" /></Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/dashboard">View the dashboard</Link></Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Loaded with example data so you can try everything right away.</p>
        </div>
        <DashboardPreview />
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-6">
              <f.icon className="h-5 w-5 text-primary" />
              <div className="mt-3 font-semibold">{f.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{f.text}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
