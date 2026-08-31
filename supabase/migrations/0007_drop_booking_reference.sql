-- ============================================================================
-- 0007_drop_booking_reference.sql
-- Drop itinerary_items.booking_reference. Bookings are identified purely by
-- type ('accommodation' / 'transport'); confirmation numbers are no longer
-- tracked. No rows currently use the column.
-- ============================================================================

alter table itinerary_items drop column booking_reference;
