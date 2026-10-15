# Hiro

**Track, manage and optimise your recruiter process.**

Hiro is an AI-native recruitment workspace for agency recruiters. It tracks every candidate touchpoint, drafts a personalised message for each step, matches CVs to jobs with explainable AI, and helps prepare client submissions.

**Live app:** https://hiro-recruitment.lovable.app

---

## Key features

### Dashboard that sets priorities
KPIs, charts and recommended next actions based on your live pipeline: who to contact today, response rates and coverage gaps.

### Explainable matching
Upload CVs as PDF or Word, or paste the text. AI parses each one into a structured profile and scores it against a job. The scorecard shows the match percentage, evidence for each strength, missing criteria or red flags, and suggested interview questions to probe the gaps. Bulk triage handles many CVs at once.

### Personalised outreach
Tracking for each candidate covers outreach steps, status, dates and next-contact date. Each step gets a draft message written from the candidate's actual background and why it fits the role, and in-app reminders flag what's due.

### Client submission notes
Turn phone-screen notes into polished client submission notes.

### Clients and jobs
Create and organise clients and open roles (title, salary, location, must-have skills, soft factors and description), with list and pipeline views.

## Workspace pages

**Today** · **Dashboard** · **Jobs** · **Candidates** · **Screening** · **Outreach** · **Calls**

## Accounts and data

- Sign-up and login are required.
- Each recruiter sees only their own data.
- Data is stored in Lovable Cloud (Supabase) with row-level access rules.

## Tech stack

- React, TypeScript, TanStack Start and Router, Vite
- Tailwind CSS with shadcn/ui components and Recharts
- Lovable Cloud (Supabase) for authentication and database
- AI parsing, matching and drafting through server functions
- Built and hosted with [Lovable](https://lovable.dev)

---

Built by **Wiam El Youbi**, [wiam-elyoubi.com](https://wiam-elyoubi.com).
