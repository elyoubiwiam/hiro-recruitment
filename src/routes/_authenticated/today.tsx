import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, Clock, Copy, Loader2, Mail, MessageCircleReply, PhoneCall, Plus, RotateCcw, Sparkles, Linkedin, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { CandidateJobPicker, EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { runAI } from "@/lib/ai.functions";
import { useStore } from "@/lib/store";
import { bucketOf, dueLabel, markSentPatch, snoozePatch, STATUS_LABEL, STEPS, type Bucket } from "@/lib/tracking";
import type { Track } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/today")({
  head: () => ({
    meta: [
      { title: "Today — Talentdesk" },
      { name: "description", content: "Who to contact today, with a personalized draft for each candidate's next step." },
      { property: "og:title", content: "Today — Talentdesk" },
      { property: "og:description", content: "Your outreach follow-up queue." },
    ],
  }),
  component: Today,
});

const SECTIONS: { id: Bucket; label: string }[] = [
  { id: "overdue", label: "Overdue" },
  { id: "today", label: "Due today" },
  { id: "upcoming", label: "Upcoming" },
  { id: "done", label: "Replied & closed" },
];

function Today() {
  const { tracks, loading } = useStore();
  const due = tracks.filter((t) => ["overdue", "today"].includes(bucketOf(t))).length;
  const replied = tracks.filter((t) => t.status === "replied" || t.status === "call_booked").length;
  const rate = tracks.length ? Math.round((replied / tracks.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="overflow-hidden rounded-2xl border bg-card shadow-xl shadow-foreground/5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b px-8 py-6">
          <div>
            <h1 className="text-xl">Outreach Tracker</h1>
            <p className="text-sm text-muted-foreground">
              {loading ? "Loading…" : due ? `${due} candidate${due > 1 ? "s" : ""} require attention today` : "You're all caught up for today"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />AI drafting active
            </span>
            <TrackDialog />
          </div>
        </div>

        {!loading && tracks.length === 0 && (
          <div className="p-8"><EmptyState text="No candidates in a sequence yet. Click “Track candidate” to start one." /></div>
        )}

        {SECTIONS.map((s) => {
          const list = tracks
            .filter((t) => bucketOf(t) === s.id)
            .sort((a, b) => (a.nextContactAt ?? "").localeCompare(b.nextContactAt ?? ""));
          if (!list.length) return null;
          return (
            <div key={s.id}>
              <div className="border-b bg-muted/50 px-8 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {s.label} · {list.length}
              </div>
              <div className="divide-y">
                {list.map((t) => <TrackCard key={t.id} track={t} />)}
              </div>
            </div>
          );
        })}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/50 px-8 py-4 text-xs">
          <div className="flex gap-4">
            <span className="text-muted-foreground">In tracker: <strong className="text-foreground">{tracks.length}</strong></span>
            <span className="text-muted-foreground">Response rate: <strong className="text-primary">{rate}%</strong></span>
          </div>
          <Link to="/jobs" className="font-semibold text-primary hover:underline">View full pipeline</Link>
        </div>
      </div>
    </div>
  );
}

function initials(n: string) {
  return n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function TrackCard({ track: t }: { track: Track }) {
  const { candidates, jobs, clients, updateTrack } = useStore();
  const cand = candidates.find((c) => c.id === t.candidateId);
  const job = jobs.find((j) => j.id === t.jobId);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const step = STEPS[t.step]!;
  const draft = t.drafts[String(t.step)];
  const [subject, setSubject] = useState(draft?.subject ?? "");
  const [body, setBody] = useState(draft?.body ?? "");
  const bucket = bucketOf(t);
  const active = t.status === "active";
  if (!cand || !job) return null;

  async function generate() {
    if (!cand || !job) return;
    setBusy(true);
    try {
      const { rawText, ...candidate } = cand;
      const history = t.history.map((h) => ({ step: STEPS[h.step]?.label, sentAt: h.sentAt, message: t.drafts[String(h.step)]?.body }));
      const r: { subject: string; body: string } = await runAI({
        data: {
          task: "step_draft",
          payload: { job, client: clients.find((c) => c.id === job.clientId), candidate: { ...candidate, cv: rawText }, step: { index: t.step + 1, of: STEPS.length, label: step.label, channel: step.channel }, history },
        },
      });
      await updateTrack(t.id, { drafts: { ...t.drafts, [String(t.step)]: { subject: r.subject, body: r.body } } });
      setSubject(r.subject); setBody(r.body);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not write the draft");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    await updateTrack(t.id, { drafts: { ...t.drafts, [String(t.step)]: { subject, body } } });
    setEditing(false);
    toast.success("Draft saved");
  }

  async function markSent() {
    if (draft) await navigator.clipboard.writeText(draft.subject ? `Subject: ${draft.subject}\n\n${draft.body}` : draft.body).catch(() => {});
    const p = markSentPatch(t);
    await updateTrack(t.id, p);
    setSubject(""); setBody("");
    toast.success(p.status === "closed" ? "Sequence complete" : `Logged. Next: ${STEPS[p.step!]!.label} ${dueLabel({ ...t, ...p } as Track).toLowerCase()}`);
  }

  const tone = bucket === "overdue" ? "text-destructive" : bucket === "today" ? "text-warning" : "text-muted-foreground";
  const StepIcon = step.channel === "LinkedIn" ? Linkedin : Mail;

  return (
    <div className="group p-8 transition-colors hover:bg-muted/30">
      <div className="flex items-start gap-6">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border font-bold ${active ? "border-accent-foreground/20 bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
          {initials(cand.name)}
        </div>
        <div className="min-w-0 flex-grow">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">{cand.name}</h3>
              <p className="text-sm text-muted-foreground">{cand.headline}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">For <span className="font-medium text-foreground">{job.title}</span> · {clients.find((c) => c.id === job.clientId)?.name}</p>
            </div>
            <div className="text-right">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{active ? "Current step" : "Status"}</div>
              <div className="flex items-center justify-end gap-2">
                {active ? (
                  <>
                    <span className="rounded-md border border-warning/20 bg-warning-soft px-2.5 py-1 text-xs font-medium text-warning">Step {t.step + 1}: {step.short}</span>
                    <span className={`text-xs font-medium ${tone}`}>{dueLabel(t)}</span>
                  </>
                ) : (
                  <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium">{STATUS_LABEL[t.status]}</span>
                )}
              </div>
              <StepDots track={t} />
            </div>
          </div>

          {active && (
            <div className="relative rounded-xl border bg-muted/40 p-5 transition-colors group-hover:border-primary/30">
              <div className="absolute -top-3 left-4 flex items-center gap-1 rounded border bg-card px-2 text-[10px] font-bold uppercase tracking-widest text-primary">
                <Zap className="h-3 w-3" />Personalized draft · {step.label}
              </div>
              {editing ? (
                <div className="space-y-2 pt-1">
                  {step.channel === "Email" || t.step === 1 ? <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="bg-card" /> : null}
                  <Textarea rows={7} value={body} onChange={(e) => setBody(e.target.value)} className="bg-card text-sm" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveEdit}>Save draft</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </div>
              ) : draft ? (
                <>
                  {draft.subject && <div className="mb-1 pt-1 text-sm font-semibold">{draft.subject}</div>}
                  <p className="whitespace-pre-wrap pt-1 text-sm leading-relaxed text-foreground/80">{draft.body}</p>
                </>
              ) : (
                <div className="flex items-center justify-between gap-3 pt-1">
                  <p className="text-sm text-muted-foreground">No draft yet for this step.</p>
                  <Button size="sm" variant="outline" onClick={generate} disabled={busy}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Write draft
                  </Button>
                </div>
              )}

              {!editing && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-4">
                    <button className="text-xs font-semibold text-muted-foreground hover:text-primary" onClick={() => { setSubject(draft?.subject ?? ""); setBody(draft?.body ?? ""); setEditing(true); }}>Edit draft</button>
                    {draft && <button className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary disabled:opacity-50" disabled={busy} onClick={generate}>{busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}Rewrite</button>}
                    {draft && <button className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary" onClick={() => { navigator.clipboard.writeText(draft.subject ? `Subject: ${draft.subject}\n\n${draft.body}` : draft.body); toast.success("Copied"); }}><Copy className="h-3 w-3" />Copy</button>}
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary"><Clock className="h-3 w-3" />Snooze</DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {[1, 3, 7].map((d) => <DropdownMenuItem key={d} onClick={() => updateTrack(t.id, snoozePatch(t, d))}>{d} day{d > 1 ? "s" : ""}</DropdownMenuItem>)}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary"><MessageCircleReply className="h-3 w-3" />Outcome</DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => updateTrack(t.id, { status: "replied", nextContactAt: null })}><MessageCircleReply className="h-4 w-4" />Candidate replied</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateTrack(t.id, { status: "call_booked", nextContactAt: null })}><PhoneCall className="h-4 w-4" />Call booked</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateTrack(t.id, { status: "closed", nextContactAt: null })}><X className="h-4 w-4" />Not interested / close</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Button onClick={markSent} className="group/btn">
                    <StepIcon className="h-4 w-4" />Mark sent via {step.channel}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {!active && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Check className="h-4 w-4 text-success" />
              {t.history.length} message{t.history.length === 1 ? "" : "s"} sent{t.lastContactedAt ? ` · last on ${new Date(t.lastContactedAt).toLocaleDateString()}` : ""}
              <button className="font-semibold text-primary hover:underline" onClick={() => updateTrack(t.id, { status: "active", nextContactAt: new Date().toISOString() })}>Resume sequence</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepDots({ track: t }: { track: Track }) {
  return (
    <div className="mt-2 flex justify-end gap-1" title={t.history.map((h) => `${STEPS[h.step]?.label}: ${new Date(h.sentAt).toLocaleDateString()}`).join("\n")}>
      {STEPS.map((s, i) => {
        const sent = t.history.some((h) => h.step === i);
        const current = t.status === "active" && i === t.step;
        return <span key={s.label} className={`h-1.5 w-5 rounded-full ${sent ? "bg-primary" : current ? "bg-warning" : "bg-border"}`} />;
      })}
    </div>
  );
}

function TrackDialog() {
  const { startTrack } = useStore();
  const [open, setOpen] = useState(false);
  const [candidateId, setCandidateId] = useState<string>();
  const [jobId, setJobId] = useState<string>();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4" />Track candidate</Button></DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>Start an outreach sequence</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">5 steps: LinkedIn connection → InMail (+2 days) → Follow-up 1 (+3) → Follow-up 2 (+4) → Final check-in (+7). The first step is due today.</p>
        <CandidateJobPicker candidateId={candidateId} jobId={jobId} onCandidate={setCandidateId} onJob={setJobId} />
        <Button disabled={!candidateId || !jobId} onClick={async () => {
          const r = await startTrack(candidateId!, jobId!);
          if (r) { toast.success("Added to your tracker"); setOpen(false); }
        }}>Start sequence</Button>
      </DialogContent>
    </Dialog>
  );
}
