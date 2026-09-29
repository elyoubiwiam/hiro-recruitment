import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { AlertTriangle, CheckCircle2, CircleDashed, HelpCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { CandidateJobPicker, EmptyState, GenerateButton, scoreTone } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { runAI } from "@/lib/ai.functions";
import { useStore } from "@/lib/store";
import type { MatchResult } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/screening")({
  validateSearch: z.object({ candidate: z.string().optional(), job: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Match Scorecard | Talentdesk" },
      { name: "description", content: "Explainable AI match scorecards for candidates against open jobs." },
      { property: "og:title", content: "Match Scorecard | Talentdesk" },
      { property: "og:description", content: "Explainable AI candidate-job matching." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Screening,
});

function Screening() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/screening" });
  const { candidates, jobs, clients, matches, saveMatch } = useStore();
  const [loading, setLoading] = useState(false);
  const cand = candidates.find((c) => c.id === search.candidate);
  const job = jobs.find((j) => j.id === search.job);
  const record = matches.find((m) => m.candidateId === search.candidate && m.jobId === search.job);

  async function run() {
    if (!cand || !job) return;
    setLoading(true);
    try {
      const { rawText, ...candidate } = cand;
      const result: MatchResult = await runAI({
        data: { task: "match", payload: { job, client: clients.find((c) => c.id === job.clientId), candidate: { ...candidate, cv: rawText } } },
      });
      await saveMatch(cand.id, job.id, result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scoring failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader title="Match Scorecard" subtitle="Review evidence, strengths and gaps for each candidate." />
      <div className="mb-8 space-y-4 rounded-xl border bg-card p-5">
        <CandidateJobPicker
          candidateId={search.candidate} jobId={search.job}
          onCandidate={(v) => navigate({ search: (s) => ({ ...s, candidate: v }) })}
          onJob={(v) => navigate({ search: (s) => ({ ...s, job: v }) })}
        />
        <GenerateButton loading={loading} disabled={!cand || !job} onClick={run}>{record ? "Re-score match" : "Score match"}</GenerateButton>
      </div>
      {loading && !record ? <EmptyState text="Analyzing CV against the job requirements..." /> : record ? <Scorecard r={record.result} /> : <EmptyState text="Pick a candidate and a job, then score the match." />}
    </>
  );
}

function Scorecard({ r }: { r: MatchResult }) {
  const icon = { met: <CheckCircle2 className="h-4 w-4 text-success" />, partial: <CircleDashed className="h-4 w-4 text-warning" />, missing: <XCircle className="h-4 w-4 text-destructive" /> };
  const sev = { low: "secondary", medium: "outline", high: "destructive" } as const;
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-xl border bg-card p-6 lg:col-span-1">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Match</div>
        <div className={`font-display text-7xl ${scoreTone(r.score)}`}>{r.score}%</div>
        <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-accent" style={{ width: `${r.score}%` }} /></div>
        <div className="mt-3 font-semibold">{r.verdict}</div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.summary}</p>
        <h3 className="mb-2 mt-6 text-lg">Must-have coverage</h3>
        <ul className="space-y-2">
          {r.skillCoverage?.map((s, i) => (
            <li key={i} className="text-sm"><div className="flex items-center gap-2 font-medium">{icon[s.status]}{s.skill}</div><div className="pl-6 text-xs text-muted-foreground">{s.evidence}</div></li>
          ))}
        </ul>
      </div>
      <div className="space-y-6 lg:col-span-2">
        <section className="rounded-xl border bg-card p-6">
          <h3 className="mb-3 text-xl">Strengths</h3>
          <ul className="space-y-3">{r.strengths?.map((s, i) => (
            <li key={i} className="border-l-2 border-success pl-3"><div className="font-medium">{s.point}</div><div className="text-sm text-muted-foreground">{s.evidence}</div></li>
          ))}</ul>
        </section>
        <section className="rounded-xl border bg-card p-6">
          <h3 className="mb-3 text-xl">Gaps & missing criteria</h3>
          {r.gaps?.length ? <ul className="space-y-3">{r.gaps.map((g, i) => (
            <li key={i} className="flex gap-3"><Badge variant={sev[g.severity]} className="h-fit capitalize">{g.severity}</Badge><div><div className="font-medium">{g.criterion}</div><div className="text-sm text-muted-foreground">{g.note}</div></div></li>
          ))}</ul> : <p className="text-sm text-muted-foreground">No material gaps.</p>}
          {r.redFlags?.length > 0 && (
            <div className="mt-5 rounded-md border border-destructive/30 bg-destructive/5 p-4">
              <div className="mb-2 flex items-center gap-2 font-semibold text-destructive"><AlertTriangle className="h-4 w-4" />Red flags</div>
              <ul className="list-disc space-y-1 pl-5 text-sm">{r.redFlags.map((f, i) => <li key={i}>{f}</li>)}</ul>
            </div>
          )}
        </section>
        <section className="rounded-xl border bg-card p-6">
          <h3 className="mb-3 text-xl">Suggested interview questions</h3>
          <ol className="space-y-3">{r.interviewQuestions?.map((q, i) => (
            <li key={i} className="flex gap-3"><HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div><div className="font-medium">{q.question}</div><div className="text-xs text-muted-foreground">Probes: {q.purpose}</div></div></li>
          ))}</ol>
        </section>
      </div>
    </div>
  );
}
