-- ============================================================================
-- 0002_itinerary.sql
-- Itinerary days/items, item photos, trip invites, and their RLS policies.
-- ============================================================================

create extension if not exists citext;

-- ----------------------------------------------------------------------------
-- itinerary_days
-- ----------------------------------------------------------------------------
create table itinerary_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips (id) on delete cascade,
  date date not null,
  notes text,
  sort_order int not null default 0,
  unique (trip_id, date)
);

alter table itinerary_days enable row level security;

create index itinerary_days_trip_id_idx on itinerary_days (trip_id);

-- ----------------------------------------------------------------------------
-- itinerary_items
-- ----------------------------------------------------------------------------
create table itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips (id) on delete cascade,
  day_id uuid references itinerary_days (id) on delete set null,
  type text not null check (type in ('accommodation', 'food', 'activity', 'transport', 'place')),
  title text not null,
  notes text,
  location_name text,
  location_address text,
  lat double precision,
  lng double precision,
  start_time timestamptz,
  end_time timestamptz,
  all_day boolean not null default false,
  price_amount numeric(10, 2),
  price_currency text,
  booking_reference text,
  url text,
  sort_order int not null default 0,
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table itinerary_items enable row level security;

create trigger itinerary_items_set_updated_at
  before update on itinerary_items
  for each row execute function set_updated_at();

create index itinerary_items_trip_id_idx on itinerary_items (trip_id);
create index itinerary_items_day_id_idx on itinerary_items (day_id);

-- ----------------------------------------------------------------------------
-- item_photos
-- ----------------------------------------------------------------------------
create table item_photos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references itinerary_items (id) on delete cascade,
  trip_id uuid not null references trips (id) on delete cascade,
  storage_path text not null,
  caption text,
  uploaded_by uuid not null references profiles (id),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table item_photos enable row level security;

create index item_photos_item_id_idx on item_photos (item_id);

-- ----------------------------------------------------------------------------
-- trip_invites
-- ----------------------------------------------------------------------------
create table trip_invites (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips (id) on delete cascade,
  email citext not null,
  role text not null check (role in ('editor', 'viewer')),
  invited_by uuid not null references profiles (id),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz default (now() + interval '14 days')
);

alter table trip_invites enable row level security;

create index trip_invites_email_idx on trip_invites (email);
create index trip_invites_token_idx on trip_invites (token);

-- Accept an invite: validates the invite matches the caller's email, adds
-- them to trip_members, and marks the invite accepted. SECURITY DEFINER so
-- an invitee (not yet a trip member) can call it without broader table grants.
create or replace function accept_trip_invite(_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _invite trip_invites%rowtype;
  _caller_email citext;
begin
  select email into _caller_email from auth.users where id = auth.uid();

  select * into _invite
  from trip_invites
  where token = _token and status = 'pending';

  if not found then
    raise exception 'invite not found or already used';
  end if;

  if _invite.expires_at is not null and _invite.expires_at < now() then
    raise exception 'invite has expired';
  end if;

  if _invite.email != _caller_email then
    raise exception 'invite email does not match the signed-in account';
  end if;

  insert into trip_members (trip_id, user_id, role, invited_by)
  values (_invite.trip_id, auth.uid(), _invite.role, _invite.invited_by)
  on conflict (trip_id, user_id) do nothing;

  update trip_invites set status = 'accepted' where id = _invite.id;

  return _invite.trip_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Policies: itinerary_days / itinerary_items / item_photos
-- Read: any trip member. Write: owner or editor. Admin bypass on every table.
-- ----------------------------------------------------------------------------
create policy "itinerary_days_select_member"
  on itinerary_days for select
  using (is_trip_member(trip_id));

create policy "itinerary_days_write_editor"
  on itinerary_days for all
  using (trip_role(trip_id) in ('owner', 'editor'))
  with check (trip_role(trip_id) in ('owner', 'editor'));

create policy "itinerary_days_admin_all"
  on itinerary_days for all
  using (is_platform_admin());

create policy "itinerary_items_select_member"
  on itinerary_items for select
  using (is_trip_member(trip_id));

create policy "itinerary_items_write_editor"
  on itinerary_items for all
  using (trip_role(trip_id) in ('owner', 'editor'))
  with check (trip_role(trip_id) in ('owner', 'editor'));

create policy "itinerary_items_admin_all"
  on itinerary_items for all
  using (is_platform_admin());

create policy "item_photos_select_member"
  on item_photos for select
  using (is_trip_member(trip_id));

create policy "item_photos_write_editor"
  on item_photos for all
  using (trip_role(trip_id) in ('owner', 'editor'))
  with check (trip_role(trip_id) in ('owner', 'editor'));

create policy "item_photos_admin_all"
  on item_photos for all
  using (is_platform_admin());

-- ----------------------------------------------------------------------------
-- Policies: trip_invites
-- Select: trip owners, or the invited user matching their own email.
-- Insert/delete: trip owners only. Accept happens via the function above.
-- ----------------------------------------------------------------------------
create policy "trip_invites_select_owner_or_invitee"
  on trip_invites for select
  using (
    trip_role(trip_id) = 'owner'
    or email = (select email from auth.users where id = auth.uid())
    or is_platform_admin()
  );

create policy "trip_invites_write_owner_or_admin"
  on trip_invites for all
  using (trip_role(trip_id) = 'owner' or is_platform_admin())
  with check (trip_role(trip_id) = 'owner' or is_platform_admin());

-- ----------------------------------------------------------------------------
-- Realtime replication
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table itinerary_days;
alter publication supabase_realtime add table itinerary_items;
alter publication supabase_realtime add table item_photos;
