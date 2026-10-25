-- DishaYaaN schema: profiles, catalogue, bookings, community, orders, AI usage, RLS.
-- Apply in the Supabase SQL editor or: supabase db push
-- Extensions
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and account_status = 'active'
  );
$$;

create or replace function public.is_mentor()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('mentor', 'admin') and account_status = 'active'
  );
$$;

create or replace function public.current_profile_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users). Role is never self-assigned.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  role text not null default 'student' check (role in ('student', 'mentor', 'admin')),
  account_status text not null default 'active' check (account_status in ('pending', 'active', 'suspended')),
  education jsonb not null default '{}'::jsonb,
  interests text[] not null default '{}',
  preferred_domains text[] not null default '{}',
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);
create index profiles_email_idx on public.profiles (email);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role, account_status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'student',
    'active'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.protect_profile_privileges()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  jwt_role text;
begin
  jwt_role := coalesce(auth.role(), 'anon');
  if jwt_role = 'service_role' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.role := 'student';
    if new.account_status is null then
      new.account_status := 'active';
    end if;
  elsif tg_op = 'UPDATE' then
    if new.role is distinct from old.role and not public.is_admin() then
      raise exception 'role cannot be changed by this user';
    end if;
    if new.account_status is distinct from old.account_status and not public.is_admin() then
      raise exception 'account status cannot be changed by this user';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_protect
  before insert or update on public.profiles
  for each row execute function public.protect_profile_privileges();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  content_id text unique,
  slug text not null unique,
  title text not null,
  kind text,
  track_id text,
  exam_code text,
  summary text,
  accent text,
  class_range text,
  duration_weeks int,
  sessions_per_week int,
  mode text,
  skills text[] not null default '{}',
  projects text[] not null default '{}',
  outcomes text[] not null default '{}',
  curriculum jsonb not null default '[]'::jsonb,
  prerequisites text,
  price_inr numeric,
  goal_oriented boolean not null default false,
  featured boolean not null default false,
  published boolean not null default true,
  thumbnail_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index programs_published_idx on public.programs (published, kind);
create index programs_track_idx on public.programs (track_id);
create index programs_title_trgm on public.programs using gin (title gin_trgm_ops);

create trigger programs_updated_at
  before update on public.programs
  for each row execute function public.set_updated_at();

create table public.mentors (
  id uuid primary key default gen_random_uuid(),
  content_id text unique,
  slug text not null unique,
  code text,
  display_name text,
  role_title text not null,
  domain text,
  bio text,
  expertise text[] not null default '{}',
  helps_with text[] not null default '{}',
  qualifications text,
  experience text,
  languages text[] not null default '{}',
  availability text,
  format text,
  profile_image_url text,
  video_url text,
  video_duration text,
  college text,
  company text,
  published boolean not null default true,
  status text not null default 'verifying',
  user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index mentors_published_idx on public.mentors (published, domain);
create index mentors_user_idx on public.mentors (user_id);

create trigger mentors_updated_at
  before update on public.mentors
  for each row execute function public.set_updated_at();

create table public.program_mentors (
  program_id uuid not null references public.programs (id) on delete cascade,
  mentor_id uuid not null references public.mentors (id) on delete cascade,
  primary key (program_id, mentor_id)
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  content_id text unique,
  slug text not null unique,
  name text not null,
  tagline text,
  best_for text,
  price_inr numeric,
  billing_period text,
  mentor_sessions_per_month int,
  ai_credits_per_month int,
  accent text,
  popular boolean not null default false,
  features text[] not null default '{}',
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger plans_updated_at
  before update on public.plans
  for each row execute function public.set_updated_at();

create table public.mentor_availability (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentors (id) on delete cascade,
  weekday int check (weekday between 0 and 6),
  slot_label text not null,
  session_mode text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index mentor_availability_mentor_idx on public.mentor_availability (mentor_id, active);

-- ---------------------------------------------------------------------------
-- Bookings & requests
-- ---------------------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid references public.profiles (id) on delete set null,
  booker_role text,
  name text not null,
  whatsapp text not null,
  email text,
  domain text,
  session_mode text,
  mentor_slug text,
  mentor_id uuid references public.mentors (id) on delete set null,
  context text,
  requested_date date,
  slot text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled', 'rejected')),
  admin_notes text,
  idempotency_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_status_idx on public.bookings (status, created_at desc);
create index bookings_user_idx on public.bookings (user_id);
create index bookings_whatsapp_idx on public.bookings (whatsapp);

create unique index bookings_pending_slot_uniq
  on public.bookings (whatsapp, requested_date, slot)
  where status in ('pending', 'confirmed') and requested_date is not null and slot is not null and slot <> '';

create unique index bookings_confirmed_mentor_slot_uniq
  on public.bookings (mentor_id, requested_date, slot)
  where status = 'confirmed' and mentor_id is not null and requested_date is not null and slot is not null;

create trigger bookings_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

create table public.mentor_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  name text not null,
  whatsapp text not null,
  class_level text,
  domain text,
  language text,
  availability text,
  context text,
  assigned_mentor_id uuid references public.mentors (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'assigned', 'contacted', 'closed', 'rejected')),
  admin_notes text,
  idempotency_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index mentor_requests_status_idx on public.mentor_requests (status, created_at desc);

create trigger mentor_requests_updated_at
  before update on public.mentor_requests
  for each row execute function public.set_updated_at();

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  category text not null check (category in ('home-demand', 'partner-enquiry', 'contact', 'plan-checkout')),
  name text not null,
  organization text,
  email text,
  phone text,
  class_level text,
  domain text,
  message text,
  plan_slug text,
  status text not null default 'new' check (status in ('new', 'open', 'in_progress', 'closed')),
  assigned_admin_id uuid references public.profiles (id) on delete set null,
  admin_notes text,
  idempotency_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index enquiries_status_idx on public.enquiries (status, category, created_at desc);

create trigger enquiries_updated_at
  before update on public.enquiries
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Community
-- ---------------------------------------------------------------------------
create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  author_name text not null,
  body text not null,
  link text,
  file_path text,
  file_name text,
  tags text[] not null default '{}',
  visibility text not null default 'public' check (visibility in ('public', 'hidden')),
  moderation_status text not null default 'published' check (moderation_status in ('published', 'pending', 'removed')),
  is_announcement boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index community_posts_feed_idx on public.community_posts (moderation_status, visibility, created_at desc);

create trigger community_posts_updated_at
  before update on public.community_posts
  for each row execute function public.set_updated_at();

create table public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  moderation_status text not null default 'published' check (moderation_status in ('published', 'pending', 'removed')),
  created_at timestamptz not null default now()
);

create index community_comments_post_idx on public.community_comments (post_id, created_at);

create table public.community_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  emoji text not null default '👍',
  created_at timestamptz not null default now(),
  unique (post_id, user_id, emoji)
);

create table public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles (id) on delete set null,
  post_id uuid references public.community_posts (id) on delete cascade,
  comment_id uuid references public.community_comments (id) on delete cascade,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed', 'actioned')),
  admin_notes text,
  created_at timestamptz not null default now()
);

create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles (id) on delete set null,
  target_type text not null,
  target_id uuid not null,
  action text not null,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Learning, PathFinder, payments, AI
-- ---------------------------------------------------------------------------
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  program_id uuid references public.programs (id) on delete set null,
  plan_id uuid references public.plans (id) on delete set null,
  status text not null default 'requested' check (status in ('requested', 'active', 'completed', 'cancelled')),
  progress jsonb not null default '{}'::jsonb,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'pending', 'paid', 'failed', 'refunded')),
  enrolled_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index enrollments_student_idx on public.enrollments (student_id);

create trigger enrollments_updated_at
  before update on public.enrollments
  for each row execute function public.set_updated_at();

create table public.pathfinder_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  class_level text,
  answers int[] not null default '{}',
  axes int[] not null,
  top_tracks text[] not null,
  created_at timestamptz not null default now()
);

create index pathfinder_user_idx on public.pathfinder_results (user_id, created_at desc);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  plan_id uuid references public.plans (id) on delete set null,
  program_id uuid references public.programs (id) on delete set null,
  student_name text not null,
  email text,
  whatsapp text not null,
  amount_inr numeric not null,
  currency text not null default 'INR',
  provider text not null default 'manual' check (provider in ('manual', 'razorpay')),
  provider_order_id text unique,
  provider_payment_id text,
  status text not null default 'created' check (status in ('created', 'pending', 'paid', 'failed', 'cancelled')),
  idempotency_key text unique,
  receipt text unique,
  raw_event jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_status_idx on public.orders (status, created_at desc);

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  session_key text,
  feature text not null default 'assistant',
  used_on date not null default current_date,
  request_count int not null default 0,
  tokens int,
  error_status text,
  updated_at timestamptz not null default now(),
  unique (session_key, feature, used_on)
);

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  attempts int not null default 0,
  last_error text,
  idempotency_key text unique,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_idx on public.audit_log (created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.programs enable row level security;
alter table public.mentors enable row level security;
alter table public.program_mentors enable row level security;
alter table public.plans enable row level security;
alter table public.mentor_availability enable row level security;
alter table public.bookings enable row level security;
alter table public.mentor_requests enable row level security;
alter table public.enquiries enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_reactions enable row level security;
alter table public.community_reports enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.enrollments enable row level security;
alter table public.pathfinder_results enable row level security;
alter table public.orders enable row level security;
alter table public.ai_usage enable row level security;
alter table public.notification_outbox enable row level security;
alter table public.audit_log enable row level security;

-- Profiles
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
create policy profiles_insert_own on public.profiles
  for insert with check (id = auth.uid());

-- Public catalogue
create policy programs_public_read on public.programs
  for select using (published = true or public.is_admin());
create policy programs_admin_write on public.programs
  for all using (public.is_admin()) with check (public.is_admin());

create policy mentors_public_read on public.mentors
  for select using (published = true or public.is_admin() or user_id = auth.uid());
create policy mentors_admin_write on public.mentors
  for all using (public.is_admin()) with check (public.is_admin());

create policy program_mentors_read on public.program_mentors
  for select using (true);
create policy program_mentors_admin on public.program_mentors
  for all using (public.is_admin()) with check (public.is_admin());

create policy plans_public_read on public.plans
  for select using (published = true or public.is_admin());
create policy plans_admin_write on public.plans
  for all using (public.is_admin()) with check (public.is_admin());

create policy availability_read on public.mentor_availability
  for select using (active = true or public.is_admin());
create policy availability_admin on public.mentor_availability
  for all using (public.is_admin()) with check (public.is_admin());

-- Bookings: insert own/anonymous pending via authenticated user; listing is own or admin.
-- Anonymous inserts are performed by Edge/Netlify functions with the service role.
create policy bookings_select on public.bookings
  for select using (
    user_id = auth.uid()
    or public.is_admin()
    or exists (select 1 from public.mentors m where m.id = bookings.mentor_id and m.user_id = auth.uid())
  );
create policy bookings_insert on public.bookings
  for insert with check (
    (auth.uid() is not null and (user_id is null or user_id = auth.uid()) and status = 'pending')
    or public.is_admin()
  );
create policy bookings_update_admin on public.bookings
  for update using (public.is_admin()) with check (public.is_admin());

create policy mentor_requests_select on public.mentor_requests
  for select using (user_id = auth.uid() or public.is_admin());
create policy mentor_requests_insert on public.mentor_requests
  for insert with check (
    (auth.uid() is not null and (user_id is null or user_id = auth.uid()) and status = 'pending')
    or public.is_admin()
  );
create policy mentor_requests_admin on public.mentor_requests
  for update using (public.is_admin()) with check (public.is_admin());

create policy enquiries_select on public.enquiries
  for select using (user_id = auth.uid() or public.is_admin());
create policy enquiries_insert on public.enquiries
  for insert with check (
    (auth.uid() is not null and (user_id is null or user_id = auth.uid()))
    or public.is_admin()
  );
create policy enquiries_admin on public.enquiries
  for update using (public.is_admin()) with check (public.is_admin());

-- Community
create policy posts_read on public.community_posts
  for select using (
    (visibility = 'public' and moderation_status = 'published')
    or user_id = auth.uid()
    or public.is_admin()
  );
create policy posts_insert on public.community_posts
  for insert with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and is_announcement = false
  );
create policy posts_update_own on public.community_posts
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
create policy posts_delete_own on public.community_posts
  for delete using (user_id = auth.uid() or public.is_admin());

create policy comments_read on public.community_comments
  for select using (
    moderation_status = 'published'
    or user_id = auth.uid()
    or public.is_admin()
  );
create policy comments_insert on public.community_comments
  for insert with check (auth.uid() is not null and user_id = auth.uid());
create policy comments_delete_own on public.community_comments
  for delete using (user_id = auth.uid() or public.is_admin());

create policy reactions_read on public.community_reactions
  for select using (true);
create policy reactions_write on public.community_reactions
  for insert with check (auth.uid() is not null and user_id = auth.uid());
create policy reactions_delete on public.community_reactions
  for delete using (user_id = auth.uid());

create policy reports_insert on public.community_reports
  for insert with check (auth.uid() is not null);
create policy reports_admin on public.community_reports
  for all using (public.is_admin()) with check (public.is_admin());

create policy moderation_admin on public.moderation_actions
  for all using (public.is_admin()) with check (public.is_admin());

-- Enrollments / PathFinder / orders
create policy enrollments_select on public.enrollments
  for select using (student_id = auth.uid() or public.is_admin());
create policy enrollments_insert on public.enrollments
  for insert with check (student_id = auth.uid() or public.is_admin());
create policy enrollments_admin_update on public.enrollments
  for update using (public.is_admin()) with check (public.is_admin());

create policy pathfinder_select on public.pathfinder_results
  for select using (user_id = auth.uid() or public.is_admin());
create policy pathfinder_insert on public.pathfinder_results
  for insert with check (user_id = auth.uid());

create policy orders_select on public.orders
  for select using (user_id = auth.uid() or public.is_admin());
create policy orders_insert on public.orders
  for insert with check (
    (auth.uid() is not null and (user_id is null or user_id = auth.uid()) and status in ('created', 'pending'))
    or public.is_admin()
  );
create policy orders_admin_update on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

-- AI usage, outbox, audit: no public access (service role / admin read)
create policy ai_usage_own on public.ai_usage
  for select using (user_id = auth.uid() or public.is_admin());
create policy audit_admin on public.audit_log
  for select using (public.is_admin());
create policy audit_admin_insert on public.audit_log
  for insert with check (public.is_admin());

-- Notification outbox: no policies for authenticated users (service role only)

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('community', 'community', true),
  ('program-media', 'program-media', true)
on conflict (id) do nothing;

create policy avatars_read on storage.objects for select using (bucket_id = 'avatars');
create policy avatars_write on storage.objects
  for insert with check (
    bucket_id = 'avatars' and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy avatars_update on storage.objects
  for update using (
    bucket_id = 'avatars' and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy community_media_read on storage.objects for select using (bucket_id = 'community');
create policy community_media_write on storage.objects
  for insert with check (
    bucket_id = 'community' and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy program_media_read on storage.objects for select using (bucket_id = 'program-media');
create policy program_media_admin on storage.objects
  for all using (bucket_id = 'program-media' and public.is_admin())
  with check (bucket_id = 'program-media' and public.is_admin());
