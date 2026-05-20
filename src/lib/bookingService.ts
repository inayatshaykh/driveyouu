import { supabase } from './supabase';
import type { BookingSummaryData } from '@/components/customer/BookingSummaryModal';

export interface SupabaseBooking {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  booking_type: string;
  status: string;
  pickup_address: string;
  drop_address: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  duration: string | null;
  days: number | null;
  car_category: string;
  transmission: string;
  driver_needed: string | null;
  base_fare: number | null;
  night_charge: number | null;
  total_fare: number;
  cancellation_charge: number | null;
  assigned_driver: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

// Save booking to Supabase
export async function saveBooking(
  data: BookingSummaryData,
  userId: string,
  userName: string,
  userPhone: string
): Promise<{ id: string | null; error: string | null }> {
  const payload = {
    customer_id: userId,
    customer_name: userName,
    customer_phone: userPhone,
    booking_type: data.tab,
    status: 'pending',
    pickup_address: data.pickup,
    drop_address: data.destination ?? null,
    scheduled_date: data.date ?? null,
    scheduled_time: data.time ?? null,
    duration: data.duration ?? null,
    days: data.days ?? null,
    car_category: data.carCategory,
    transmission: data.transmission,
    driver_needed: data.driverNeeded ?? null,
    base_fare: data.baseFare ?? null,
    night_charge: data.nightCharge ?? null,
    total_fare: data.total ?? 0,
    cancellation_charge: data.cancellationCharge ?? null,
    assigned_driver: null,
    admin_notes: null,
  };

  const { data: result, error } = await supabase
    .from('bookings')
    .insert(payload)
    .select('id')
    .single();

  if (error) {
    console.error('Supabase booking error:', error);
    return { id: null, error: error.message };
  }

  return { id: result.id, error: null };
}

// Fetch all bookings for admin
export async function fetchAllBookings(): Promise<{ data: SupabaseBooking[]; error: string | null }> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: data as SupabaseBooking[], error: null };
}

// Update booking status (admin action)
export async function updateBookingStatus(
  bookingId: string,
  status: string,
  assignedDriver?: string,
  adminNotes?: string
): Promise<{ error: string | null }> {
  const updates: any = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (assignedDriver !== undefined) updates.assigned_driver = assignedDriver;
  if (adminNotes !== undefined) updates.admin_notes = adminNotes;

  const { error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', bookingId);

  if (error) return { error: error.message };
  return { error: null };
}

// Fetch bookings for a specific customer (by phone — single fast query)
export async function fetchCustomerBookings(mobile: string): Promise<{ data: SupabaseBooking[]; error: string | null }> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .or(`customer_id.eq.${mobile},customer_phone.eq.${mobile}`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    // RLS / table missing — treat as empty, not a hard error shown to user
    console.error('fetchCustomerBookings error:', error.message);
    return { data: [], error: null };
  }
  return { data: (data ?? []) as SupabaseBooking[], error: null };
}

// Subscribe to real-time booking updates (for admin)
export function subscribeToBookings(callback: (booking: SupabaseBooking) => void) {
  return supabase
    .channel('admin-bookings')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bookings' },
      (payload) => callback(payload.new as SupabaseBooking)
    )
    .subscribe();
}
