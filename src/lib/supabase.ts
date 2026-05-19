import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hifdqpnfviyzsmonhzz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpZmRqcXBuZnZpeXpzbW9uaHp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMjIxNjQsImV4cCI6MjA5NDY5ODE2NH0.qZ7pDXXvutsRW1rHVt-0890NgXrwScpLL0leXCl6peU';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

// ─── AUTH ────────────────────────────────────────────────────────────────────

export const auth = {
  sendOtp: async (phone: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
      options: { channel: 'sms' },
    });
    return { data, error };
  },

  verifyOtp: async (phone: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  onAuthStateChange: (cb: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(cb);
  },
};

// ─── PROFILES ────────────────────────────────────────────────────────────────

export const profiles = {
  get: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  upsert: async (profile: Database['public']['Tables']['profiles']['Insert']) => {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile)
      .select()
      .single();
    return { data, error };
  },

  update: async (userId: string, updates: Database['public']['Tables']['profiles']['Update']) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  },
};

// ─── BOOKINGS ────────────────────────────────────────────────────────────────

export const bookings = {
  create: async (booking: Database['public']['Tables']['bookings']['Insert']) => {
    const { data, error } = await supabase
      .from('bookings')
      .insert(booking)
      .select()
      .single();
    return { data, error };
  },

  getByCustomer: async (customerId: string) => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  getByDriver: async (driverId: string) => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  getAll: async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  updateStatus: async (bookingId: string, status: string) => {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', bookingId)
      .select()
      .single();
    return { data, error };
  },

  subscribeToBooking: (bookingId: string, cb: (payload: any) => void) => {
    return supabase
      .channel(`booking:${bookingId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings',
        filter: `id=eq.${bookingId}`,
      }, cb)
      .subscribe();
  },
};

// ─── DRIVERS ─────────────────────────────────────────────────────────────────

export const drivers = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('drivers')
      .select('*, profiles(*)')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  getAvailable: async () => {
    const { data, error } = await supabase
      .from('drivers')
      .select('*, profiles(*)')
      .eq('is_available', true)
      .eq('kyc_status', 'verified');
    return { data, error };
  },

  updateLocation: async (driverId: string, lat: number, lng: number) => {
    const { data, error } = await supabase
      .from('drivers')
      .update({ current_lat: lat, current_lng: lng })
      .eq('id', driverId);
    return { data, error };
  },

  updateAvailability: async (driverId: string, isAvailable: boolean) => {
    const { data, error } = await supabase
      .from('drivers')
      .update({ is_available: isAvailable })
      .eq('id', driverId);
    return { data, error };
  },

  subscribeToLocation: (driverId: string, cb: (payload: any) => void) => {
    return supabase
      .channel(`driver:${driverId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'drivers',
        filter: `id=eq.${driverId}`,
      }, cb)
      .subscribe();
  },
};

// ─── STORAGE ─────────────────────────────────────────────────────────────────

export const storage = {
  uploadDocument: async (userId: string, file: File, docType: string) => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/${docType}.${ext}`;
    const { data, error } = await supabase.storage
      .from('driver-documents')
      .upload(path, file, { upsert: true });
    return { data, error };
  },

  getDocumentUrl: (userId: string, docType: string, ext: string) => {
    const { data } = supabase.storage
      .from('driver-documents')
      .getPublicUrl(`${userId}/${docType}.${ext}`);
    return data.publicUrl;
  },

  uploadProfilePicture: async (userId: string, file: File) => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/avatar.${ext}`;
    const { data, error } = await supabase.storage
      .from('profile-pictures')
      .upload(path, file, { upsert: true });
    return { data, error };
  },
};

export default supabase;
