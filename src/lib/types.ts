export type Stage = "intake" | "sourcing" | "interviewing" | "offer" | "filled";
export const STAGES: { id: Stage; label: string }[] = [
  { id: "intake", label: "Intake" },
  { id: "sourcing", label: "Sourcing" },
  { id: "interviewing", label: "Interviewing" },
  { id: "offer", label: "Offer" },
  { id: "filled", label: "Filled" },
];

export interface Client {
  id: string;
  name: string;
  industry: string;
  contactName: string;
  contactEmail: string;
}

export interface Job {
  id: string;
  clientId: string;
  title: string;
  department: string;
  salaryMin: number;
  salaryMax: number;
  currency: string;
  location: string;
  workMode: "Remote" | "Hybrid" | "On-site";
  mustHave: string[];
  softFactors: string[];
  description: string;
  stage: Stage;
  createdAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
  summary: string;
  skills: string[];
  experience: { title: string; company: string; start: string; end: string; highlights: string[] }[];
  education: { degree: string; school: string; year: string }[];
  rawText: string;
  createdAt: string;
}

export interface MatchResult {
  score: number;
  verdict: string;
  summary: string;
  skillCoverage: { skill: string; status: "met" | "partial" | "missing"; evidence: string }[];
  strengths: { point: string; evidence: string }[];
  gaps: { criterion: string; severity: "low" | "medium" | "high"; note: string }[];
  redFlags: string[];
  interviewQuestions: { question: string; purpose: string }[];
}

export interface OutreachResult {
  linkedinConnect: string;
  inmail: { subject: string; body: string };
  emails: { day: number; subject: string; body: string }[];
}

export interface SynthesisResult {
  headline: string;
  executiveSummary: string;
  highlights: string[];
  compensation: { current: string; expected: string };
  availability: { noticePeriod: string; earliestStart: string };
  cultureFit: string;
  strengths: string[];
  concerns: string[];
  submissionNote: { subject: string; body: string };
}

export interface Transcript {
  id: string;
  candidateId: string;
  jobId: string;
  title: string;
  text: string;
  result?: SynthesisResult;
  createdAt: string;
}

export interface MatchRecord {
  candidateId: string;
  jobId: string;
  result: MatchResult;
  createdAt: string;
}
