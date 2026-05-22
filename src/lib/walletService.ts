import { supabase } from './supabase';

export interface WalletTransaction {
  id: string;
  driver_id: string;
  type: 'credit' | 'debit' | 'commission' | 'withdrawal';
  amount: number;
  description: string;
  booking_id: string | null;
  created_at: string;
}

export interface WithdrawalRequest {
  id: string;
  driver_id: string;
  driver_name: string;
  driver_phone: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

// ── Wallet balance helpers ────────────────────────────────────────────────────

export async function getDriverWallet(driverId: string): Promise<{
  balance: number; totalEarned: number; totalCommission: number; error: string | null
}> {
  const { data, error } = await supabase
    .from('drivers')
    .select('earnings')
    .eq('id', driverId)
    .single();
  if (error) return { balance: 0, totalEarned: 0, totalCommission: 0, error: error.message };

  // Get transaction totals
  const { data: txns } = await supabase
    .from('wallet_transactions')
    .select('type, amount')
    .eq('driver_id', driverId);

  const totalEarned = (txns ?? []).filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalCommission = (txns ?? []).filter(t => t.type === 'commission').reduce((s, t) => s + t.amount, 0);

  return { balance: data.earnings ?? 0, totalEarned, totalCommission, error: null };
}

// ── Cash payment: deduct 25% commission from wallet immediately ───────────────
export async function processCashPayment(
  driverId: string,
  bookingId: string,
  totalFare: number
): Promise<{ error: string | null }> {
  const driverShare = Math.round(totalFare * 0.75);
  const commission = Math.round(totalFare * 0.25);

  // Get current balance
  const { data: driver } = await supabase.from('drivers').select('earnings, rides').eq('id', driverId).single();
  if (!driver) return { error: 'Driver not found' };

  const newBalance = (driver.earnings ?? 0) + driverShare - commission;

  // Update wallet balance and rides count
  const { error } = await supabase.from('drivers').update({
    earnings: newBalance,
    rides: (driver.rides ?? 0) + 1,
  }).eq('id', driverId);
  if (error) return { error: error.message };

  // Log credit transaction
  await supabase.from('wallet_transactions').insert({
    driver_id: driverId,
    type: 'credit',
    amount: driverShare,
    description: `Cash ride fare (75%) — ₹${totalFare.toLocaleString()} total`,
    booking_id: bookingId,
  });

  // Log commission deduction
  await supabase.from('wallet_transactions').insert({
    driver_id: driverId,
    type: 'commission',
    amount: commission,
    description: `Company commission (25%) — Cash ride`,
    booking_id: bookingId,
  });

  return { error: null };
}

// ── Online payment: credit 75% to driver wallet ───────────────────────────────
export async function processOnlinePayment(
  driverId: string,
  bookingId: string,
  totalFare: number
): Promise<{ error: string | null }> {
  const driverShare = Math.round(totalFare * 0.75);

  const { data: driver } = await supabase.from('drivers').select('earnings, rides').eq('id', driverId).single();
  if (!driver) return { error: 'Driver not found' };

  const { error } = await supabase.from('drivers').update({
    earnings: (driver.earnings ?? 0) + driverShare,
    rides: (driver.rides ?? 0) + 1,
  }).eq('id', driverId);
  if (error) return { error: error.message };

  await supabase.from('wallet_transactions').insert({
    driver_id: driverId,
    type: 'credit',
    amount: driverShare,
    description: `Online ride fare (75%) — ₹${totalFare.toLocaleString()} total`,
    booking_id: bookingId,
  });

  return { error: null };
}

// ── Admin: manual commission deduction ───────────────────────────────────────
export async function adminDeductCommission(
  driverId: string,
  amount: number,
  reason: string
): Promise<{ error: string | null }> {
  const { data: driver } = await supabase.from('drivers').select('earnings').eq('id', driverId).single();
  if (!driver) return { error: 'Driver not found' };

  const { error } = await supabase.from('drivers').update({
    earnings: (driver.earnings ?? 0) - amount,
  }).eq('id', driverId);
  if (error) return { error: error.message };

  await supabase.from('wallet_transactions').insert({
    driver_id: driverId,
    type: 'debit',
    amount,
    description: `Admin deduction: ${reason}`,
    booking_id: null,
  });

  return { error: null };
}

// ── Wallet transactions history ───────────────────────────────────────────────
export async function fetchWalletTransactions(driverId: string): Promise<WalletTransaction[]> {
  const { data } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false })
    .limit(50);
  return (data ?? []) as WalletTransaction[];
}

// ── Withdrawal requests ───────────────────────────────────────────────────────
export async function createWithdrawalRequest(
  driverId: string,
  driverName: string,
  driverPhone: string,
  amount: number
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('withdrawal_requests').insert({
    driver_id: driverId,
    driver_name: driverName,
    driver_phone: driverPhone,
    amount,
    status: 'pending',
  });
  if (error) return { error: error.message };
  return { error: null };
}

export async function fetchAllWithdrawalRequests(): Promise<WithdrawalRequest[]> {
  const { data } = await supabase
    .from('withdrawal_requests')
    .select('*')
    .order('created_at', { ascending: false });
  return (data ?? []) as WithdrawalRequest[];
}

export async function approveWithdrawal(
  requestId: string,
  driverId: string,
  amount: number,
  adminNote?: string
): Promise<{ error: string | null }> {
  // Deduct from driver wallet
  const { data: driver } = await supabase.from('drivers').select('earnings').eq('id', driverId).single();
  if (!driver) return { error: 'Driver not found' };

  const { error: walletError } = await supabase.from('drivers').update({
    earnings: (driver.earnings ?? 0) - amount,
  }).eq('id', driverId);
  if (walletError) return { error: walletError.message };

  // Log withdrawal transaction
  await supabase.from('wallet_transactions').insert({
    driver_id: driverId,
    type: 'withdrawal',
    amount,
    description: 'Withdrawal approved by admin',
    booking_id: null,
  });

  // Update request status
  const { error } = await supabase.from('withdrawal_requests').update({
    status: 'approved',
    admin_note: adminNote ?? null,
    updated_at: new Date().toISOString(),
  }).eq('id', requestId);

  return { error: error?.message ?? null };
}

export async function rejectWithdrawal(
  requestId: string,
  adminNote?: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('withdrawal_requests').update({
    status: 'rejected',
    admin_note: adminNote ?? null,
    updated_at: new Date().toISOString(),
  }).eq('id', requestId);
  return { error: error?.message ?? null };
}
