import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Building2, ChevronRight, LayoutGrid, List, MapPin, Plus } from "lucide-react";
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
import { useStore } from "@/lib/store";
import { STAGES, type Job, type Stage } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/jobs/")({
  head: () => ({
    meta: [
      { title: "Clients & Jobs | Talentdesk" },
      { name: "description", content: "Manage agency clients and open job requisitions in list or pipeline view." },
      { property: "og:title", content: "Clients & Jobs | Talentdesk" },
      { property: "og:description", content: "Manage agency clients and open job requisitions." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { clients, jobs, candidates, tracks, updateJob } = useStore();
  const [view, setView] = useState<"list" | "pipeline">("pipeline");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [openOnly, setOpenOnly] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 } | null>(null);
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "Not available";
  const stageIdx = (s: Stage) => STAGES.findIndex((x) => x.id === s);
  const shown = jobs
    .filter((j) => clientFilter === "all" || j.clientId === clientFilter)
    .filter((j) => !openOnly || j.stage !== "filled")
    .sort((a, b) => {
      if (!sort) return 0;
      const v = (j: Job): string | number =>
        sort.key === "title" ? j.title.toLowerCase()
        : sort.key === "client" ? clientName(j.clientId).toLowerCase()
        : sort.key === "location" ? j.location.toLowerCase()
        : sort.key === "salary" ? Number(j.salaryMin) || 0
        : stageIdx(j.stage);
      const x = v(a), y = v(b);
      return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
    });
  const toggleSort = (key: SortKey) =>
    setSort((s) => (s?.key === key ? (s.dir === 1 ? { key, dir: -1 } : null) : { key, dir: 1 }));
  const SortTh = ({ k, label }: { k: SortKey; label: string }) => (
    <th className="p-0">
      <button onClick={() => toggleSort(k)} className="flex w-full items-center gap-1 p-3 uppercase tracking-wider transition-colors hover:text-foreground">
        {label}
        {sort?.key === k ? (sort.dir === 1 ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
      </button>
    </th>
  );
  const setStage = (id: string, stage: Stage) =>
    updateJob(id, { stage });

  return (
    <>
      <PageHeader
        title="Clients & Jobs"
        subtitle="Review clients, requisitions and pipeline status."
        action={
          <div className="flex gap-2">
            <NewClientDialog />
            <NewJobDialog />
          </div>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <button onClick={() => { setClientFilter("all"); setOpenOnly(false); }} className={`group relative rounded-xl border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lg hover:shadow-primary/10 cursor-pointer ${!openOnly && clientFilter === "all" ? "border-primary ring-1 ring-primary" : ""}`}>
          <StatInner label="All clients & jobs" value={clients.length} />
        </button>
        <button onClick={() => { setOpenOnly(!openOnly); setView("list"); }} className={`group relative rounded-xl border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lg hover:shadow-primary/10 cursor-pointer ${openOnly ? "border-primary ring-1 ring-primary" : ""}`}>
          <StatInner label="Open jobs" value={jobs.filter((j) => j.stage !== "filled").length} />
        </button>
        <Link to="/candidates" className="group relative rounded-xl border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lg hover:shadow-primary/10 cursor-pointer">
          <StatInner label="Candidates" value={candidates.length} />
        </Link>
        <Link to="/today" className="group relative rounded-xl border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lg hover:shadow-primary/10 cursor-pointer">
          <StatInner label="In outreach" value={tracks.filter((t) => t.status === "active").length} />
        </Link>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((c) => (
          <button
            key={c.id}
            onClick={() => setClientFilter(clientFilter === c.id ? "all" : c.id)}
            className={`group relative cursor-pointer rounded-xl border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lg hover:shadow-primary/10 ${clientFilter === c.id ? "border-primary ring-1 ring-primary" : ""}`}
          >
            <ChevronRight className="absolute right-3 top-4 h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="flex items-center gap-2 font-semibold"><Building2 className="h-4 w-4 text-primary" />{c.name}</div>
            <div className="text-sm text-muted-foreground">{c.industry}</div>
            <div className="mt-2 text-xs text-muted-foreground">
              {c.contactName} · {jobs.filter((j) => j.clientId === c.id).length} jobs
            </div>
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl">
          Requisitions {openOnly && <span className="text-muted-foreground">· open</span>} {clientFilter !== "all" && <span className="text-muted-foreground">· {clientName(clientFilter)}</span>}
        </h2>
        <div className="flex rounded-md border bg-card p-0.5">
          <Button size="sm" variant={view === "pipeline" ? "default" : "ghost"} onClick={() => setView("pipeline")}><LayoutGrid className="h-4 w-4" />Pipeline</Button>
          <Button size="sm" variant={view === "list" ? "default" : "ghost"} onClick={() => setView("list")}><List className="h-4 w-4" />List</Button>
        </div>
      </div>

      {view === "pipeline" ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {STAGES.map((s) => {
            const col = shown.filter((j) => j.stage === s.id);
            return (
              <div key={s.id} className="min-w-52 flex-1 rounded-lg bg-muted/60 p-3">
                <div className="mb-3 flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {s.label}<span>{col.length}</span>
                </div>
                <div className="space-y-2">
                  {col.map((j) => (
                    <div key={j.id} className="rounded-md border bg-card p-3 shadow-sm">
                      <Link to="/jobs/$jobId" params={{ jobId: j.id }} className="font-semibold hover:text-primary">{j.title}</Link>
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
        <div className="overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><SortTh k="title" label="Role" /><SortTh k="client" label="Client" /><SortTh k="location" label="Location" /><SortTh k="salary" label="Salary" /><SortTh k="stage" label="Stage" /></tr>
            </thead>
            <tbody>
              {shown.map((j) => (
                <tr key={j.id} className="border-t transition-colors hover:bg-muted/40">
                  <td className="p-3"><Link to="/jobs/$jobId" params={{ jobId: j.id }} className="font-semibold hover:text-primary">{j.title}</Link><div className="text-xs text-muted-foreground">{j.department}</div></td>
                  <td className="p-3">{clientName(j.clientId)}</td>
                  <td className="p-3"><span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{j.location}</span><span className="text-xs text-muted-foreground">{j.workMode}</span></td>
                  <td className="p-3">{money(j.salaryMin)}–{money(j.salaryMax)}</td>
                  <td className="p-3">
                    <Select value={j.stage} onValueChange={(v) => setStage(j.id, v as Stage)}>
                      <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{STAGES.map((x) => <SelectItem key={x.id} value={x.id}>{x.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

type SortKey = "title" | "client" | "location" | "salary" | "stage";

function StatInner({ label, value }: { label: string; value: number }) {
  return (
    <>
      <ChevronRight className="absolute right-3 top-4 h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-3xl font-bold group-hover:text-primary">{value}</div>
    </>
  );
}

function NewClientDialog() {
  const { addClient } = useStore();
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
            addClient(f);
            setOpen(false); setF({ name: "", industry: "", contactName: "", contactEmail: "" });
            toast.success("Client added");
          }}>Save client</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NewJobDialog() {
  const { clients, addJob } = useStore();
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
            const job: Omit<Job, "id" | "createdAt"> = {
              clientId: f.clientId, title: f.title, department: f.department, location: f.location,
              salaryMin: Number(f.salaryMin) || 0, salaryMax: Number(f.salaryMax) || 0, currency: "USD",
              workMode: f.workMode as Job["workMode"], mustHave: split(f.mustHave), softFactors: split(f.softFactors),
              description: f.description, stage: "intake",
            };
            addJob(job);
            setOpen(false); setF(blank); toast.success("Job created");
          }}>Create job</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
