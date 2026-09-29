import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Check, Copy, GraduationCap, Loader2, MapPin, RotateCcw, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, GenerateButton } from "@/components/shared";
import { Scorecard } from "@/components/Scorecard";
import { PresentationDialog } from "@/components/PresentationDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { runAI } from "@/lib/ai.functions";
import { useStore } from "@/lib/store";
import { dueLabel, markSentPatch, STATUS_LABEL, STEPS } from "@/lib/tracking";
import type { Candidate, Job, MatchResult, SynthesisResult } from "@/lib/types";

type Ctx = { open: (candidateId: string, jobId?: string) => void };
const DrawerCtx = createContext<Ctx>({ open: () => {} });
export const useCandidateDrawer = () => useContext(DrawerCtx);

export function CandidateDrawerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ candidateId: string; jobId?: string } | null>(null);
  return (
    <DrawerCtx.Provider value={{ open: (candidateId, jobId) => setState({ candidateId, jobId }) }}>
      {children}
      <Sheet open={!!state} onOpenChange={(o) => !o && setState(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
          {state && <DrawerBody key={state.candidateId} candidateId={state.candidateId} initialJobId={state.jobId} />}
        </SheetContent>
      </Sheet>
    </DrawerCtx.Provider>
  );
}

function stripForAI(c: Candidate) {
  const { rawText, ...rest } = c;
  return { ...rest, cv: rawText };
}

function DrawerBody({ candidateId, initialJobId }: { candidateId: string; initialJobId?: string }) {
  const { candidates, jobs, clients, matches } = useStore();
  const cand = candidates.find((c) => c.id === candidateId);
  const firstMatched = matches.find((m) => m.candidateId === candidateId)?.jobId;
  const [jobId, setJobId] = useState<string | undefined>(initialJobId ?? firstMatched ?? jobs.find((j) => j.stage !== "filled")?.id);
  const [share, setShare] = useState(false);
  const job = jobs.find((j) => j.id === jobId);
  if (!cand) return <EmptyState text="Candidate not found." />;

  return (
    <>
      <SheetHeader className="text-left">
        <div className="flex items-start justify-between gap-3 pr-6">
          <div>
            <SheetTitle className="text-2xl">{cand.name}</SheetTitle>
            <SheetDescription className="text-primary">{cand.headline}</SheetDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShare(true)}><Share2 className="h-4 w-4" />Share with client</Button>
        </div>
      </SheetHeader>
      <div className="mt-4 space-y-1.5">
        <Label className="text-xs text-muted-foreground">Job context</Label>
        <Select value={jobId ?? ""} onValueChange={setJobId}>
          <SelectTrigger className="bg-card"><SelectValue placeholder="Select a job" /></SelectTrigger>
          <SelectContent>
            {jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.title} · {clients.find((c) => c.id === j.clientId)?.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Tabs defaultValue="profile" className="mt-5">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="score">Scorecard</TabsTrigger>
          <TabsTrigger value="outreach">Outreach</TabsTrigger>
          <TabsTrigger value="calls">Calls</TabsTrigger>
        </TabsList>
        <TabsContent value="profile"><ProfileTab c={cand} /></TabsContent>
        <TabsContent value="score">{job ? <ScoreTab c={cand} job={job} /> : <EmptyState text="Select a job first." />}</TabsContent>
        <TabsContent value="outreach">{job ? <OutreachTab c={cand} job={job} /> : <EmptyState text="Select a job first." />}</TabsContent>
        <TabsContent value="calls">{job ? <CallsTab c={cand} job={job} /> : <EmptyState text="Select a job first." />}</TabsContent>
      </Tabs>
      <PresentationDialog open={share} onOpenChange={setShare} candidate={cand} job={job} />
    </>
  );
}

function ProfileTab({ c }: { c: Candidate }) {
  return (
    <div className="space-y-5 pt-2">
      {c.location && <div className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{c.location}</div>}
      <p className="text-sm leading-relaxed">{c.summary}</p>
      <div className="flex flex-wrap gap-1.5">{c.skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}</div>
      <div>
        <h3 className="mb-3 text-lg">Experience</h3>
        <ol className="space-y-4 border-l-2 border-border pl-5">
          {c.experience.map((e, i) => (
            <li key={i}>
              <div className="font-semibold">{e.title} <span className="font-normal text-muted-foreground">· {e.company}</span></div>
              <div className="text-xs text-muted-foreground">{e.start} to {e.end}</div>
              {e.highlights?.length > 0 && <ul className="mt-1 list-disc pl-4 text-sm text-muted-foreground">{e.highlights.map((h, j) => <li key={j}>{h}</li>)}</ul>}
            </li>
          ))}
        </ol>
      </div>
      {c.education.length > 0 && (
        <div>
          <h3 className="mb-2 text-lg">Education</h3>
          {c.education.map((e, i) => <div key={i} className="flex items-center gap-2 text-sm"><GraduationCap className="h-4 w-4 text-primary" />{e.degree}, {e.school} {e.year && `(${e.year})`}</div>)}
        </div>
      )}
      {c.rawText && (
        <details className="rounded-xl border bg-muted/30 p-4 text-sm">
          <summary className="cursor-pointer font-medium">Original CV text</summary>
          <p className="mt-3 whitespace-pre-wrap text-xs text-muted-foreground">{c.rawText}</p>
        </details>
      )}
    </div>
  );
}

function ScoreTab({ c, job }: { c: Candidate; job: Job }) {
  const { matches, clients, saveMatch } = useStore();
  const [loading, setLoading] = useState(false);
  const rec = matches.find((m) => m.candidateId === c.id && m.jobId === job.id);
  async function run() {
    setLoading(true);
    try {
      const result: MatchResult = await runAI({ data: { task: "match", payload: { job, client: clients.find((x) => x.id === job.clientId), candidate: stripForAI(c) } } });
      await saveMatch(c.id, job.id, result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scoring failed");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{rec ? `Saved ${new Date(rec.createdAt).toLocaleDateString()}. Viewing it uses no AI credits.` : "No scorecard saved for this job yet."}</p>
        <GenerateButton loading={loading} onClick={run}>{rec ? "Re-score" : "Score match"}</GenerateButton>
      </div>
      {rec ? <Scorecard r={rec.result} compact /> : <EmptyState text={loading ? "Analyzing CV against the job..." : "Score this candidate to see evidence, strengths, gaps and questions."} />}
    </div>
  );
}

function OutreachTab({ c, job }: { c: Candidate; job: Job }) {
  const { tracks, clients, startTrack, updateTrack } = useStore();
  const track = tracks.find((t) => t.candidateId === c.id && t.jobId === job.id);
  const [stepIdx, setStepIdx] = useState(track?.step ?? 0);
  const [channel, setChannel] = useState<string>(STEPS[track?.step ?? 0]!.channel);
  const [busy, setBusy] = useState(false);
  const draft = track?.drafts[String(stepIdx)];
  const [subject, setSubject] = useState(draft?.subject ?? "");
  const [body, setBody] = useState(draft?.body ?? "");

  useEffect(() => {
    setSubject(draft?.subject ?? "");
    setBody(draft?.body ?? "");
  }, [draft?.subject, draft?.body, stepIdx]);

  if (!track) {
    return (
      <div className="space-y-3 pt-2">
        <EmptyState text="This candidate is not in an outreach sequence for this job." />
        <Button onClick={() => startTrack(c.id, job.id).then((r) => r && toast.success("Sequence started"))}>Start sequence</Button>
      </div>
    );
  }
  const t = track;

  async function generate() {
    setBusy(true);
    try {
      const step = STEPS[stepIdx]!;
      const history = t.history.filter((h) => h.step < stepIdx).map((h) => ({ step: STEPS[h.step]?.label, message: t.drafts[String(h.step)]?.body }));
      const r: { subject: string; body: string } = await runAI({
        data: { task: "step_draft", payload: { job, client: clients.find((x) => x.id === job.clientId), candidate: stripForAI(c), step: { index: stepIdx + 1, of: STEPS.length, label: step.label, channel }, history } },
      });
      await updateTrack(t.id, { drafts: { ...t.drafts, [String(stepIdx)]: { subject: r.subject, body: r.body } } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not write the draft");
    } finally {
      setBusy(false);
    }
  }
  const save = () => updateTrack(t.id, { drafts: { ...t.drafts, [String(stepIdx)]: { subject, body } } });
  const text = subject ? `Subject: ${subject}\n\n${body}` : body;
  const isCurrent = t.status === "active" && stepIdx === t.step;
  const dirty = body !== (draft?.body ?? "") || subject !== (draft?.subject ?? "");

  return (
    <div className="space-y-4 pt-2">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant="secondary">{STATUS_LABEL[t.status]}</Badge>
        {t.status === "active" && <span className="text-muted-foreground">Current: Step {t.step + 1} · {dueLabel(t)}</span>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Step</Label>
          <Select value={String(stepIdx)} onValueChange={(v) => { setStepIdx(Number(v)); setChannel(STEPS[Number(v)]!.channel); }}>
            <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STEPS.map((s, i) => <SelectItem key={s.label} value={String(i)}>Step {i + 1}: {s.label}{t.drafts[String(i)] ? " (draft saved)" : ""}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Channel</Label>
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="LinkedIn">LinkedIn</SelectItem>
              <SelectItem value="Email">Email</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {draft || dirty ? (
        <div className="space-y-2">
          {channel === "Email" || stepIdx === 1 ? <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="bg-card" /> : null}
          <Textarea rows={9} value={body} onChange={(e) => setBody(e.target.value)} className="bg-card text-sm" />
        </div>
      ) : (
        <EmptyState text="No draft saved for this step. Write one with AI or type your own." />
      )}
      <div className="flex flex-wrap items-center gap-2">
        {!draft && !dirty && <Button variant="outline" size="sm" onClick={() => setBody(" ")}>Write manually</Button>}
        <Button variant="outline" size="sm" onClick={generate} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : draft ? <RotateCcw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}{draft ? "Rewrite with AI" : "Write with AI"}
        </Button>
        {dirty && <Button size="sm" variant="secondary" onClick={() => { save(); toast.success("Draft saved"); }}>Save draft</Button>}
        {body.trim() && <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(text); toast.success("Copied"); }}><Copy className="h-4 w-4" />Copy</Button>}
        {isCurrent && (
          <Button size="sm" className="ml-auto" onClick={async () => {
            if (body.trim()) { await navigator.clipboard.writeText(text).catch(() => {}); await save(); }
            await updateTrack(t.id, markSentPatch(t));
            toast.success("Copied and marked sent");
            setStepIdx(Math.min(t.step + 1, STEPS.length - 1));
          }}><Check className="h-4 w-4" />Copy and mark sent</Button>
        )}
      </div>
    </div>
  );
}

function CallsTab({ c, job }: { c: Candidate; job: Job }) {
  const { transcripts, clients, addTranscript, updateTranscript } = useStore();
  const list = transcripts.filter((t) => t.candidateId === c.id);
  const [selId, setSelId] = useState<string>(list.find((t) => t.jobId === job.id)?.id ?? list[0]?.id ?? "new");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const sel = list.find((t) => t.id === selId);

  async function run() {
    const notes = sel ? sel.text : text;
    if (notes.trim().length < 30) return;
    setLoading(true);
    try {
      const result: SynthesisResult = await runAI({ data: { task: "synthesize", payload: { job, client: clients.find((x) => x.id === job.clientId), candidate: stripForAI(c), transcript: notes } } });
      if (sel) await updateTranscript(sel.id, { result });
      else {
        const id = await addTranscript({ candidateId: c.id, jobId: job.id, text: notes, title: `Call notes: ${c.name}`, result });
        if (id) setSelId(id);
        setText("");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Synthesis failed");
    } finally {
      setLoading(false);
    }
  }
  const r = sel?.result;

  return (
    <div className="space-y-4 pt-2">
      <div className="flex flex-wrap gap-2">
        {list.map((t) => <Button key={t.id} size="sm" variant={selId === t.id ? "default" : "outline"} onClick={() => setSelId(t.id)}>{t.title}</Button>)}
        <Button size="sm" variant={selId === "new" ? "default" : "outline"} onClick={() => setSelId("new")}>New notes</Button>
      </div>
      {sel ? (
        <details className="rounded-xl border bg-muted/30 p-4 text-sm"><summary className="cursor-pointer font-medium">Transcript</summary><p className="mt-3 whitespace-pre-wrap font-mono text-xs text-muted-foreground">{sel.text}</p></details>
      ) : (
        <Textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste call notes or a transcript..." className="font-mono text-xs" />
      )}
      {!r && <GenerateButton loading={loading} disabled={!sel && text.trim().length < 30} onClick={run}>Synthesize</GenerateButton>}
      {r ? (
        <div className="space-y-4 rounded-xl border bg-card p-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold">{r.headline}</h3>
            <Button size="sm" variant="ghost" onClick={run} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}Re-synthesize</Button>
          </div>
          <p className="text-sm leading-relaxed">{r.executiveSummary}</p>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-md bg-muted p-3"><div className="text-xs font-semibold uppercase text-muted-foreground">Compensation</div>Current: {r.compensation.current}<br /><strong>Expected: {r.compensation.expected}</strong></div>
            <div className="rounded-md bg-muted p-3"><div className="text-xs font-semibold uppercase text-muted-foreground">Availability</div>Notice: {r.availability.noticePeriod}<br /><strong>Start: {r.availability.earliestStart}</strong></div>
          </div>
          <ul className="list-disc space-y-1 pl-5 text-sm">{r.highlights.map((h, i) => <li key={i}>{h}</li>)}</ul>
          <p className="text-sm text-muted-foreground"><strong className="text-foreground">Culture fit:</strong> {r.cultureFit}</p>
          <div className="rounded-lg border-2 border-primary/30 p-4">
            <div className="mb-2 flex items-center justify-between"><span className="text-xs uppercase tracking-wider text-primary">Submission note</span>
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(`Subject: ${r.submissionNote.subject}\n\n${r.submissionNote.body}`); toast.success("Copied"); }}><Copy className="h-3.5 w-3.5" />Copy</Button></div>
            <div className="font-semibold">{r.submissionNote.subject}</div>
            <p className="mt-2 whitespace-pre-wrap text-sm">{r.submissionNote.body}</p>
          </div>
        </div>
      ) : sel ? <EmptyState text={loading ? "Synthesizing the call..." : "Not yet synthesized."} /> : null}
    </div>
  );
}
