<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Data lives in Lovable Cloud tables with owner_id + RLS (owner or admin); client reads/writes via src/lib/store.tsx using the browser client. Why: per-account privacy with owner oversight.
- First account to sign up gets the admin (owner) role via handle_new_user trigger, which also seeds sample data per account. Why: owner sees everyone's data without hardcoding an email.
- AI goes through runAI (requireSupabaseAuth) in src/lib/ai.functions.ts. Why: only signed-in users can spend AI credits.
- Outreach sequence steps/timings live in src/lib/tracking.ts. Why: single source for due-date logic.
- AI output and saved demo data pass through shared copy normalization before display. Why: previously saved and generated text must follow the app's no-em-dash copy rule.
