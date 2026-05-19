import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { ShieldCheck, XIcon, ChevronDown, Calendar, Car, HelpCircle, LogOut, User } from 'lucide-react';
import { getUrsUser, clearUrsUser } from '@/utils/ursSession';

interface NavbarProps {
  onLoginClick?: () => void;
}

export function Navbar({ onLoginClick }: NavbarProps) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [user, setUser] = useState(() => getUrsUser());
  const [userRole, setUserRole] = useState<string | null>(null);

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Load and sync user from localStorage
  useEffect(() => {
    const load = () => {
      const updatedUser = getUrsUser();
      setUser(updatedUser);
      try {
        const u = localStorage.getItem('auth_user');
        setUserRole(u ? JSON.parse(u).role ?? null : null);
      } catch {
        setUserRole(null);
      }
    };
    load();
    window.addEventListener('storage', load);
    const interval = setInterval(load, 1000);
    return () => {
      window.removeEventListener('storage', load);
      clearInterval(interval);
    };
  }, []);

  // Close mobile menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mobileMenuOpen]);

  // Close user dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userDropdownOpen]);

  const isAdmin = userRole === 'admin';
  const isDriver = userRole === 'driver';
  const isCustomer = userRole === 'customer' || (!isAdmin && !isDriver && !!user);

  const displayName = user?.mobile || 'Account';
  const initials = user?.mobile
    ? user.mobile.slice(-4)
    : '?';

  const handleLogout = () => {
    clearUrsUser();
    setUser(null);
    setUserRole(null);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    navigate({ to: '/' });
  };

  const closeAll = () => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-4 flex items-center justify-between relative">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-white flex-shrink-0" onClick={closeAll}>
          <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <div className="leading-tight">
            <span className="font-bold tracking-tight text-sm sm:text-base">UR&apos;s Chauffeur</span>
            <div className="text-[10px] text-slate-400 -mt-0.5">Professional drivers · Nationwide</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7 text-sm text-slate-300">
          <Link to="/" className="hover:text-white transition">Home</Link>
          <Link to="/booking" className="hover:text-white transition">Book a Driver</Link>
          <a href="/#how-it-works" className="hover:text-white transition">How It Works</a>
          <a href="/#contact" className="hover:text-white transition">Contact</a>
        </nav>

        {/* Right side */}
        <div className="hidden md:flex items-center">
          {user ? (
            /* ── User dropdown ── */
            <div className="relative" ref={userDropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(v => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors group"
              >
                {/* Avatar */}
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {initials}
                </div>
                {/* Name */}
                <span className="text-sm font-semibold text-white max-w-[120px] truncate">
                  {displayName}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown panel */}
              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{displayName}</div>
                        <div className="text-xs text-slate-400 truncate capitalize">{userRole || 'customer'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="p-1.5 space-y-0.5">
                    {isCustomer && (
                      <Link
                        to="/customer/bookings"
                        onClick={closeAll}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-colors"
                      >
                        <Calendar className="h-4 w-4 text-slate-400" />
                        My Bookings
                      </Link>
                    )}
                    {isAdmin && (
                      <Link
                        to="/admin/dashboard"
                        onClick={closeAll}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-colors"
                      >
                        <User className="h-4 w-4 text-slate-400" />
                        Admin Panel
                      </Link>
                    )}
                    {isDriver && (
                      <Link
                        to="/driver"
                        onClick={closeAll}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-colors"
                      >
                        <Car className="h-4 w-4 text-slate-400" />
                        Driver Portal
                      </Link>
                    )}
                    <Link
                      to="/booking"
                      onClick={closeAll}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-colors"
                    >
                      <Car className="h-4 w-4 text-slate-400" />
                      Book a Driver
                    </Link>
                    <a
                      href="/#contact"
                      onClick={closeAll}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-colors"
                    >
                      <HelpCircle className="h-4 w-4 text-slate-400" />
                      Help Center
                    </a>

                    <div className="h-px bg-slate-800 mx-1 my-1" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="border border-slate-600 text-slate-300 hover:bg-white hover:text-slate-900 font-bold px-5 py-2 rounded-full text-sm transition-all duration-200"
            >
              Login / Sign Up
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(v => !v)}
          className="md:hidden text-white p-2 hover:bg-slate-800 rounded-lg transition"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <XIcon size={22} /> : <span className="text-2xl font-bold leading-none">⋮</span>}
        </button>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="md:hidden absolute right-4 top-full mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 min-w-52 z-50"
          >
            <nav className="flex flex-col space-y-0.5">
              <Link to="/" className="px-4 py-3 text-white hover:bg-slate-800 rounded-xl text-sm" onClick={closeAll}>Home</Link>
              <Link to="/booking" className="px-4 py-3 text-white hover:bg-slate-800 rounded-xl text-sm" onClick={closeAll}>Book a Driver</Link>
              <a href="/#how-it-works" className="px-4 py-3 text-white hover:bg-slate-800 rounded-xl text-sm" onClick={closeAll}>How It Works</a>
              <a href="/#contact" className="px-4 py-3 text-white hover:bg-slate-800 rounded-xl text-sm" onClick={closeAll}>Contact</a>

              <div className="h-px bg-slate-800 mx-1 my-1" />

              {!user ? (
                <Link to="/login" className="px-4 py-3 text-white hover:bg-slate-800 rounded-xl text-sm font-semibold" onClick={closeAll}>
                  Login / Sign Up
                </Link>
              ) : (
                <>
                  {/* User info */}
                  <div className="flex items-center gap-2.5 px-4 py-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{displayName}</div>
                      <div className="text-xs text-slate-400 capitalize">{userRole || 'customer'}</div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-800 mx-1 mb-1" />

                  {isCustomer && (
                    <Link to="/customer/bookings" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl text-sm" onClick={closeAll}>
                      <Calendar className="h-4 w-4" /> My Bookings
                    </Link>
                  )}
                  {isAdmin && (
                    <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl text-sm" onClick={closeAll}>
                      <User className="h-4 w-4" /> Admin Panel
                    </Link>
                  )}
                  {isDriver && (
                    <Link to="/driver" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl text-sm" onClick={closeAll}>
                      <Car className="h-4 w-4" /> Driver Portal
                    </Link>
                  )}
                  <a href="/#contact" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl text-sm" onClick={closeAll}>
                    <HelpCircle className="h-4 w-4" /> Help Center
                  </a>

                  <div className="h-px bg-slate-800 mx-1 my-1" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl text-sm"
                  >
                    <LogOut className="h-4 w-4" /> Logout
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
