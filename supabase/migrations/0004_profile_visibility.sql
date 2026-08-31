-- ============================================================================
-- 0004_profile_visibility.sql
-- Let trip co-members see each other's basic profile info (name/email), so
-- the members list can show who's who. Previously profiles were only
-- visible to their owner or a platform admin.
-- ============================================================================

create policy "profiles_select_trip_co_member"
  on profiles for select
  using (
    exists (
      select 1 from trip_members tm1
      join trip_members tm2 on tm1.trip_id = tm2.trip_id
      where tm1.user_id = auth.uid() and tm2.user_id = profiles.id
    )
  );
