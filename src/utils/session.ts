// ─── Unified Session Utility ──────────────────────────────────────────────────
// Single source of truth for all login paths:
//   - AuthModal (booking form OTP)
//   - /login page (full login)
//   - /admin/login page (admin OTP)
//
// All three paths call setSession() on success.
// All readers (Navbar, guards, booking form) call getSession().
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole = 'customer' | 'admin' | 'driver';

export interface Session {
  mobile: string;
  name: string;
  role: UserRole;
  verified: boolean;
}

const KEY = 'app_session';

export function setSession(session: Session): void {
  localStorage.setItem(KEY, JSON.stringify(session));

  // Keep legacy keys in sync so any old code still works
  localStorage.setItem('auth_token', 'session-' + Date.now());
  localStorage.setItem('auth_user', JSON.stringify(session));

  // Keep urs_user in sync for booking form / getUrsUser() callers
  if (session.role === 'customer') {
    localStorage.setItem('urs_user', JSON.stringify({ mobile: session.mobile, verified: true }));
  }

  // Keep admin_session in sync for getAdminSession() callers
  if (session.role === 'admin') {
    localStorage.setItem('admin_session', JSON.stringify(session));
  }

  // Notify other tabs / same-tab listeners
  window.dispatchEvent(new Event('session-change'));
}

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    // 1. Primary: app_session
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Session;
      if (s?.mobile && s?.verified) return s;
    }

    // 2. Fallback: urs_user (set by old AuthModal before this utility existed)
    const urs = localStorage.getItem('urs_user');
    if (urs) {
      const u = JSON.parse(urs);
      if (u?.mobile && u?.verified) {
        const s: Session = { mobile: u.mobile, name: u.mobile, role: 'customer', verified: true };
        setSession(s); // migrate to unified key
        return s;
      }
    }

    // 3. Fallback: auth_user (set by old /login page before this utility existed)
    const au = localStorage.getItem('auth_user');
    if (au) {
      const u = JSON.parse(au);
      if (u?.mobile) {
        const s: Session = {
          mobile: u.mobile,
          name: u.name || u.mobile,
          role: (u.role as UserRole) || 'customer',
          verified: true,
        };
        setSession(s); // migrate to unified key
        return s;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(KEY);
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  localStorage.removeItem('urs_user');
  localStorage.removeItem('admin_session');
  window.dispatchEvent(new Event('session-change'));
}

export function isLoggedIn(): boolean {
  return getSession() !== null;
}
