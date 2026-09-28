import { useState } from "react";
import { Check, Copy, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setDone(true);
        toast.success("Copied to clipboard");
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {label}
    </Button>
  );
}

export function GenerateButton({ loading, onClick, children, disabled }: { loading: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <Button onClick={onClick} disabled={loading || disabled} >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {children}
    </Button>
  );
}

export function CandidateJobPicker({
  candidateId, jobId, onCandidate, onJob,
}: { candidateId?: string | undefined; jobId?: string | undefined; onCandidate: (v: string) => void; onJob: (v: string) => void }) {
  const { candidates, jobs, clients } = useStore();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label>Candidate</Label>
        <Select value={candidateId ?? ""} onValueChange={onCandidate}>
          <SelectTrigger className="bg-card"><SelectValue placeholder="Select a candidate" /></SelectTrigger>
          <SelectContent>
            {candidates.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name} — {c.headline}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Job</Label>
        <Select value={jobId ?? ""} onValueChange={onJob}>
          <SelectTrigger className="bg-card"><SelectValue placeholder="Select a job" /></SelectTrigger>
          <SelectContent>
            {jobs.filter((j) => j.stage !== "filled").map((j) => (
              <SelectItem key={j.id} value={j.id}>{j.title} · {clients.find((c) => c.id === j.clientId)?.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

export const money = (n: number, c = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n);

export function scoreTone(s: number) {
  return s >= 80 ? "text-success" : s >= 60 ? "text-warning" : "text-destructive";
}
