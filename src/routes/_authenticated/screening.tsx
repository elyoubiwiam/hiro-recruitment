import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { CandidateJobPicker, EmptyState, GenerateButton } from "@/components/shared";
import { Scorecard } from "@/components/Scorecard";
import { runAI } from "@/lib/ai.functions";
import { useStore } from "@/lib/store";
import type { MatchResult } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/screening")({
  validateSearch: z.object({ candidate: z.string().optional(), job: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Match Scorecard | Hiro" },
      { name: "description", content: "Explainable AI match scorecards for candidates against open jobs." },
      { property: "og:title", content: "Match Scorecard | Hiro" },
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
