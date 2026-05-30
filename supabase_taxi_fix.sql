-- ============================================================
-- Run this in Supabase → SQL Editor → New Query
-- Fixes booking_type constraint to allow taxi bookings
-- ============================================================

-- Step 1: Drop the old constraint
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_booking_type_check;

-- Step 2: Add new constraint that includes taxi types
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_booking_type_check
  CHECK (booking_type IN (
    'hourly',
    'multiday',
    'outstation',
    'taxi_oneway_instant',
    'taxi_oneway_schedule',
    'taxi_roundtrip_instant',
    'taxi_roundtrip_schedule'
  ));

-- Step 3: Also add assigned_driver_phone column if missing
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS assigned_driver_phone TEXT;

-- Done!
-- ============================================================
