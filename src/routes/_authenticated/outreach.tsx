import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Linkedin, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { CandidateJobPicker, CopyButton, EmptyState, GenerateButton } from "@/components/shared";
import { runAI } from "@/lib/ai.functions";
import { useStore } from "@/lib/store";
import type { OutreachResult } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/outreach")({
  validateSearch: z.object({ candidate: z.string().optional(), job: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Outreach Generator — Talentdesk" },
      { name: "description", content: "Generate tailored LinkedIn and email outreach sequences for candidates." },
      { property: "og:title", content: "Outreach Generator — Talentdesk" },
      { property: "og:description", content: "Tailored multi-step candidate outreach, instantly." },
    ],
  }),
  component: Outreach,
});

function Outreach() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/outreach" });
  const { candidates, jobs, clients } = useStore();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OutreachResult | null>(null);
  const cand = candidates.find((c) => c.id === search.candidate);
  const job = jobs.find((j) => j.id === search.job);

  async function run() {
    if (!cand || !job) return;
    setLoading(true);
    try {
      const { rawText, ...candidate } = cand;
      setResult(await runAI({ data: { task: "outreach", payload: { job, client: clients.find((c) => c.id === job.clientId), candidate: { ...candidate, cv: rawText } } } }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  const steps = result
    ? [
        { icon: Linkedin, label: "Day 0 · LinkedIn connection request", subject: "", body: result.linkedinConnect },
        { icon: Send, label: "Day 1 · InMail pitch", subject: result.inmail.subject, body: result.inmail.body },
        ...result.emails.map((e) => ({ icon: Mail, label: `Day ${e.day} · Follow-up email`, subject: e.subject, body: e.body })),
      ]
    : [];

  return (
    <>
      <PageHeader title="Outreach Generator" subtitle="Multi-step sequences that explain why this person fits this role." />
      <div className="mb-8 space-y-4 rounded-lg border bg-card p-5">
        <CandidateJobPicker
          candidateId={search.candidate} jobId={search.job}
          onCandidate={(v) => { setResult(null); navigate({ search: (s) => ({ ...s, candidate: v }) }); }}
          onJob={(v) => { setResult(null); navigate({ search: (s) => ({ ...s, job: v }) }); }}
        />
        <GenerateButton loading={loading} disabled={!cand || !job} onClick={run}>{result ? "Regenerate sequence" : "Generate sequence"}</GenerateButton>
      </div>
      {!result ? (
        <EmptyState text={loading ? "Writing a personalised sequence…" : "Pick a candidate and a job to generate outreach."} />
      ) : (
        <ol className="relative space-y-5 border-l-2 border-accent/40 pl-8">
          {steps.map((s, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[45px] flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground"><s.icon className="h-4 w-4" /></span>
              <div className="rounded-lg border bg-card p-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</div>
                  <CopyButton text={s.subject ? `Subject: ${s.subject}\n\n${s.body}` : s.body} />
                </div>
                {s.subject && <div className="mb-2 font-semibold">{s.subject}</div>}
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{s.body}</p>
                {i === 0 && <div className="mt-2 text-xs text-muted-foreground">{s.body.length}/300 characters</div>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
