import { supabase } from './supabase';

export interface Review {
  id: string;
  name: string;
  city: string;
  rating: number;
  quote: string;
  visible: boolean;
  created_at: string;
}

export async function fetchVisibleReviews(): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('visible', true)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as Review[];
}

export async function fetchAllReviews(): Promise<{ data: Review[]; error: string | null }> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return { data: [], error: error.message };
  return { data: data as Review[], error: null };
}

export async function createReview(
  review: Omit<Review, 'id' | 'created_at'>
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('reviews').insert(review);
  if (error) return { error: error.message };
  return { error: null };
}

export async function updateReview(
  id: string,
  updates: Partial<Omit<Review, 'id' | 'created_at'>>
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('reviews').update(updates).eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function deleteReview(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}
