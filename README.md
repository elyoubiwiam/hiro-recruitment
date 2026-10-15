# Lovable Recruit AI

Build an AI-native recruitment workspace for agency recruiters inspired by Spott (spott.io) with three core workflows:

1. Client & Job Management:
- Create and organize clients and open job requisitions (job title, department, salary range, location/remote, must-have skills, soft factors, and job description).
- Clean, modern dashboard with list and pipeline stage views.

2. CV Screening & Explainable Matching:
- Upload candidate CVs/resumes (PDF, Word, or paste text).
- AI parsing into structured profiles (experience, skills, education, contact info).
- Detailed, transparent match scorecard against the selected job: match percentage, breakdown of strengths, flagged missing criteria or red flags, and suggested interview questions to probe gaps.

3. Outbound Outreach Generator:
- Select a candidate profile and an active job to instantly generate tailored multi-step cold outreach sequences (LinkedIn connection request, InMail pitch, and follow-up emails) highlighting why their specific background fits the role.

4. Call Transcript Synthesizer & Client Submission Note:
- Upload or paste recruiter phone screen notes or call transcripts.
- AI synthesis into an executive candidate profile and client-ready submission note (key highlights, compensation expectations, notice period/availability, culture fit, and strengths) ready to copy or email straight to client hiring managers.

Include realistic sample agency data (clients, tech/sales jobs, candidate CVs, and call transcripts) so the workflows are immediately interactive.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://hiro-recruitment.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5bac6c91-ea1b-4724-be52-9605b35d3e28).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
