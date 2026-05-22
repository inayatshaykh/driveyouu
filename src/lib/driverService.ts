import { supabase } from './supabase';

export interface SupabaseDriver {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  zone: string;
  rating: number;
  rides: number;
  earnings: number;
  status: 'online' | 'offline';
  kyc: string;
  created_at: string;
}

export async function fetchDrivers(): Promise<{ data: SupabaseDriver[]; error: string | null }> {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return { data: [], error: error.message };
  return { data: data as SupabaseDriver[], error: null };
}

export async function addDriver(
  driver: Omit<SupabaseDriver, 'id' | 'created_at'>
): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from('drivers')
    .insert(driver)
    .select('id')
    .single();
  if (error) return { id: null, error: error.message };
  return { id: data.id, error: null };
}

export async function updateDriverStatus(
  id: string,
  status: 'online' | 'offline'
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('drivers').update({ status }).eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function removeDriver(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('drivers').delete().eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

// Fetch driver by phone (for driver login)
export async function fetchDriverByPhone(phone: string): Promise<{ data: SupabaseDriver | null; error: string | null }> {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('phone', phone)
    .single();
  if (error) return { data: null, error: error.message };
  return { data: data as SupabaseDriver, error: null };
}

// Update driver earnings (add to existing)
export async function addDriverEarnings(id: string, amount: number): Promise<{ error: string | null }> {
  const { data: driver } = await supabase.from('drivers').select('earnings, rides').eq('id', id).single();
  if (!driver) return { error: 'Driver not found' };
  const { error } = await supabase.from('drivers').update({
    earnings: (driver.earnings ?? 0) + amount,
    rides: (driver.rides ?? 0) + 1,
  }).eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

// Deduct commission from driver wallet (for cash payments)
export async function deductDriverCommission(id: string, amount: number): Promise<{ error: string | null }> {
  const { data: driver } = await supabase.from('drivers').select('earnings').eq('id', id).single();
  if (!driver) return { error: 'Driver not found' };
  const newBalance = Math.max(0, (driver.earnings ?? 0) - amount);
  const { error } = await supabase.from('drivers').update({ earnings: newBalance }).eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}
