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

  const STEP_COLORS = {
    Connect: "var(--color-chart-1)",
    InMail: "var(--color-chart-2)",
    "Follow-up 1": "var(--color-chart-3)",
    "Follow-up 2": "var(--color-chart-4)",
    Final: "var(--color-chart-5)",
  } as const;
  const stepData = STEPS.map((step) => ({
    step: step.short,
    candidates: activeTracks.filter((track) => track.step === STEPS.findIndex((s) => s.short === step.short)).length,
    color: STEP_COLORS[step.short],
  }));
  const stepConfig = Object.fromEntries(STEPS.map((step) => [step.short, { label: step.label, color: STEP_COLORS[step.short] }]));

  const STATUS_COLORS: Record<Track["status"], string> = {
    active: "var(--color-chart-1)",
    replied: "var(--color-chart-4)",
    call_booked: "var(--color-chart-3)",
    closed: "var(--color-chart-5)",
  };
  const statusConfig = { inSequence: { label: "In sequence", color: STATUS_COLORS.active }, replied: { label: "Replied", color: STATUS_COLORS.replied }, callBooked: { label: "Call booked", color: STATUS_COLORS.call_booked }, closed: { label: "Closed", color: STATUS_COLORS.closed } };
  const statusData = [
    { key: "inSequence", value: tracks.filter((track) => track.status === "active").length },
    { key: "replied", value: tracks.filter((track) => track.status === "replied").length },
    { key: "callBooked", value: tracks.filter((track) => track.status === "call_booked").length },
    { key: "closed", value: tracks.filter((track) => track.status === "closed").length },
  ].filter((entry) => entry.value > 0);
  const statusTotal = statusData.reduce((sum, entry) => sum + entry.value, 0);

  const matchData = jobs
    .map((job) => {
      const jobMatches = matches.filter((match) => match.jobId === job.id);
      return { role: job.title, score: jobMatches.length ? Math.round(jobMatches.reduce((sum, match) => sum + match.result.score, 0) / jobMatches.length) : 0, screened: jobMatches.length > 0 };
    })
    .filter((entry) => entry.screened)
    .slice(0, 6)
    .map((entry) => ({ ...entry, fill: "var(--color-chart-2)" }));
  const matchConfig = { score: { label: "Average match", color: "var(--color-chart-2)" } };

  const hasChartData = activeTracks.length > 0 || tracks.length > 0 || matchData.length > 0;

  const recommendations = [
    ...(overdue ? [{ key: "overdue", title: `Contact ${overdue} overdue candidate${overdue === 1 ? "" : "s"}`, detail: "Review the next message before sending to avoid further delay.", to: "/dashboard" as const, label: "Review outreach", urgency: "High priority" }] : []),
    ...(dueToday ? [{ key: "today", title: `Contact ${dueToday} candidate${dueToday === 1 ? "" : "s"} due today`, detail: "Send the scheduled message and record the outcome.", to: "/dashboard" as const, label: "Open tracker", urgency: "Due today" }] : []),
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
            <Metric icon={CalendarClock} label="Outreach due" value={overdue + dueToday} context={`${overdue} overdue · ${dueToday} due today`} to="/dashboard" emphasis={overdue > 0} />
            <Metric icon={MessageSquareReply} label="Response rate" value={responseRate === null ? "Not available" : `${responseRate}%`} context={`${answered} replies or calls booked / ${contacted.length} contacted sequences`} to="/dashboard" />
            <Metric icon={FileSearch} label="Roles screened" value={`${openJobs.length - jobsWithoutMatches.length}/${openJobs.length}`} context="Open roles with a saved scorecard" to="/screening" />
          </section>

          <section aria-labelledby="charts-title">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 id="charts-title" className="text-xl font-semibold">Pipeline charts</h2>
                <p className="mt-1 text-sm text-muted-foreground">How your outreach and screening work is distributed right now.</p>
              </div>
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
            {loading || !hasChartData ? (
              <p className="text-sm text-muted-foreground">{loading ? "Loading charts..." : "Charts appear once you have candidates in outreach or saved scorecards."}</p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-lg border bg-card p-5">
                  <h3 className="text-sm font-semibold">Active sequences by step</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">Where waiting candidates sit in the sequence.</p>
                  <ChartContainer config={stepConfig} className="mt-4 aspect-[16/10] w-full">
                    <BarChart data={stepData} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="step" tickLine={false} axisLine={false} tickMargin={8} fontSize={10} interval={0} tickFormatter={(value: string) => (value === "Follow-up 1" ? "FU 1" : value === "Follow-up 2" ? "FU 2" : value)} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} width={40} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="candidates" radius={6} maxBarSize={40}>
                        {stepData.map((entry) => (
                          <Cell key={entry.step} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </div>

                <div className="rounded-lg border bg-card p-5">
                  <h3 className="text-sm font-semibold">Sequence outcomes</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">Results across all tracked candidates.</p>
                  <div className="relative mt-4">
                    <ChartContainer config={statusConfig} className="mx-auto aspect-square w-full max-w-[220px]">
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        <Pie data={statusData} dataKey="value" nameKey="key" innerRadius={58} outerRadius={88} strokeWidth={2}>
                          {statusData.map((entry) => (
                            <Cell key={entry.key} fill={statusConfig[entry.key as keyof typeof statusConfig].color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ChartContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-mono text-2xl font-semibold">{statusTotal}</span>
                      <span className="text-xs text-muted-foreground">tracked</span>
                    </div>
                  </div>
                  <dl className="mt-4 space-y-1.5">
                    {statusData.map((entry) => (
                      <div key={entry.key} className="flex items-center justify-between text-xs">
                        <dt className="flex items-center gap-2 text-muted-foreground">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: statusConfig[entry.key as keyof typeof statusConfig].color }} />
                          {statusConfig[entry.key as keyof typeof statusConfig].label}
                        </dt>
                        <dd className="font-mono font-semibold">{entry.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="rounded-lg border bg-card p-5">
                  <h3 className="text-sm font-semibold">Average match score by role</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">Saved scorecards only, scaled to 100.</p>
                  <ChartContainer config={matchConfig} className="mt-4 aspect-[16/10] w-full">
                    <BarChart data={matchData} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
                      <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} fontSize={11} />
                      <YAxis type="category" dataKey="role" tickLine={false} axisLine={false} fontSize={11} width={110} tickFormatter={(value: string) => (value.length > 16 ? `${value.slice(0, 15)}…` : value)} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="score" radius={6} maxBarSize={22} />
                    </BarChart>
                  </ChartContainer>
                </div>
              </div>
            )}
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
  icon: typeof BriefcaseBusiness; label: string; value: string | number; context: string; to: "/jobs" | "/dashboard" | "/screening"; emphasis?: boolean;
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
