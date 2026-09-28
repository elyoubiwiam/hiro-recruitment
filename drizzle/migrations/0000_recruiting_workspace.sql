
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users see own roles; admins see all" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Profiles (so the owner can see who owns what)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile or admin" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Core tables
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  industry text NOT NULL DEFAULT '',
  contact_name text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  department text NOT NULL DEFAULT '',
  salary_min integer NOT NULL DEFAULT 0,
  salary_max integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  location text NOT NULL DEFAULT '',
  work_mode text NOT NULL DEFAULT 'Hybrid',
  must_have text[] NOT NULL DEFAULT '{}',
  soft_factors text[] NOT NULL DEFAULT '{}',
  description text NOT NULL DEFAULT '',
  stage text NOT NULL DEFAULT 'intake',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  headline text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  skills text[] NOT NULL DEFAULT '{}',
  experience jsonb NOT NULL DEFAULT '[]',
  education jsonb NOT NULL DEFAULT '[]',
  raw_text text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (candidate_id, job_id)
);
CREATE TABLE public.transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  text text NOT NULL DEFAULT '',
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.outreach_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  step integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  next_contact_at timestamptz DEFAULT now(),
  last_contacted_at timestamptz,
  history jsonb NOT NULL DEFAULT '[]',
  drafts jsonb NOT NULL DEFAULT '{}',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (candidate_id, job_id)
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['clients','jobs','candidates','matches','transcripts','outreach_tracks'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Owner or admin can read" ON public.%I FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(), ''admin''))', t);
    EXECUTE format('CREATE POLICY "Owner can insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid())', t);
    EXECUTE format('CREATE POLICY "Owner or admin can update" ON public.%I FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(), ''admin'')) WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), ''admin''))', t);
    EXECUTE format('CREATE POLICY "Owner or admin can delete" ON public.%I FOR DELETE TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(), ''admin''))', t);
    EXECUTE format('CREATE INDEX ON public.%I (owner_id)', t);
  END LOOP;
END $$;

-- Sample data for each new account
CREATE OR REPLACE FUNCTION public.seed_sample_data(_uid uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c1 uuid := gen_random_uuid(); c2 uuid := gen_random_uuid(); c3 uuid := gen_random_uuid();
  j1 uuid := gen_random_uuid(); j2 uuid := gen_random_uuid(); j3 uuid := gen_random_uuid(); j4 uuid := gen_random_uuid();
  p1 uuid := gen_random_uuid(); p2 uuid := gen_random_uuid(); p3 uuid := gen_random_uuid(); p4 uuid := gen_random_uuid();
BEGIN
  INSERT INTO clients (id, owner_id, name, industry, contact_name, contact_email) VALUES
    (c1, _uid, 'Northwind Analytics', 'B2B SaaS · Data', 'Priya Raman', 'priya.raman@northwind.io'),
    (c2, _uid, 'Helio Payments', 'Fintech · Series C', 'Marcus Vogel', 'm.vogel@heliopay.com'),
    (c3, _uid, 'Brightpath Health', 'HealthTech', 'Dana Okafor', 'dana@brightpath.health');

  INSERT INTO jobs (id, owner_id, client_id, title, department, salary_min, salary_max, location, work_mode, must_have, soft_factors, description, stage) VALUES
    (j1, _uid, c1, 'Senior Backend Engineer', 'Platform Engineering', 140000, 170000, 'Austin, TX', 'Hybrid',
      ARRAY['Go or Python','PostgreSQL','Distributed systems','AWS','5+ years backend'], ARRAY['Mentors juniors','Comfortable with ambiguity','Clear written communication'],
      'Northwind is rebuilding its ingestion platform to process 4B events/day. You will own core services in Go, design Postgres + Kafka data flows, and lead the migration to event-driven architecture. Team of 7, reporting to the VP Engineering.', 'interviewing'),
    (j2, _uid, c2, 'Enterprise Account Executive', 'Sales', 130000, 150000, 'New York, NY', 'Hybrid',
      ARRAY['Closing $250k+ ACV deals','Fintech or payments','MEDDICC','Quota over-attainment'], ARRAY['Hunter mentality','Coachable','Executive presence'],
      'Helio is expanding its enterprise motion into mid-market retailers and marketplaces. OTE $260k (50/50). Full-cycle deals with CFOs and heads of payments, 6–9 month cycles.', 'sourcing'),
    (j3, _uid, c1, 'Product Designer', 'Design', 115000, 135000, 'Remote (US)', 'Remote',
      ARRAY['B2B SaaS product design','Figma','Design systems','Data-heavy UIs'], ARRAY['Research-driven','Collaborative with engineering'],
      'Design Northwind''s analytics workspace used by 3,000 data teams. Own end-to-end flows from discovery to shipped UI, and evolve the design system.', 'intake'),
    (j4, _uid, c3, 'Staff Frontend Engineer', 'Patient Experience', 170000, 200000, 'Boston, MA', 'Remote',
      ARRAY['React','TypeScript','Accessibility (WCAG)','Technical leadership','8+ years frontend'], ARRAY['Mission-driven','Cross-team influence'],
      'Lead frontend architecture for Brightpath''s patient app (1.2M MAU). Drive accessibility, performance and the shared web/native component strategy.', 'offer');

  INSERT INTO candidates (id, owner_id, name, email, phone, location, headline, summary, skills, experience, education, raw_text) VALUES
    (p1, _uid, 'Jordan Mello', 'jordan.mello@gmail.com', '(512) 555-0147', 'Austin, TX', 'Senior Software Engineer @ Cartwheel Logistics',
      'Backend engineer with 7 years building high-throughput Go/Python data services; led an event-driven migration.',
      ARRAY['Go','Python','PostgreSQL','Kafka','AWS','Terraform','Docker','Kubernetes','gRPC','Redis'],
      '[{"title":"Senior Software Engineer","company":"Cartwheel Logistics","start":"Mar 2021","end":"Present","highlights":["Go ingestion service handling 1.8B events/day on Kafka + PostgreSQL","Led event-sourcing migration, cut p99 latency 62%","Mentored 3 junior engineers"]},{"title":"Software Engineer","company":"Parcelly","start":"Jun 2018","end":"Feb 2021","highlights":["Python/Django APIs on AWS (ECS, RDS, SQS)","Postgres tuning reduced infra costs 28%"]},{"title":"Junior Developer","company":"Brightsoft Agency","start":"Jul 2017","end":"May 2018","highlights":["PHP/Laravel client projects"]}]',
      '[{"degree":"B.S. Computer Science","school":"University of Texas at Austin","year":"2017"}]',
      'JORDAN MELLO — Austin, TX. Backend engineer, 7 years, Go and Python. Senior Software Engineer at Cartwheel Logistics (2021–present): Go ingestion 1.8B events/day on Kafka + PostgreSQL; led 4-engineer squad migrating order pipeline to event sourcing, p99 -62%; mentored 3 juniors; introduced RFC process. Software Engineer at Parcelly (2018–2021): Python/Django on AWS ECS/RDS/SQS; Postgres tuning -28% infra cost. Junior Developer at Brightsoft (2017–2018). B.S. CS, UT Austin 2017. Skills: Go, Python, PostgreSQL, Kafka, AWS, Terraform, Docker, Kubernetes, gRPC, Redis.'),
    (p2, _uid, 'Samira Haddad', 'samira.haddad@outlook.com', '(917) 555-0192', 'Brooklyn, NY', 'Enterprise Account Executive @ Ledgerline',
      'Fintech enterprise AE with consistent quota over-attainment and a $780k record deal.',
      ARRAY['Enterprise sales','MEDDICC','Salesforce','Gong','Payments','Fintech','Negotiation','Outbound'],
      '[{"title":"Enterprise Account Executive","company":"Ledgerline","start":"Jan 2022","end":"Present","highlights":["142% of quota FY23, 118% FY24","Closed $780k ACV record deal with national grocery chain"]},{"title":"Mid-Market AE","company":"Payvault","start":"Aug 2019","end":"Dec 2021","highlights":["President''s Club 2021","Built outbound playbook adopted by 12 reps"]},{"title":"SDR → AE","company":"Oracle NetSuite","start":"Jun 2016","end":"Jul 2019","highlights":[]}]',
      '[{"degree":"B.A. Economics","school":"Fordham University","year":"2016"}]',
      'SAMIRA HADDAD — Brooklyn, NY. Enterprise AE at Ledgerline (2022–present): 142% of $1.6M quota FY23, 118% FY24; $780k ACV record deal; MEDDICC across 6–9 month cycles with CFOs. Mid-Market AE at Payvault (2019–2021): President''s Club 2021, avg $180k ACV. SDR→AE Oracle NetSuite (2016–2019). B.A. Economics, Fordham 2016.'),
    (p3, _uid, 'Leo Tanaka', 'leo.tanaka@proton.me', '', 'San Francisco, CA', 'Staff Frontend Engineer @ Quillhealth',
      'Staff-level frontend lead in healthtech; led a WCAG AA program and a shared web/native component library.',
      ARRAY['React','TypeScript','Next.js','React Native','Accessibility','GraphQL','Design systems','Performance'],
      '[{"title":"Staff Frontend Engineer","company":"Quillhealth","start":"2021","end":"Present","highlights":["Frontend tech lead for 5 teams","Drove WCAG 2.1 AA compliance program"]},{"title":"Senior Frontend Engineer","company":"Loop Commerce","start":"2018","end":"2021","highlights":["Next.js LCP 4.1s → 1.6s"]},{"title":"Frontend Engineer","company":"Kinetic","start":"2016","end":"2018","highlights":[]},{"title":"Frontend Engineer","company":"Pixelbay","start":"2015","end":"2016","highlights":[]}]',
      '[{"degree":"B.S. Cognitive Science","school":"UC San Diego","year":"2015"}]',
      'LEO TANAKA — San Francisco (open to relocation). Staff Frontend Engineer at Quillhealth (2021–present): tech lead for 5 teams, React + TypeScript architecture, WCAG 2.1 AA program, shared web/React Native component library. Senior FE at Loop Commerce (2018–2021): LCP 4.1s→1.6s. FE at Kinetic (2016–2018), Pixelbay (2015–2016). B.S. Cognitive Science UCSD 2015.'),
    (p4, _uid, 'Ava Lindqvist', 'ava@lindqvist.design', '', 'Denver, CO (Remote)', 'Product Designer II @ Metricly',
      'B2B product designer specializing in dashboards, query builders and design systems.',
      ARRAY['Figma','Design systems','User research','Prototyping','Data visualization','B2B SaaS'],
      '[{"title":"Product Designer II","company":"Metricly","start":"2022","end":"Present","highlights":["Lead designer for dashboards used by 40k analysts","Co-created 180-component design system"]},{"title":"Product Designer","company":"Tandem HR","start":"2020","end":"2022","highlights":["Onboarding redesign, +23% activation"]},{"title":"UX Contractor","company":"Freelance","start":"2019","end":"2020","highlights":[]}]',
      '[{"degree":"BFA Interaction Design","school":"California College of the Arts","year":"2019"}]',
      'AVA LINDQVIST — Remote, Denver. Product Designer II at Metricly (2022–present): dashboards & query builder for 40k analysts; co-created 180-component Figma design system. Product Designer at Tandem HR (2020–2022): +23% activation. UX contractor 2019–2020 (4 month gap after). BFA Interaction Design, CCA 2019.');

  INSERT INTO transcripts (owner_id, candidate_id, job_id, title, text) VALUES
    (_uid, p1, j1, 'Phone screen — Jordan Mello',
     E'Recruiter: What''s prompting you to look?\nJordan: Cartwheel''s platform work is basically done — I want another migration-scale problem. Northwind''s 4B events/day is exactly that.\nRecruiter: Tell me about the Kafka migration.\nJordan: I wrote the RFC, split the order pipeline into 9 services, ran dual-writes for 6 weeks, zero-downtime cutover. p99 dropped 62%.\nRecruiter: Leadership?\nJordan: De facto tech lead for 4 engineers, run design reviews, mentor 3 juniors. Not a people manager yet.\nRecruiter: Comp?\nJordan: Base $148k plus ~10% bonus. Looking for $165k base, flexible if equity is meaningful.\nRecruiter: Notice?\nJordan: Three weeks. Pre-booked vacation Nov 20–27.\nRecruiter: Hybrid in Austin OK?\nJordan: Yes, 15 min from their office. Two days a week is ideal.\nRecruiter: Deal-breakers?\nJordan: Heavy on-call with no rotation. And I want to keep writing Go.\nNotes: articulate, strong ownership stories. Interviewing elsewhere (final round).'),
    (_uid, p2, j2, 'Intro call — Samira Haddad',
     E'- 118% to plan YTD at Ledgerline, territory being cut in Q1 reorg — main reason for looking\n- Biggest win $780k ACV grocery chain, 8 month cycle, multi-threaded CFO + CIO + head of payments\n- MEDDICC religiously, runs mutual action plans\n- Current OTE $240k (130 base), wants $150 base / $280k OTE — would consider $145 base with strong accelerators\n- 2 weeks notice, prefers start after Jan 6 to collect Q4 commission\n- Brooklyn, happy with 3 days in office\n- Wants a team where enterprise isn''t brand new\n- Slight concern: never sold to marketplaces specifically');

  INSERT INTO outreach_tracks (owner_id, candidate_id, job_id, step, status, next_contact_at, last_contacted_at, history) VALUES
    (_uid, p3, j4, 2, 'active', now() - interval '1 day', now() - interval '4 days',
      jsonb_build_array(jsonb_build_object('step',0,'sentAt',now() - interval '7 days'), jsonb_build_object('step',1,'sentAt',now() - interval '4 days'))),
    (_uid, p4, j3, 0, 'active', now(), NULL, '[]'),
    (_uid, p2, j2, 1, 'active', now() + interval '2 days', now(),
      jsonb_build_array(jsonb_build_object('step',0,'sentAt',now())));
END $$;

REVOKE EXECUTE ON FUNCTION public.seed_sample_data(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email) VALUES (NEW.id, NEW.email);
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  PERFORM public.seed_sample_data(NEW.id);
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
