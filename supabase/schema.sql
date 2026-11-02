-- =====================================================================
-- Elets Solution Marketplace — Supabase schema
-- Mirrors src/lib/types.ts. Run in the Supabase SQL editor (or `supabase db push`).
-- Integrity rules enforced in the database:
--   * provider verification, matching eligibility and listing package are
--     three separate columns, changeable only by Elets staff;
--   * match scores are written by a server-side function that never reads
--     `listing_package` (see `match_inputs` view);
--   * every staff mutation is recorded in `audit_log` via triggers.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- enums
create type app_role as enum ('buyer', 'provider', 'admin');
create type verification_status as enum ('verified', 'pending', 'docs_requested', 'unverified', 'rejected');
create type listing_package as enum ('standard', 'featured', 'premium');
create type company_size as enum ('1-50', '51-200', '201-1000', '1000+');
create type budget_band as enum ('under-25l', '25l-1cr', '1cr-5cr', '5cr-25cr', '25cr-plus', 'undisclosed');
create type requirement_stage as enum ('submitted', 'under_review', 'matching', 'shortlisted', 'introduced', 'evaluation', 'negotiation', 'completed');
create type match_status as enum ('suggested', 'approved', 'rejected', 'shortlisted', 'intro_requested', 'introduced');
create type provider_interest as enum ('none', 'interested', 'declined');
create type opportunity_stage as enum ('introduction', 'discovery', 'evaluation', 'proposal', 'negotiation', 'won', 'lost');
create type module_state as enum ('done', 'active', 'upcoming', 'skipped');

-- ---------------------------------------------------------------- taxonomy (admin-configurable)
create table industries (
  id text primary key,
  name text not null,
  icon text not null default 'Layers',
  description text not null default '',
  active boolean not null default true
);

create table tech_categories (
  id text primary key,
  slug text unique not null,
  name text not null,
  icon text not null default 'Layers',
  description text not null default '',
  featured boolean not null default false,
  active boolean not null default true,
  related text[] not null default '{}'
);

create table service_categories (id text primary key, name text not null, active boolean not null default true);
create table regions (id text primary key, name text not null, active boolean not null default true);

-- ---------------------------------------------------------------- organisations & users
create table providers (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  tagline text not null default '',
  description text not null default '',
  logo_path text,                       -- Supabase Storage: logos/<provider_id>/...
  logo_initials text,
  logo_from text, logo_to text,
  website text,
  hq text,
  founded int,
  size company_size,
  industries text[] not null default '{}',
  categories text[] not null default '{}',
  services text[] not null default '{}',
  capabilities text[] not null default '{}',
  regions text[] not null default '{}',
  client_segments text[] not null default '{}',
  certifications text[] not null default '{}',
  budget_bands budget_band[] not null default '{}',
  contact jsonb not null default '{}'::jsonb,
  -- integrity-separated controls (staff only)
  verification verification_status not null default 'unverified',
  verified_at timestamptz,
  matching_eligible boolean not null default false,
  listing_package listing_package not null default 'standard',
  account_status text not null default 'active' check (account_status in ('active', 'suspended')),
  profile_views int not null default 0,
  created_at timestamptz not null default now()
);

create table provider_solutions (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references providers(id) on delete cascade,
  name text not null,
  category_id text references tech_categories(id),
  summary text not null default '',
  deployment text[] not null default '{}',
  highlights text[] not null default '{}'
);

create table provider_case_studies (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references providers(id) on delete cascade,
  title text not null,
  industry_id text references industries(id),
  category_id text references tech_categories(id),
  summary text not null default '',
  outcome text not null default '',
  year int
);

create table provider_documents (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references providers(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('incorporation', 'gst', 'certification', 'reference', 'other')),
  status text not null default 'under_review' check (status in ('accepted', 'under_review', 'requested')),
  storage_path text,                    -- Supabase Storage: documents/providers/<provider_id>/...
  uploaded_at timestamptz
);

create table buyer_orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  industry_id text references industries(id),
  city text, state text,
  size company_size,
  status text not null default 'active' check (status in ('active', 'invited', 'inactive')),
  created_at timestamptz not null default now()
);

-- One row per auth user. Role and org are set by Elets staff / invite flow, never by the user.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  title text,
  role app_role not null,
  buyer_org_id uuid references buyer_orgs(id),
  provider_id uuid references providers(id),
  created_at timestamptz not null default now(),
  check ((role = 'buyer' and buyer_org_id is not null) or (role = 'provider' and provider_id is not null) or role = 'admin')
);

create table team_members (
  id uuid primary key references profiles(id) on delete cascade,
  focus_industries text[] not null default '{}',
  phone text
);

-- ---------------------------------------------------------------- requirements & matching
create table requirements (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  buyer_org_id uuid not null references buyer_orgs(id),
  created_by uuid references profiles(id),
  title text not null,
  industry_id text not null references industries(id),
  category_id text not null references tech_categories(id),
  problem text not null,
  objectives text[] not null default '{}',
  capabilities text[] not null default '{}',
  budget budget_band not null default 'undisclosed',
  timeline text not null default 'exploratory',
  scale text not null default 'organisation',
  location text,
  regions text[] not null default '{}',
  deployment text[] not null default '{}',
  compliance text[] not null default '{}',
  additional_notes text not null default '',
  stage requirement_stage not null default 'submitted',
  priority text not null default 'medium',
  assigned_to uuid references team_members(id),
  pro_requested boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table requirement_attachments (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references requirements(id) on delete cascade,
  name text not null,
  size_bytes bigint,
  storage_path text not null,           -- documents/requirements/<requirement_id>/...
  uploaded_at timestamptz not null default now()
);

create table requirement_status_history (
  id bigserial primary key,
  requirement_id uuid not null references requirements(id) on delete cascade,
  stage requirement_stage not null,
  by_user uuid references profiles(id),
  note text,
  at timestamptz not null default now()
);

create table requirement_notes (   -- internal, staff-only
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references requirements(id) on delete cascade,
  author_id uuid not null references profiles(id),
  text text not null,
  at timestamptz not null default now()
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references requirements(id) on delete cascade,
  provider_id uuid not null references providers(id) on delete cascade,
  status match_status not null default 'suggested',
  provider_interest provider_interest not null default 'none',
  score int,                            -- snapshot written by the scoring function
  dimensions jsonb,                     -- 8-dimension breakdown snapshot
  reviewed_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (requirement_id, provider_id)
);

-- The ONLY provider data the scoring function may read. `listing_package`,
-- `profile_views` and any commercial data are intentionally absent.
create view match_inputs as
  select p.id, p.industries, p.categories, p.capabilities, p.regions, p.certifications, p.budget_bands, p.size,
         coalesce((select jsonb_agg(jsonb_build_object('industry_id', c.industry_id, 'category_id', c.category_id))
                   from provider_case_studies c where c.provider_id = p.id), '[]'::jsonb) as case_studies
  from providers p
  where p.matching_eligible and p.account_status = 'active';

-- ---------------------------------------------------------------- opportunities & meetings
create table opportunities (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  requirement_id uuid not null references requirements(id),
  provider_id uuid not null references providers(id),
  buyer_org_id uuid not null references buyer_orgs(id),
  stage opportunity_stage not null default 'introduction',
  owner_id uuid references team_members(id),
  next_step text,
  next_step_due date,
  outcome text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table opportunity_notes (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  author_id uuid not null references profiles(id),
  text text not null,
  at timestamptz not null default now()
);

create table meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  at timestamptz not null,
  duration_mins int not null default 60,
  mode text not null check (mode in ('video', 'in-person', 'phone')),
  location text,
  buyer_org_id uuid references buyer_orgs(id),
  provider_id uuid references providers(id),
  requirement_id uuid references requirements(id),
  engagement_id uuid,
  attendees uuid[] not null default '{}',
  status text not null default 'scheduled' check (status in ('scheduled', 'requested', 'completed', 'cancelled')),
  agenda text
);

-- ---------------------------------------------------------------- Elets Pro
create table pro_requests (
  id uuid primary key default gen_random_uuid(),
  buyer_org_id uuid not null references buyer_orgs(id),
  requirement_id uuid references requirements(id),
  services text[] not null default '{}',
  note text,
  status text not null default 'new' check (status in ('new', 'contacted', 'converted')),
  at timestamptz not null default now()
);

create table pro_engagements (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  buyer_org_id uuid not null references buyer_orgs(id),
  requirement_id uuid references requirements(id),
  rm_id uuid not null references team_members(id),
  status text not null default 'active' check (status in ('active', 'on_hold', 'completed')),
  start_date date not null default current_date,
  target_date date,
  modules jsonb not null,               -- { discovery: 'done', intelligence: 'active', ... }
  brief jsonb not null default '{}'::jsonb,
  recommendation jsonb,
  outcome text
);
alter table meetings add constraint meetings_engagement_fk foreign key (engagement_id) references pro_engagements(id);

create table pro_shortlist (
  engagement_id uuid references pro_engagements(id) on delete cascade,
  provider_id uuid references providers(id),
  status text not null,
  diligence text not null default 'not_started',
  note text not null default '',
  primary key (engagement_id, provider_id)
);
create table pro_market_scan (id uuid primary key default gen_random_uuid(), engagement_id uuid references pro_engagements(id) on delete cascade, segment text, finding text, provider_ids uuid[] default '{}');
create table pro_documents (id uuid primary key default gen_random_uuid(), engagement_id uuid references pro_engagements(id) on delete cascade, name text, category text, storage_path text, size_bytes bigint, uploaded_by uuid references profiles(id), at timestamptz default now());
create table pro_criteria (id uuid primary key default gen_random_uuid(), engagement_id uuid references pro_engagements(id) on delete cascade, name text, grp text check (grp in ('technical', 'commercial')), weight int check (weight between 0 and 100));
create table pro_scores (engagement_id uuid references pro_engagements(id) on delete cascade, provider_id uuid references providers(id), criterion_id uuid references pro_criteria(id) on delete cascade, score numeric check (score between 0 and 10), primary key (engagement_id, provider_id, criterion_id));
create table pro_milestones (id uuid primary key default gen_random_uuid(), engagement_id uuid references pro_engagements(id) on delete cascade, title text, due date, status text, module text);
create table pro_tasks (id uuid primary key default gen_random_uuid(), engagement_id uuid references pro_engagements(id) on delete cascade, title text, assignee_id uuid references profiles(id), due date, status text, priority text, module text);
create table pro_meeting_notes (id uuid primary key default gen_random_uuid(), engagement_id uuid references pro_engagements(id) on delete cascade, title text, date date, attendees text[], summary text, actions text[]);
create table pro_messages (id uuid primary key default gen_random_uuid(), engagement_id uuid references pro_engagements(id) on delete cascade, author_id uuid references profiles(id), text text, at timestamptz default now());

-- ---------------------------------------------------------------- comms, content, audit
create table notifications (
  id uuid primary key default gen_random_uuid(),
  audience app_role not null,
  user_id uuid references profiles(id),  -- null = everyone with the audience role (scoped by RLS)
  type text not null,
  title text not null,
  body text not null,
  href text not null,
  read boolean not null default false,
  at timestamptz not null default now()
);

create table threads (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  context_kind text not null default 'general',
  context_id uuid,
  created_at timestamptz not null default now()
);
create table thread_participants (thread_id uuid references threads(id) on delete cascade, user_id uuid references profiles(id), last_read_at timestamptz, primary key (thread_id, user_id));
create table messages (id uuid primary key default gen_random_uuid(), thread_id uuid not null references threads(id) on delete cascade, author_id uuid not null references profiles(id), text text not null, at timestamptz not null default now());

create table site_content (id int primary key default 1 check (id = 1), content jsonb not null);
create table announcements (id uuid primary key default gen_random_uuid(), title text, body text, audience text, active boolean default true, at timestamptz default now());
create table saved_searches (id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles(id) on delete cascade, name text, query text, filters jsonb, at timestamptz default now());
create table favourites (user_id uuid references profiles(id) on delete cascade, provider_id uuid references providers(id) on delete cascade, primary key (user_id, provider_id));

create table audit_log (
  id bigserial primary key,
  actor_id uuid references profiles(id),
  action text not null,
  entity text not null,
  entity_id text,
  detail text,
  at timestamptz not null default now()
);

-- ---------------------------------------------------------------- helpers
create or replace function public.my_role() returns app_role language sql stable security definer set search_path = public as
  $$ select role from profiles where id = auth.uid() $$;
create or replace function public.my_buyer_org() returns uuid language sql stable security definer set search_path = public as
  $$ select buyer_org_id from profiles where id = auth.uid() $$;
create or replace function public.my_provider() returns uuid language sql stable security definer set search_path = public as
  $$ select provider_id from profiles where id = auth.uid() $$;
create or replace function public.is_staff() returns boolean language sql stable as $$ select public.my_role() = 'admin' $$;

-- Providers may edit their profile but never the integrity-controlled columns.
create or replace function public.protect_provider_controls() returns trigger language plpgsql as $$
begin
  if not public.is_staff() and (
       new.verification is distinct from old.verification or
       new.verified_at is distinct from old.verified_at or
       new.matching_eligible is distinct from old.matching_eligible or
       new.listing_package is distinct from old.listing_package or
       new.account_status is distinct from old.account_status) then
    raise exception 'Only Elets staff can change verification, matching eligibility, listing package or account status';
  end if;
  return new;
end $$;
create trigger providers_protect before update on providers for each row execute function public.protect_provider_controls();

-- Generic audit trigger for staff writes on key tables.
create or replace function public.audit_staff_write() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_staff() then
    insert into audit_log (actor_id, action, entity, entity_id, detail)
    values (auth.uid(), lower(tg_op), tg_table_name, coalesce((to_jsonb(new) ->> 'id'), (to_jsonb(old) ->> 'id')), null);
  end if;
  return coalesce(new, old);
end $$;
do $$ declare t text; begin
  foreach t in array array['providers','buyer_orgs','requirements','matches','opportunities','pro_engagements','tech_categories','industries','site_content'] loop
    execute format('create trigger %I_audit after insert or update or delete on %I for each row execute function public.audit_staff_write()', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------- row level security
do $$ declare t text; begin
  foreach t in array array['industries','tech_categories','service_categories','regions','providers','provider_solutions','provider_case_studies','provider_documents','buyer_orgs','profiles','team_members','requirements','requirement_attachments','requirement_status_history','requirement_notes','matches','opportunities','opportunity_notes','meetings','pro_requests','pro_engagements','pro_shortlist','pro_market_scan','pro_documents','pro_criteria','pro_scores','pro_milestones','pro_tasks','pro_meeting_notes','pro_messages','notifications','threads','thread_participants','messages','site_content','announcements','saved_searches','favourites','audit_log'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy staff_all on %I for all using (public.is_staff()) with check (public.is_staff())', t);
  end loop;
end $$;

-- Public / any signed-in user
create policy taxonomy_read on industries for select using (active);
create policy taxonomy_read on tech_categories for select using (active);
create policy taxonomy_read on service_categories for select using (active);
create policy taxonomy_read on regions for select using (active);
create policy providers_public_read on providers for select using (account_status = 'active');
create policy solutions_public_read on provider_solutions for select using (true);
create policy cases_public_read on provider_case_studies for select using (true);
create policy content_read on site_content for select using (true);
create policy announcements_read on announcements for select using (active);

-- Providers manage their own profile
create policy provider_update_own on providers for update using (id = public.my_provider()) with check (id = public.my_provider());
create policy provider_solutions_own on provider_solutions for all using (provider_id = public.my_provider()) with check (provider_id = public.my_provider());
create policy provider_cases_own on provider_case_studies for all using (provider_id = public.my_provider()) with check (provider_id = public.my_provider());
create policy provider_docs_own on provider_documents for all using (provider_id = public.my_provider()) with check (provider_id = public.my_provider());

-- Buyers see their own org and requirements
create policy buyer_org_read on buyer_orgs for select using (id = public.my_buyer_org());
create policy profiles_self on profiles for select using (id = auth.uid());
create policy req_buyer_rw on requirements for select using (buyer_org_id = public.my_buyer_org());
create policy req_buyer_insert on requirements for insert with check (buyer_org_id = public.my_buyer_org() and stage = 'submitted');
create policy req_attach_buyer on requirement_attachments for all using (requirement_id in (select id from requirements where buyer_org_id = public.my_buyer_org()));
create policy req_history_buyer on requirement_status_history for select using (requirement_id in (select id from requirements where buyer_org_id = public.my_buyer_org()));

-- Matches: buyers only after Elets review; providers only for their own approved matches
create policy match_buyer_read on matches for select using (
  status not in ('suggested', 'rejected') and requirement_id in (select id from requirements where buyer_org_id = public.my_buyer_org()));
create policy match_provider_read on matches for select using (provider_id = public.my_provider() and status not in ('suggested', 'rejected'));
-- Providers may only change provider_interest (enforce column-level via RPC in production).
create policy match_provider_interest on matches for update using (provider_id = public.my_provider()) with check (provider_id = public.my_provider());
-- Providers see a matched requirement's brief (buyer identity is joined only once introduced — do this in an RPC/view).
create policy req_provider_matched on requirements for select using (id in (select requirement_id from matches where provider_id = public.my_provider() and status not in ('suggested', 'rejected')));

create policy opp_party_read on opportunities for select using (buyer_org_id = public.my_buyer_org() or provider_id = public.my_provider());
create policy meetings_party on meetings for select using (buyer_org_id = public.my_buyer_org() or provider_id = public.my_provider() or auth.uid() = any(attendees));
create policy pro_req_buyer on pro_requests for all using (buyer_org_id = public.my_buyer_org()) with check (buyer_org_id = public.my_buyer_org());
create policy pro_eng_buyer on pro_engagements for select using (buyer_org_id = public.my_buyer_org());
create policy notif_own on notifications for select using (audience = public.my_role() and (user_id is null or user_id = auth.uid()));
create policy notif_mark_read on notifications for update using (user_id = auth.uid());
create policy thread_member on threads for select using (id in (select thread_id from thread_participants where user_id = auth.uid()));
create policy thread_part_self on thread_participants for select using (user_id = auth.uid());
create policy messages_member on messages for select using (thread_id in (select thread_id from thread_participants where user_id = auth.uid()));
create policy messages_post on messages for insert with check (author_id = auth.uid() and thread_id in (select thread_id from thread_participants where user_id = auth.uid()));
create policy saved_search_own on saved_searches for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy fav_own on favourites for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Pro child tables readable by the engagement's buyer
do $$ declare t text; begin
  foreach t in array array['pro_shortlist','pro_market_scan','pro_documents','pro_criteria','pro_scores','pro_milestones','pro_tasks','pro_meeting_notes','pro_messages'] loop
    execute format('create policy buyer_read on %I for select using (engagement_id in (select id from pro_engagements where buyer_org_id = public.my_buyer_org()))', t);
  end loop;
end $$;
create policy pro_messages_buyer_post on pro_messages for insert with check (author_id = auth.uid() and engagement_id in (select id from pro_engagements where buyer_org_id = public.my_buyer_org()));

-- ---------------------------------------------------------------- storage
insert into storage.buckets (id, name, public) values ('logos', 'logos', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('documents', 'documents', false) on conflict do nothing;

create policy "logos public read" on storage.objects for select using (bucket_id = 'logos');
create policy "provider uploads own logo" on storage.objects for insert with check (bucket_id = 'logos' and (storage.foldername(name))[1] = public.my_provider()::text);
create policy "staff documents" on storage.objects for all using (bucket_id = 'documents' and public.is_staff());
create policy "provider own documents" on storage.objects for all using (bucket_id = 'documents' and (storage.foldername(name))[1] = 'providers' and (storage.foldername(name))[2] = public.my_provider()::text);
create policy "buyer requirement documents" on storage.objects for all using (
  bucket_id = 'documents' and (storage.foldername(name))[1] = 'requirements'
  and (storage.foldername(name))[2]::uuid in (select id from requirements where buyer_org_id = public.my_buyer_org()));
