type Task = "parse_cv" | "match" | "outreach" | "synthesize";

const SYSTEM: Record<Task, string> = {
  parse_cv: `You are an expert recruitment CV parser. Extract a structured candidate profile and reply ONLY with a JSON object:
{"name":string,"email":string,"phone":string,"location":string,"headline":string (current title @ company),"summary":string (2-3 sentences),"skills":string[] (max 20, normalized),"experience":[{"title":string,"company":string,"start":string,"end":string,"highlights":string[]}],"education":[{"degree":string,"school":string,"year":string}],"rawText":string (plain-text transcription of the CV, max 4000 chars)}
Use "" for unknown fields. Never invent facts.`,
  match: `You are a senior agency recruiter producing a transparent, explainable match scorecard of a candidate against a job. Be rigorous and evidence-based: cite concrete evidence from the CV. Reply ONLY with a JSON object:
{"score":integer 0-100,"verdict":"Strong match"|"Good match"|"Partial match"|"Weak match","summary":string (2-3 sentences),"skillCoverage":[{"skill":string (each must-have),"status":"met"|"partial"|"missing","evidence":string}],"strengths":[{"point":string,"evidence":string}] (3-5),"gaps":[{"criterion":string,"severity":"low"|"medium"|"high","note":string}],"redFlags":string[] (e.g. short tenures, unexplained gaps, location/salary mismatch; empty if none),"interviewQuestions":[{"question":string,"purpose":string}] (4-6, targeted at probing gaps)}`,
  outreach: `You are a top-performing agency recruiter writing personalized, non-generic cold outreach. Reference specific details from the candidate's background and why they fit THIS role. Warm, concise, no clichés, no emojis. Reply ONLY with a JSON object:
{"linkedinConnect":string (max 280 chars),"inmail":{"subject":string,"body":string (120-180 words)},"emails":[{"day":integer,"subject":string,"body":string}] (exactly 3 follow-ups on days 3, 7, 14; each shorter than the previous)}
Sign off as "Alex" from the agency. Do not reveal the client name if marked confidential; otherwise describe the company.`,
  synthesize: `You are a senior agency recruiter turning phone-screen notes/transcripts into an executive candidate profile and a client-ready submission note. Only use facts from the transcript and CV; write "Not discussed" when unknown. Reply ONLY with a JSON object:
{"headline":string,"executiveSummary":string (3-4 sentences),"highlights":string[] (4-6),"compensation":{"current":string,"expected":string},"availability":{"noticePeriod":string,"earliestStart":string},"cultureFit":string (2-3 sentences),"strengths":string[] (3-5),"concerns":string[],"submissionNote":{"subject":string,"body":string (polished email to the hiring manager, 180-260 words, with short bullet points, signed "Alex")}}`,
};

function buildContent(task: Task, p: any): any[] {
  if (task === "parse_cv") {
    if (p.fileData) {
      return [
        { type: "input_file", filename: p.filename || "cv.pdf", file_data: p.fileData },
        { type: "input_text", text: "Parse this CV into the JSON profile." },
      ];
    }
    return [{ type: "input_text", text: `Parse this CV into the JSON profile:\n\n${p.text}` }];
  }
  const ctx = `JOB:\n${JSON.stringify(p.job, null, 2)}\n\nCLIENT:\n${JSON.stringify(p.client ?? {}, null, 2)}\n\nCANDIDATE:\n${JSON.stringify(p.candidate, null, 2)}`;
  if (task === "synthesize") {
    return [{ type: "input_text", text: `${ctx}\n\nCALL TRANSCRIPT / NOTES:\n${p.transcript}\n\nProduce the JSON.` }];
  }
  return [{ type: "input_text", text: `${ctx}\n\nProduce the JSON.` }];
}

export async function callAI(task: Task, payload: unknown) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI is not configured for this project.");

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
      msg = JSON.parse(body)?.error?.message ?? JSON.parse(body)?.message ?? "";
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
    return JSON.parse(cleaned);
  } catch {
    throw new Error("Could not read the AI response. Please try again.");
  }
}
