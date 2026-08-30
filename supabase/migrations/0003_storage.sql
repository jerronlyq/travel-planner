-- ============================================================================
-- 0003_storage.sql
-- Private trip-photos bucket and its RLS policies on storage.objects.
--
-- Path convention: trip-photos/{trip_id}/{item_id}/{uuid}-{filename}
--                   trip-photos/{trip_id}/cover/{uuid}-{filename}
-- storage.foldername(name) splits the object path, so folder[1] = trip_id.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('trip-photos', 'trip-photos', false)
on conflict (id) do nothing;

create policy "trip_photos_select_member"
  on storage.objects for select
  using (
    bucket_id = 'trip-photos'
    and is_trip_member((storage.foldername(name))[1]::uuid)
  );

create policy "trip_photos_insert_editor"
  on storage.objects for insert
  with check (
    bucket_id = 'trip-photos'
    and trip_role((storage.foldername(name))[1]::uuid) in ('owner', 'editor')
  );

create policy "trip_photos_update_editor"
  on storage.objects for update
  using (
    bucket_id = 'trip-photos'
    and trip_role((storage.foldername(name))[1]::uuid) in ('owner', 'editor')
  );

create policy "trip_photos_delete_editor"
  on storage.objects for delete
  using (
    bucket_id = 'trip-photos'
    and trip_role((storage.foldername(name))[1]::uuid) in ('owner', 'editor')
  );

create policy "trip_photos_admin_all"
  on storage.objects for all
  using (bucket_id = 'trip-photos' and is_platform_admin());
