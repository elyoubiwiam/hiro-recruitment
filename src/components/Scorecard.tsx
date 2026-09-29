import { AlertTriangle, CheckCircle2, CircleDashed, HelpCircle, XCircle } from "lucide-react";
import { scoreTone } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import type { MatchResult } from "@/lib/types";

export function tierOf(score: number) {
  return score >= 80 ? "Strong Match" : score >= 60 ? "Potential" : "Low";
}

export function Scorecard({ r, compact = false }: { r: MatchResult; compact?: boolean }) {
  const icon = { met: <CheckCircle2 className="h-4 w-4 text-success" />, partial: <CircleDashed className="h-4 w-4 text-warning" />, missing: <XCircle className="h-4 w-4 text-destructive" /> };
  const sev = { low: "secondary", medium: "outline", high: "destructive" } as const;
  return (
    <div className={compact ? "space-y-4" : "grid gap-6 lg:grid-cols-3"}>
      <div className="rounded-xl border bg-card p-6 lg:col-span-1">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Match</div>
        <div className={`font-display ${compact ? "text-5xl" : "text-7xl"} ${scoreTone(r.score)}`}>{r.score}%</div>
        <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${r.score}%` }} /></div>
        <div className="mt-3 font-semibold">{r.verdict}</div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.summary}</p>
        <h3 className="mb-2 mt-6 text-lg">Must-have coverage</h3>
        <ul className="space-y-2">
          {r.skillCoverage?.map((s, i) => (
            <li key={i} className="text-sm"><div className="flex items-center gap-2 font-medium">{icon[s.status]}{s.skill}</div><div className="pl-6 text-xs text-muted-foreground">{s.evidence}</div></li>
          ))}
        </ul>
      </div>
      <div className={compact ? "space-y-4" : "space-y-6 lg:col-span-2"}>
        <section className="rounded-xl border bg-card p-6">
          <h3 className="mb-3 text-xl">Strengths</h3>
          <ul className="space-y-3">{r.strengths?.map((s, i) => (
            <li key={i} className="border-l-2 border-success pl-3"><div className="font-medium">{s.point}</div><div className="text-sm text-muted-foreground">{s.evidence}</div></li>
          ))}</ul>
        </section>
        <section className="rounded-xl border bg-card p-6">
          <h3 className="mb-3 text-xl">Gaps & missing criteria</h3>
          {r.gaps?.length ? <ul className="space-y-3">{r.gaps.map((g, i) => (
            <li key={i} className="flex gap-3"><Badge variant={sev[g.severity] ?? "outline"} className="h-fit capitalize">{g.severity}</Badge><div><div className="font-medium">{g.criterion}</div><div className="text-sm text-muted-foreground">{g.note}</div></div></li>
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
