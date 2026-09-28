import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Candidate, Client, Job, MatchRecord, Transcript } from "./types";
import { seedCandidates, seedClients, seedJobs, seedTranscripts } from "./seed";

interface Data {
  clients: Client[];
  jobs: Job[];
  candidates: Candidate[];
  matches: MatchRecord[];
  transcripts: Transcript[];
}

const KEY = "talentdesk-v1";
const initial: Data = {
  clients: seedClients,
  jobs: seedJobs,
  candidates: seedCandidates,
  matches: [],
  transcripts: seedTranscripts,
};

interface Store extends Data {
  update: (fn: (d: Data) => Data) => void;
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);

export const uid = () => Math.random().toString(36).slice(2, 10);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setData({ ...initial, ...JSON.parse(raw) });
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(data));
  }, [data, loaded]);

  return (
    <Ctx.Provider value={{ ...data, update: (fn) => setData((d) => fn(d)), reset: () => setData(initial) }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("StoreProvider missing");
  return s;
}
