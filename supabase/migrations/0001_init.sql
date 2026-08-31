-- ============================================================================
-- 0001_init.sql
-- Profiles, trips, trip_members, platform admin, and their RLS policies.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Generic updated_at trigger helper (reused by later migrations too)
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  is_platform_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Populate a profile row whenever a new auth user is created.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values ( 
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Regular users may only ever update their own non-privileged columns.
-- is_platform_admin may only change if the caller is already an admin
-- (enforced here rather than via column-level RLS, which is fiddly).
-- auth.uid() is null for direct database access (SQL editor, service role,
-- migrations) rather than an app request through Supabase Auth, so that
-- path is left open — it's how the very first admin gets bootstrapped, and
-- RLS already blocks any unauthenticated app request before this trigger
-- would ever see it.
create or replace function protect_admin_flag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_platform_admin is distinct from old.is_platform_admin then
    if auth.uid() is not null and not exists (
      select 1 from profiles where id = auth.uid() and is_platform_admin
    ) then
      raise exception 'only a platform admin may change is_platform_admin';
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_admin_flag_trigger
  before update on profiles
  for each row execute function protect_admin_flag();

-- ----------------------------------------------------------------------------
-- RLS helper functions (used across this and later migrations)
-- ----------------------------------------------------------------------------
create or replace function is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_platform_admin from profiles where id = auth.uid()), false)
$$;

-- profiles policies
create policy "profiles_select_self_or_admin"
  on profiles for select
  using (id = auth.uid() or is_platform_admin());

create policy "profiles_update_self_or_admin"
  on profiles for update
  using (id = auth.uid() or is_platform_admin());

create policy "profiles_admin_all"
  on profiles for all
  using (is_platform_admin());

-- ----------------------------------------------------------------------------
-- trips
-- ----------------------------------------------------------------------------
create table trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id),
  name text not null,
  description text,
  destination text,
  start_date date,
  end_date date,
  timezone text,
  cover_photo_path text,
  default_currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table trips enable row level security;

create trigger trips_set_updated_at
  before update on trips
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- trip_members
-- ----------------------------------------------------------------------------
create table trip_members (
  trip_id uuid not null references trips (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  invited_by uuid references profiles (id),
  joined_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

alter table trip_members enable row level security;

create index trip_members_user_id_idx on trip_members (user_id);

create or replace function is_trip_member(_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from trip_members
    where trip_id = _trip_id and user_id = auth.uid()
  )
$$;

create or replace function trip_role(_trip_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from trip_members
  where trip_id = _trip_id and user_id = auth.uid()
$$;

-- Automatically add the creator as 'owner' when a trip is created.
-- SECURITY DEFINER avoids the chicken-and-egg problem of needing to already
-- be a trip member to insert yourself as the first one.
create or replace function add_trip_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into trip_members (trip_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger trips_add_owner
  after insert on trips
  for each row execute function add_trip_owner();

-- trips policies
create policy "trips_select_member_or_admin"
  on trips for select
  using (is_trip_member(id) or is_platform_admin());

create policy "trips_insert_self"
  on trips for insert
  with check (owner_id = auth.uid());

create policy "trips_update_owner_or_admin"
  on trips for update
  using (trip_role(id) = 'owner' or is_platform_admin());

create policy "trips_delete_owner_or_admin"
  on trips for delete
  using (trip_role(id) = 'owner' or is_platform_admin());

-- trip_members policies
create policy "trip_members_select_member_or_admin"
  on trip_members for select
  using (is_trip_member(trip_id) or is_platform_admin());

create policy "trip_members_write_owner_or_admin"
  on trip_members for all
  using (trip_role(trip_id) = 'owner' or is_platform_admin())
  with check (trip_role(trip_id) = 'owner' or is_platform_admin());

-- ----------------------------------------------------------------------------
-- Realtime replication
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table trips;
alter publication supabase_realtime add table trip_members;
