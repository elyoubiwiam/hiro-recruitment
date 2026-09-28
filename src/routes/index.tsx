import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, CalendarCheck, FileSearch, MessagesSquare, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Talentdesk — AI workspace for agency recruiters" },
      { name: "description", content: "Track every candidate touchpoint, get personalized drafts for each step, and match CVs to jobs with explainable AI." },
      { property: "og:title", content: "Talentdesk — AI workspace for agency recruiters" },
      { property: "og:description", content: "Outreach tracking, personalized drafts, CV matching and client submissions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/today", replace: true });
    });
  }, [navigate]);

  const features = [
    { icon: CalendarCheck, title: "Never miss a follow-up", text: "Every candidate has a step, a due date and a draft ready for that step." },
    { icon: FileSearch, title: "Explainable matching", text: "Scorecards with evidence, gaps and interview questions." },
    { icon: MessagesSquare, title: "Personalized outreach", text: "Messages written from the candidate's actual background." },
    { icon: PhoneCall, title: "Client-ready notes", text: "Turn phone screens into submission emails in seconds." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between p-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <div className="h-3.5 w-3.5 rounded-sm border-2 border-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">Talentdesk</span>
        </div>
        <Button asChild variant="outline"><Link to="/today">Open workspace</Link></Button>
      </header>
      <section className="mx-auto max-w-5xl px-6 pb-20 pt-16">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />AI drafting for recruiters
        </span>
        <h1 className="mt-5 max-w-2xl text-5xl leading-tight">Know exactly who to contact today — and what to say.</h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Talentdesk tracks every step of your candidate outreach and prepares a personalized message for the next one.
        </p>
        <Button asChild size="lg" className="mt-8"><Link to="/today">Open the workspace <ArrowRight className="h-4 w-4" /></Link></Button>
        <div className="mt-16 grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-6">
              <f.icon className="h-5 w-5 text-primary" />
              <div className="mt-3 font-semibold">{f.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{f.text}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
