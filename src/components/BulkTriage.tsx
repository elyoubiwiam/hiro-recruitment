import { useState } from "react";
import { Check, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useCandidateDrawer } from "@/components/CandidateDrawer";
import { scoreTone } from "@/components/shared";
import { tierOf } from "@/components/Scorecard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cachedAI } from "@/lib/ai-cache";
import { extractFile } from "@/lib/file-extract";
import { triageKey, useStore } from "@/lib/store";
import type { Job, MatchResult } from "@/lib/types";

type Row = { file: string; state: "queued" | "working" | "done" | "error"; error?: string };

export function BulkTriage({ job }: { job: Job }) {
  const { candidates, matches, triage, addCandidate, saveMatch, setTriage } = useStore();
  const drawer = useCandidateDrawer();
  const [queue, setQueue] = useState<Row[]>([]);
  const [filter, setFilter] = useState<"all" | "shortlisted" | "rejected">("all");
  const busy = queue.some((q) => q.state === "queued" || q.state === "working");

  async function onFiles(list: FileList | null) {
    const files = Array.from(list ?? []).slice(0, 25);
    if (!files.length) return;
    setQueue((q) => [...q, ...files.map((f) => ({ file: f.name, state: "queued" as const }))]);
    const set = (name: string, p: Partial<Row>) => setQueue((q) => q.map((r) => (r.file === name ? { ...r, ...p } : r)));
    const known = [...candidates];
    // Two at a time keeps things quick without hitting rate limits.
    const work = [...files];
    const worker = async () => {
      for (let f = work.shift(); f; f = work.shift()) {
        set(f.name, { state: "working" });
        try {
          const ex = await extractFile(f);
          const { id, createdAt, stage, ...jobCtx } = job;
          const r = await cachedAI<{ profile: any; match: MatchResult }>("triage", { job: jobCtx, ...ex });
          const p = r.profile ?? {};
          let cand = known.find((c) => c.name && c.name === p.name && (c.email || "") === (p.email || ""));
          if (!cand) {
            cand = (await addCandidate({
              name: p.name || f.name.replace(/\.\w+$/, ""), email: p.email || "", phone: p.phone || "", location: p.location || "",
              headline: p.headline || "", summary: p.summary || "", skills: p.skills || [], experience: p.experience || [],
              education: p.education || [], rawText: ex.text?.slice(0, 20000) || "",
            })) ?? undefined;
            if (cand) known.push(cand);
          }
          if (cand && r.match) await saveMatch(cand.id, job.id, r.match);
          set(f.name, { state: "done" });
        } catch (e) {
          set(f.name, { state: "error", error: e instanceof Error ? e.message : "Failed" });
        }
      }
    };
    await Promise.all([worker(), worker()]);
    toast.success("Triage complete");
  }

  const rows = candidates
    .map((c) => ({ c, m: matches.find((m) => m.candidateId === c.id && m.jobId === job.id), s: triage[triageKey(c.id, job.id)] }))
    .filter((r) => r.m)
    .filter((r) => filter === "all" || r.s === filter)
    .sort((a, b) => (a.s === "rejected" ? 1 : 0) - (b.s === "rejected" ? 1 : 0) || b.m!.result.score - a.m!.result.score);
  const tierVariant = (s: number) => (s >= 80 ? "default" : s >= 60 ? "secondary" : "outline") as const;

  return (
    <section className="space-y-4">
      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-card p-8 text-center transition-colors hover:border-primary"
      >
        {busy ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Upload className="h-6 w-6 text-primary" />}
        <div className="font-semibold">{busy ? `Triaging ${queue.filter((q) => q.state === "done").length}/${queue.length} CVs...` : "Drop multiple CVs to rank them for this job"}</div>
        <div className="text-xs text-muted-foreground">PDF, Word or .txt, up to 25 at once. Each CV is parsed and scored in a single AI request; re-uploading the same file is free.</div>
        <input type="file" multiple accept=".pdf,.docx,.txt,.md" className="hidden" disabled={busy} onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
      </label>
      {queue.some((q) => q.state === "error") && (
        <ul className="space-y-1 text-xs text-destructive">{queue.filter((q) => q.state === "error").map((q) => <li key={q.file}>{q.file}: {q.error}</li>)}</ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl">Ranked candidates</h2>
        <div className="flex gap-1">
          {(["all", "shortlisted", "rejected"] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} className="capitalize" onClick={() => setFilter(f)}>{f}</Button>
          ))}
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow><TableHead className="w-16">Score</TableHead><TableHead>Candidate</TableHead><TableHead>Tier</TableHead><TableHead className="text-right">Decision</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">No scored candidates{filter !== "all" ? ` marked ${filter}` : ""} yet.</TableCell></TableRow>}
            {rows.map(({ c, m, s }) => (
              <TableRow key={c.id} className={s === "rejected" ? "opacity-50" : ""}>
                <TableCell className={`font-display text-xl font-semibold ${scoreTone(m!.result.score)}`}>{m!.result.score}</TableCell>
                <TableCell>
                  <button onClick={() => drawer.open(c.id, job.id)} className="text-left font-semibold hover:text-primary hover:underline">{c.name}</button>
                  <div className="max-w-xs truncate text-xs text-muted-foreground">{c.headline}</div>
                </TableCell>
                <TableCell><Badge variant={tierVariant(m!.result.score)}>{tierOf(m!.result.score)}</Badge></TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex gap-1">
                    <Button size="sm" variant={s === "shortlisted" ? "default" : "outline"} onClick={() => setTriage(c.id, job.id, s === "shortlisted" ? null : "shortlisted")}><Check className="h-4 w-4" />Shortlist</Button>
                    <Button size="sm" variant={s === "rejected" ? "destructive" : "outline"} onClick={() => setTriage(c.id, job.id, s === "rejected" ? null : "rejected")}><X className="h-4 w-4" />Reject</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
