import { runAI } from "./ai.functions";

type Task = "parse_cv" | "match" | "outreach" | "synthesize" | "step_draft" | "triage";
const KEY = "talentdesk-ai-cache-v1";
const MAX = 150;

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36) + s.length.toString(36);
}

function read(): Record<string, { at: number; v: unknown }> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

/** Removes cached AI results that mention any of the given values (e.g. a deleted candidate). */
export function forgetAI(values: string[]) {
  const needles = values.filter((v) => v && v.length > 2);
  if (!needles.length) return;
  const cache = read();
  for (const [k, e] of Object.entries(cache)) {
    const txt = JSON.stringify(e.v);
    if (needles.some((n) => txt.includes(n))) delete cache[k];
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {}
}

/**
 * Runs an AI task once per identical input. Repeat requests (same CV, same job)
 * return the saved result and never spend credits again, unless `force` is set.
 */
export async function cachedAI<T = any>(task: Task, payload: unknown, force = false): Promise<T> {
  const k = `${task}:${hash(JSON.stringify(payload))}`;
  const cache = read();
  if (!force && cache[k]) return cache[k]!.v as T;
  const v = await runAI({ data: { task, payload } });
  cache[k] = { at: Date.now(), v };
  const entries = Object.entries(cache).sort((a, b) => b[1].at - a[1].at).slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {}
  return v as T;
}
