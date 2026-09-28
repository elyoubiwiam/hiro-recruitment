import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { FileSearch, GraduationCap, Mail, MapPin, Phone, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { EmptyState, GenerateButton } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { runAI } from "@/lib/ai.functions";
import { extractFile } from "@/lib/file-extract";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/candidates")({
  head: () => ({
    meta: [
      { title: "Candidates — Talentdesk" },
      { name: "description", content: "Upload CVs and let AI parse them into structured candidate profiles." },
      { property: "og:title", content: "Candidates — Talentdesk" },
      { property: "og:description", content: "AI CV parsing into structured candidate profiles." },
    ],
  }),
  component: CandidatesPage,
});

function CandidatesPage() {
  const { candidates, addCandidate, deleteCandidate } = useStore();
  const [selected, setSelected] = useState<string | undefined>(candidates[0]?.id);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const current = candidates.find((c) => c.id === selected) ?? candidates[0];

  async function parse(payload: { text?: string; fileData?: string; filename?: string }) {
    setLoading(true);
    try {
      const r = await runAI({ data: { task: "parse_cv", payload } });
      const cand = await addCandidate({
        name: r.name || "Unnamed candidate", email: r.email || "", phone: r.phone || "",
        location: r.location || "", headline: r.headline || "", summary: r.summary || "",
        skills: r.skills || [], experience: r.experience || [], education: r.education || [],
        rawText: payload.text || r.rawText || "",
      });
      if (!cand) return;
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
      await parse(await extractFile(file));
    } catch {
      toast.error("Could not read that file. Try PDF, DOCX or TXT.");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <>
      <PageHeader title="Candidates" subtitle="Drop in a CV — AI turns it into a structured profile." />
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
              <div className="font-semibold">{loading ? "Parsing CV…" : "Drop a CV here or click to browse"}</div>
              <div className="text-xs text-muted-foreground">PDF, Word (.docx) or .txt</div>
              <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.md" className="hidden" disabled={loading} onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
          </TabsContent>
          <TabsContent value="paste" className="space-y-3">
            <Textarea rows={8} placeholder="Paste the full CV text…" value={text} onChange={(e) => setText(e.target.value)} className="mt-3" />
            <GenerateButton loading={loading} disabled={text.trim().length < 50} onClick={() => parse({ text })}>Parse CV</GenerateButton>
          </TabsContent>
        </Tabs>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-2">
          {candidates.map((c) => (
            <button key={c.id} onClick={() => setSelected(c.id)}
              className={`w-full rounded-xl border bg-card p-3 text-left hover:border-primary ${current?.id === c.id ? "border-primary ring-1 ring-primary" : ""}`}>
              <div className="font-semibold">{c.name}</div>
              <div className="truncate text-sm text-muted-foreground">{c.headline}</div>
            </button>
          ))}
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
                <Button asChild size="sm"><Link to="/screening" search={{ candidate: current.id }}><FileSearch className="h-4 w-4" />Match to job</Link></Button>
                <Button size="sm" variant="ghost" onClick={() => {
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
                  <div className="text-xs text-muted-foreground">{e.start} – {e.end}</div>
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
