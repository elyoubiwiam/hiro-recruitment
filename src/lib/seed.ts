import type { Candidate, Client, Job, MatchRecord, Transcript } from "./types";

const d = (days: number) => new Date(Date.now() - days * 86400000).toISOString();

export const seedClients: Client[] = [
  { id: "c1", name: "Northwind Analytics", industry: "B2B SaaS · Data", contactName: "Priya Raman", contactEmail: "priya.raman@northwind.io" },
  { id: "c2", name: "Helio Payments", industry: "Fintech · Series C", contactName: "Marcus Vogel", contactEmail: "m.vogel@heliopay.com" },
  { id: "c3", name: "Brightpath Health", industry: "HealthTech", contactName: "Dana Okafor", contactEmail: "dana@brightpath.health" },
];

export const seedJobs: Job[] = [
  {
    id: "j1", clientId: "c1", title: "Senior Backend Engineer", department: "Platform Engineering",
    salaryMin: 140000, salaryMax: 170000, currency: "USD", location: "Austin, TX", workMode: "Hybrid",
    mustHave: ["Go or Python", "PostgreSQL", "Distributed systems", "AWS", "5+ years backend"],
    softFactors: ["Mentors juniors", "Comfortable with ambiguity", "Clear written communication"],
    description: "Northwind is rebuilding its ingestion platform to process 4B events/day. You'll own core services in Go, design Postgres + Kafka data flows, and lead the migration to event-driven architecture. Team of 7, reporting to the VP Engineering.",
    stage: "interviewing", createdAt: d(21),
  },
  {
    id: "j2", clientId: "c2", title: "Enterprise Account Executive", department: "Sales",
    salaryMin: 130000, salaryMax: 150000, currency: "USD", location: "New York, NY", workMode: "Hybrid",
    mustHave: ["Closing $250k+ ACV deals", "Fintech or payments", "MEDDICC", "Quota over-attainment"],
    softFactors: ["Hunter mentality", "Coachable", "Executive presence"],
    description: "Helio is expanding its enterprise motion into mid-market retailers and marketplaces. OTE $260k (50/50). You'll run full-cycle deals with CFOs and heads of payments, averaging 6-9 month cycles.",
    stage: "sourcing", createdAt: d(10),
  },
  {
    id: "j3", clientId: "c1", title: "Product Designer", department: "Design",
    salaryMin: 115000, salaryMax: 135000, currency: "USD", location: "Remote (US)", workMode: "Remote",
    mustHave: ["B2B SaaS product design", "Figma", "Design systems", "Data-heavy UIs"],
    softFactors: ["Research-driven", "Collaborative with engineering"],
    description: "Design Northwind's analytics workspace used by 3,000 data teams. Own end-to-end flows from discovery to shipped UI, and evolve our design system.",
    stage: "intake", createdAt: d(3),
  },
  {
    id: "j4", clientId: "c3", title: "Staff Frontend Engineer", department: "Patient Experience",
    salaryMin: 170000, salaryMax: 200000, currency: "USD", location: "Boston, MA", workMode: "Remote",
    mustHave: ["React", "TypeScript", "Accessibility (WCAG)", "Technical leadership", "8+ years frontend"],
    softFactors: ["Mission-driven", "Cross-team influence"],
    description: "Lead frontend architecture for Brightpath's patient app (1.2M MAU). Drive accessibility, performance and the React Native/web shared component strategy.",
    stage: "offer", createdAt: d(34),
  },
];

const cv1 = `JORDAN MELLO
Austin, TX · jordan.mello@gmail.com · (512) 555-0147 · github.com/jmello

SUMMARY
Backend engineer with 7 years building high-throughput data services in Go and Python. Led migration of a monolith to event-driven microservices at scale.

EXPERIENCE
Senior Software Engineer, Cartwheel Logistics (Mar 2021 to Present)
- Designed Go ingestion service handling 1.8B events/day on Kafka + PostgreSQL
- Led 4-engineer squad migrating order pipeline to event sourcing; cut p99 latency 62%
- Mentored 3 junior engineers; introduced RFC process

Software Engineer, Parcelly (Jun 2018 to Feb 2021)
- Built Python/Django APIs and Celery workers on AWS (ECS, RDS, SQS)
- Owned Postgres performance tuning; reduced infra costs 28%

Junior Developer, Brightsoft Agency (Jul 2017 to May 2018)
- PHP/Laravel client projects

EDUCATION
B.S. Computer Science, University of Texas at Austin, 2017

SKILLS
Go, Python, PostgreSQL, Kafka, AWS, Terraform, Docker, Kubernetes, gRPC, Redis`;

const cv2 = `SAMIRA HADDAD
Brooklyn, NY · samira.haddad@outlook.com · (917) 555-0192

Enterprise Account Executive, payments and fintech

EXPERIENCE
Enterprise Account Executive, Ledgerline (Jan 2022 to Present)
- 142% of $1.6M quota in FY23, 118% in FY24
- Closed largest deal in company history: $780k ACV with national grocery chain
- Run MEDDICC across 6-9 month cycles with CFOs and VPs Finance

Mid-Market AE, Payvault (Aug 2019 to Dec 2021)
- President's Club 2021; averaged $180k ACV
- Built outbound playbook adopted by team of 12

SDR to AE, Oracle NetSuite (Jun 2016 to Jul 2019)

EDUCATION
B.A. Economics, Fordham University, 2016

SKILLS
Enterprise sales, MEDDICC, Salesforce, Gong, Payments, Fintech, Negotiation, Outbound prospecting`;

const cv3 = `LEO TANAKA
San Francisco, CA (open to relocation) · leo.tanaka@proton.me

EXPERIENCE
Staff Frontend Engineer, Quillhealth (2021 to Present)
- Frontend tech lead for 5 teams; defined React + TypeScript architecture for clinician portal
- Drove WCAG 2.1 AA compliance program; passed third-party audit
- Built shared component library used across web and React Native

Senior Frontend Engineer, Loop Commerce (2018 to 2021)
- Next.js storefront performance: LCP 4.1s → 1.6s

Frontend Engineer, Kinetic (2016 to 2018)
Frontend Engineer, Pixelbay (2015 to 2016)

EDUCATION
B.S. Cognitive Science, UC San Diego, 2015

SKILLS
React, TypeScript, Next.js, React Native, Accessibility, GraphQL, Design systems, Performance`;

const cv4 = `AVA LINDQVIST
Remote, Denver, CO · ava@lindqvist.design · ava-lindqvist.com

Product Designer focused on complex B2B workflows.

EXPERIENCE
Product Designer II, Metricly (2022 to Present)
- Lead designer for dashboards & query builder used by 40k analysts
- Co-created design system (180 components) in Figma with engineering

Product Designer, Tandem HR (2020 to 2022)
- Redesigned onboarding; +23% activation

UX Contractor (2019 to 2020), various early-stage startups (4 month gap after)

EDUCATION
BFA Interaction Design, California College of the Arts, 2019

SKILLS
Figma, Design systems, User research, Prototyping, Data visualization, B2B SaaS`;

export const seedCandidates: Candidate[] = [
  {
    id: "p1", name: "Jordan Mello", email: "jordan.mello@gmail.com", phone: "(512) 555-0147", location: "Austin, TX",
    headline: "Senior Software Engineer @ Cartwheel Logistics",
    summary: "Backend engineer with 7 years building high-throughput Go/Python data services; led event-driven migration.",
    skills: ["Go", "Python", "PostgreSQL", "Kafka", "AWS", "Terraform", "Docker", "Kubernetes", "gRPC", "Redis"],
    experience: [
      { title: "Senior Software Engineer", company: "Cartwheel Logistics", start: "Mar 2021", end: "Present", highlights: ["Go ingestion 1.8B events/day", "Led event-sourcing migration, -62% p99", "Mentored 3 juniors"] },
      { title: "Software Engineer", company: "Parcelly", start: "Jun 2018", end: "Feb 2021", highlights: ["Python/Django on AWS", "Postgres tuning, -28% infra cost"] },
      { title: "Junior Developer", company: "Brightsoft Agency", start: "Jul 2017", end: "May 2018", highlights: ["PHP/Laravel"] },
    ],
    education: [{ degree: "B.S. Computer Science", school: "University of Texas at Austin", year: "2017" }],
    rawText: cv1, createdAt: d(12),
  },
  {
    id: "p2", name: "Samira Haddad", email: "samira.haddad@outlook.com", phone: "(917) 555-0192", location: "Brooklyn, NY",
    headline: "Enterprise Account Executive @ Ledgerline",
    summary: "Fintech enterprise AE with consistent quota over-attainment and a $780k record deal.",
    skills: ["Enterprise sales", "MEDDICC", "Salesforce", "Gong", "Payments", "Fintech", "Negotiation", "Outbound"],
    experience: [
      { title: "Enterprise Account Executive", company: "Ledgerline", start: "Jan 2022", end: "Present", highlights: ["142% FY23, 118% FY24", "$780k ACV record deal"] },
      { title: "Mid-Market AE", company: "Payvault", start: "Aug 2019", end: "Dec 2021", highlights: ["President's Club 2021"] },
      { title: "SDR → AE", company: "Oracle NetSuite", start: "Jun 2016", end: "Jul 2019", highlights: [] },
    ],
    education: [{ degree: "B.A. Economics", school: "Fordham University", year: "2016" }],
    rawText: cv2, createdAt: d(6),
  },
  {
    id: "p3", name: "Leo Tanaka", email: "leo.tanaka@proton.me", phone: "", location: "San Francisco, CA",
    headline: "Staff Frontend Engineer @ Quillhealth",
    summary: "Staff-level frontend lead in healthtech; led WCAG AA program and shared web/native component library.",
    skills: ["React", "TypeScript", "Next.js", "React Native", "Accessibility", "GraphQL", "Design systems", "Performance"],
    experience: [
      { title: "Staff Frontend Engineer", company: "Quillhealth", start: "2021", end: "Present", highlights: ["Tech lead for 5 teams", "WCAG 2.1 AA program"] },
      { title: "Senior Frontend Engineer", company: "Loop Commerce", start: "2018", end: "2021", highlights: ["LCP 4.1s → 1.6s"] },
      { title: "Frontend Engineer", company: "Kinetic", start: "2016", end: "2018", highlights: [] },
      { title: "Frontend Engineer", company: "Pixelbay", start: "2015", end: "2016", highlights: [] },
    ],
    education: [{ degree: "B.S. Cognitive Science", school: "UC San Diego", year: "2015" }],
    rawText: cv3, createdAt: d(20),
  },
  {
    id: "p4", name: "Ava Lindqvist", email: "ava@lindqvist.design", phone: "", location: "Denver, CO (Remote)",
    headline: "Product Designer II @ Metricly",
    summary: "B2B product designer specializing in dashboards, query builders and design systems.",
    skills: ["Figma", "Design systems", "User research", "Prototyping", "Data visualization", "B2B SaaS"],
    experience: [
      { title: "Product Designer II", company: "Metricly", start: "2022", end: "Present", highlights: ["Dashboards for 40k analysts", "180-component design system"] },
      { title: "Product Designer", company: "Tandem HR", start: "2020", end: "2022", highlights: ["+23% activation"] },
      { title: "UX Contractor", company: "Freelance", start: "2019", end: "2020", highlights: [] },
    ],
    education: [{ degree: "BFA Interaction Design", school: "California College of the Arts", year: "2019" }],
    rawText: cv4, createdAt: d(2),
  },
];

export const seedTranscripts: Transcript[] = [
  {
    id: "t1", candidateId: "p1", jobId: "j1", title: "Phone screen: Jordan Mello", createdAt: d(4),
    text: `Recruiter: What is prompting you to consider a new role?
Jordan: The platform work at Cartwheel is largely complete. I am interested in another migration-scale problem. Northwind's 4B events/day is relevant.
Recruiter: Tell me about the Kafka migration.
Jordan: I wrote the RFC, split the order pipeline into 9 services, ran dual-writes for 6 weeks, zero downtime cutover. p99 dropped 62%.
Recruiter: What is your leadership experience?
Jordan: I'm the de facto tech lead for 4 engineers, run our design reviews, mentor 3 juniors. Not a people manager and don't want to be yet.
Recruiter: What are your compensation expectations?
Jordan: Base is $148k plus about 10% bonus. Looking for $165k base, flexible if equity is meaningful.
Recruiter: What is your notice period?
Jordan: Three weeks. Pre-booked vacation Nov 20 to 27.
Recruiter: Would a hybrid schedule in Austin work for you?
Jordan: Yes, I live 15 min from their office. Two days a week is ideal.
Recruiter: What would prevent you from accepting the role?
Jordan: Heavy on-call with no rotation. And I'd want to keep writing Go, not just reviewing.
Notes: Very articulate, strong ownership stories, slightly less AWS depth than GCP; he said mostly AWS ECS, some EKS. Interviewing with one other company (final round).`,
  },
  {
    id: "t2", candidateId: "p2", jobId: "j2", title: "Intro call: Samira Haddad", createdAt: d(1),
    text: `Notes from a 25-minute call with Samira:
- Currently 118% to plan YTD at Ledgerline, but territory being cut in Q1 reorg - main reason for looking
- Biggest win $780k ACV grocery chain, 8 month cycle, multi-threaded CFO + CIO + head of payments
- Uses MEDDICC religiously, runs mutual action plans
- Current OTE $240k (130 base), wants $150 base / $280k OTE - will consider $145 base with strong accelerators
- 2 weeks notice, would like to start after Jan 6 to collect Q4 commission
- Lives in Brooklyn and is available to work in the office 3 days per week
- Wants a team where enterprise isn't brand new - asked about Helio's existing enterprise logos
- Energetic, crisp, very numbers-driven. Slight concern: never sold to marketplaces specifically`,
  },
];

const cov = (skill: string, status: "met" | "partial" | "missing", evidence: string) => ({ skill, status, evidence });
const gap = (criterion: string, severity: "low" | "medium" | "high", note: string) => ({ criterion, severity, note });

export const seedMatches: MatchRecord[] = [
  {
    candidateId: "p1", jobId: "j1", createdAt: d(5),
    result: {
      score: 93, verdict: "Strong match", summary: "Nine years of backend engineering with deep Kotlin and Kubernetes experience at fintech scale. Aligns with every must-have for the Senior Backend Engineer role.",
      skillCoverage: [
        cov("Kotlin", "met", "Led the migration of 40+ services from Java to Kotlin at Vertexa"),
        cov("Kubernetes", "met", "Owns the EKS platform for 120 microservices, including cost optimization"),
        cov("PostgreSQL", "partial", "Strong SQL, mostly MySQL in production; has reviewed Postgres plans"),
      ],
      strengths: [
        { point: "Payments-grade reliability", evidence: "Reduced p99 latency by 45% while doubling transaction volume" },
        { point: "Mentorship", evidence: "Grew a team of 4 engineers into 9 over two years" },
      ],
      gaps: [gap("Go", "low", "Never shipped Go in production, but owns Java-to-Kotlin migrations")],
      redFlags: [],
      interviewQuestions: [],
    },
  },
  {
    candidateId: "p2", jobId: "j2", createdAt: d(3),
    result: {
      score: 78, verdict: "Good match", summary: "Consistent enterprise seller with MEDDICC discipline and strong fintech references. Commercial rigor is excellent, marketplace experience is thin.",
      skillCoverage: [
        cov("Enterprise SaaS sales", "met", "Closed $2.4M ARR over 3 years with an average cycle of 7 months"),
        cov("MEDDICC", "met", "Uses mutual action plans and multi-threaded deals by default"),
        cov("Marketplace", "missing", "No marketplace or two-sided platform experience"),
      ],
      strengths: [
        { point: "C-level relationships", evidence: "Sold into CFO and CIO simultaneously in the grocery chain deal" },
        { point: "Numbers-driven", evidence: "Maintains a personal deal scorecard reviewed weekly" },
      ],
      gaps: [gap("Marketplace", "high", "No direct marketplace deals; worth probing in the panel interview")],
      redFlags: [],
      interviewQuestions: [],
    },
  },
  {
    candidateId: "p3", jobId: "j4", createdAt: d(2),
    result: {
      score: 71, verdict: "Partial match", summary: "Solid frontend foundation with React and accessibility focus, but lacks staff-level scope and healthcare exposure for the Staff Frontend Engineer role.",
      skillCoverage: [
        cov("React", "met", "Ships a 200k-user React app with design system ownership"),
        cov("Accessibility", "met", "Led WCAG 2.1 AA audit and remediation across the product"),
        cov("Healthcare", "missing", "No regulated healthcare or HIPAA environment experience"),
      ],
      strengths: [
        { point: "Performance", evidence: "Cut bundle size by 38% and raised Lighthouse score to 96" },
        { point: "Design partnership", evidence: "Works daily with designers on component APIs" },
      ],
      gaps: [
        gap("Healthcare domain", "medium", "No HIPAA or clinical workflow exposure"),
        gap("Staff-level scope", "medium", "Mostly feature work, limited cross-team architecture"),
      ],
      redFlags: [],
      interviewQuestions: [],
    },
  },
];
