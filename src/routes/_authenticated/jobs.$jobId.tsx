import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileSearch, MapPin, MessagesSquare } from "lucide-react";
import { EmptyState, money, scoreTone } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { STAGES } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/jobs/$jobId")({
  head: () => ({
    meta: [
      { title: "Job requisition — Talentdesk" },
      { name: "description", content: "Job details, requirements and matched candidates." },
      { property: "og:title", content: "Job requisition — Talentdesk" },
      { property: "og:description", content: "Job details and matched candidates." },
    ],
  }),
  component: JobPage,
});

function JobPage() {
  const { jobId } = Route.useParams();
  const { jobs, clients, candidates, matches } = useStore();
  const job = jobs.find((j) => j.id === jobId);
  if (!job) return <EmptyState text="Job not found." />;
  const client = clients.find((c) => c.id === job.clientId);
  const ranked = candidates
    .map((c) => ({ c, m: matches.find((m) => m.candidateId === c.id && m.jobId === job.id) }))
    .sort((a, b) => (b.m?.result.score ?? -1) - (a.m?.result.score ?? -1));

  return (
    <div>
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />All jobs</Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm text-accent">{client?.name} · {job.department}</div>
          <h1 className="text-4xl">{job.title}</h1>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{job.location} · {job.workMode}</span>
            <span>{money(job.salaryMin)}–{money(job.salaryMax)}</span>
            <Badge variant="secondary">{STAGES.find((s) => s.id === job.stage)?.label}</Badge>
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <section className="rounded-lg border bg-card p-5">
            <h3 className="mb-3 text-lg">Must-haves</h3>
            <div className="flex flex-wrap gap-2">{job.mustHave.map((s) => <Badge key={s}>{s}</Badge>)}</div>
            <h3 className="mb-3 mt-5 text-lg">Soft factors</h3>
            <div className="flex flex-wrap gap-2">{job.softFactors.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}</div>
          </section>
          <section className="rounded-lg border bg-card p-5">
            <h3 className="mb-2 text-lg">Description</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{job.description}</p>
          </section>
        </div>
        <section className="lg:col-span-2">
          <h2 className="mb-3 text-2xl">Candidates</h2>
          <div className="space-y-2">
            {ranked.map(({ c, m }) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 text-center font-display text-2xl ${m ? scoreTone(m.result.score) : "text-muted-foreground"}`}>{m ? `${m.result.score}%` : "—"}</div>
                  <div><div className="font-semibold">{c.name}</div><div className="text-sm text-muted-foreground">{c.headline}</div></div>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline"><Link to="/screening" search={{ candidate: c.id, job: job.id }}><FileSearch className="h-4 w-4" />{m ? "Scorecard" : "Screen"}</Link></Button>
                  <Button asChild size="sm" variant="outline"><Link to="/outreach" search={{ candidate: c.id, job: job.id }}><MessagesSquare className="h-4 w-4" />Outreach</Link></Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
