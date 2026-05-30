import { supabase } from './supabase';

export interface WalletTransaction {
  id: string;
  driver_id: string;
  type: 'credit' | 'debit' | 'commission' | 'withdrawal';
  payment_method: 'cash' | 'online' | null;
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
  balance: number;
  totalEarned: number;
  totalCommission: number;
  cashRides: number;
  onlineRides: number;
  cashEarned: number;
  onlineEarned: number;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from('drivers')
    .select('earnings')
    .eq('id', driverId)
    .single();
  if (error) return { balance: 0, totalEarned: 0, totalCommission: 0, cashRides: 0, onlineRides: 0, cashEarned: 0, onlineEarned: 0, error: error.message };

  const { data: txns } = await supabase
    .from('wallet_transactions')
    .select('type, amount, payment_method')
    .eq('driver_id', driverId);

  const credits = (txns ?? []).filter(t => t.type === 'credit');
  const totalEarned = credits.reduce((s, t) => s + t.amount, 0);
  const totalCommission = (txns ?? []).filter(t => t.type === 'commission').reduce((s, t) => s + t.amount, 0);
  const cashRides = credits.filter(t => t.payment_method === 'cash').length;
  const onlineRides = credits.filter(t => t.payment_method === 'online').length;
  const cashEarned = credits.filter(t => t.payment_method === 'cash').reduce((s, t) => s + t.amount, 0);
  const onlineEarned = credits.filter(t => t.payment_method === 'online').reduce((s, t) => s + t.amount, 0);

  return { balance: data.earnings ?? 0, totalEarned, totalCommission, cashRides, onlineRides, cashEarned, onlineEarned, error: null };
}

// ── Cash payment: driver collects cash → 25% commission auto-deducted from wallet ──
export async function processCashPayment(
  driverId: string,
  bookingId: string,
  totalFare: number
): Promise<{ error: string | null }> {
  const driverShare = Math.round(totalFare * 0.75);
  const commission = Math.round(totalFare * 0.25);

  const { data: driver } = await supabase.from('drivers').select('earnings, rides').eq('id', driverId).single();
  if (!driver) return { error: 'Driver not found' };

  // Cash: driver gets full fare in hand, but 25% commission is deducted from wallet balance
  // Net effect: wallet goes DOWN by commission amount (driver owes company)
  const newBalance = (driver.earnings ?? 0) - commission;

  const { error } = await supabase.from('drivers').update({
    earnings: newBalance,
    rides: (driver.rides ?? 0) + 1,
  }).eq('id', driverId);
  if (error) return { error: error.message };

  // Log the full fare as credit (cash collected)
  await supabase.from('wallet_transactions').insert({
    driver_id: driverId,
    type: 'credit',
    payment_method: 'cash',
    amount: driverShare,
    description: `💵 Cash ride — collected ₹${totalFare.toLocaleString()} · Your share: ₹${driverShare.toLocaleString()}`,
    booking_id: bookingId,
  });

  // Log commission deduction
  await supabase.from('wallet_transactions').insert({
    driver_id: driverId,
    type: 'commission',
    payment_method: 'cash',
    amount: commission,
    description: `🏢 Commission (25%) deducted — Cash ride · ₹${commission.toLocaleString()}`,
    booking_id: bookingId,
  });

  return { error: null };
}

// ── Online payment: 75% credited to wallet, 25% never enters wallet ──────────
export async function processOnlinePayment(
  driverId: string,
  bookingId: string,
  totalFare: number
): Promise<{ error: string | null }> {
  const driverShare = Math.round(totalFare * 0.75);
  const commission = Math.round(totalFare * 0.25);

  const { data: driver } = await supabase.from('drivers').select('earnings, rides').eq('id', driverId).single();
  if (!driver) return { error: 'Driver not found' };

  // Online: only 75% credited to wallet, 25% goes directly to company
  const { error } = await supabase.from('drivers').update({
    earnings: (driver.earnings ?? 0) + driverShare,
    rides: (driver.rides ?? 0) + 1,
  }).eq('id', driverId);
  if (error) return { error: error.message };

  // Log 75% credit
  await supabase.from('wallet_transactions').insert({
    driver_id: driverId,
    type: 'credit',
    payment_method: 'online',
    amount: driverShare,
    description: `📱 Online ride — ₹${driverShare.toLocaleString()} credited (75% of ₹${totalFare.toLocaleString()})`,
    booking_id: bookingId,
  });

  // Log commission (informational — not deducted from wallet, already withheld)
  await supabase.from('wallet_transactions').insert({
    driver_id: driverId,
    type: 'commission',
    payment_method: 'online',
    amount: commission,
    description: `🏢 Commission (25%) withheld — Online ride · ₹${commission.toLocaleString()}`,
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
