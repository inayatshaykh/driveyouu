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
