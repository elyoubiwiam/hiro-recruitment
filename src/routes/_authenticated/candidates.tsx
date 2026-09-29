import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Filter, PanelRightOpen, FileSearch, GraduationCap, Mail, MapPin, Phone, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { EmptyState, GenerateButton } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { runAI } from "@/lib/ai.functions";
import { extractFile } from "@/lib/file-extract";
import { cvMeta, saveCvFile } from "@/lib/cv-files";
import { useStore } from "@/lib/store";
import { useCandidateDrawer } from "@/components/CandidateDrawer";

export const Route = createFileRoute("/_authenticated/candidates")({
  head: () => ({
    meta: [
      { title: "Candidates | Talentdesk" },
      { name: "description", content: "Upload CVs and let AI parse them into structured candidate profiles." },
      { property: "og:title", content: "Candidates | Talentdesk" },
      { property: "og:description", content: "AI CV parsing into structured candidate profiles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CandidatesPage,
});

function CandidatesPage() {
  const { candidates, addCandidate, deleteCandidate } = useStore();
  const drawer = useCandidateDrawer();
  const [selected, setSelected] = useState<string | undefined>(candidates[0]?.id);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [fLocations, setFLocations] = useState<string[]>([]);
  const [fSkills, setFSkills] = useState<string[]>([]);
  const [fSchools, setFSchools] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const current = candidates.find((c) => c.id === selected) ?? candidates[0];

  const sorted = useMemo(
    () => [...candidates].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [candidates],
  );
  const locations = useMemo(() => [...new Set(candidates.map((c) => c.location).filter(Boolean))].sort(), [candidates]);
  const skills = useMemo(() => [...new Set(candidates.flatMap((c) => c.skills))].sort(), [candidates]);
  const schools = useMemo(() => [...new Set(candidates.flatMap((c) => c.education.map((e) => e.school)).filter(Boolean))].sort(), [candidates]);

  const filtering = query.trim() !== "" || fLocations.length > 0 || fSkills.length > 0 || fSchools.length > 0;
  const visible = useMemo(() => {
    if (!filtering) return sorted.slice(0, 5);
    const q = query.trim().toLowerCase();
    return sorted.filter((c) => {
      if (q && ![c.name, c.headline, c.summary, c.location, ...c.skills].join(" ").toLowerCase().includes(q)) return false;
      if (fLocations.length && !fLocations.includes(c.location)) return false;
      if (fSkills.length && !fSkills.some((s) => c.skills.includes(s))) return false;
      if (fSchools.length && !c.education.some((e) => fSchools.includes(e.school))) return false;
      return true;
    });
  }, [sorted, filtering, query, fLocations, fSkills, fSchools]);

  function toggle(list: string[], set: (v: string[]) => void, value: string) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }
  function clearFilters() {
    setQuery(""); setFLocations([]); setFSkills([]); setFSchools([]);
  }

  async function parse(payload: { text?: string; fileData?: string; filename?: string }, file?: File) {
    setLoading(true);
    try {
      const r = await runAI({ data: { task: "parse_cv", payload } });
      const cand = await addCandidate({
        name: r.name || "Unnamed candidate", email: r.email || "", phone: r.phone || "",
        location: r.location || "", headline: r.headline || "", summary: r.summary || "",
        skills: r.skills || [], experience: r.experience || [], education: r.education || [],
        rawText: payload.text || r.rawText || "",
        cvFile: file ? cvMeta(file) : undefined,
      });
      if (!cand) return;
      if (file) await saveCvFile(cand.id, file).catch(() => toast.error("Profile saved, but the CV file could not be stored."));
      setSelected(cand.id);
      setText("");
      toast.success(`Parsed ${cand.name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Parsing failed");
    } finally {
      setLoading(false);
    }
  }

  async function onFile(file?: File) {
    if (!file) return;
    try {
      await parse(await extractFile(file), file);
    } catch {
      toast.error("Could not read that file. Try PDF, DOCX or TXT.");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <>
      <PageHeader title="Candidates" subtitle="Upload a CV to create a structured candidate profile." />
      <div className="mb-8 rounded-xl border bg-card p-5">
        <Tabs defaultValue="upload">
          <TabsList><TabsTrigger value="upload">Upload file</TabsTrigger><TabsTrigger value="paste">Paste text</TabsTrigger></TabsList>
          <TabsContent value="upload">
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }}
              className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 text-center hover:border-primary"
            >
              <Upload className="h-6 w-6 text-primary" />
              <div className="font-semibold">{loading ? "Parsing CV..." : "Drop a CV here or click to browse"}</div>
              <div className="text-xs text-muted-foreground">PDF, Word (.docx) or .txt</div>
              <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.md" className="hidden" disabled={loading} onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
          </TabsContent>
          <TabsContent value="paste" className="space-y-3">
            <Textarea rows={8} placeholder="Paste the full CV text..." value={text} onChange={(e) => setText(e.target.value)} className="mt-3" />
            <GenerateButton loading={loading} disabled={text.trim().length < 50} onClick={() => parse({ text })}>Parse CV</GenerateButton>
          </TabsContent>
        </Tabs>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-2">
          <div className="mb-3 space-y-2">
            <Input placeholder="Search name, skill, headline..." value={query} onChange={(e) => setQuery(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              <FilterMenu label="Location" options={locations} active={fLocations} onToggle={(v) => toggle(fLocations, setFLocations, v)} />
              <FilterMenu label="Skill" options={skills} active={fSkills} onToggle={(v) => toggle(fSkills, setFSkills, v)} />
              <FilterMenu label="Education" options={schools} active={fSchools} onToggle={(v) => toggle(fSchools, setFSchools, v)} />
              {filtering && (
                <Button size="sm" variant="ghost" onClick={clearFilters}><X className="h-4 w-4" />Clear</Button>
              )}
            </div>
          </div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {filtering ? `${visible.length} candidate${visible.length === 1 ? "" : "s"} found` : "Latest candidates added"}
          </div>
          {visible.map((c) => (
            <button key={c.id} onClick={() => { setSelected(c.id); drawer.open(c.id); }}
              className={`w-full rounded-xl border bg-card p-3 text-left hover:border-primary ${current?.id === c.id ? "border-primary ring-1 ring-primary" : ""}`}>
              <div className="font-semibold">{c.name}</div>
              <div className="truncate text-sm text-muted-foreground">{c.headline}</div>
            </button>
          ))}
          {visible.length === 0 && <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">No candidates match these filters.</div>}
        </div>
        {current ? (
          <div className="rounded-xl border bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl">{current.name}</h2>
                <div className="text-primary">{current.headline}</div>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {current.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{current.location}</span>}
                  {current.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{current.email}</span>}
                  {current.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{current.phone}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => drawer.open(current.id)}><PanelRightOpen className="h-4 w-4" />Open workspace</Button>
                <Button asChild size="sm" variant="outline"><Link to="/screening" search={{ candidate: current.id }}><FileSearch className="h-4 w-4" />Match to job</Link></Button>
                <Button size="sm" variant="ghost" aria-label="Delete candidate" onClick={() => {
                  if (!confirm(`Delete ${current.name}? Their CV file, scorecards, outreach and call notes will also be deleted.`)) return;
                  deleteCandidate(current.id);
                  setSelected(undefined);
                }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed">{current.summary}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">{current.skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}</div>
            <h3 className="mb-3 mt-6 text-xl">Experience</h3>
            <ol className="space-y-4 border-l-2 border-border pl-5">
              {current.experience.map((e, i) => (
                <li key={i}>
                  <div className="font-semibold">{e.title} <span className="font-normal text-muted-foreground">· {e.company}</span></div>
                  <div className="text-xs text-muted-foreground">{e.start} to {e.end}</div>
                  {e.highlights?.length > 0 && <ul className="mt-1 list-disc pl-4 text-sm text-muted-foreground">{e.highlights.map((h, j) => <li key={j}>{h}</li>)}</ul>}
                </li>
              ))}
            </ol>
            <h3 className="mb-2 mt-6 text-xl">Education</h3>
            {current.education.map((e, i) => (
              <div key={i} className="flex items-center gap-2 text-sm"><GraduationCap className="h-4 w-4 text-primary" />{e.degree}, {e.school} {e.year && `(${e.year})`}</div>
            ))}
          </div>
        ) : <EmptyState text="Select or upload a candidate." />}
      </div>
    </>
  );
}

function FilterMenu({ label, options, active, onToggle }: { label: string; options: string[]; active: string[]; onToggle: (v: string) => void }) {
  if (options.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant={active.length ? "default" : "outline"}>
          <Filter className="h-3.5 w-3.5" />{label}{active.length > 0 && ` (${active.length})`}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-72 overflow-auto">
        <DropdownMenuLabel>{label}: select one or more</DropdownMenuLabel>
        {options.map((o) => (
          <DropdownMenuCheckboxItem key={o} checked={active.includes(o)} onCheckedChange={() => onToggle(o)}>{o}</DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
