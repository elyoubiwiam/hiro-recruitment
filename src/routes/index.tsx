import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, LayoutGrid, List, MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { money } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { uid, useStore } from "@/lib/store";
import { STAGES, type Job, type Stage } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Clients & Jobs — Talentdesk" },
      { name: "description", content: "Manage agency clients and open job requisitions in list or pipeline view." },
      { property: "og:title", content: "Clients & Jobs — Talentdesk" },
      { property: "og:description", content: "Manage agency clients and open job requisitions." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { clients, jobs, candidates, transcripts, update } = useStore();
  const [view, setView] = useState<"list" | "pipeline">("pipeline");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const shown = jobs.filter((j) => clientFilter === "all" || j.clientId === clientFilter);
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "—";
  const setStage = (id: string, stage: Stage) =>
    update((d) => ({ ...d, jobs: d.jobs.map((j) => (j.id === id ? { ...j, stage } : j)) }));

  return (
    <>
      <PageHeader
        title="Clients & Jobs"
        subtitle="Your agency's book of business at a glance."
        action={
          <div className="flex gap-2">
            <NewClientDialog />
            <NewJobDialog />
          </div>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ["Active clients", clients.length],
          ["Open jobs", jobs.filter((j) => j.stage !== "filled").length],
          ["Candidates", candidates.length],
          ["Call notes", transcripts.length],
        ].map(([l, v]) => (
          <div key={l} className="rounded-lg border bg-card p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{l}</div>
            <div className="mt-1 font-display text-4xl">{v}</div>
          </div>
        ))}
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((c) => (
          <button
            key={c.id}
            onClick={() => setClientFilter(clientFilter === c.id ? "all" : c.id)}
            className={`rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary ${clientFilter === c.id ? "border-primary ring-1 ring-primary" : ""}`}
          >
            <div className="flex items-center gap-2 font-semibold"><Building2 className="h-4 w-4 text-accent" />{c.name}</div>
            <div className="text-sm text-muted-foreground">{c.industry}</div>
            <div className="mt-2 text-xs text-muted-foreground">
              {c.contactName} · {jobs.filter((j) => j.clientId === c.id).length} jobs
            </div>
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl">
          Requisitions {clientFilter !== "all" && <span className="text-muted-foreground">· {clientName(clientFilter)}</span>}
        </h2>
        <div className="flex rounded-md border bg-card p-0.5">
          <Button size="sm" variant={view === "pipeline" ? "default" : "ghost"} onClick={() => setView("pipeline")}><LayoutGrid className="h-4 w-4" />Pipeline</Button>
          <Button size="sm" variant={view === "list" ? "default" : "ghost"} onClick={() => setView("list")}><List className="h-4 w-4" />List</Button>
        </div>
      </div>

      {view === "pipeline" ? (
        <div className="grid gap-3 overflow-x-auto lg:grid-cols-5">
          {STAGES.map((s) => {
            const col = shown.filter((j) => j.stage === s.id);
            return (
              <div key={s.id} className="min-w-56 rounded-lg bg-muted/60 p-3">
                <div className="mb-3 flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {s.label}<span>{col.length}</span>
                </div>
                <div className="space-y-2">
                  {col.map((j) => (
                    <div key={j.id} className="rounded-md border bg-card p-3 shadow-sm">
                      <Link to="/jobs/$jobId" params={{ jobId: j.id }} className="font-semibold hover:text-accent">{j.title}</Link>
                      <div className="text-xs text-muted-foreground">{clientName(j.clientId)}</div>
                      <div className="mt-2 text-xs">{money(j.salaryMin)}–{money(j.salaryMax)}</div>
                      <Select value={j.stage} onValueChange={(v) => setStage(j.id, v as Stage)}>
                        <SelectTrigger className="mt-2 h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{STAGES.map((x) => <SelectItem key={x.id} value={x.id}>{x.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="p-3">Role</th><th className="p-3">Client</th><th className="p-3">Location</th><th className="p-3">Salary</th><th className="p-3">Stage</th></tr>
            </thead>
            <tbody>
              {shown.map((j) => (
                <tr key={j.id} className="border-t">
                  <td className="p-3"><Link to="/jobs/$jobId" params={{ jobId: j.id }} className="font-semibold hover:text-accent">{j.title}</Link><div className="text-xs text-muted-foreground">{j.department}</div></td>
                  <td className="p-3">{clientName(j.clientId)}</td>
                  <td className="p-3"><span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{j.location}</span><span className="text-xs text-muted-foreground">{j.workMode}</span></td>
                  <td className="p-3">{money(j.salaryMin)}–{money(j.salaryMax)}</td>
                  <td className="p-3"><Badge variant="secondary">{STAGES.find((s) => s.id === j.stage)?.label}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function NewClientDialog() {
  const { update } = useStore();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", industry: "", contactName: "", contactEmail: "" });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline"><Plus className="h-4 w-4" />Client</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New client</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          {(["name", "industry", "contactName", "contactEmail"] as const).map((k) => (
            <div key={k} className="space-y-1"><Label className="capitalize">{k.replace(/([A-Z])/g, " $1")}</Label>
              <Input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>
          ))}
          <Button disabled={!f.name} onClick={() => {
            update((d) => ({ ...d, clients: [...d.clients, { id: uid(), ...f }] }));
            setOpen(false); setF({ name: "", industry: "", contactName: "", contactEmail: "" });
            toast.success("Client added");
          }}>Save client</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NewJobDialog() {
  const { clients, update } = useStore();
  const [open, setOpen] = useState(false);
  const blank = { clientId: "", title: "", department: "", salaryMin: "", salaryMax: "", location: "", workMode: "Hybrid", mustHave: "", softFactors: "", description: "" };
  const [f, setF] = useState(blank);
  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4" />Job</Button></DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>New job requisition</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1"><Label>Client</Label>
            <Select value={f.clientId} onValueChange={(v) => setF({ ...f, clientId: v })}>
              <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select></div>
          <div className="space-y-1"><Label>Job title</Label><Input value={f.title} onChange={set("title")} /></div>
          <div className="space-y-1"><Label>Department</Label><Input value={f.department} onChange={set("department")} /></div>
          <div className="space-y-1"><Label>Location</Label><Input value={f.location} onChange={set("location")} /></div>
          <div className="space-y-1"><Label>Salary min (USD)</Label><Input type="number" value={f.salaryMin} onChange={set("salaryMin")} /></div>
          <div className="space-y-1"><Label>Salary max (USD)</Label><Input type="number" value={f.salaryMax} onChange={set("salaryMax")} /></div>
          <div className="space-y-1"><Label>Work mode</Label>
            <Select value={f.workMode} onValueChange={(v) => setF({ ...f, workMode: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["Remote", "Hybrid", "On-site"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select></div>
          <div className="space-y-1"><Label>Must-have skills (comma separated)</Label><Input value={f.mustHave} onChange={set("mustHave")} /></div>
          <div className="space-y-1 sm:col-span-2"><Label>Soft factors (comma separated)</Label><Input value={f.softFactors} onChange={set("softFactors")} /></div>
          <div className="space-y-1 sm:col-span-2"><Label>Job description</Label><Textarea rows={5} value={f.description} onChange={set("description")} /></div>
          <Button className="sm:col-span-2" disabled={!f.title || !f.clientId} onClick={() => {
            const split = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
            const job: Job = {
              id: uid(), clientId: f.clientId, title: f.title, department: f.department, location: f.location,
              salaryMin: Number(f.salaryMin) || 0, salaryMax: Number(f.salaryMax) || 0, currency: "USD",
              workMode: f.workMode as Job["workMode"], mustHave: split(f.mustHave), softFactors: split(f.softFactors),
              description: f.description, stage: "intake", createdAt: new Date().toISOString(),
            };
            update((d) => ({ ...d, jobs: [...d.jobs, job] }));
            setOpen(false); setF(blank); toast.success("Job created");
          }}>Create job</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
