import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { seedCandidates, seedClients, seedJobs, seedMatches, seedTranscripts } from "./seed";
import { normalizeCopy } from "./copy";
import type { Candidate, Client, Job, MatchRecord, MatchResult, Track, Transcript } from "./types";

type Row = Record<string, any>;
const snake = (s: string) => s.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());
const camel = (s: string) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const toRow = (o: Row) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined).map(([k, v]) => [snake(k), v]));
const fromRow = <T,>(r: Row) => Object.fromEntries(Object.entries(r).map(([k, v]) => [camel(k), v])) as T;

interface Data {
  clients: Client[];
  jobs: Job[];
  candidates: Candidate[];
  matches: MatchRecord[];
  transcripts: Transcript[];
  tracks: Track[];
  triage: Record<string, TriageStatus>;
}
export type TriageStatus = "shortlisted" | "rejected";
export const triageKey = (candidateId: string, jobId: string) => `${candidateId}:${jobId}`;
const DEMO = true; // accounts disabled for now — data lives in this browser
const LS_KEY = "talentdesk-demo-v2";
const hrs = (h: number) => new Date(Date.now() + h * 3600000).toISOString();
function demoSeed(): Data {
  const t = (id: string, candidateId: string, jobId: string, step: number, next: string, history: number[]): Track => ({
    id, candidateId, jobId, step, status: "active", nextContactAt: next,
    lastContactedAt: history.length ? hrs(-history[history.length - 1]!) : null,
    history: history.map((h, i) => ({ step: i, sentAt: hrs(-h) })), drafts: {}, notes: "", createdAt: hrs(-240),
  });
  return {
    clients: seedClients, jobs: seedJobs, candidates: seedCandidates, matches: seedMatches.map((x) => ({ ...x, createdAt: x.createdAt })),
    transcripts: seedTranscripts.map((x) => ({ ...x, result: x.result ?? null })),
    tracks: [
      t("k1", "p1", "j1", 2, hrs(-20), [120, 70]),
      t("k2", "p2", "j2", 1, hrs(3), [40]),
      t("k3", "p3", "j1", 0, hrs(50), []),
    ],
    triage: {},
  };
}
const uid = () => (crypto as any).randomUUID?.() ?? Math.random().toString(36).slice(2);
const empty: Data = { clients: [], jobs: [], candidates: [], matches: [], transcripts: [], tracks: [], triage: {} };

interface Store extends Data {
  loading: boolean;
  userId: string | null;
  email: string | null;
  isAdmin: boolean;
  reload: () => Promise<void>;
  addClient: (c: Omit<Client, "id">) => Promise<void>;
  addJob: (j: Omit<Job, "id" | "createdAt">) => Promise<void>;
  updateJob: (id: string, p: Partial<Job>) => Promise<void>;
  addCandidate: (c: Omit<Candidate, "id" | "createdAt">) => Promise<Candidate | null>;
  deleteCandidate: (id: string) => Promise<void>;
  saveMatch: (candidateId: string, jobId: string, result: MatchResult) => Promise<void>;
  addTranscript: (t: Omit<Transcript, "id" | "createdAt">) => Promise<string | null>;
  updateTranscript: (id: string, p: Partial<Transcript>) => Promise<void>;
  startTrack: (candidateId: string, jobId: string, drafts?: Track["drafts"]) => Promise<Track | null>;
  updateTrack: (id: string, p: Partial<Track>) => Promise<void>;
  setTriage: (candidateId: string, jobId: string, status: TriageStatus | null) => void;
}

const Ctx = createContext<Store | null>(null);

function fail(error: { message: string } | null) {
  if (error) {
    toast.error(error.message);
    return true;
  }
  return false;
}

export const DEMO_MODE = DEMO;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(empty);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (DEMO && !loading) localStorage.setItem(LS_KEY, JSON.stringify(data));
  }, [data, loading]);

  const load = useCallback(async () => {
    if (DEMO) {
      let d: Data | null = null;
      try { d = JSON.parse(localStorage.getItem(LS_KEY) || "null"); } catch {}
      setData(normalizeCopy(d ? { ...d, triage: d.triage ?? {} } : demoSeed())); setUserId("demo"); setEmail("Demo workspace"); setIsAdmin(false); setLoading(false);
      return;
    }
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setData(empty); setUserId(null); setEmail(null); setIsAdmin(false); setLoading(false);
      return;
    }
    setUserId(u.user.id); setEmail(u.user.email ?? null);
    const [c, j, p, m, t, o, r] = await Promise.all([
      supabase.from("clients").select("*").order("created_at"),
      supabase.from("jobs").select("*").order("created_at"),
      supabase.from("candidates").select("*").order("created_at", { ascending: false }),
      supabase.from("matches").select("*"),
      supabase.from("transcripts").select("*").order("created_at", { ascending: false }),
      supabase.from("outreach_tracks").select("*").order("next_contact_at"),
      supabase.from("user_roles").select("role").eq("user_id", u.user.id),
    ]);
    setIsAdmin(!!r.data?.some((x) => x.role === "admin"));
    setData({
      clients: (c.data ?? []).map((x) => fromRow<Client>(x)),
      jobs: (j.data ?? []).map((x) => fromRow<Job>(x)),
      candidates: (p.data ?? []).map((x) => fromRow<Candidate>(x)),
      matches: (m.data ?? []).map((x) => fromRow<MatchRecord>(x)),
      transcripts: (t.data ?? []).map((x) => fromRow<Transcript>(x)),
      tracks: (o.data ?? []).map((x) => fromRow<Track>(x)),
      triage: {},
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    if (DEMO) return;
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") load();
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const insert = async <T,>(table: any, row: Row): Promise<T | null> => {
    if (DEMO) return { status: "active", step: 0, history: [], notes: "", lastContactedAt: null, ...row, id: uid(), createdAt: new Date().toISOString() } as T;
    const { data: d, error } = await supabase.from(table).insert(toRow(row) as any).select().single();
    if (fail(error)) return null;
    return fromRow<T>(d as Row);
  };
  const patch = async (table: any, id: string, p: Row) => {
    if (DEMO) return;
    const { error } = await supabase.from(table).update(toRow(p) as any).eq("id", id);
    fail(error);
  };

  const store: Store = {
    ...data, loading, userId, email, isAdmin, reload: load,
    addClient: async (c) => {
      const r = await insert<Client>("clients", c);
      if (r) setData((d) => ({ ...d, clients: [...d.clients, r] }));
    },
    addJob: async (j) => {
      const r = await insert<Job>("jobs", j);
      if (r) setData((d) => ({ ...d, jobs: [...d.jobs, r] }));
    },
    updateJob: async (id, p) => {
      setData((d) => ({ ...d, jobs: d.jobs.map((j) => (j.id === id ? { ...j, ...p } : j)) }));
      await patch("jobs", id, p);
    },
    addCandidate: async (c) => {
      const r = await insert<Candidate>("candidates", c);
      if (r) setData((d) => ({ ...d, candidates: [r, ...d.candidates] }));
      return r;
    },
    deleteCandidate: async (id) => {
      setData((d) => ({ ...d, candidates: d.candidates.filter((c) => c.id !== id), tracks: d.tracks.filter((t) => t.candidateId !== id) }));
      if (DEMO) return;
      const { error } = await supabase.from("candidates").delete().eq("id", id);
      fail(error);
    },
    saveMatch: async (candidateId, jobId, result) => {
      if (DEMO) {
        const rec: MatchRecord = { candidateId, jobId, result, createdAt: new Date().toISOString() };
        setData((d) => ({ ...d, matches: [...d.matches.filter((m) => !(m.candidateId === candidateId && m.jobId === jobId)), rec] }));
        return;
      }
      const { data: row, error } = await supabase
        .from("matches")
        .upsert({ candidate_id: candidateId, job_id: jobId, result: result as any }, { onConflict: "candidate_id,job_id" })
        .select().single();
      if (fail(error) || !row) return;
      const rec = fromRow<MatchRecord>(row);
      setData((d) => ({ ...d, matches: [...d.matches.filter((m) => !(m.candidateId === candidateId && m.jobId === jobId)), rec] }));
    },
    addTranscript: async (t) => {
      const r = await insert<Transcript>("transcripts", t);
      if (r) setData((d) => ({ ...d, transcripts: [r, ...d.transcripts] }));
      return r?.id ?? null;
    },
    updateTranscript: async (id, p) => {
      setData((d) => ({ ...d, transcripts: d.transcripts.map((t) => (t.id === id ? { ...t, ...p } : t)) }));
      await patch("transcripts", id, p);
    },
    startTrack: async (candidateId, jobId, drafts) => {
      const existing = data.tracks.find((t) => t.candidateId === candidateId && t.jobId === jobId);
      if (existing) {
        if (drafts) {
          setData((d) => ({ ...d, tracks: d.tracks.map((t) => (t.id === existing.id ? { ...t, drafts } : t)) }));
          await patch("outreach_tracks", existing.id, { drafts });
        }
        return existing;
      }
      const r = await insert<Track>("outreach_tracks", { candidateId, jobId, drafts: drafts ?? {}, nextContactAt: new Date().toISOString() });
      if (r) setData((d) => ({ ...d, tracks: [...d.tracks, r] }));
      return r;
    },
    updateTrack: async (id, p) => {
      setData((d) => ({ ...d, tracks: d.tracks.map((t) => (t.id === id ? { ...t, ...p } : t)) }));
      await patch("outreach_tracks", id, p);
    },
    setTriage: (candidateId, jobId, status) => {
      setData((d) => {
        const triage = { ...d.triage };
        if (status) triage[triageKey(candidateId, jobId)] = status;
        else delete triage[triageKey(candidateId, jobId)];
        return { ...d, triage };
      });
    },
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("StoreProvider missing");
  return s;
}
