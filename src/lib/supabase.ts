import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hifdqpnfviyzsmonhzz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpZmRqcXBuZnZpeXpzbW9uaHp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMjIxNjQsImV4cCI6MjA5NDY5ODE2NH0.qZ7pDXXvutsRW1rHVt-0890NgXrwScpLL0leXCl6peU';

// Create Supabase client for browser
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

// Helper functions for authentication
export const auth = {
  // Sign in with phone OTP
  signInWithPhone: async (phone: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        channel: 'sms',
      },
    });
    return { data, error };
  },

  // Verify OTP
  verifyOtp: async (phone: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    return { data, error };
  },

  // Sign in with email/password
  signInWithEmail: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign up with email/password
  signUpWithEmail: async (email: string, password: string, metadata?: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    return { data, error };
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Get current session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Listen to auth state changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Helper functions for database operations
export const db = {
  // Generic query builder
  from: (table: string) => supabase.from(table),

  // Realtime subscriptions
  subscribe: (table: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
      .subscribe();
  },
};

// Helper functions for storage
export const storage = {
  // Upload file
  upload: async (bucket: string, path: string, file: File) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
    return { data, error };
  },

  // Download file
  download: async (bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);
    return { data, error };
  },

  // Get public URL
  getPublicUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return data.publicUrl;
  },

  // Delete file
  remove: async (bucket: string, paths: string[]) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove(paths);
    return { data, error };
  },
};

export default supabase;
