import { useState, useEffect, useRef } from 'react';
import { Link } from '@tanstack/react-router';
import { ShieldCheck, XIcon } from 'lucide-react';
import { getUrsUser, clearUrsUser, maskMobile } from '@/utils/ursSession';

interface NavbarProps {
  onLoginClick?: () => void;
}

export function Navbar({ onLoginClick }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(() => getUrsUser());
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(getUrsUser());
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  const isAdmin =
    typeof window !== 'undefined' &&
    (() => {
      try {
        const u = localStorage.getItem('auth_user');
        return u ? JSON.parse(u).role === 'admin' : false;
      } catch {
        return false;
      }
    })();

  const isDriver =
    typeof window !== 'undefined' &&
    (() => {
      try {
        const u = localStorage.getItem('auth_user');
        return u ? JSON.parse(u).role === 'driver' : false;
      } catch {
        return false;
      }
    })();

  const handleLogout = () => {
    clearUrsUser();
    setUser(null);
    setMobileMenuOpen(false);
  };

  const closeMenu = () => setMobileMenuOpen(false);

  const loginButton = user ? (
    <div className="hidden sm:flex items-center gap-3">
      <span className="text-sm text-slate-300">👤 {maskMobile(user.mobile)}</span>
      <button
        type="button"
        onClick={handleLogout}
        className="text-sm text-slate-400 hover:text-white transition"
      >
        Logout
      </button>
    </div>
  ) : (
    <button
      type="button"
      onClick={() => {
        if (onLoginClick) onLoginClick();
        else window.location.href = '/booking';
      }}
      className="hidden sm:inline-flex border border-slate-600 text-slate-300 hover:bg-white hover:text-slate-900 font-bold px-5 py-2 rounded-full text-sm transition-all duration-200"
    >
      Login / Sign Up
    </button>
  );

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-4 flex items-center justify-between relative">
        <Link to="/" className="flex items-center gap-2 text-white" onClick={closeMenu}>
          <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <div className="leading-tight">
            <span className="font-bold tracking-tight text-sm sm:text-base">UR&apos;s Chauffeur</span>
            <div className="text-[10px] text-slate-400 -mt-0.5">Professional drivers · Nationwide</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm text-slate-300">
          <Link to="/" className="hover:text-white transition">Home</Link>
          <Link to="/booking" className="hover:text-white transition">Book a Driver</Link>
          <a href="/#how-it-works" className="hover:text-white transition">How It Works</a>
          <a href="/#contact" className="hover:text-white transition">Contact</a>
        </nav>

        {loginButton}

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-2xl text-white font-bold px-2 hover:bg-slate-800 rounded-lg transition"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <XIcon size={24} /> : '⋮'}
        </button>

        {mobileMenuOpen && (
          <div
            ref={menuRef}
            className="md:hidden absolute right-4 top-full mt-2 bg-slate-800 rounded-2xl shadow-xl p-2 min-w-48 z-50"
          >
            <nav className="flex flex-col">
              <Link to="/" className="px-4 py-3 text-white hover:bg-slate-700 rounded-xl text-sm" onClick={closeMenu}>
                Home
              </Link>
              <Link to="/booking" className="px-4 py-3 text-white hover:bg-slate-700 rounded-xl text-sm" onClick={closeMenu}>
                Book a Driver
              </Link>
              <a href="/#how-it-works" className="px-4 py-3 text-white hover:bg-slate-700 rounded-xl text-sm" onClick={closeMenu}>
                How It Works
              </a>
              <a href="/#contact" className="px-4 py-3 text-white hover:bg-slate-700 rounded-xl text-sm" onClick={closeMenu}>
                Contact
              </a>
              <div className="border-t border-slate-700 my-1" />
              {!user && (
                <button
                  type="button"
                  className="px-4 py-3 text-white hover:bg-slate-700 rounded-xl text-sm font-semibold text-left"
                  onClick={() => {
                    closeMenu();
                    if (onLoginClick) onLoginClick();
                    else window.location.href = '/booking';
                  }}
                >
                  Login / Sign Up
                </button>
              )}
              {isAdmin && (
                <Link to="/admin" className="px-4 py-3 text-white hover:bg-slate-700 rounded-xl text-sm" onClick={closeMenu}>
                  Admin Panel
                </Link>
              )}
              {isDriver && (
                <Link to="/driver" className="px-4 py-3 text-white hover:bg-slate-700 rounded-xl text-sm" onClick={closeMenu}>
                  Driver Portal
                </Link>
              )}
              {user && (
                <>
                  <div className="border-t border-slate-700 my-1" />
                  <button
                    type="button"
                    className="px-4 py-3 text-white hover:bg-slate-700 rounded-xl text-sm text-left"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
