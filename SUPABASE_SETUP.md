# Supabase Integration Setup Guide

## ✅ Completed Steps

### 1. Installed Supabase Client
```bash
npm install @supabase/supabase-js
```

### 2. Created Supabase Configuration
- **File:** `src/lib/supabase.ts`
- **Features:**
  - Browser client with auto-refresh
  - Phone OTP authentication
  - Email/password authentication
  - Database helpers
  - Storage helpers
  - Realtime subscriptions

### 3. Environment Variables Configured
- ✅ `VITE_SUPABASE_URL` - Your project URL
- ✅ `VITE_SUPABASE_ANON_KEY` - Public API key
- ✅ `DATABASE_URL` - PostgreSQL connection string

---

## 🚀 Next Steps (Do These in Supabase Dashboard)

### Step 1: Enable Phone Authentication
1. Go to: **Authentication → Providers**
2. Enable: **Phone**
3. Choose SMS provider:
   - **Twilio** (recommended for India)
   - **MessageBird**
   - **Vonage**
4. Add provider credentials
5. Save settings

### Step 2: Configure Phone Auth Settings
1. Go to: **Authentication → Settings**
2. Set **Minimum Password Length:** 6
3. Enable **Confirm Email:** OFF (for phone-only auth)
4. Set **Site URL:** `http://localhost:3000` (dev) or your production URL
5. Add **Redirect URLs:**
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.com/auth/callback`

### Step 3: Set Up Database Tables
Run this SQL in **SQL Editor**:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone VARCHAR(15) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  email VARCHAR(255),
  role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'driver', 'admin')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  emergency_contacts JSONB,
  notification_preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drivers table
CREATE TABLE public.drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  license_number VARCHAR(50) UNIQUE NOT NULL,
  license_expiry DATE NOT NULL,
  vehicle_type VARCHAR(50),
  vehicle_number VARCHAR(20),
  kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
  is_available BOOLEAN DEFAULT false,
  current_location JSONB,
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_rides INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES public.customers(id),
  driver_id UUID REFERENCES public.drivers(id),
  booking_type VARCHAR(20) NOT NULL CHECK (booking_type IN ('on-demand', 'scheduled', 'hourly', 'outstation')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in-progress', 'completed', 'cancelled')),
  pickup_location JSONB NOT NULL,
  drop_location JSONB,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER,
  fare DECIMAL(10,2),
  distance DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for customers table
CREATE POLICY "Customers can view own data" ON public.customers
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Customers can update own data" ON public.customers
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for drivers table
CREATE POLICY "Drivers can view own data" ON public.drivers
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Drivers can update own data" ON public.drivers
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for bookings table
CREATE POLICY "Customers can view own bookings" ON public.bookings
  FOR SELECT USING (
    customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  );

CREATE POLICY "Drivers can view assigned bookings" ON public.bookings
  FOR SELECT USING (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );

-- Create indexes for performance
CREATE INDEX idx_users_phone ON public.users(phone);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX idx_bookings_driver ON public.bookings(driver_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_drivers_available ON public.drivers(is_available);
```

### Step 4: Set Up Storage Buckets
1. Go to: **Storage**
2. Create buckets:
   - `driver-documents` (private) - for KYC, license, etc.
   - `vehicle-images` (public) - for vehicle photos
   - `profile-pictures` (public) - for user avatars

3. Set bucket policies:

**For driver-documents (private):**
```sql
-- Allow authenticated users to upload their own documents
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to view their own documents
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
```

**For vehicle-images (public):**
```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload vehicle images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vehicle-images');

-- Allow public read access
CREATE POLICY "Public can view vehicle images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vehicle-images');
```

### Step 5: Configure Realtime
1. Go to: **Database → Replication**
2. Enable realtime for tables:
   - ✅ `bookings` - for live booking updates
   - ✅ `drivers` - for live driver location
3. Click **Save**

---

## 🔧 Integration Status

### ✅ Completed
- [x] Supabase client installed
- [x] Configuration file created
- [x] Environment variables set
- [x] Helper functions for auth, db, storage

### 🚧 Pending (Requires Supabase Dashboard Setup)
- [ ] Enable Phone Auth provider
- [ ] Create database tables
- [ ] Set up RLS policies
- [ ] Create storage buckets
- [ ] Enable realtime replication

### 📝 To Do (Code Updates)
- [ ] Update login to use Supabase Phone Auth
- [ ] Replace demo OTP with real Supabase OTP
- [ ] Update API routes to use Supabase
- [ ] Add user role management
- [ ] Implement file upload for KYC
- [ ] Add realtime booking updates
- [ ] Add live driver tracking

---

## 🧪 Testing Supabase Connection

Run this in your browser console after starting the app:

```javascript
import { supabase } from './src/lib/supabase';

// Test connection
const testConnection = async () => {
  const { data, error } = await supabase.auth.getSession();
  console.log('Supabase connected:', !error);
  console.log('Session:', data);
};

testConnection();
```

---

## 📚 Supabase Features Available

### 1. Authentication
```typescript
import { auth } from '@/lib/supabase';

// Send OTP
await auth.signInWithPhone('+919876543210');

// Verify OTP
await auth.verifyOtp('+919876543210', '123456');

// Get current user
const { user } = await auth.getCurrentUser();

// Sign out
await auth.signOut();
```

### 2. Database
```typescript
import { db } from '@/lib/supabase';

// Query data
const { data, error } = await db.from('bookings').select('*');

// Insert data
await db.from('bookings').insert({ customer_id: '...', ... });

// Update data
await db.from('bookings').update({ status: 'completed' }).eq('id', bookingId);

// Delete data
await db.from('bookings').delete().eq('id', bookingId);
```

### 3. Storage
```typescript
import { storage } from '@/lib/supabase';

// Upload file
await storage.upload('driver-documents', 'user-id/license.jpg', file);

// Get public URL
const url = storage.getPublicUrl('vehicle-images', 'car.jpg');

// Download file
await storage.download('driver-documents', 'user-id/license.jpg');
```

### 4. Realtime
```typescript
import { db } from '@/lib/supabase';

// Subscribe to booking updates
const subscription = db.subscribe('bookings', (payload) => {
  console.log('Booking updated:', payload);
});

// Unsubscribe
subscription.unsubscribe();
```

---

## 🔐 Security Best Practices

1. **Never expose service_role key** in client code
2. **Always use RLS policies** for data access control
3. **Validate user roles** before sensitive operations
4. **Use HTTPS** in production
5. **Enable MFA** for admin accounts
6. **Rotate keys** periodically
7. **Monitor auth logs** for suspicious activity

---

## 🚀 Deployment Checklist

- [ ] Update `VITE_SUPABASE_URL` in Vercel env vars
- [ ] Update `VITE_SUPABASE_ANON_KEY` in Vercel env vars
- [ ] Update `DATABASE_URL` in Vercel env vars
- [ ] Add production URL to Supabase redirect URLs
- [ ] Enable phone auth provider with production credentials
- [ ] Test phone OTP in production
- [ ] Verify RLS policies are working
- [ ] Test file uploads to storage
- [ ] Monitor realtime connections

---

## 📞 Support

- **Supabase Docs:** https://supabase.com/docs
- **Phone Auth Guide:** https://supabase.com/docs/guides/auth/phone-login
- **RLS Guide:** https://supabase.com/docs/guides/auth/row-level-security
- **Storage Guide:** https://supabase.com/docs/guides/storage

---

## 🎯 Next Steps

1. **Complete Supabase Dashboard setup** (Steps 1-5 above)
2. **Test connection** using browser console
3. **Update login component** to use real Supabase Phone Auth
4. **Migrate existing data** (if any) to Supabase
5. **Deploy to production** with updated env vars
