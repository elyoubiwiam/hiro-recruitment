import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Clock, DollarSign, Mail, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { CandidateJobPicker, CopyButton, EmptyState, GenerateButton } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { runAI } from "@/lib/ai.functions";
import { uid, useStore } from "@/lib/store";
import type { SynthesisResult } from "@/lib/types";

export const Route = createFileRoute("/calls")({
  head: () => ({
    meta: [
      { title: "Call Synthesizer — Talentdesk" },
      { name: "description", content: "Turn phone-screen notes into executive profiles and client submission notes." },
      { property: "og:title", content: "Call Synthesizer — Talentdesk" },
      { property: "og:description", content: "Phone screens to client-ready submissions." },
    ],
  }),
  component: Calls,
});

function Calls() {
  const { transcripts, candidates, jobs, clients, update } = useStore();
  const [selId, setSelId] = useState<string | "new">(transcripts[0]?.id ?? "new");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState({ candidateId: "", jobId: "", text: "" });
  const sel = transcripts.find((t) => t.id === selId);
  const candidateId = sel ? sel.candidateId : draft.candidateId;
  const jobId = sel ? sel.jobId : draft.jobId;
  const text = sel ? sel.text : draft.text;

  const patch = (p: Partial<typeof draft>) => {
    if (sel) update((d) => ({ ...d, transcripts: d.transcripts.map((t) => (t.id === sel.id ? { ...t, ...p } : t)) }));
    else setDraft({ ...draft, ...p });
  };

  async function run() {
    const cand = candidates.find((c) => c.id === candidateId);
    const job = jobs.find((j) => j.id === jobId);
    if (!cand || !job || !text.trim()) return;
    setLoading(true);
    try {
      const { rawText, ...candidate } = cand;
      const result: SynthesisResult = await runAI({
        data: { task: "synthesize", payload: { job, client: clients.find((c) => c.id === job.clientId), candidate: { ...candidate, cv: rawText }, transcript: text } },
      });
      if (sel) {
        update((d) => ({ ...d, transcripts: d.transcripts.map((t) => (t.id === sel.id ? { ...t, result } : t)) }));
      } else {
        const id = uid();
        update((d) => ({ ...d, transcripts: [{ id, candidateId, jobId, text, title: `Call notes — ${cand.name}`, result, createdAt: new Date().toISOString() }, ...d.transcripts] }));
        setSelId(id);
        setDraft({ candidateId: "", jobId: "", text: "" });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Synthesis failed");
    } finally {
      setLoading(false);
    }
  }

  const r = sel?.result;
  const client = clients.find((c) => c.id === jobs.find((j) => j.id === jobId)?.clientId);

  return (
    <>
      <PageHeader title="Call Synthesizer" subtitle="Phone screen in, client-ready submission out." />
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="space-y-2">
          <Button variant={selId === "new" ? "default" : "outline"} className="w-full justify-start" onClick={() => setSelId("new")}><Plus className="h-4 w-4" />New call notes</Button>
          {transcripts.map((t) => (
            <button key={t.id} onClick={() => setSelId(t.id)} className={`w-full rounded-lg border bg-card p-3 text-left text-sm hover:border-primary ${selId === t.id ? "border-primary ring-1 ring-primary" : ""}`}>
              <div className="font-semibold">{t.title}</div>
              <div className="text-xs text-muted-foreground">{t.result ? "Synthesized" : "Not yet synthesized"}</div>
            </button>
          ))}
        </div>

        <div className="space-y-6">
          <div className="space-y-4 rounded-lg border bg-card p-5">
            <CandidateJobPicker candidateId={candidateId || undefined} jobId={jobId || undefined} onCandidate={(v) => patch({ candidateId: v })} onJob={(v) => patch({ jobId: v })} />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Transcript or notes</span>
              <label className="flex cursor-pointer items-center gap-1 text-xs text-accent">
                <Upload className="h-3.5 w-3.5" />Upload .txt
                <Input type="file" accept=".txt,.md,.vtt,.srt" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) patch({ text: await f.text() }); }} />
              </label>
            </div>
            <Textarea rows={10} value={text} onChange={(e) => patch({ text: e.target.value })} placeholder="Paste your phone-screen notes or call transcript…" className="font-mono text-xs" />
            <GenerateButton loading={loading} disabled={!candidateId || !jobId || text.trim().length < 30} onClick={run}>{r ? "Re-synthesize" : "Synthesize"}</GenerateButton>
          </div>

          {r ? (
            <>
              <section className="rounded-lg border bg-card p-6">
                <div className="text-xs uppercase tracking-wider text-accent">Executive profile</div>
                <h2 className="text-3xl">{r.headline}</h2>
                <p className="mt-3 leading-relaxed">{r.executiveSummary}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md bg-muted p-4"><div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><DollarSign className="h-3.5 w-3.5" />Compensation</div><div className="mt-1 text-sm">Current: {r.compensation.current}</div><div className="text-sm font-semibold">Expected: {r.compensation.expected}</div></div>
                  <div className="rounded-md bg-muted p-4"><div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><Clock className="h-3.5 w-3.5" />Availability</div><div className="mt-1 text-sm">Notice: {r.availability.noticePeriod}</div><div className="text-sm font-semibold">Start: {r.availability.earliestStart}</div></div>
                </div>
                <div className="mt-5 grid gap-6 sm:grid-cols-2">
                  <div><h3 className="mb-2 text-lg">Key highlights</h3><ul className="list-disc space-y-1 pl-5 text-sm">{r.highlights.map((h, i) => <li key={i}>{h}</li>)}</ul></div>
                  <div><h3 className="mb-2 text-lg">Strengths</h3><ul className="list-disc space-y-1 pl-5 text-sm">{r.strengths.map((h, i) => <li key={i}>{h}</li>)}</ul></div>
                </div>
                <h3 className="mb-1 mt-5 text-lg">Culture fit</h3><p className="text-sm text-muted-foreground">{r.cultureFit}</p>
                {r.concerns.length > 0 && <><h3 className="mb-1 mt-5 text-lg">Watch-outs</h3><ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">{r.concerns.map((h, i) => <li key={i}>{h}</li>)}</ul></>}
              </section>
              <section className="rounded-lg border-2 border-accent/40 bg-card p-6">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs uppercase tracking-wider text-accent">Client submission note</div>
                  <div className="flex gap-2">
                    <CopyButton text={`Subject: ${r.submissionNote.subject}\n\n${r.submissionNote.body}`} />
                    <Button size="sm" asChild>
                      <a href={`mailto:${client?.contactEmail ?? ""}?subject=${encodeURIComponent(r.submissionNote.subject)}&body=${encodeURIComponent(r.submissionNote.body)}`}><Mail className="h-3.5 w-3.5" />Email {client?.contactName ?? "client"}</a>
                    </Button>
                  </div>
                </div>
                <div className="font-semibold">{r.submissionNote.subject}</div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{r.submissionNote.body}</p>
              </section>
            </>
          ) : (
            <EmptyState text={loading ? "Synthesizing the call…" : "Synthesize to get an executive profile and submission note."} />
          )}
        </div>
      </div>
    </>
  );
}
