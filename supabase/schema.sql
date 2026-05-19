-- ============================================================
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone       VARCHAR(15) UNIQUE NOT NULL,
  full_name   VARCHAR(255),
  email       VARCHAR(255),
  role        VARCHAR(20) NOT NULL DEFAULT 'customer'
                CHECK (role IN ('customer', 'driver', 'admin')),
  status      VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── DRIVERS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.drivers (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  license_number   VARCHAR(50) UNIQUE NOT NULL,
  license_expiry   DATE NOT NULL,
  vehicle_type     VARCHAR(50),
  vehicle_number   VARCHAR(20),
  kyc_status       VARCHAR(20) DEFAULT 'pending'
                     CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
  is_available     BOOLEAN DEFAULT false,
  current_lat      DECIMAL(10,8),
  current_lng      DECIMAL(11,8),
  rating           DECIMAL(3,2) DEFAULT 0.00,
  total_rides      INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── BOOKINGS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bookings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id       UUID REFERENCES public.profiles(id),
  driver_id         UUID REFERENCES public.drivers(id),
  booking_type      VARCHAR(20) NOT NULL
                      CHECK (booking_type IN ('on-demand','scheduled','hourly','outstation')),
  status            VARCHAR(20) DEFAULT 'pending'
                      CHECK (status IN ('pending','confirmed','in_progress','completed','cancelled')),
  pickup_address    TEXT NOT NULL,
  pickup_lat        DECIMAL(10,8) NOT NULL,
  pickup_lng        DECIMAL(11,8) NOT NULL,
  drop_address      TEXT,
  drop_lat          DECIMAL(10,8),
  drop_lng          DECIMAL(11,8),
  scheduled_time    TIMESTAMPTZ,
  duration_minutes  INTEGER,
  fare              DECIMAL(10,2),
  distance_km       DECIMAL(8,2),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_phone   ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_role    ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_driver   ON public.bookings(driver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status   ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_drivers_available ON public.drivers(is_available);

-- ─── AUTO-UPDATE updated_at ───────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Drivers: own data
CREATE POLICY "drivers_select_own" ON public.drivers
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "drivers_update_own" ON public.drivers
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "drivers_admin_all" ON public.drivers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Bookings: customers see own, drivers see assigned
CREATE POLICY "bookings_customer_own" ON public.bookings
  FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "bookings_driver_assigned" ON public.bookings
  FOR SELECT USING (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );
CREATE POLICY "bookings_customer_insert" ON public.bookings
  FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "bookings_admin_all" ON public.bookings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── AUTO-CREATE PROFILE ON SIGNUP ───────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.phone, ''),
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── REALTIME ────────────────────────────────────────────────
-- Enable realtime for bookings and drivers tables
-- Go to: Database → Replication → enable for bookings + drivers
