-- ============================================================================
-- 0005_fix_invite_email_check.sql
-- Both the trip_invites SELECT policy and accept_trip_invite() looked up the
-- caller's email via `select email from auth.users where id = auth.uid()`.
-- RLS policies execute as the querying role (`authenticated`), which has no
-- grant on auth.users, causing "permission denied for table users". Swap to
-- auth.jwt() ->> 'email', which reads the same email off the caller's own
-- session token without touching that table.
-- ============================================================================

drop policy "trip_invites_select_owner_or_invitee" on trip_invites;

create policy "trip_invites_select_owner_or_invitee"
  on trip_invites for select
  using (
    trip_role(trip_id) = 'owner'
    or email = (auth.jwt() ->> 'email')
    or is_platform_admin()
  );

create or replace function accept_trip_invite(_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _invite trip_invites%rowtype;
  _caller_email citext := auth.jwt() ->> 'email';
begin
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
