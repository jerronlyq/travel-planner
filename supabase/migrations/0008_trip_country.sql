-- ============================================================================
-- 0008_trip_country.sql
-- Store the trip's country (ISO 3166-1 alpha-2) so the item location search
-- can restrict suggestions to where the trip actually is. Set when the
-- destination is picked from place search; null for free-typed destinations.
-- ============================================================================

alter table trips add column country_code text;
