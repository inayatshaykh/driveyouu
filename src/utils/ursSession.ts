export interface UrsUser {
  mobile: string;
  verified: boolean;
}

const STORAGE_KEY = 'urs_user';

export function getUrsUser(): UrsUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UrsUser;
    return parsed.verified ? parsed : null;
  } catch {
    return null;
  }
}

export function setUrsUser(user: UrsUser): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearUrsUser(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function maskMobile(mobile: string): string {
  if (mobile.length < 4) return mobile;
  return `+91 ${mobile.slice(0, 2)}XXXX${mobile.slice(-2)}`;
}

export const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
