import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, BriefcaseBusiness, CalendarClock, CheckCheck, FileSearch, MessageSquareReply, PhoneCall, Users } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useStore } from "@/lib/store";
import { bucketOf, STATUS_LABEL, STEPS } from "@/lib/tracking";
import { STAGES, type Track } from "@/lib/types";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Recruitment Dashboard | Talentdesk" },
      { name: "description", content: "Monitor recruitment workload, outreach results, screening progress and next actions." },
      { property: "og:title", content: "Recruitment Dashboard | Talentdesk" },
      { property: "og:description", content: "Monitor recruitment workload, outreach results, screening progress and next actions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { clients, jobs, candidates, matches, tracks, transcripts, loading } = useStore();
  const openJobs = jobs.filter((job) => job.stage !== "filled");
  const activeTracks = tracks.filter((track) => track.status === "active");
  const overdue = activeTracks.filter((track) => bucketOf(track) === "overdue").length;
  const dueToday = activeTracks.filter((track) => bucketOf(track) === "today").length;
  const answered = tracks.filter((track) => track.status === "replied" || track.status === "call_booked").length;
  const contacted = tracks.filter((track) => track.history.length > 0);
  const responseRate = contacted.length ? Math.round((answered / contacted.length) * 100) : null;
  const jobsWithoutMatches = openJobs.filter((job) => !matches.some((match) => match.jobId === job.id));
  const jobsWithoutOutreach = openJobs.filter((job) => !activeTracks.some((track) => track.jobId === job.id));
  const callsToSynthesize = transcripts.filter((transcript) => !transcript.result).length;
  const submissionsReady = transcripts.filter((transcript) => !!transcript.result).length;
  const stageCounts = STAGES.map((stage) => ({ ...stage, count: jobs.filter((job) => job.stage === stage.id).length }));
  const maxStage = Math.max(1, ...stageCounts.map((stage) => stage.count));

  const recommendations = [
    ...(overdue ? [{ key: "overdue", title: `Contact ${overdue} overdue candidate${overdue === 1 ? "" : "s"}`, detail: "Review the next message before sending to avoid further delay.", to: "/today" as const, label: "Review outreach", urgency: "High priority" }] : []),
    ...(dueToday ? [{ key: "today", title: `Contact ${dueToday} candidate${dueToday === 1 ? "" : "s"} due today`, detail: "Send the scheduled message and record the outcome.", to: "/today" as const, label: "Open tracker", urgency: "Due today" }] : []),
    ...(jobsWithoutMatches.length ? [{ key: "screening", title: `Screen candidates for ${jobsWithoutMatches.length} open role${jobsWithoutMatches.length === 1 ? "" : "s"}`, detail: "These roles have no saved match scorecards yet. Start with a relevant candidate.", to: "/screening" as const, label: "Start screening", urgency: "Coverage gap" }] : []),
    ...(jobsWithoutOutreach.length ? [{ key: "sourcing", title: `Start outreach for ${jobsWithoutOutreach.length} open role${jobsWithoutOutreach.length === 1 ? "" : "s"}`, detail: "No active candidate sequences are linked to these roles.", to: "/outreach" as const, label: "Prepare outreach", urgency: "Sourcing gap" }] : []),
    ...(callsToSynthesize ? [{ key: "calls", title: `Prepare ${callsToSynthesize} client submission${callsToSynthesize === 1 ? "" : "s"}`, detail: "Call notes are available but have not been turned into submission notes.", to: "/calls" as const, label: "Review calls", urgency: "Ready for review" }] : []),
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" subtitle="Recruitment activity and next priorities across your workspace." />
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      ) : (
        <>
          <section aria-label="Key performance indicators" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric icon={BriefcaseBusiness} label="Open roles" value={openJobs.length} context={`Across ${clients.length} clients`} to="/jobs" />
            <Metric icon={CalendarClock} label="Outreach due" value={overdue + dueToday} context={`${overdue} overdue · ${dueToday} due today`} to="/today" emphasis={overdue > 0} />
            <Metric icon={MessageSquareReply} label="Response rate" value={responseRate === null ? "Not available" : `${responseRate}%`} context={`${answered} replies or calls booked / ${contacted.length} contacted sequences`} to="/today" />
            <Metric icon={FileSearch} label="Roles screened" value={`${openJobs.length - jobsWithoutMatches.length}/${openJobs.length}`} context="Open roles with a saved scorecard" to="/screening" />
          </section>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]">
            <section aria-labelledby="priorities-title" className="min-w-0">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 id="priorities-title" className="text-xl font-semibold">Recommended next actions</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Based on your current records, not a projected target.</p>
                </div>
                <span className="shrink-0 text-xs font-medium text-muted-foreground">{recommendations.length} actions</span>
              </div>
              {recommendations.length ? (
                <ol className="divide-y border-y">
                  {recommendations.map((item, index) => (
                    <li key={item.key} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 gap-4">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent font-mono text-xs font-semibold text-accent-foreground">{String(index + 1).padStart(2, "0")}</span>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold uppercase text-primary">{item.urgency}</span>
                          <h3 className="mt-1 font-semibold leading-snug">{item.title}</h3>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
                        </div>
                      </div>
                      <Button asChild size="sm" variant="outline" className="shrink-0 self-start sm:mt-5">
                        <Link to={item.to}>{item.label}<ArrowRight className="h-4 w-4" /></Link>
                      </Button>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="flex items-start gap-3 border-y py-6 text-sm text-muted-foreground">
                  <CheckCheck className="h-5 w-5 shrink-0 text-success" />No outstanding actions based on the current records.
                </div>
              )}
            </section>

            <div className="min-w-0 space-y-8">
              <section aria-labelledby="pipeline-title">
                <div className="mb-4 flex items-center justify-between">
                  <h2 id="pipeline-title" className="text-xl font-semibold">Role pipeline</h2>
                  <Link to="/jobs" className="text-sm font-medium text-primary hover:underline">View roles</Link>
                </div>
                <div className="space-y-4 border-y py-5">
                  {stageCounts.map((stage) => (
                    <div key={stage.id} className="grid grid-cols-[96px_minmax(0,1fr)_24px] items-center gap-3 text-sm">
                      <span className="text-muted-foreground">{stage.label}</span>
                      <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${stage.count / maxStage * 100}%` }} /></div>
                      <span className="text-right font-mono font-semibold">{stage.count}</span>
                    </div>
                  ))}
                </div>
              </section>
              <section aria-labelledby="activity-title">
                <h2 id="activity-title" className="mb-4 text-xl font-semibold">Workspace activity</h2>
                <dl className="divide-y border-y">
                  <Activity icon={Users} label="Candidate profiles" value={candidates.length} />
                  <Activity icon={MessageSquareReply} label="Active outreach sequences" value={activeTracks.length} />
                  <Activity icon={FileSearch} label="Saved match scorecards" value={matches.length} />
                  <Activity icon={PhoneCall} label="Submission notes ready" value={submissionsReady} />
                </dl>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, value, context, to, emphasis = false }: {
  icon: typeof BriefcaseBusiness; label: string; value: string | number; context: string; to: "/jobs" | "/today" | "/screening"; emphasis?: boolean;
}) {
  return (
    <Link to={to} className="group flex min-h-36 flex-col justify-between rounded-lg border bg-card p-5 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase text-muted-foreground"><span>{label}</span><Icon className="h-4 w-4 text-primary" /></div>
      <div className="mt-3">
        <div className={`font-display font-semibold ${typeof value === "string" && value.length > 5 ? "text-2xl" : "text-4xl"} ${emphasis ? "text-destructive" : "text-foreground"}`}>{value}</div>
        <div className="mt-1 text-xs leading-snug text-muted-foreground">{context}</div>
      </div>
    </Link>
  );
}

function Activity({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return <div className="flex items-center justify-between gap-3 py-3 text-sm"><dt className="flex items-center gap-2 text-muted-foreground"><Icon className="h-4 w-4 text-primary" />{label}</dt><dd className="font-mono font-semibold">{value}</dd></div>;
}
