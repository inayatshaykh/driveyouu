-- ============================================================
-- Run this in Supabase → SQL Editor → New Query
-- Adds payment_method column to wallet_transactions
-- ============================================================

ALTER TABLE public.wallet_transactions
  ADD COLUMN IF NOT EXISTS payment_method TEXT
  CHECK (payment_method IN ('cash', 'online', NULL));

-- Done!
-- ============================================================
