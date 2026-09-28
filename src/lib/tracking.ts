import type { Track } from "./types";

export const STEPS = [
  { label: "LinkedIn connection", short: "Connect", channel: "LinkedIn", waitDays: 0 },
  { label: "InMail pitch", short: "InMail", channel: "LinkedIn", waitDays: 2 },
  { label: "Follow-up email 1", short: "Follow-up 1", channel: "Email", waitDays: 3 },
  { label: "Follow-up email 2", short: "Follow-up 2", channel: "Email", waitDays: 4 },
  { label: "Final check-in", short: "Final", channel: "Email", waitDays: 7 },
] as const;

export const STATUS_LABEL: Record<Track["status"], string> = {
  active: "In sequence",
  replied: "Replied",
  call_booked: "Call booked",
  closed: "Closed",
};

const DAY = 86400000;

export function markSentPatch(t: Track): Partial<Track> {
  const now = new Date();
  const nextStep = t.step + 1;
  const history = [...t.history, { step: t.step, sentAt: now.toISOString() }];
  if (nextStep >= STEPS.length) {
    return { history, lastContactedAt: now.toISOString(), status: "closed", nextContactAt: null, step: t.step };
  }
  return {
    history,
    step: nextStep,
    lastContactedAt: now.toISOString(),
    nextContactAt: new Date(now.getTime() + STEPS[nextStep]!.waitDays * DAY).toISOString(),
  };
}

export function snoozePatch(t: Track, days: number): Partial<Track> {
  const base = Math.max(Date.now(), t.nextContactAt ? new Date(t.nextContactAt).getTime() : Date.now());
  return { nextContactAt: new Date(base + days * DAY).toISOString() };
}

export type Bucket = "overdue" | "today" | "upcoming" | "done";

export function bucketOf(t: Track): Bucket {
  if (t.status !== "active" || !t.nextContactAt) return "done";
  const next = new Date(t.nextContactAt);
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + DAY);
  if (next < start) return "overdue";
  if (next < end) return "today";
  return "upcoming";
}

export function dueLabel(t: Track): string {
  if (!t.nextContactAt) return "";
  const next = new Date(t.nextContactAt);
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const diff = Math.floor((next.getTime() - start.getTime()) / DAY);
  if (diff < 0) return `${-diff} day${diff === -1 ? "" : "s"} overdue`;
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  return `Due ${next.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}`;
}
