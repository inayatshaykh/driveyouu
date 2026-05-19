// ─── Admin Session Utility ────────────────────────────────────────────────────
// Manages admin authentication state in localStorage.
// Currently uses a hardcoded list of authorized admin mobile numbers with demo OTP.
// To switch to real OTP later: replace verifyAdminOtp() with an API/SMS call.

export interface AdminUser {
  mobile: string;
  name: string;
  role: 'admin';
}

const STORAGE_KEY = 'admin_session';

// ── Authorized admin mobile numbers ──────────────────────────────────────────
// Add or remove admin numbers here. When real OTP is ready, this list moves
// to the database and this file just calls the API.
const ADMIN_MOBILES: Record<string, { name: string }> = {
  '9876543212': { name: 'Super Admin' },
  // Add more admin numbers here:
  // '9999999999': { name: 'Manager' },
};

// ── Demo OTP (replace with real SMS call later) ───────────────────────────────
const DEMO_OTP = '1234';

export function isAdminMobile(mobile: string): boolean {
  return mobile in ADMIN_MOBILES;
}

// Called when admin enters their mobile — in future, send real OTP via SMS here
export async function sendAdminOtp(mobile: string): Promise<{ error: string | null }> {
  if (!isAdminMobile(mobile)) {
    return { error: 'This number is not registered as an admin.' };
  }
  // TODO: replace with real SMS API call
  // await smsService.send(mobile, generateOtp());
  return { error: null };
}

// Called when admin submits OTP — in future, verify against SMS service here
export async function verifyAdminOtp(
  mobile: string,
  otp: string
): Promise<{ user: AdminUser | null; error: string | null }> {
  if (!isAdminMobile(mobile)) {
    return { user: null, error: 'Unauthorized mobile number.' };
  }
  // TODO: replace with real OTP verification
  if (otp !== DEMO_OTP) {
    return { user: null, error: 'Invalid OTP. Please try again.' };
  }
  const admin = ADMIN_MOBILES[mobile];
  const user: AdminUser = { mobile, name: admin.name, role: 'admin' };
  return { user, error: null };
}

export function setAdminSession(user: AdminUser): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  // Also set auth_token and auth_user so the existing admin guard keeps working
  localStorage.setItem('auth_token', 'admin-' + Date.now());
  localStorage.setItem('auth_user', JSON.stringify(user));
}

export function getAdminSession(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminUser;
    return parsed.role === 'admin' ? parsed : null;
  } catch {
    return null;
  }
}

export function clearAdminSession(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
}
