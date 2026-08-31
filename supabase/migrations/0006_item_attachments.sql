-- ============================================================================
-- 0006_item_attachments.sql
-- Generalise item_photos into item_attachments so itinerary items can hold
-- any file (booking PDFs, e-tickets) alongside images.
--
-- Rename keeps rows, FKs, RLS policies, the index, and the realtime
-- publication membership; we rename the dependent objects too so names stay
-- honest. New columns describe non-image files.
-- ============================================================================

alter table item_photos rename to item_attachments;
alter index item_photos_item_id_idx rename to item_attachments_item_id_idx;

alter table item_attachments
  add column mime_type text,
  add column file_name text;

-- Existing rows are all images uploaded as JPEG by the old uploader.
update item_attachments set mime_type = 'image/jpeg' where mime_type is null;

alter policy "item_photos_select_member" on item_attachments
  rename to "item_attachments_select_member";
alter policy "item_photos_write_editor" on item_attachments
  rename to "item_attachments_write_editor";
alter policy "item_photos_admin_all" on item_attachments
  rename to "item_attachments_admin_all";
