-- ============================================================================
-- 0009_cover_blur.sql
-- A tiny (~20px) JPEG data-URI stored alongside the cover, rendered blurred
-- behind the real image so trip cards / heroes fade in instead of popping.
-- Written at upload time by CoverImageField.
-- ============================================================================

alter table trips add column cover_blur text;
