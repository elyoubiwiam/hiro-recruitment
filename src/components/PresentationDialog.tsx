import { useState } from "react";
import { Copy, EyeOff, Printer } from "lucide-react";
import { toast } from "sonner";
import { tierOf } from "@/components/Scorecard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/lib/store";
import type { Candidate, Job } from "@/lib/types";

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const PHONE = /(\+?\d[\d\s().-]{7,}\d)/g;

/** Removes email addresses and phone numbers from any client-facing text. */
export function redact(s: string, c: Candidate) {
  let out = s.replace(EMAIL, "[email redacted]").replace(PHONE, "[phone redacted]");
  if (c.email) out = out.split(c.email).join("[email redacted]");
  if (c.phone) out = out.split(c.phone).join("[phone redacted]");
  return out;
}

export function PresentationDialog({ open, onOpenChange, candidate: c, job }: { open: boolean; onOpenChange: (o: boolean) => void; candidate: Candidate; job?: Job }) {
  const { matches, transcripts, clients } = useStore();
  const [anon, setAnon] = useState(false);
  const match = job ? matches.find((m) => m.candidateId === c.id && m.jobId === job.id)?.result : undefined;
  const call = transcripts.find((t) => t.candidateId === c.id && t.jobId === job?.id && t.result)?.result ?? transcripts.find((t) => t.candidateId === c.id && t.result)?.result;
  const client = clients.find((x) => x.id === job?.clientId);
  const name = anon ? `Candidate ${c.name.split(" ").map((p) => p[0]).join("")}` : c.name;

  const summary = call?.executiveSummary || match?.summary || c.summary;
  const highlights = call?.highlights?.length ? call.highlights : match?.strengths?.map((s) => s.point) ?? [];
  const strengths = call?.strengths ?? [];
  const sections: [string, string[]][] = [
    ["Executive summary", [summary]],
    ["Key highlights", highlights],
    ...(strengths.length ? [["Strengths", strengths] as [string, string[]]] : []),
    ["Compensation", call ? [`Current: ${call.compensation.current}`, `Expected: ${call.compensation.expected}`] : ["Not discussed yet"]],
    ["Availability", call ? [`Notice period: ${call.availability.noticePeriod}`, `Earliest start: ${call.availability.earliestStart}`] : ["Not discussed yet"]],
    ...(call?.cultureFit ? [["Culture fit", [call.cultureFit]] as [string, string[]]] : []),
    ["Core skills", [c.skills.slice(0, 12).join(", ")]],
  ];
  const clean = (s: string) => redact(anon ? s.split(c.name).join(name) : s, c);

  const plain = [
    `${name}: ${c.headline}`,
    job ? `Role: ${job.title}${client ? ` at ${client.name}` : ""}` : "",
    match ? `Match score: ${match.score}% (${tierOf(match.score)})` : "",
    c.location ? `Location: ${c.location}` : "",
    "",
    ...sections.flatMap(([h, items]) => [h.toUpperCase(), ...items.map((i) => (items.length > 1 ? `- ${clean(i)}` : clean(i))), ""]),
    "Contact details are withheld. Please arrange introductions through your recruiter.",
  ].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n");

  function print() {
    const w = window.open("", "_blank");
    if (!w) return toast.error("Allow pop-ups to export the presentation.");
    const esc = (s: string) => s.replace(/[&<>]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[ch]!);
    w.document.write(`<html><head><title>${esc(name)} | Candidate presentation</title><style>body{font-family:Inter,system-ui,sans-serif;max-width:720px;margin:40px auto;color:#1a1523;line-height:1.55}h1{margin:0}h2{font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#773CD6;margin-top:28px}.score{font-size:40px;font-weight:700;color:#773CD6}.muted{color:#6b6477}</style></head><body>
      <h1>${esc(name)}</h1><div class="muted">${esc(c.headline)}${c.location ? ` · ${esc(c.location)}` : ""}</div>
      ${job ? `<p>Presented for <strong>${esc(job.title)}</strong>${client ? ` at ${esc(client.name)}` : ""}</p>` : ""}
      ${match ? `<div class="score">${match.score}% <span style="font-size:16px">${tierOf(match.score)}</span></div>` : ""}
      ${sections.map(([h, items]) => `<h2>${esc(h)}</h2>${items.length > 1 ? `<ul>${items.map((i) => `<li>${esc(clean(i))}</li>`).join("")}</ul>` : `<p>${esc(clean(items[0] ?? ""))}</p>`}`).join("")}
      <p class="muted" style="margin-top:32px;font-size:12px">Contact details are withheld. Please arrange introductions through your recruiter.</p>
      <script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Client presentation</DialogTitle>
          <DialogDescription>Built from saved scorecards and call notes, so it uses no AI credits. Email and phone are removed automatically.</DialogDescription>
        </DialogHeader>
        <label className="flex items-center gap-2 text-sm"><Switch checked={anon} onCheckedChange={setAnon} /><EyeOff className="h-4 w-4 text-muted-foreground" />Hide candidate name</label>
        <div className="rounded-xl border bg-muted/30 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold">{name}</h3>
              <p className="text-sm text-muted-foreground">{c.headline}{c.location ? ` · ${c.location}` : ""}</p>
              {job && <p className="mt-1 text-xs">For <strong>{job.title}</strong>{client ? ` at ${client.name}` : ""}</p>}
            </div>
            {match && <div className="text-right"><div className="font-display text-3xl font-semibold text-primary">{match.score}%</div><div className="text-xs text-muted-foreground">{tierOf(match.score)}</div></div>}
          </div>
          {sections.map(([h, items]) => (
            <div key={h} className="mt-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-primary">{h}</div>
              {items.length > 1 ? <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">{items.map((i, k) => <li key={k}>{clean(i)}</li>)}</ul> : <p className="mt-1 text-sm">{clean(items[0] ?? "")}</p>}
            </div>
          ))}
          <p className="mt-5 text-xs text-muted-foreground">Contact details withheld: [email redacted] · [phone redacted]</p>
        </div>
        {!match && !call && <p className="text-xs text-muted-foreground">Tip: score the match and synthesize a call first for a richer presentation.</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => { navigator.clipboard.writeText(plain); toast.success("Presentation copied"); }}><Copy className="h-4 w-4" />Copy text</Button>
          <Button onClick={print}><Printer className="h-4 w-4" />Export PDF</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
