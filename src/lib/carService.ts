import { supabase } from './supabase';

export interface CarModel {
  id: string;
  name: string;
  type: string;
  quantity: number;
  description: string | null;
  features: string[] | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CarEnquiry {
  id: string;
  car_model_id: string;
  car_name: string;
  customer_name: string;
  customer_phone: string;
  pickup_date: string | null;
  return_date: string | null;
  message: string | null;
  status: 'pending' | 'contacted' | 'booked' | 'cancelled';
  created_at: string;
}

// ── Car Models ────────────────────────────────────────────────────────────────

export async function fetchCarModels(): Promise<CarModel[]> {
  const { data } = await supabase
    .from('car_models')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  return (data ?? []) as CarModel[];
}

export async function fetchAllCarModels(): Promise<CarModel[]> {
  const { data } = await supabase
    .from('car_models')
    .select('*')
    .order('created_at', { ascending: false });
  return (data ?? []) as CarModel[];
}

export async function addCarModel(
  car: Omit<CarModel, 'id' | 'created_at'>
): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from('car_models')
    .insert(car)
    .select('id')
    .single();
  if (error) return { id: null, error: error.message };
  return { id: data.id, error: null };
}

export async function updateCarModel(
  id: string,
  updates: Partial<Omit<CarModel, 'id' | 'created_at'>>
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('car_models').update(updates).eq('id', id);
  return { error: error?.message ?? null };
}

export async function deleteCarModel(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('car_models').delete().eq('id', id);
  return { error: error?.message ?? null };
}

// ── Availability: count active bookings per car model ─────────────────────────
export async function getCarAvailability(carModelId: string, quantity: number): Promise<{
  available: number; booked: number; isAvailable: boolean;
}> {
  const { count } = await supabase
    .from('car_enquiries')
    .select('*', { count: 'exact', head: true })
    .eq('car_model_id', carModelId)
    .eq('status', 'booked');
  const booked = count ?? 0;
  const available = Math.max(0, quantity - booked);
  return { available, booked, isAvailable: available > 0 };
}

// ── Enquiries ─────────────────────────────────────────────────────────────────

export async function submitEnquiry(
  enquiry: Omit<CarEnquiry, 'id' | 'created_at' | 'status'>
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('car_enquiries').insert({ ...enquiry, status: 'pending' });
  return { error: error?.message ?? null };
}

export async function fetchAllEnquiries(): Promise<CarEnquiry[]> {
  const { data } = await supabase
    .from('car_enquiries')
    .select('*')
    .order('created_at', { ascending: false });
  return (data ?? []) as CarEnquiry[];
}

export async function updateEnquiryStatus(
  id: string,
  status: CarEnquiry['status']
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('car_enquiries').update({ status }).eq('id', id);
  return { error: error?.message ?? null };
}
