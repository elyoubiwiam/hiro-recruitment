import { normalizeCopy } from "./copy";

export type Task = "parse_cv" | "match" | "outreach" | "synthesize" | "step_draft" | "triage";

// Shared style rule, kept short to save input tokens on every call.
const STYLE = 'Professional, direct, concise. No clichés, emojis, em dashes, invented facts or signatures. Use "" if unknown. Reply ONLY with JSON.';
const PROFILE = '{"name","email","phone","location","headline":"title @ company","summary":"2 sentences","skills":[max 15],"experience":[{"title","company","start","end","highlights":[max 3]}],"education":[{"degree","school","year"}]}';
const MATCH = '{"score":0-100,"verdict":"Strong match|Good match|Partial match|Weak match","summary":"2 sentences","skillCoverage":[{"skill":each must-have,"status":"met|partial|missing","evidence"}],"strengths":[{"point","evidence"}] 3,"gaps":[{"criterion","severity":"low|medium|high","note"}],"redFlags":[string],"interviewQuestions":[{"question","purpose"}] 4}';

const SYSTEM: Record<Task, string> = {
  parse_cv: `Parse the CV. ${STYLE} Shape: ${PROFILE}`,
  match: `Score the candidate against the job with cited CV evidence. ${STYLE} Shape: ${MATCH}`,
  triage: `Parse the CV, then score it against the job with cited evidence. ${STYLE} Shape: {"profile":${PROFILE},"match":${MATCH}}`,
  step_draft: `Write ONE personalized outreach message for the given sequence step, using concrete fit details. Do not repeat ALREADY SENT; follow-ups add a new angle and get shorter. Limits: LinkedIn connection 280 chars, no subject; InMail 120-160 words; follow-ups 50-100 words; final 40-70 words, closes the loop. ${STYLE} Shape: {"subject":"" for LinkedIn,"body"}`,
  outreach: `Write a personalized cold outreach sequence. Hide client name if confidential. ${STYLE} Shape: {"linkedinConnect":max 280 chars,"inmail":{"subject","body":120-160 words},"emails":[{"day":3|7|14,"subject","body"}] 3, each shorter}`,
  synthesize: `Turn call notes into an executive profile and client submission note. Only use given facts; write "Not discussed" if unknown. ${STYLE} Shape: {"headline","executiveSummary":"3 sentences","highlights":[4-5],"compensation":{"current","expected"},"availability":{"noticePeriod","earliestStart"},"cultureFit":"2 sentences","strengths":[3-4],"concerns":[string],"submissionNote":{"subject","body":160-220 words with short bullets}}`,
};

const LIMITS = { cv: 6000, doc: 12000, transcript: 10000, description: 1500 };

/** Collapse whitespace and cut oversized text before it reaches the model. */
export function squeeze(s: unknown, max: number): string {
  const t = String(s ?? "").replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").replace(/\n{2,}/g, "\n").trim();
  return t.length > max ? `${t.slice(0, max)}\n[truncated]` : t;
}

function compactJob(job: any) {
  if (!job) return {};
  const { id, clientId, createdAt, stage, ...rest } = job;
  return { ...rest, description: squeeze(job.description, LIMITS.description) };
}
function compactCandidate(c: any) {
  if (!c) return {};
  const { id, createdAt, rawText, cv, email, phone, ...rest } = c;
  return { ...rest, cv: squeeze(cv ?? rawText, LIMITS.cv) };
}
const j = (o: unknown) => JSON.stringify(o);

function buildContent(task: Task, p: any): any[] {
  if (task === "parse_cv" || task === "triage") {
    const jobCtx = task === "triage" ? `JOB:${j(compactJob(p.job))}\n` : "";
    if (p.fileData) {
      return [
        { type: "input_file", filename: p.filename || "cv.pdf", file_data: p.fileData },
        { type: "input_text", text: `${jobCtx}Return the JSON.` },
      ];
    }
    return [{ type: "input_text", text: `${jobCtx}CV:\n${squeeze(p.text, LIMITS.doc)}` }];
  }
  const client = p.client ? { name: p.client.name, industry: p.client.industry } : {};
  const ctx = `JOB:${j(compactJob(p.job))}\nCLIENT:${j(client)}\nCANDIDATE:${j(compactCandidate(p.candidate))}`;
  if (task === "step_draft") {
    const history = (p.history ?? []).map((h: any) => ({ step: h.step, message: squeeze(h.message, 600) }));
    return [{ type: "input_text", text: `${ctx}\nSTEP:${j(p.step)}\nALREADY SENT:${j(history)}` }];
  }
  if (task === "synthesize") {
    return [{ type: "input_text", text: `${ctx}\nNOTES:\n${squeeze(p.transcript, LIMITS.transcript)}` }];
  }
  return [{ type: "input_text", text: ctx }];
}

export async function callAI(task: Task, payload: any) {
  const key = process.env['LOVABLE_API_KEY'];
  if (!key) throw new Error("AI is not configured for this project.");
  if (payload?.fileData && String(payload.fileData).length > 6_000_000) {
    throw new Error("This file is too large. Upload a CV under 4 MB.");
  }

  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      stream: true,
      store: false,
      reasoning: { effort: "low", summary: "auto" },
      include: ["reasoning.encrypted_content"],
      instructions: SYSTEM[task],
      input: [{ role: "user", content: buildContent(task, payload) }],
      text: { format: { type: "json_object" } },
    }),
  });

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    let msg = "";
    try {
      const parsed = JSON.parse(body);
      msg = parsed?.error?.message ?? parsed?.message ?? "";
    } catch {}
    if (res.status === 402) throw new Error(msg || "AI credits exhausted. Add credits in Settings → Plans & credits.");
    if (res.status === 429) throw new Error("Too many AI requests right now. Please wait a moment and try again.");
    throw new Error(msg || `AI request failed (${res.status}).`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const evt = JSON.parse(data);
        if (evt.type === "response.output_text.delta") text += evt.delta ?? "";
        else if (evt.type === "error" || evt.type === "response.failed") {
          throw new Error(evt.error?.message || evt.response?.error?.message || "AI request failed.");
        }
      } catch (e) {
        if (e instanceof Error && !(e instanceof SyntaxError)) throw e;
      }
    }
  }

  if (!text.trim()) throw new Error("The AI returned an empty response.");
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  try {
    return normalizeCopy(JSON.parse(cleaned));
  } catch {
    throw new Error("Could not read the AI response. Please try again.");
  }
}
