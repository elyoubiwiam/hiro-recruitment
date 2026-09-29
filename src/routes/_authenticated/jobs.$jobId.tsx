import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, MapPin } from "lucide-react";
import { EmptyState, money } from "@/components/shared";
import { BulkTriage } from "@/components/BulkTriage";
import { useCandidateDrawer } from "@/components/CandidateDrawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { STAGES } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/jobs/$jobId")({
  head: () => ({
    meta: [
      { title: "Job requisition | Hiro" },
      { name: "description", content: "Job details, requirements and matched candidates." },
      { property: "og:title", content: "Job requisition | Hiro" },
      { property: "og:description", content: "Job details and matched candidates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JobPage,
});

function JobPage() {
  const { jobId } = Route.useParams();
  const { jobs, clients, candidates, matches } = useStore();
  const drawer = useCandidateDrawer();
  const job = jobs.find((j) => j.id === jobId);
  if (!job) return <EmptyState text="Job not found." />;
  const client = clients.find((c) => c.id === job.clientId);
  const unscored = candidates.filter((c) => !matches.some((m) => m.candidateId === c.id && m.jobId === job.id));

  return (
    <div>
      <Link to="/jobs" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />All jobs</Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm text-primary">{client?.name} · {job.department}</div>
          <h1 className="text-3xl font-bold">{job.title}</h1>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{job.location} · {job.workMode}</span>
            <span>{money(job.salaryMin)}–{money(job.salaryMax)}</span>
            <Badge variant="secondary">{STAGES.find((s) => s.id === job.stage)?.label}</Badge>
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <section className="rounded-xl border bg-card p-5">
            <h3 className="mb-3 text-lg">Must-haves</h3>
            <div className="flex flex-wrap gap-2">{job.mustHave.map((s) => <Badge key={s}>{s}</Badge>)}</div>
            <h3 className="mb-3 mt-5 text-lg">Soft factors</h3>
            <div className="flex flex-wrap gap-2">{job.softFactors.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}</div>
          </section>
          <section className="rounded-xl border bg-card p-5">
            <h3 className="mb-2 text-lg">Description</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{job.description}</p>
          </section>
        </div>
        <div className="space-y-6 lg:col-span-2">
          <BulkTriage job={job} />
          {unscored.length > 0 && (
            <section>
              <h3 className="mb-2 text-lg">Not yet scored for this role</h3>
              <div className="flex flex-wrap gap-2">
                {unscored.map((c) => <Button key={c.id} size="sm" variant="outline" onClick={() => drawer.open(c.id, job.id)}>{c.name}</Button>)}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
