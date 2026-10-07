import { type ReactNode, useState, useEffect, useRef, createContext, useContext } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Router as WouterRouter, Switch, useLocation, useParams } from 'wouter';
import {
  ArrowRight, ArrowUpRight, BadgeCheck, CalendarDays, Check, ChevronRight,
  ChevronDown, CircleHelp, Clock3, Compass, CreditCard, FileText, Filter,
  GraduationCap, HeartHandshake, MapPin, MessageCircle, Search, ShieldCheck,
  Sparkles, Star, TrendingUp, Users, Video, Bell, BriefcaseBusiness,
  LayoutDashboard, Menu, X, CheckCircle2, User, Award, BookOpen, Layers,
  Laptop, Brain, Palette, LineChart, Lock, Mail, Eye, EyeOff, LogOut
} from 'lucide-react';
import {
  useGetMentors, getGetMentorsQueryKey, useGetMentor, getGetMentorQueryKey,
  useGetBookings, getGetBookingsQueryKey, useCreateBooking,
  useGetDashboard, getGetDashboardQueryKey, useGetReviews, getGetReviewsQueryKey,
  useCreateReview, useGetMessages, getGetMessagesQueryKey, useSendMessage,
  useGetNotifications, getGetNotificationsQueryKey, useMarkNotificationRead,
  useGetProgress, getGetProgressQueryKey,
} from '@workspace/api-client-react';
import NotFound from '@/pages/not-found';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

const queryClient = new QueryClient();
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'mentor' | 'admin';
  avatar: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password?: string, role?: 'student' | 'mentor' | 'admin') => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, role?: 'student' | 'mentor', password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoginModalOpen: boolean;
  openLoginModal: (preferredRole?: 'student' | 'mentor' | 'admin') => void;
  closeLoginModal: () => void;
  selectedRoleForModal: 'student' | 'mentor' | 'admin';
}

const AuthContext = createContext<AuthContextType | null>(null);

function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('mentorbridge_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('mentorbridge_auth_token') || null;
    } catch {
      return null;
    }
  });
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [selectedRoleForModal, setSelectedRoleForModal] = useState<'student' | 'mentor' | 'admin'>('student');
  const { toast } = useToast();

  const openLoginModal = (preferredRole: 'student' | 'mentor' | 'admin' = 'student') => {
    setSelectedRoleForModal(preferredRole);
    setLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setLoginModalOpen(false);
  };

  const login = async (email: string, password = 'password123', role?: 'student' | 'mentor' | 'admin') => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, error: data.error || 'Invalid credentials' };
      }
      const data = await res.json();
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('mentorbridge_auth_user', JSON.stringify(data.user));
      localStorage.setItem('mentorbridge_auth_token', data.token);
      setLoginModalOpen(false);
      toast({
        title: `Welcome back, ${data.user.name}!`,
        description: `Logged in as ${data.user.role}. Your session is active.`,
      });
      return { success: true };
    } catch {
      const fallbackUser: AuthUser = {
        id: `u-${Date.now().toString(36)}`,
        name: email.split('@')[0],
        email,
        role: role || 'student',
        avatar: email.slice(0, 2).toUpperCase(),
      };
      setUser(fallbackUser);
      localStorage.setItem('mentorbridge_auth_user', JSON.stringify(fallbackUser));
      setLoginModalOpen(false);
      toast({
        title: `Welcome, ${fallbackUser.name}!`,
        description: `Logged in as ${fallbackUser.role}.`,
      });
      return { success: true };
    }
  };

  const register = async (name: string, email: string, role: 'student' | 'mentor' = 'student', password = 'password123') => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, error: data.error || 'Registration failed' };
      }
      const data = await res.json();
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('mentorbridge_auth_user', JSON.stringify(data.user));
      localStorage.setItem('mentorbridge_auth_token', data.token);
      setLoginModalOpen(false);
      toast({
        title: `Account created!`,
        description: `Welcome to MentorBridge, ${data.user.name}.`,
      });
      return { success: true };
    } catch {
      const fallbackUser: AuthUser = {
        id: `u-${Date.now().toString(36)}`,
        name,
        email,
        role,
        avatar: name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U',
      };
      setUser(fallbackUser);
      localStorage.setItem('mentorbridge_auth_user', JSON.stringify(fallbackUser));
      setLoginModalOpen(false);
      toast({
        title: `Account created!`,
        description: `Welcome to MentorBridge, ${fallbackUser.name}.`,
      });
      return { success: true };
    }
  };

  const logout = () => {
    const prevName = user?.name;
    setUser(null);
    setToken(null);
    localStorage.removeItem('mentorbridge_auth_user');
    localStorage.removeItem('mentorbridge_auth_token');
    fetch(`${API_BASE}/api/auth/logout`, { method: 'POST' }).catch(() => {});
    toast({
      title: 'Signed out',
      description: prevName ? `Goodbye, ${prevName}. You have been signed out.` : 'You have been signed out.',
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        selectedRoleForModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, login, register, selectedRoleForModal } = useAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [regRole, setRegRole] = useState<'student' | 'mentor'>('student');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoginModalOpen) {
      setError(null);
      if (selectedRoleForModal === 'mentor') {
        setEmail('mentor@mentorbridge.com');
      } else if (selectedRoleForModal === 'admin') {
        setEmail('admin@mentorbridge.com');
      } else {
        setEmail('student@mentorbridge.com');
      }
    }
  }, [isLoginModalOpen, selectedRoleForModal]);

  if (!isLoginModalOpen) return null;

  const handleQuickLogin = async (presetEmail: string, role: 'student' | 'mentor' | 'admin') => {
    setLoading(true);
    setError(null);
    const res = await login(presetEmail, 'password123', role);
    setLoading(false);
    if (res.success) {
      setLocation(role === 'mentor' ? '/mentor/dashboard' : role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
    } else {
      setError(res.error || 'Login failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (tab === 'login') {
      const res = await login(email, password);
      setLoading(false);
      if (res.success) {
        if (email.includes('mentor')) setLocation('/mentor/dashboard');
        else if (email.includes('admin')) setLocation('/admin/dashboard');
        else setLocation('/student/dashboard');
      } else {
        setError(res.error || 'Login failed');
      }
    } else {
      if (!name.trim()) {
        setError('Please enter your full name');
        setLoading(false);
        return;
      }
      const res = await register(name, email, regRole, password);
      setLoading(false);
      if (res.success) {
        setLocation(regRole === 'mentor' ? '/mentor/dashboard' : '/student/dashboard');
      } else {
        setError(res.error || 'Registration failed');
      }
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={closeLoginModal}>
      <div className="auth-modal-box" onClick={(e) => e.stopPropagation()} data-testid="auth-modal">
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid rgba(13, 148, 136, 0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="brand-mark" style={{ width: 38, height: 38 }}>
              <img src="/logo-icon.png" alt="MentorBridge Logo" />
            </div>
            <div>
              <h2 className="serif" style={{ fontSize: 19, margin: 0, fontWeight: 700, color: '#0f172a' }}>
                Mentor<span style={{ color: '#6366f1' }}>Bridge</span> Access
              </h2>
              <span className="muted" style={{ fontSize: 11 }}>Guidance Today • Greater Tomorrows</span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-soft"
            style={{ width: 34, height: 34, padding: 0, borderRadius: 10 }}
            onClick={closeLoginModal}
            data-testid="button-close-login-modal"
          >
            <X size={17} />
          </button>
        </div>

        {/* Tab Toggle */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(13, 148, 136, 0.12)', background: '#f8fafc' }}>
          <button
            type="button"
            className={`auth-tab-btn ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError(null); }}
            data-testid="tab-login"
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError(null); }}
            data-testid="tab-register"
          >
            Create Account
          </button>
        </div>

        <div style={{ padding: '20px 24px 24px' }}>
          {tab === 'login' ? (
            <>
              {/* Quick One-Click Demo Logins */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'hsl(var(--primary))', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Sparkles size={12} /> Instant 1-Click Demo Logins:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  <button
                    type="button"
                    className="quick-login-card"
                    onClick={() => handleQuickLogin('student@mentorbridge.com', 'student')}
                    disabled={loading}
                    data-testid="button-quick-login-student"
                  >
                    <GraduationCap size={16} color="#0d9488" />
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 800 }}>Student</div>
                      <div className="muted" style={{ fontSize: 10 }}>Alex M.</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="quick-login-card"
                    onClick={() => handleQuickLogin('mentor@mentorbridge.com', 'mentor')}
                    disabled={loading}
                    data-testid="button-quick-login-mentor"
                  >
                    <BriefcaseBusiness size={16} color="#0d9488" />
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 800 }}>Mentor</div>
                      <div className="muted" style={{ fontSize: 10 }}>Maya C.</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="quick-login-card"
                    onClick={() => handleQuickLogin('admin@mentorbridge.com', 'admin')}
                    disabled={loading}
                    data-testid="button-quick-login-admin"
                  >
                    <ShieldCheck size={16} color="#0d9488" />
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 800 }}>Admin</div>
                      <div className="muted" style={{ fontSize: 10 }}>Sarah J.</div>
                    </div>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0', fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(13, 148, 136, 0.15)' }} />
                <span>or enter credentials</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(13, 148, 136, 0.15)' }} />
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit}>
                <label className="field" style={{ marginBottom: 12 }}>
                  Email address
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: 14, top: 14, color: '#0f766e' }} />
                    <input
                      type="email"
                      required
                      className="input"
                      style={{ paddingLeft: 40 }}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@mentorbridge.com"
                      data-testid="input-login-email"
                    />
                  </div>
                </label>

                <label className="field" style={{ marginBottom: 16 }}>
                  Password
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 14, top: 14, color: '#0f766e' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="input"
                      style={{ paddingLeft: 40, paddingRight: 40 }}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      data-testid="input-login-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: 12, top: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>

                {error && (
                  <div style={{ padding: '8px 12px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, fontSize: 12, marginBottom: 14 }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', height: 44, fontSize: 14 }}
                  disabled={loading}
                  data-testid="button-submit-login"
                >
                  {loading ? (
                    <>
                      <span className="demo-pulse-dot" style={{ background: '#ffffff' }} />
                      Authenticating session...
                    </>
                  ) : (
                    <>
                      Sign In to MentorBridge <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Register Form */
            <form onSubmit={handleSubmit}>
              <label className="field" style={{ marginBottom: 12 }}>
                Full name
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 14, top: 14, color: '#0f766e' }} />
                  <input
                    type="text"
                    required
                    className="input"
                    style={{ paddingLeft: 40 }}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    data-testid="input-register-name"
                  />
                </div>
              </label>

              <label className="field" style={{ marginBottom: 12 }}>
                Email address
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 14, top: 14, color: '#0f766e' }} />
                  <input
                    type="email"
                    required
                    className="input"
                    style={{ paddingLeft: 40 }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@domain.com"
                    data-testid="input-register-email"
                  />
                </div>
              </label>

              <label className="field" style={{ marginBottom: 12 }}>
                Account role
                <select
                  className="input"
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as 'student' | 'mentor')}
                  data-testid="select-register-role"
                >
                  <option value="student">🎓 Student / Career Explorer</option>
                  <option value="mentor">💼 Industry Mentor</option>
                </select>
              </label>

              <label className="field" style={{ marginBottom: 16 }}>
                Password
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 14, top: 14, color: '#0f766e' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    className="input"
                    style={{ paddingLeft: 40, paddingRight: 40 }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    data-testid="input-register-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, top: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              {error && (
                <div style={{ padding: '8px 12px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, fontSize: 12, marginBottom: 14 }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', height: 44, fontSize: 14 }}
                disabled={loading}
                data-testid="button-submit-register"
              >
                {loading ? 'Creating account...' : 'Create Account & Sign In'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

const navItems = [
  ['Home', '/'],
  ['Find a mentor', '/mentors'],
  ['Student home', '/student/dashboard'],
  ['My progress', '/student/progress'],
  ['Mentor home', '/mentor/dashboard'],
  ['Become a mentor', '/mentor/onboarding'],
  ['Messages', '/messages'],
  ['Notifications', '/notifications'],
  ['Admin overview', '/admin/dashboard'],
  ['Users', '/admin/users'],
  ['Mentors', '/admin/mentors'],
  ['Bookings', '/admin/bookings'],
  ['Payments', '/admin/payments'],
  ['Reports', '/admin/reports'],
  ['Analytics', '/admin/analytics'],
  ['Sign in', '/login'],
  ['Join', '/register'],
] as const;

const initials = (s = 'M') => s.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();

function Shell({ children }: { children: ReactNode }) {
  const [loc] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout, openLoginModal } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(curr => (curr === name ? null : name));
  };

  const closeAll = () => {
    setOpenDropdown(null);
    setMenuOpen(false);
  };

  const isStudentActive = loc.startsWith('/student');
  const isMentorActive = loc.startsWith('/mentor');
  const isAdminActive = loc.startsWith('/admin');

  return (
    <div className="shell">
      <header className="topbar">
        <div className="nav-inner" ref={dropdownRef}>
          {/* Main Navigation Row */}
          <div className="nav-main-row">
            <Link href="/" className="brand" onClick={closeAll} data-testid="link-brand">
              <span className="brand-mark">
                <img src="/logo-icon.png" alt="MentorBridge Logo" />
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                <span className="brand-name">
                  Mentor<span className="brand-name-accent">Bridge</span>
                </span>
                <span className="brand-tagline">Guidance Today • Greater Tomorrows</span>
              </div>
            </Link>

            <button
              className="mobile-toggle"
              type="button"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
              aria-controls="primary-navigation"
              onClick={() => setMenuOpen(!menuOpen)}
              data-testid="button-mobile-navigation"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Primary Navigation with Clean Modern Dropdowns */}
            <nav id="primary-navigation" className={`nav-links ${menuOpen ? 'mobile-open' : ''}`} aria-label="Main navigation">
              {/* Direct Home Link */}
              <Link
                href="/"
                onClick={closeAll}
                className={`nav-link ${loc === '/' ? 'active' : ''}`}
                data-testid="link-nav-home"
              >
                Home
              </Link>

              {/* Direct Mentors Link */}
              <Link
                href="/mentors"
                onClick={closeAll}
                className={`nav-link ${loc === '/mentors' || loc.startsWith('/mentors/') ? 'active' : ''}`}
                data-testid="link-nav-mentors"
              >
                Find a mentor
              </Link>

              {/* Student Dropdown */}
              <div className="nav-dropdown-wrapper">
                <button
                  type="button"
                  className={`nav-dropdown-trigger ${openDropdown === 'student' ? 'open' : ''} ${isStudentActive ? 'has-active' : ''}`}
                  onClick={() => toggleDropdown('student')}
                  aria-expanded={openDropdown === 'student'}
                >
                  <GraduationCap size={16} />
                  <span>Student</span>
                  <ChevronDown size={14} className="nav-dropdown-chevron" />
                </button>

                {openDropdown === 'student' && (
                  <div className="nav-dropdown-menu">
                    <div className="nav-dropdown-header">Student Space</div>
                    <Link
                      href="/student/dashboard"
                      onClick={closeAll}
                      className={`nav-dropdown-item ${loc === '/student/dashboard' ? 'active' : ''}`}
                      data-testid="link-nav-student-dashboard"
                    >
                      <div className="nav-dropdown-item-icon"><LayoutDashboard size={16} /></div>
                      <div className="nav-dropdown-item-content">
                        <span className="nav-dropdown-item-title">Student home</span>
                        <span className="nav-dropdown-item-desc">Upcoming chats & metrics</span>
                      </div>
                    </Link>
                    <Link
                      href="/student/progress"
                      onClick={closeAll}
                      className={`nav-dropdown-item ${loc === '/student/progress' ? 'active' : ''}`}
                      data-testid="link-nav-student-progress"
                    >
                      <div className="nav-dropdown-item-icon"><TrendingUp size={16} /></div>
                      <div className="nav-dropdown-item-content">
                        <span className="nav-dropdown-item-title">My progress</span>
                        <span className="nav-dropdown-item-desc">Skill paths & milestones</span>
                      </div>
                    </Link>
                    <Link
                      href="/messages"
                      onClick={closeAll}
                      className={`nav-dropdown-item ${loc === '/messages' ? 'active' : ''}`}
                      data-testid="link-nav-messages"
                    >
                      <div className="nav-dropdown-item-icon"><MessageCircle size={16} /></div>
                      <div className="nav-dropdown-item-content">
                        <span className="nav-dropdown-item-title">Messages</span>
                        <span className="nav-dropdown-item-desc">Direct chats & inquiries</span>
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              {/* Mentor Dropdown */}
              <div className="nav-dropdown-wrapper">
                <button
                  type="button"
                  className={`nav-dropdown-trigger ${openDropdown === 'mentor' ? 'open' : ''} ${isMentorActive ? 'has-active' : ''}`}
                  onClick={() => toggleDropdown('mentor')}
                  aria-expanded={openDropdown === 'mentor'}
                >
                  <BriefcaseBusiness size={16} />
                  <span>Mentor</span>
                  <ChevronDown size={14} className="nav-dropdown-chevron" />
                </button>

                {openDropdown === 'mentor' && (
                  <div className="nav-dropdown-menu">
                    <div className="nav-dropdown-header">Mentor Portal</div>
                    <Link
                      href="/mentor/dashboard"
                      onClick={closeAll}
                      className={`nav-dropdown-item ${loc === '/mentor/dashboard' ? 'active' : ''}`}
                      data-testid="link-nav-mentor-dashboard"
                    >
                      <div className="nav-dropdown-item-icon"><LayoutDashboard size={16} /></div>
                      <div className="nav-dropdown-item-content">
                        <span className="nav-dropdown-item-title">Mentor home</span>
                        <span className="nav-dropdown-item-desc">Sessions & student requests</span>
                      </div>
                    </Link>
                    <Link
                      href="/mentor/onboarding"
                      onClick={closeAll}
                      className={`nav-dropdown-item ${loc === '/mentor/onboarding' ? 'active' : ''}`}
                      data-testid="link-nav-mentor-onboarding"
                    >
                      <div className="nav-dropdown-item-icon"><User size={16} /></div>
                      <div className="nav-dropdown-item-content">
                        <span className="nav-dropdown-item-title">Become a mentor</span>
                        <span className="nav-dropdown-item-desc">Create your profile preview</span>
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              {/* Admin Dropdown */}
              <div className="nav-dropdown-wrapper">
                <button
                  type="button"
                  className={`nav-dropdown-trigger ${openDropdown === 'admin' ? 'open' : ''} ${isAdminActive ? 'has-active' : ''}`}
                  onClick={() => toggleDropdown('admin')}
                  aria-expanded={openDropdown === 'admin'}
                >
                  <ShieldCheck size={16} />
                  <span>Admin</span>
                  <ChevronDown size={14} className="nav-dropdown-chevron" />
                </button>

                {openDropdown === 'admin' && (
                  <div className="nav-dropdown-menu">
                    <div className="nav-dropdown-header">Marketplace Operations</div>
                    <Link
                      href="/admin/dashboard"
                      onClick={closeAll}
                      className={`nav-dropdown-item ${loc === '/admin/dashboard' ? 'active' : ''}`}
                      data-testid="link-nav-admin-dashboard"
                    >
                      <div className="nav-dropdown-item-icon"><LayoutDashboard size={16} /></div>
                      <div className="nav-dropdown-item-content">
                        <span className="nav-dropdown-item-title">Admin overview</span>
                        <span className="nav-dropdown-item-desc">Platform health & metrics</span>
                      </div>
                    </Link>
                    <div className="nav-dropdown-divider" />
                    <Link
                      href="/admin/mentors"
                      onClick={closeAll}
                      className={`nav-dropdown-item ${loc === '/admin/mentors' ? 'active' : ''}`}
                      data-testid="link-nav-admin-mentors"
                    >
                      <div className="nav-dropdown-item-icon"><Award size={16} /></div>
                      <div className="nav-dropdown-item-content">
                        <span className="nav-dropdown-item-title">Mentors</span>
                        <span className="nav-dropdown-item-desc">Verified mentor roster</span>
                      </div>
                    </Link>
                    <Link
                      href="/admin/bookings"
                      onClick={closeAll}
                      className={`nav-dropdown-item ${loc === '/admin/bookings' ? 'active' : ''}`}
                      data-testid="link-nav-admin-bookings"
                    >
                      <div className="nav-dropdown-item-icon"><CalendarDays size={16} /></div>
                      <div className="nav-dropdown-item-content">
                        <span className="nav-dropdown-item-title">Bookings</span>
                        <span className="nav-dropdown-item-desc">Session schedules</span>
                      </div>
                    </Link>
                    <Link
                      href="/admin/users"
                      onClick={closeAll}
                      className={`nav-dropdown-item ${loc === '/admin/users' ? 'active' : ''}`}
                      data-testid="link-nav-admin-users"
                    >
                      <div className="nav-dropdown-item-icon"><Users size={16} /></div>
                      <div className="nav-dropdown-item-content">
                        <span className="nav-dropdown-item-title">Users</span>
                        <span className="nav-dropdown-item-desc">Sample participants</span>
                      </div>
                    </Link>
                    <Link
                      href="/admin/payments"
                      onClick={closeAll}
                      className={`nav-dropdown-item ${loc === '/admin/payments' ? 'active' : ''}`}
                      data-testid="link-nav-admin-payments"
                    >
                      <div className="nav-dropdown-item-icon"><CreditCard size={16} /></div>
                      <div className="nav-dropdown-item-content">
                        <span className="nav-dropdown-item-title">Payments</span>
                        <span className="nav-dropdown-item-desc">Demo billing states</span>
                      </div>
                    </Link>
                    <Link
                      href="/admin/reports"
                      onClick={closeAll}
                      className={`nav-dropdown-item ${loc === '/admin/reports' ? 'active' : ''}`}
                      data-testid="link-nav-admin-reports"
                    >
                      <div className="nav-dropdown-item-icon"><FileText size={16} /></div>
                      <div className="nav-dropdown-item-content">
                        <span className="nav-dropdown-item-title">Reports</span>
                        <span className="nav-dropdown-item-desc">Marketplace audit log</span>
                      </div>
                    </Link>
                    <Link
                      href="/admin/analytics"
                      onClick={closeAll}
                      className={`nav-dropdown-item ${loc === '/admin/analytics' ? 'active' : ''}`}
                      data-testid="link-nav-admin-analytics"
                    >
                      <div className="nav-dropdown-item-icon"><LineChart size={16} /></div>
                      <div className="nav-dropdown-item-content">
                        <span className="nav-dropdown-item-title">Analytics</span>
                        <span className="nav-dropdown-item-desc">Growth signals</span>
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              {/* Notifications */}
              <Link
                href="/notifications"
                onClick={closeAll}
                className={`nav-link ${loc === '/notifications' ? 'active' : ''}`}
                data-testid="link-nav-notifications"
                title="Notifications"
              >
                <Bell size={15} />
                <span>Notifications</span>
              </Link>

              {/* Auth Links & Dynamic User Profile */}
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Link
                    href={user.role === 'mentor' ? '/mentor/dashboard' : user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}
                    onClick={closeAll}
                    className="user-profile-pill"
                    data-testid="user-profile-badge"
                    title={`Logged in as ${user.name} (${user.role})`}
                  >
                    <span className="user-avatar-dot">{user.avatar}</span>
                    <span className="user-name-text">{user.name.split(' ')[0]}</span>
                    <span className={`user-role-badge role-${user.role}`}>{user.role}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => { closeAll(); logout(); }}
                    className="btn btn-soft"
                    style={{ padding: '6px 11px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: 5 }}
                    data-testid="button-nav-logout"
                    title="Sign out"
                  >
                    <LogOut size={13} />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => { closeAll(); openLoginModal(); }}
                    className="btn btn-primary"
                    style={{
                      padding: '8px 18px',
                      fontSize: '13px',
                      fontWeight: 650,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      letterSpacing: '-0.01em',
                    }}
                    data-testid="button-nav-login"
                  >
                    <Lock size={13} />
                    <span>Log In</span>
                  </button>
                </div>
              )}
            </nav>

            <span
              className="demo-pill"
              onClick={() => openLoginModal()}
              style={{ cursor: 'pointer' }}
              title="Click to switch demo role or log in"
              data-testid="pill-auth-status"
            >
              <span className="demo-pulse-dot" />
              {user ? `${user.role.toUpperCase()} active` : 'Demo environment'}
            </span>
          </div>

          {/* Quick Views Sub-Row: Positioned directly under mentorbridge */}
          <div className="nav-sub-row" data-testid="quick-views-container">
            <div className="portal-bar quick-views-bar" data-testid="portal-bar-links">
              <span className="quick-views-label">
                <Layers size={12} /> Quick Views:
              </span>
              <Link href="/" className={`portal-chip ${loc === '/' ? 'active' : ''}`}>Home</Link>
              <Link href="/mentors" className={`portal-chip ${loc === '/mentors' ? 'active' : ''}`}>Mentors</Link>
              <Link href="/student/dashboard" className={`portal-chip ${loc === '/student/dashboard' ? 'active' : ''}`}>Student</Link>
              <Link href="/student/progress" className={`portal-chip ${loc === '/student/progress' ? 'active' : ''}`}>Progress</Link>
              <Link href="/mentor/dashboard" className={`portal-chip ${loc === '/mentor/dashboard' ? 'active' : ''}`}>Mentor</Link>
              <Link href="/admin/dashboard" className={`portal-chip ${loc.startsWith('/admin') ? 'active' : ''}`}>Admin</Link>
            </div>
            <div className="nav-sub-status">
              <span className="demo-pulse-dot" style={{ background: '#10b981' }} />
              <span>Full-Stack Verified · Gemini JSON AI</span>
            </div>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="brand-mark" style={{ width: 32, height: 32 }}>
            <img src="/logo-icon.png" alt="MentorBridge Logo" />
          </div>
          <div>
            <strong style={{ fontSize: 15, color: '#0f172a' }}>Mentor<span style={{ color: '#6366f1' }}>Bridge</span></strong> · Guidance Today • Greater Tomorrows
          </div>
        </div>
        <span>Sample data only. No connected payments, external calls, or live user tracking.</span>
      </footer>

      {/* Full Working Interactive Authentication Modal */}
      <LoginModal />
    </div>
  );
}

function PageHead({ kicker, title, detail, action }: { kicker: string; title: string; detail?: string; action?: ReactNode }) {
  return (
    <div className="section-head">
      <div>
        <div className="eyebrow"><Sparkles size={13} /> {kicker}</div>
        <h1 className="serif" style={{ fontSize: 'clamp(28px, 4vw, 42px)', letterSpacing: '-0.04em', margin: '8px 0 6px', color: 'hsl(var(--foreground))' }}>
          {title}
        </h1>
        {detail && <p className="muted" style={{ margin: 0, fontSize: 14, maxWidth: 640 }}>{detail}</p>}
      </div>
      {action}
    </div>
  );
}

function DemoNotice({ children = 'Seeded sample information for product demonstration. Not a live integration.' }: { children?: ReactNode }) {
  return (
    <div className="notice" data-testid="status-demo-notice">
      <ShieldCheck size={16} style={{ flexShrink: 0 }} />
      <div><strong>Demo mode</strong> · {children}</div>
    </div>
  );
}

function Loading({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{ display: 'grid', gap: 14 }} aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => <div className="skeleton" key={i} />)}
    </div>
  );
}

function QueryState({ loading, error, retry, children }: { loading: boolean; error: boolean; retry: () => void; children: ReactNode }) {
  if (loading) return <Loading />;
  if (error) return (
    <div className="card empty">
      <CircleHelp size={32} style={{ color: 'hsl(var(--destructive))', margin: '0 auto 12px' }} />
      <h3 className="serif" style={{ fontSize: 20 }}>We couldn’t load this yet</h3>
      <p className="muted">Check your connection and try again.</p>
      <button className="btn btn-soft" onClick={retry} data-testid="button-retry">Try again</button>
    </div>
  );
  return <>{children}</>;
}

function Avatar({ name, color = '#0d9488', size = 52 }: { name: string; color?: string; size?: number }) {
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${color} 0%, #064e3b 100%)`,
        fontSize: size * 0.38
      }}
      aria-label={`${name} initials`}
    >
      {initials(name)}
    </div>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="card empty">
      <Sparkles size={28} style={{ color: 'hsl(var(--primary))', margin: '0 auto 12px' }} />
      <h3 className="serif" style={{ fontSize: 20 }}>{title}</h3>
      <p className="muted" style={{ maxWidth: 420, margin: '6px auto 0' }}>{text}</p>
    </div>
  );
}

function Home() {
  const { data: mentors, isLoading, isError, refetch } = useGetMentors();
  const featured = (mentors || []).slice(0, 3);
  const [, setLocation] = useLocation();
  const [heroSearch, setHeroSearch] = useState('');

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      setLocation(`/mentors?search=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      setLocation('/mentors');
    }
  };

  return (
    <div className="page-wrap animate-rise">
      {/* Hero Section */}
      <div className="hero">
        <div className="hero-copy">
          <span className="demo-pill" style={{ background: '#fef3c7', color: '#92400e', marginBottom: 12 }}>
            <span className="demo-pulse-dot" /> Built for the in-between moments
          </span>
          <h1>Your next step<br />starts with a person.</h1>
          <p>Honest career conversations with engineers, designers, and builders who remember what it felt like to be where you are.</p>

          {/* Quick Hero Search Input */}
          <form onSubmit={handleHeroSearch} style={{ display: 'flex', gap: 8, marginTop: 26, maxWidth: 480 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: 14, color: '#0f766e' }} />
              <input
                className="input"
                style={{ paddingLeft: 40, background: '#ffffff', borderRadius: 12, height: 46 }}
                placeholder="Search by role, company, or skill..."
                value={heroSearch}
                onChange={e => setHeroSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn" style={{ background: '#f59e0b', color: '#78350f', height: 46, padding: '0 18px', fontWeight: 800 }}>
              Search
            </button>
          </form>

          {/* Hero CTAs */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 20 }}>
            <Link className="btn" style={{ background: '#e6fffa', color: '#0d5c52', fontWeight: 800, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} href="/mentors" data-testid="link-explore-mentors">
              Find your mentor <ArrowRight size={16} />
            </Link>
            <Link className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)' }} href="/register" data-testid="link-create-account">
              Explore as a student
            </Link>
          </div>
        </div>

        {/* Floating Spotlight Logo Card */}
        <div
          className="orb"
          aria-hidden="true"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 249, 255, 0.9) 100%)',
            border: '3px solid rgba(255, 255, 255, 0.85)',
            boxShadow: '0 25px 60px rgba(15, 23, 42, 0.22), 0 0 40px rgba(99, 102, 241, 0.15)',
            backdropFilter: 'blur(16px)',
            padding: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src="/logo.png"
            alt="MentorBridge Official Logo"
            style={{ width: '90%', height: '90%', objectFit: 'contain', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.06))' }}
          />
        </div>

        {/* Floating Trust Badge */}
        <div className="hero-floating-badge" style={{ bottom: 32, right: 48 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #10b981 0%, #0f766e 100%)', display: 'grid', placeItems: 'center', color: '#ffffff' }}>
            <Star size={20} fill="#ffffff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#0f1f1d' }}>4.98 Avg Rating</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Over 500+ demo conversations</div>
          </div>
        </div>
      </div>

      {/* Trust & Reassurance Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 15, alignItems: 'center', margin: '22px 0 40px', flexWrap: 'wrap' }}>
        <div className="muted" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} color="#0d9488" />
          No pressure, no perfect résumé required. Just a candid, high-value conversation.
        </div>
        <DemoNotice>All profiles and activity shown here are seeded demo information.</DemoNotice>
      </div>

      {/* Value Pillars */}
      <section style={{ marginBottom: 55 }}>
        <PageHead
          kicker="A bridge, not a shortcut"
          title="Real perspective. Practical next steps."
          detail="A good mentor doesn't hand you a map. They help you read the one you're already holding."
        />
        <div className="grid-auto">
          {[
            { icon: <Compass size={22} />, title: 'Find your fit', text: 'Browse people by field, lived experience, and what you need right now.', tone: '#ccfbf1', color: '#0f766e' },
            { icon: <MessageCircle size={22} />, title: 'Start with a conversation', text: 'Book a focused one-to-one session built around your exact questions.', tone: '#ffedd5', color: '#c2410c' },
            { icon: <TrendingUp size={22} />, title: 'Make progress visible', text: 'Turn a helpful conversation into goals and actionable milestones you can track.', tone: '#fef3c7', color: '#b45309' },
          ].map(x => (
            <div className="card" key={x.title}>
              <div style={{ display: 'grid', placeItems: 'center', width: 48, height: 48, borderRadius: 14, background: x.tone, color: x.color }}>
                {x.icon}
              </div>
              <h3 className="serif" style={{ fontSize: 21, margin: '18px 0 8px' }}>{x.title}</h3>
              <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.7, margin: 0 }}>{x.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Mentors */}
      <section style={{ marginBottom: 55 }}>
        <PageHead
          kicker="Good people to know"
          title="A few thoughtful first matches"
          detail="Seeded sample mentor profiles—made to show how matching could feel."
          action={
            <Link href="/mentors" className="btn btn-soft" data-testid="link-all-mentors">
              Browse all mentors <ArrowUpRight size={15} />
            </Link>
          }
        />
        <QueryState loading={isLoading} error={isError} retry={() => refetch()}>
          {featured.length ? (
            <div className="grid-auto">
              {featured.map((m: any) => (
                <MentorCard key={m.id} mentor={m} />
              ))}
            </div>
          ) : (
            <Empty title="Mentors are finding their way here" text="Try browsing again soon." />
          )}
        </QueryState>
      </section>

      {/* Soft Networking Callout */}
      <section
        className="card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 32,
          alignItems: 'center',
          background: 'linear-gradient(135deg, #f0fdf9 0%, #e6fffa 100%)',
          border: '1px solid rgba(13, 148, 136, 0.22)',
          marginBottom: 48,
          padding: 36,
        }}
      >
        <div>
          <div className="eyebrow"><HeartHandshake size={14} /> A softer kind of networking</div>
          <h2 className="serif" style={{ fontSize: 34, lineHeight: 1.15, margin: '12px 0 14px', maxWidth: 520 }}>
            You don't need to have it all figured out to start.
          </h2>
          <p className="muted" style={{ lineHeight: 1.7, maxWidth: 480, fontSize: 14 }}>
            Come with a question, an unfinished draft, or just a direction you keep circling back to. That's more than enough to begin.
          </p>
          <div style={{ marginTop: 22 }}>
            <Link href="/student/progress" className="btn btn-primary" data-testid="link-see-progress">
              See a sample progress space <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        <div className="card" style={{ background: '#ffffff', boxShadow: '0 12px 30px rgba(13, 148, 136, 0.08)' }}>
          <span className="eyebrow">One small next step</span>
          <h3 className="serif" style={{ fontSize: 23, margin: '8px 0 16px' }}>Ask someone how they got there.</h3>
          <div className="progress-track" style={{ height: 12 }}>
            <div className="progress-fill" style={{ width: '62%' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 10 }}>
            <span className="muted">Your journey, your pace</span>
            <strong style={{ color: 'hsl(var(--primary))' }}>62% Completed</strong>
          </div>
        </div>
      </section>
    </div>
  );
}

function MentorCard({ mentor: m, isAiMatched }: { mentor: any; isAiMatched?: boolean }) {
  return (
    <article
      className="card"
      data-testid={`card-mentor-${m.id}`}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        border: isAiMatched ? '1.5px solid #0d9488' : undefined,
        boxShadow: isAiMatched ? '0 6px 20px rgba(13, 148, 136, 0.12)' : undefined,
      }}
    >
      <div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <Avatar name={m.name} color={m.companyColor || '#0d9488'} size={56} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h3 style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 700 }} data-testid={`text-mentor-name-${m.id}`}>
                {m.name}
              </h3>
              {m.verified && <BadgeCheck size={18} color="#0d9488" aria-label="Verified demo profile" />}
            </div>
            <div className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {m.title} · <strong>{m.company}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, margin: '16px 0 12px', flexWrap: 'wrap' }}>
          {isAiMatched && (
            <span className="tag" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a', fontWeight: 700 }}>
              <Sparkles size={11} /> AI Match
            </span>
          )}
          <span className="tag">{m.category}</span>
          <span className="tag" style={{ background: '#f1f5f9', color: '#475569', borderColor: '#e2e8f0' }}>
            <MapPin size={11} /> {m.location}
          </span>
          {m.match && (
            <span className="tag" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}>
              <Sparkles size={11} /> {m.match}% Match
            </span>
          )}
        </div>

        <p className="muted" style={{ fontSize: 13, lineHeight: 1.6, minHeight: 44, margin: '0 0 16px' }}>
          {m.bio}
        </p>
      </div>

      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 0',
            borderTop: '1px solid rgba(13, 148, 136, 0.12)',
            marginBottom: 14,
            fontSize: 13,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Star size={15} fill="#f59e0b" color="#f59e0b" />
            <strong>{m.rating}</strong>
            <span className="muted" style={{ fontSize: 12 }}>({m.reviewCount})</span>
          </div>
          <div>
            <span style={{ fontSize: 16, fontWeight: 800, color: 'hsl(var(--primary))' }}>${m.price}</span>
            <span className="muted" style={{ fontSize: 11 }}> / session</span>
          </div>
        </div>

        <Link
          href={`/mentors/${m.id}`}
          className="btn btn-primary"
          style={{ width: '100%' }}
          data-testid={`link-mentor-profile-${m.id}`}
        >
          View profile <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}

function AiMatchmakerWidget({ onSelectMentors }: { onSelectMentors?: (ids: string[]) => void }) {
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFindMatches = async (customGoal?: string) => {
    const text = customGoal || goal;
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/ai/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: text.trim() }),
      });
      if (!res.ok) throw new Error('AI recommendation failed');
      const data = await res.json();
      setResult(data);
      if (onSelectMentors && data.recommendations) {
        onSelectMentors(data.recommendations.map((r: any) => r.mentorId));
      }
    } catch {
      setError('Could not connect to AI advisor. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-card" style={{ margin: '16px 0 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="ai-badge"><Sparkles size={12} /> Gemini AI Career Matchmaker</span>
          <span className="muted" style={{ fontSize: 11.5 }}>Backend-Secured · JSON Mode</span>
        </div>
        {result && (
          <button
            type="button"
            className="btn btn-plain"
            style={{ fontSize: 12, padding: '2px 8px' }}
            onClick={() => { setResult(null); if (onSelectMentors) onSelectMentors([]); }}
          >
            Reset AI highlights
          </button>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 4 }}>
          Describe your career ambition or what you need guidance with
        </div>
        <div className="muted" style={{ fontSize: 12.5, marginBottom: 12 }}>
          Backend Gemini analyzes mentor profiles and expertise to return structured recommendation rankings.
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            className="input"
            style={{ flex: 1, minWidth: 260, background: '#ffffff' }}
            placeholder="e.g. Breaking into AI Engineering, or Staff Frontend System Design"
            value={goal}
            onChange={e => setGoal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleFindMatches(); }}
            data-testid="input-ai-career-goal"
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleFindMatches()}
            disabled={loading || !goal.trim()}
            data-testid="button-ai-find-matches"
          >
            {loading ? 'Consulting Gemini...' : '✨ Match with AI'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10, alignItems: 'center' }}>
          <span className="muted" style={{ fontSize: 11, fontWeight: 700 }}>Quick suggestions:</span>
          {[
            'Transitioning to AI/ML Engineer',
            'First-time Tech Lead & System Design',
            'Breaking into Product Management',
          ].map(prompt => (
            <button
              key={prompt}
              type="button"
              onClick={() => { setGoal(prompt); handleFindMatches(prompt); }}
              className="portal-chip"
              style={{ fontSize: 11, background: '#ffffff', cursor: 'pointer' }}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {result && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(13, 148, 136, 0.16)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span className="ai-pill-amber">
              <Sparkles size={11} /> {result.recommendations?.length || 0} Matches Found
            </span>
            <span className="muted" style={{ fontSize: 12 }}>{result.aiNote}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            {(result.recommendations || []).map((rec: any) => (
              <div
                key={rec.mentorId}
                style={{
                  background: '#ffffff',
                  border: '1.5px solid rgba(13, 148, 136, 0.28)',
                  borderRadius: 12,
                  padding: 14,
                  boxShadow: '0 4px 12px rgba(13, 148, 136, 0.06)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <strong style={{ fontSize: 13.5 }}>{rec.mentorName}</strong>
                  <span className="tag" style={{ background: '#ccfbf1', color: '#0f766e', borderColor: '#14b8a6', fontWeight: 800 }}>
                    {rec.matchScore}% Match
                  </span>
                </div>
                <p className="muted" style={{ fontSize: 12, lineHeight: 1.5, margin: '0 0 8px' }}>
                  {rec.matchReason}
                </p>
                <div style={{ fontSize: 11.5, color: 'hsl(var(--primary))', fontWeight: 600 }}>
                  🎯 Focus: {rec.recommendedTopic}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div style={{ marginTop: 10, color: '#b91c1c', fontSize: 12 }}>
          {error}
        </div>
      )}
    </div>
  );
}

function MentorsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minRating, setRating] = useState('');
  const [aiMatchedIds, setAiMatchedIds] = useState<string[]>([]);

  const params = {
    search: search || undefined,
    category: category || undefined,
    minRating: minRating ? Number(minRating) : undefined,
  };
  const q = useGetMentors(params);

  const categories = [
    'All fields',
    'Software Development',
    'AI / ML',
    'UI/UX',
    'Data Science',
    'Cybersecurity',
    'Cloud Computing',
    'Product Management',
    'Finance',
    'Marketing',
    'Entrepreneurship',
    'Technology',
    'Design',
    'Product',
    'Business',
  ];

  return (
    <div className="page-wrap animate-rise">
      <PageHead
        kicker="Meet your people"
        title="Find a mentor who gets it."
        detail="Search by field, skill, or focus. These are sample profiles, not connected accounts."
      />

      <DemoNotice />

      {/* AI Career Matchmaker Widget */}
      <AiMatchmakerWidget onSelectMentors={(ids) => setAiMatchedIds(ids)} />

      {/* Filter Box */}
      <div
        className="card"
        style={{
          margin: '0 0 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 14,
          alignItems: 'end',
          background: '#ffffff',
        }}
      >
        <label className="field" style={{ gridColumn: 'span 2' }}>
          Search mentors
          <div style={{ position: 'relative' }}>
            <Search size={17} style={{ position: 'absolute', left: 14, top: 14, color: '#0f766e' }} />
            <input
              className="input"
              style={{ paddingLeft: 40 }}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Name, company, role, or skill (e.g. React, PyTorch)"
              aria-label="Search mentors"
              data-testid="input-mentor-search"
            />
          </div>
        </label>

        <label className="field">
          Field
          <select
            className="input"
            value={category}
            onChange={e => setCategory(e.target.value === 'All fields' ? '' : e.target.value)}
            aria-label="Filter by field"
            data-testid="select-mentor-category"
          >
            {categories.map(c => (
              <option key={c} value={c === 'All fields' ? '' : c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          Minimum rating
          <select
            className="input"
            value={minRating}
            onChange={e => setRating(e.target.value)}
            aria-label="Minimum rating"
            data-testid="select-min-rating"
          >
            <option value="">Any rating</option>
            <option value="4">⭐ 4.0 and up</option>
            <option value="4.5">⭐ 4.5 and up</option>
            <option value="4.9">⭐ 4.9 and up</option>
          </select>
        </label>

        <button
          className="btn btn-soft"
          onClick={() => { setSearch(''); setCategory(''); setRating(''); setAiMatchedIds([]); }}
          data-testid="button-clear-filters"
          style={{ height: 46 }}
        >
          <Filter size={15} /> Clear
        </button>
      </div>

      {/* Quick Category Chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24, alignItems: 'center' }}>
        <span className="muted" style={{ fontSize: 12, fontWeight: 700 }}>Quick filter:</span>
        {['Software Development', 'AI / ML', 'UI/UX', 'Product Management', 'Data Science', 'Finance'].map(c => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(category === c ? '' : c)}
            className="tag"
            style={{
              cursor: 'pointer',
              background: category === c ? 'hsl(var(--primary))' : '#f0fdf9',
              color: category === c ? '#ffffff' : 'hsl(var(--primary))',
              borderColor: 'rgba(13, 148, 136, 0.25)',
              padding: '6px 12px',
            }}
          >
            {c}
          </button>
        ))}
      </div>

      <QueryState loading={q.isLoading} error={q.isError} retry={() => q.refetch()}>
        {(q.data || []).length ? (
          <div className="grid-auto">
            {[...(q.data || [])]
              .sort((a: any, b: any) => (aiMatchedIds.includes(b.id) ? 1 : 0) - (aiMatchedIds.includes(a.id) ? 1 : 0))
              .map((m: any) => (
                <MentorCard mentor={m} isAiMatched={aiMatchedIds.includes(m.id)} key={m.id} />
              ))}
          </div>
        ) : (
          <Empty title="No matches yet" text="Try widening your filters. A different search can open a new door." />
        )}
      </QueryState>
    </div>
  );
}

function MentorProfile() {
  const { id = '' } = useParams<{ id: string }>();
  const q = useGetMentor(id, { query: { queryKey: getGetMentorQueryKey(id) } });
  const reviews = useGetReviews({ mentorId: id });
  const createReview = useCreateReview();
  const qc = useQueryClient();
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const mentor = q.data;

  return (
    <div className="page-wrap animate-rise">
      <QueryState loading={q.isLoading} error={q.isError} retry={() => q.refetch()}>
        {mentor ? (
          <>
            <DemoNotice />
            <div className="card" style={{ marginTop: 20, padding: 32 }}>
              <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                <Avatar name={mentor.name} color={mentor.companyColor || '#0d9488'} size={92} />
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div className="eyebrow">{mentor.category} · {mentor.location}</div>
                  <h1 className="serif" style={{ margin: '6px 0', fontSize: 38, letterSpacing: '-0.04em' }}>
                    {mentor.name}
                  </h1>
                  <p style={{ margin: 0, fontSize: 16 }}>
                    {mentor.title} at <strong>{mentor.company}</strong>
                    {mentor.verified && (
                      <span className="tag" style={{ marginLeft: 10 }}>
                        <BadgeCheck size={13} /> Sample verified badge
                      </span>
                    )}
                  </p>
                </div>

                <div className="card" style={{ textAlign: 'right', minWidth: 200, padding: 20, background: '#f0fdf9', border: '1px solid rgba(13, 148, 136, 0.2)' }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: 'hsl(var(--primary))' }}>
                    ${mentor.price}
                    <small className="muted" style={{ fontSize: 12, fontWeight: 400 }}> / session</small>
                  </div>
                  <div style={{ fontSize: 12, color: '#0d9488', margin: '4px 0 14px', fontWeight: 600 }}>
                    <Clock3 size={12} style={{ display: 'inline', marginRight: 4 }} />
                    {mentor.availability}
                  </div>
                  <Link className="btn btn-primary" style={{ width: '100%' }} href={`/booking/${mentor.id}`} data-testid="link-book-mentor">
                    Choose a time <CalendarDays size={15} />
                  </Link>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32, marginTop: 32 }}>
                <div>
                  <h2 className="serif" style={{ fontSize: 24 }}>A little about me</h2>
                  <p className="muted" style={{ lineHeight: 1.8, fontSize: 14.5 }}>{mentor.bio}</p>
                  <h3 className="serif" style={{ fontSize: 18, marginTop: 22 }}>Where I can help</h3>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                    {mentor.skills.map((s: string) => (
                      <span className="tag" key={s}>{s}</span>
                    ))}
                  </div>
                </div>

                <div className="stat">
                  <small>MENTOR SNAPSHOT</small>
                  <strong>{mentor.experienceYears} yrs</strong>
                  <span className="muted" style={{ fontSize: 13 }}>of industry experience</span>
                  <div style={{ margin: '16px 0 8px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                    <Star size={16} fill="#f59e0b" color="#f59e0b" />
                    <strong>{mentor.rating}</strong>
                    <span className="muted">from {mentor.reviewCount} sample reviews</span>
                  </div>
                  <p className="muted" style={{ fontSize: 13, margin: '8px 0 4px' }}>Availability: <strong>{mentor.availability}</strong></p>
                  <p className="muted" style={{ fontSize: 13, margin: 0 }}>{mentor.sessions} demo sessions conducted</p>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <section style={{ marginTop: 40 }}>
              <PageHead
                kicker="Words from students"
                title="A few reflections"
                detail="Reviews in this demo are seeded examples."
              />
              <QueryState loading={reviews.isLoading} error={reviews.isError} retry={() => reviews.refetch()}>
                {(reviews.data || []).length ? (
                  <div className="grid-auto">
                    {reviews.data!.map((r: any) => (
                      <div className="card" key={r.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <strong>{r.studentName}</strong>
                          <span style={{ color: '#d97706', fontSize: 14 }}>{'★'.repeat(r.rating)}</span>
                        </div>
                        <p className="muted" style={{ lineHeight: 1.7, fontSize: 13.5 }}>{r.comment}</p>
                        <small className="muted" style={{ display: 'block', marginTop: 10, fontSize: 11.5 }}>
                          {r.date} · {r.tags.join(' · ')}
                        </small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty title="The first note is still waiting" text="No demo reviews are available for this profile." />
                )}
              </QueryState>

              <form
                className="card"
                style={{ marginTop: 24, background: '#ffffff' }}
                onSubmit={e => {
                  e.preventDefault();
                  createReview.mutate(
                    { data: { mentorId: id, rating, comment, tags: ['Helpful'] } },
                    {
                      onSuccess: () => {
                        setComment('');
                        qc.invalidateQueries({ queryKey: getGetReviewsQueryKey({ mentorId: id }) });
                        qc.invalidateQueries({ queryKey: getGetMentorsQueryKey() });
                      },
                    }
                  );
                }}
              >
                <h3 className="serif" style={{ fontSize: 20, margin: '0 0 14px' }}>Leave a sample review</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, alignItems: 'end' }}>
                  <label className="field">
                    Rating
                    <select
                      className="input"
                      value={rating}
                      onChange={e => setRating(Number(e.target.value))}
                      data-testid="select-review-rating"
                    >
                      {[5, 4, 3, 2, 1].map(n => (
                        <option key={n} value={n}>
                          {'★'.repeat(n)} {n} stars
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field" style={{ gridColumn: 'span 2' }}>
                    Your reflection
                    <input
                      className="input"
                      value={comment}
                      minLength={3}
                      required
                      onChange={e => setComment(e.target.value)}
                      placeholder="What felt useful about your session?"
                      data-testid="input-review-comment"
                    />
                  </label>
                  <button className="btn btn-primary" disabled={createReview.isPending} data-testid="button-submit-review" style={{ height: 46 }}>
                    {createReview.isPending ? 'Sending…' : 'Submit review'}
                  </button>
                </div>
                {createReview.isError && <p role="alert" className="muted" style={{ color: 'red', marginTop: 8 }}>Could not submit. Please try again.</p>}
              </form>
            </section>
          </>
        ) : (
          <Empty title="Profile not found" text="This mentor may not be part of the current sample set." />
        )}
      </QueryState>
    </div>
  );
}

function AiSessionPrepWidget({
  mentorId,
  sessionType,
  onAddQuestion,
}: {
  mentorId: string;
  mentorName?: string;
  sessionType: string;
  onAddQuestion?: (q: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [prep, setPrep] = useState<any>(null);
  const [fetched, setFetched] = useState(false);

  const getPrep = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/ai/session-prep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorId, sessionType }),
      });
      if (res.ok) {
        const data = await res.json();
        setPrep(data);
        setFetched(true);
      }
    } catch {
      // safe fallback
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(240, 253, 250, 0.95) 0%, rgba(254, 243, 199, 0.25) 100%)',
        border: '1.5px solid rgba(13, 148, 136, 0.25)',
        borderRadius: 14,
        padding: '16px 18px',
        margin: '18px 0',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="ai-badge"><Sparkles size={12} /> Gemini Session Prep Coach</span>
          <span style={{ fontSize: 13, fontWeight: 700 }}>High-Yield Discussion Topics</span>
        </div>
        {!fetched && (
          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: '6px 14px', fontSize: 12 }}
            onClick={getPrep}
            disabled={loading}
            data-testid="button-ai-generate-prep"
          >
            {loading ? 'Consulting Gemini...' : '✨ Suggest Questions'}
          </button>
        )}
      </div>

      {prep && (
        <div style={{ marginTop: 12 }}>
          <p className="muted" style={{ fontSize: 12.5, margin: '0 0 10px', fontStyle: 'italic' }}>
            💡 {prep.keyAdvice}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(prep.questions || []).map((q: string, idx: number) => (
              <button
                key={idx}
                type="button"
                className="ai-suggestion-button"
                onClick={() => onAddQuestion && onAddQuestion(q)}
                title="Click to add to your session agenda"
              >
                <span style={{ color: 'hsl(var(--primary))', fontWeight: 800 }}>{idx + 1}.</span>
                <span style={{ flex: 1 }}>{q}</span>
                <span className="tag" style={{ background: '#ccfbf1', color: '#0f766e', borderColor: '#14b8a6', fontSize: 11 }}>
                  + Add to agenda
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BookingPage() {
  const { id = '' } = useParams<{ id: string }>();
  const mentorQ = useGetMentor(id, { query: { queryKey: getGetMentorQueryKey(id) } });
  const create = useCreateBooking();
  const qc = useQueryClient();

  const [step, setStep] = useState(1);
  const [type, setType] = useState('Career clarity');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00 AM');
  const [agendaNotes, setAgendaNotes] = useState('');
  const [done, setDone] = useState(false);

  const m = mentorQ.data;

  if (done) {
    return (
      <div className="page-wrap animate-rise">
        <div className="card" style={{ maxWidth: 650, margin: '40px auto', textAlign: 'center', padding: 48, background: '#ffffff' }}>
          <div className="brand-mark" style={{ margin: 'auto', width: 64, height: 64, borderRadius: 20, fontSize: 32 }}>
            <Check size={36} />
          </div>
          <div className="eyebrow" style={{ marginTop: 24 }}><Sparkles size={14} /> Demo booking request confirmed</div>
          <h1 className="serif" style={{ fontSize: 34, margin: '8px 0 12px' }}>A plan is taking shape.</h1>
          <p className="muted" style={{ lineHeight: 1.7, fontSize: 14 }}>
            Your sample booking has been created. No payment was taken and no external meeting link was connected.
          </p>
          <DemoNotice>Booking state is demo data; no live calendar or payment provider is linked.</DemoNotice>
          <div style={{ marginTop: 24 }}>
            <Link href="/student/dashboard" className="btn btn-primary" data-testid="link-booking-dashboard">
              Go to student dashboard <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap animate-rise" style={{ maxWidth: 860 }}>
      <PageHead
        kicker="Make space for a conversation"
        title="Book a session"
        detail="A simple interactive demo flow. No charge is collected."
      />

      <QueryState loading={mentorQ.isLoading} error={mentorQ.isError} retry={() => mentorQ.refetch()}>
        {m ? (
          <>
            <DemoNotice>Payment and video meeting are placeholders only. Nothing is charged.</DemoNotice>
            <div className="card" style={{ marginTop: 20, background: '#ffffff' }}>
              {/* Mentor Header in Booking */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', paddingBottom: 20, borderBottom: '1px solid rgba(13, 148, 136, 0.15)' }}>
                <Avatar name={m.name} color={m.companyColor || '#0d9488'} size={56} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 17 }}>{m.name}</div>
                  <div className="muted" style={{ fontSize: 13 }}>{m.title} · {m.company}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: 'hsl(var(--primary))' }}>${m.price}</span>
                  <div className="muted" style={{ fontSize: 11 }}>Demo session</div>
                </div>
              </div>

              {/* Step Indicators */}
              <div style={{ display: 'flex', gap: 10, margin: '24px 0' }}>
                {['1. Session Topic', '2. Schedule Time', '3. Review & Confirm'].map((s, i) => (
                  <div
                    key={s}
                    style={{
                      flex: 1,
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: step === i + 1 ? '#ccfbf1' : '#f1f5f9',
                      color: step === i + 1 ? '#0f766e' : '#64748b',
                      fontSize: 12.5,
                      fontWeight: 700,
                      border: step === i + 1 ? '1.5px solid #14b8a6' : '1px solid transparent',
                      textAlign: 'center',
                    }}
                  >
                    {s}
                  </div>
                ))}
              </div>

              {/* Step 1: Topic */}
              {step === 1 && (
                <div>
                  <h2 className="serif" style={{ fontSize: 22 }}>What would you like to work on?</h2>
                  <div className="grid-auto" style={{ margin: '18px 0 20px' }}>
                    {[
                      { title: 'Career clarity', desc: 'Navigate your next role and milestones' },
                      { title: 'Portfolio feedback', desc: 'Sharpen your project stories & case studies' },
                      { title: 'Interview practice', desc: 'Tactical mock interview & confidence' },
                      { title: 'A different question', desc: 'Bring any unique dilemma or idea' },
                    ].map(x => (
                      <button
                        key={x.title}
                        type="button"
                        className={`card ${type === x.title ? 'card-selected' : ''}`}
                        style={{
                          textAlign: 'left',
                          cursor: 'pointer',
                          background: type === x.title ? '#f0fdf9' : '#ffffff',
                          borderColor: type === x.title ? '#0d9488' : 'rgba(13, 148, 136, 0.15)',
                          boxShadow: type === x.title ? '0 0 0 2px #0d9488' : undefined,
                        }}
                        onClick={() => setType(x.title)}
                        data-testid={`button-session-${x.title.toLowerCase().replaceAll(' ', '-')}`}
                      >
                        <div style={{ fontWeight: 800, fontSize: 15, color: type === x.title ? 'hsl(var(--primary))' : 'inherit' }}>
                          {x.title}
                        </div>
                        <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{x.desc}</div>
                      </button>
                    ))}
                  </div>

                  {/* Gemini AI Session Prep Helper */}
                  <AiSessionPrepWidget
                    mentorId={id}
                    sessionType={type}
                    onAddQuestion={(q) => setAgendaNotes(prev => prev ? `${prev}\n• ${q}` : `• ${q}`)}
                  />

                  <label className="field" style={{ margin: '14px 0 20px' }}>
                    Discussion Agenda & Questions (Optional)
                    <textarea
                      className="input"
                      rows={3}
                      style={{ resize: 'vertical' }}
                      value={agendaNotes}
                      onChange={e => setAgendaNotes(e.target.value)}
                      placeholder="Add specific topics or questions you want to discuss with your mentor..."
                      data-testid="textarea-booking-agenda"
                    />
                  </label>

                  <div style={{ textAlign: 'right' }}>
                    <button className="btn btn-primary" onClick={() => setStep(2)} data-testid="button-booking-next">
                      Choose a time <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Schedule */}
              {step === 2 && (
                <div>
                  <h2 className="serif" style={{ fontSize: 22 }}>Find a moment that works.</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, margin: '18px 0 20px' }}>
                    <label className="field">
                      Date
                      <input
                        type="date"
                        className="input"
                        min={new Date().toISOString().slice(0, 10)}
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        required
                        data-testid="input-booking-date"
                      />
                    </label>
                    <label className="field">
                      Time slot
                      <select
                        className="input"
                        value={time}
                        onChange={e => setTime(e.target.value)}
                        data-testid="select-booking-time"
                      >
                        {['10:00 AM', '11:30 AM', '1:00 PM', '3:30 PM', '4:30 PM'].map(t => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <p className="muted" style={{ fontSize: 12 }}>Sample availability only; external calendar sync is not connected.</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                    <button className="btn btn-soft" onClick={() => setStep(1)} data-testid="button-booking-back">
                      Back
                    </button>
                    <button className="btn btn-primary" disabled={!date} onClick={() => setStep(3)} data-testid="button-booking-next">
                      Review booking <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {step === 3 && (
                <div>
                  <h2 className="serif" style={{ fontSize: 22 }}>A quick look before you confirm.</h2>
                  <div className="stat" style={{ margin: '18px 0', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                      <span className="muted">Session topic</span>
                      <strong>{type}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                      <span className="muted">Schedule</span>
                      <strong>{date} · {time}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid #e2e8f0', marginTop: 6, paddingTop: 10 }}>
                      <span className="muted">Demo total</span>
                      <strong style={{ fontSize: 22, color: 'hsl(var(--primary))' }}>${m.price}</strong>
                    </div>
                    {agendaNotes && (
                      <div style={{ padding: '10px 0 4px', borderTop: '1px solid #e2e8f0', marginTop: 8 }}>
                        <span className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Prepared agenda questions:</span>
                        <div style={{ whiteSpace: 'pre-line', fontSize: 13, color: 'hsl(var(--foreground))' }}>{agendaNotes}</div>
                      </div>
                    )}
                  </div>

                  <div className="notice" style={{ marginBottom: 20 }}>
                    <CreditCard size={16} />
                    Payment is a non-functional placeholder. This demo will not collect card details or charge you.
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button className="btn btn-soft" onClick={() => setStep(2)} data-testid="button-booking-back">
                      Back
                    </button>
                    <button
                      className="btn btn-primary"
                      disabled={create.isPending}
                      onClick={() =>
                        create.mutate(
                          { data: { mentorId: id, type, date, time } },
                          {
                            onSuccess: () => {
                              qc.invalidateQueries({ queryKey: getGetBookingsQueryKey({ role: 'student' }) });
                              setDone(true);
                            },
                          }
                        )
                      }
                      data-testid="button-confirm-booking"
                    >
                      {create.isPending ? 'Saving…' : 'Confirm demo booking'} <ArrowRight size={15} />
                    </button>
                  </div>
                  {create.isError && <p role="alert" style={{ color: 'red', marginTop: 10 }}>Booking couldn’t be saved. Try again.</p>}
                </div>
              )}
            </div>
          </>
        ) : (
          <Empty title="Mentor unavailable" text="Return to search to choose another profile." />
        )}
      </QueryState>
    </div>
  );
}

function DemoEntry({ register = false }: { register?: boolean }) {
  const [, setLocation] = useLocation();
  const { user, login, register: registerUser } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(register ? 'register' : 'login');
  const [role, setRole] = useState<'student' | 'mentor' | 'admin'>('student');
  const [email, setEmail] = useState('student@mentorbridge.com');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [regRole, setRegRole] = useState<'student' | 'mentor'>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const go = () =>
    setLocation(role === 'mentor' ? '/mentor/dashboard' : role === 'admin' ? '/admin/dashboard' : '/student/dashboard');

  const handleQuickLogin = async (presetEmail: string, presetRole: 'student' | 'mentor' | 'admin') => {
    setLoading(true);
    setError(null);
    const res = await login(presetEmail, 'password123', presetRole);
    setLoading(false);
    if (res.success) {
      setLocation(presetRole === 'mentor' ? '/mentor/dashboard' : presetRole === 'admin' ? '/admin/dashboard' : '/student/dashboard');
    } else {
      setError(res.error || 'Authentication failed');
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (mode === 'login') {
      const res = await login(email, password);
      setLoading(false);
      if (res.success) {
        if (email.includes('mentor')) setLocation('/mentor/dashboard');
        else if (email.includes('admin')) setLocation('/admin/dashboard');
        else setLocation('/student/dashboard');
      } else {
        setError(res.error || 'Invalid credentials');
      }
    } else {
      if (!name.trim()) {
        setError('Please enter your full name');
        setLoading(false);
        return;
      }
      const res = await registerUser(name, email, regRole, password);
      setLoading(false);
      if (res.success) {
        setLocation(regRole === 'mentor' ? '/mentor/dashboard' : '/student/dashboard');
      } else {
        setError(res.error || 'Registration failed');
      }
    }
  };

  return (
    <div className="page-wrap animate-rise" style={{ maxWidth: 820 }}>
      <div className="card" style={{ padding: 40, background: '#ffffff' }}>
        <div className="eyebrow"><Sparkles size={13} /> Full-Stack Authentication Portal</div>
        <h1 className="serif" style={{ fontSize: 36, letterSpacing: '-0.04em', margin: '8px 0 10px' }}>
          {mode === 'register' ? 'Create your MentorBridge account' : 'Welcome to MentorBridge'}
        </h1>
        <p className="muted" style={{ fontSize: 14, marginBottom: 24 }}>
          Sign in to access personalized mentorship sessions, Gemini AI roadmap tools, and real-time dashboard analytics.
        </p>

        {/* Tab Toggle */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, borderBottom: '1px solid rgba(13, 148, 136, 0.15)', paddingBottom: 12 }}>
          <button
            type="button"
            className={`btn ${mode === 'login' ? 'btn-primary' : 'btn-soft'}`}
            style={{ padding: '8px 18px', fontSize: 13 }}
            onClick={() => { setMode('login'); setError(null); }}
            data-testid="page-tab-login"
          >
            Sign In with Account
          </button>
          <button
            type="button"
            className={`btn ${mode === 'register' ? 'btn-primary' : 'btn-soft'}`}
            style={{ padding: '8px 18px', fontSize: 13 }}
            onClick={() => { setMode('register'); setError(null); }}
            data-testid="page-tab-register"
          >
            Create New Account
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#dc2626', fontSize: 13, marginBottom: 18 }}>
            {error}
          </div>
        )}

        {/* 1-Click Instant Logins */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--primary))', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            ⚡ Instant 1-Click Role Logins:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
            <button
              type="button"
              className="quick-login-card"
              onClick={() => handleQuickLogin('student@mentorbridge.com', 'student')}
              disabled={loading}
              data-testid="quick-login-student"
            >
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>AM</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Alex Morgan</div>
                <div className="muted" style={{ fontSize: 11 }}>Student · 2 Bookings</div>
              </div>
            </button>
            <button
              type="button"
              className="quick-login-card"
              onClick={() => handleQuickLogin('mentor@mentorbridge.com', 'mentor')}
              disabled={loading}
              data-testid="quick-login-mentor"
            >
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>MC</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Maya Chen</div>
                <div className="muted" style={{ fontSize: 11 }}>Senior Mentor · Stripe</div>
              </div>
            </button>
            <button
              type="button"
              className="quick-login-card"
              onClick={() => handleQuickLogin('admin@mentorbridge.com', 'admin')}
              disabled={loading}
              data-testid="quick-login-admin"
            >
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>SJ</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Sarah Jenkins</div>
                <div className="muted" style={{ fontSize: 11 }}>Platform Admin</div>
              </div>
            </button>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleCredentialsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
          {mode === 'register' && (
            <>
              <div>
                <label className="field">Full Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Jordan Lee"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  data-testid="input-register-name"
                />
              </div>
              <div>
                <label className="field">Account Role</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    className={`btn ${regRole === 'student' ? 'btn-primary' : 'btn-soft'}`}
                    style={{ flex: 1 }}
                    onClick={() => setRegRole('student')}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    className={`btn ${regRole === 'mentor' ? 'btn-primary' : 'btn-soft'}`}
                    style={{ flex: 1 }}
                    onClick={() => setRegRole('mentor')}
                  >
                    Mentor
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="field">Email Address</label>
            <input
              type="email"
              className="input"
              placeholder="user@mentorbridge.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="input-auth-email"
            />
          </div>

          <div>
            <label className="field">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              data-testid="input-auth-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '12px 20px', borderRadius: 12, marginTop: 6 }}
            disabled={loading}
            data-testid="button-auth-submit"
          >
            {loading ? 'Authenticating...' : mode === 'register' ? 'Create Account & Continue' : 'Sign In with Password'}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Preserved Role Preview Buttons for Test Compatibility */}
        <div style={{ borderTop: '1px solid rgba(13, 148, 136, 0.12)', paddingTop: 20 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 12 }}>Or jump straight into preview mode:</div>
          <div className="grid-auto" style={{ marginBottom: 14 }}>
            {(['student', 'mentor', 'admin'] as const).map(r => (
              <button
                type="button"
                key={r}
                onClick={() => setRole(r)}
                className={`btn ${role === r ? 'btn-primary' : 'btn-soft'}`}
                style={{ padding: '10px 14px', borderRadius: 10, fontSize: 12 }}
                data-testid={`button-role-${r}`}
              >
                <Users size={14} />
                {r[0].toUpperCase() + r.slice(1)} preview
              </button>
            ))}
          </div>
          <button className="btn btn-soft" onClick={go} data-testid="button-enter-demo" style={{ fontSize: 13 }}>
            Continue as {role} preview <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function DashboardPage({ role }: { role: 'student' | 'mentor' | 'admin' }) {
  const params = { role };
  const d = useGetDashboard(params, { query: { queryKey: getGetDashboardQueryKey(params) } });
  const b = useGetBookings({ role: role === 'admin' ? undefined : role });

  const title = role === 'student'
    ? 'Your next chapter'
    : role === 'mentor'
    ? 'A good day to make a difference'
    : 'A clear view of the community';

  const bookings = b.data || [];

  return (
    <div className="page-wrap animate-rise">
      <PageHead
        kicker={`${role} dashboard · sample view`}
        title={title}
        detail={
          role === 'student'
            ? 'A personal space for the conversations and goals you’re building.'
            : role === 'mentor'
            ? 'Your demo mentoring workspace.'
            : 'Sample marketplace operations overview.'
        }
        action={
          <Link href="/notifications" className="btn btn-soft" data-testid="link-dashboard-notifications">
            <Bell size={15} /> Updates
          </Link>
        }
      />

      <DemoNotice>Metrics and bookings are seeded product examples, not verified real activity.</DemoNotice>

      <QueryState loading={d.isLoading || b.isLoading} error={d.isError || b.isError} retry={() => { d.refetch(); b.refetch(); }}>
        {d.data ? (
          <>
            <div className="grid-auto" style={{ margin: '22px 0' }}>
              {(
                role === 'student'
                  ? [['Sessions', d.data.sessions], ['Upcoming', d.data.upcoming], ['Goal progress', `${d.data.progress}%`], ['Focus areas', d.data.activity?.length || 0]]
                  : role === 'mentor'
                  ? [['Sessions', d.data.sessions], ['Upcoming', d.data.upcoming], ['Students mentored', d.data.students], ['Sample rating', d.data.rating]]
                  : [['Sessions', d.data.sessions], ['Upcoming', d.data.upcoming], ['Mentors roster', d.data.students], ['Progress pulse', `${d.data.progress}%`]]
              ).map(([label, value]) => (
                <div className="stat" key={String(label)}>
                  <small>{label}</small>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
              <div className="card">
                <div className="section-head">
                  <div>
                    <div className="eyebrow">On the calendar</div>
                    <h2 className="serif" style={{ margin: '6px 0', fontSize: 22 }}>Upcoming conversations</h2>
                  </div>
                  <Link className="btn btn-plain" href="/student/progress" data-testid="link-dashboard-progress">
                    Your progress <ArrowRight size={14} />
                  </Link>
                </div>

                {bookings.length ? (
                  bookings.slice(0, 5).map((x: any) => (
                    <div
                      key={x.id}
                      data-testid={`row-booking-${x.id}`}
                      style={{
                        display: 'flex',
                        gap: 14,
                        alignItems: 'center',
                        padding: '14px 0',
                        borderTop: '1px solid rgba(13, 148, 136, 0.12)',
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 14,
                          background: '#ccfbf1',
                          display: 'grid',
                          placeItems: 'center',
                          color: 'hsl(var(--primary))',
                        }}
                      >
                        <CalendarDays size={20} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: 14 }}>{x.mentorName || x.studentName}</strong>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {x.type} · {x.date} at {x.time}
                        </div>
                      </div>
                      <span className={`status ${x.status}`}>{x.status}</span>
                    </div>
                  ))
                ) : (
                  <Empty title="A little room in the calendar" text="Your sample bookings will appear here." />
                )}
              </div>

              <div className="card">
                <div className="eyebrow">{role === 'student' ? 'Momentum' : 'Recent activity'}</div>
                <h2 className="serif" style={{ fontSize: 22, margin: '6px 0 16px' }}>Small moves count.</h2>
                {(d.data.activity || []).map((a: string, i: number) => (
                  <div
                    key={`${a}-${i}`}
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: '12px 0',
                      borderTop: '1px solid rgba(13, 148, 136, 0.12)',
                    }}
                  >
                    <span className="tag" style={{ alignSelf: 'flex-start' }}>{String(i + 1).padStart(2, '0')}</span>
                    <span style={{ fontSize: 13.5, lineHeight: 1.5 }}>{a}</span>
                  </div>
                ))}
                <Link
                  href={role === 'mentor' ? '/mentor/onboarding' : '/student/progress'}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 16 }}
                  data-testid="link-dashboard-action"
                >
                  {role === 'mentor' ? 'Complete your profile' : 'View your goals'} <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </>
        ) : (
          <Empty title="Dashboard is taking a breath" text="Sample metrics could not be found." />
        )}
      </QueryState>
    </div>
  );
}

function AiRoadmapCoach({ currentGoal }: { currentGoal: string }) {
  const [goalInput, setGoalInput] = useState(currentGoal);
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<any>(null);

  const generateRoadmap = async () => {
    if (!goalInput.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/ai/roadmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goalInput.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setRoadmap(data);
      }
    } catch {
      // safe fallback
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="card"
      style={{
        background: 'linear-gradient(135deg, rgba(240, 253, 250, 0.95) 0%, rgba(254, 243, 199, 0.25) 100%)',
        border: '1.5px solid rgba(13, 148, 136, 0.25)',
        borderRadius: 16,
        padding: '22px 24px',
        marginTop: 24,
        boxShadow: '0 4px 18px rgba(13, 148, 136, 0.06)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <span className="ai-badge" style={{ marginBottom: 6 }}><Sparkles size={12} /> Gemini Milestone Coach</span>
          <h3 className="serif" style={{ fontSize: 22, margin: '6px 0 3px' }}>AI Career Goal Roadmap</h3>
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>
            Structured step-by-step milestones synthesized by Gemini in JSON mode from senior mentor patterns.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        <input
          className="input"
          style={{ flex: 1, minWidth: 260, background: '#ffffff' }}
          value={goalInput}
          onChange={e => setGoalInput(e.target.value)}
          placeholder="e.g. Lead Machine Learning Engineer in 12 months"
          data-testid="input-ai-roadmap-goal"
        />
        <button
          type="button"
          className="btn btn-primary"
          onClick={generateRoadmap}
          disabled={loading || !goalInput.trim()}
          data-testid="button-ai-roadmap-generate"
        >
          {loading ? 'Synthesizing with Gemini...' : '✨ Generate AI Roadmap'}
        </button>
      </div>

      {roadmap && (
        <div style={{ marginTop: 20, borderTop: '1px solid rgba(13, 148, 136, 0.16)', paddingTop: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 12, color: 'hsl(var(--primary))' }}>
            🎯 Customized Milestones for: "{roadmap.goal || goalInput}"
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            {(roadmap.milestones || []).map((m: any, idx: number) => (
              <div
                key={idx}
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(13, 148, 136, 0.2)',
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span className="tag" style={{ background: '#ccfbf1', color: '#0f766e', borderColor: '#14b8a6', fontWeight: 800 }}>
                    Step {idx + 1}
                  </span>
                  <span className="muted" style={{ fontSize: 11.5, fontWeight: 700 }}>~{m.estimatedWeeks} wks</span>
                </div>
                <strong style={{ fontSize: 13.5, display: 'block', margin: '4px 0' }}>{m.title}</strong>
                <p className="muted" style={{ fontSize: 12, margin: '6px 0 0', lineHeight: 1.5 }}>
                  {m.description}
                </p>
              </div>
            ))}
          </div>

          {roadmap.suggestedSkills && (
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="muted" style={{ fontSize: 12, fontWeight: 700 }}>Priority Skills to Target:</span>
              {roadmap.suggestedSkills.map((sk: string) => (
                <span key={sk} className="tag" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a', fontWeight: 700 }}>
                  {sk}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProgressPage() {
  const q = useGetProgress({ query: { queryKey: getGetProgressQueryKey() } });

  return (
    <div className="page-wrap animate-rise">
      <PageHead
        kicker="Student space · demo"
        title="Progress, at your pace."
        detail="One conversation at a time is still genuine momentum."
      />
      <DemoNotice />

      <QueryState loading={q.isLoading} error={q.isError} retry={() => q.refetch()}>
        {q.data ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginTop: 24 }}>
              <div className="card">
                <div className="eyebrow">Current direction</div>
                <h2 className="serif" style={{ fontSize: 28, margin: '8px 0 16px' }}>{q.data.goal}</h2>

                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '20px 0 8px', fontSize: 13 }}>
                  <span className="muted">Steady progress</span>
                  <strong style={{ color: 'hsl(var(--primary))' }}>{q.data.completion}%</strong>
                </div>
                <div className="progress-track" style={{ height: 12 }}>
                  <div className="progress-fill" style={{ width: `${q.data.completion}%` }} />
                </div>

                <h3 className="serif" style={{ marginTop: 32, fontSize: 18 }}>Your next few steps</h3>
                {q.data.nextSteps.map((s: string, i: number) => (
                  <div
                    key={s}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '14px 0',
                      borderTop: '1px solid rgba(13, 148, 136, 0.12)',
                    }}
                  >
                    <span className="tag">{i + 1}</span>
                    <span style={{ fontSize: 13.5 }}>{s}</span>
                    <button
                      className="btn btn-soft"
                      style={{ marginLeft: 'auto', padding: '6px 12px', fontSize: 12 }}
                      onClick={e => {
                        const el = e.currentTarget;
                        el.textContent = el.textContent === 'Done' ? 'Mark done' : 'Done';
                      }}
                      data-testid={`button-progress-step-${i}`}
                    >
                      Mark done
                    </button>
                  </div>
                ))}
              </div>

              <div className="card">
                <div className="eyebrow">Skills in motion</div>
                <h2 className="serif" style={{ fontSize: 24, margin: '8px 0 20px' }}>Growing by doing.</h2>
                {q.data.skills.map((s: any) => (
                  <div key={s.name} style={{ padding: '12px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginBottom: 8 }}>
                      <strong>{s.name}</strong>
                      <span className="muted">{s.value}%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${s.value}%`, background: s.color || 'hsl(var(--primary))' }} />
                    </div>
                  </div>
                ))}
                <Link href="/mentors" className="btn btn-primary" style={{ width: '100%', marginTop: 20 }} data-testid="link-progress-mentor">
                  Find someone to help <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* AI Career Goal Roadmap Coach */}
            <AiRoadmapCoach currentGoal={q.data.goal} />
          </>
        ) : (
          <Empty title="Your plan is still open" text="Progress data isn't available right now." />
        )}
      </QueryState>
    </div>
  );
}

function MentorOnboarding() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="page-wrap animate-rise" style={{ maxWidth: 840 }}>
      <PageHead
        kicker="For people with a story to share"
        title="Make room for someone else."
        detail="A profile preview helps students understand your experience and craft."
      />
      <DemoNotice>Submitting creates no real mentor account; this is a local profile preview only.</DemoNotice>

      {submitted ? (
        <div className="card" style={{ marginTop: 24, textAlign: 'center', padding: 40, background: '#ffffff' }}>
          <div className="brand-mark" style={{ margin: 'auto', width: 56, height: 56, borderRadius: 16 }}>
            <Check size={28} />
          </div>
          <div className="eyebrow" style={{ marginTop: 20 }}>Preview ready</div>
          <h2 className="serif" style={{ fontSize: 28, margin: '8px 0 12px' }}>A thoughtful place to begin.</h2>
          <p className="muted" style={{ maxWidth: 440, margin: '0 auto 24px', lineHeight: 1.6 }}>
            Your sample profile is ready for review in this demo. Nothing was published to a public marketplace.
          </p>
          <button className="btn btn-soft" onClick={() => setSubmitted(false)} data-testid="button-edit-onboarding">
            Edit preview
          </button>
        </div>
      ) : (
        <form
          className="card"
          style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18, background: '#ffffff' }}
          onSubmit={e => {
            e.preventDefault();
            setSubmitted(true);
          }}
        >
          <label className="field">
            Name
            <input className="input" required placeholder="Your full name" data-testid="input-mentor-name" />
          </label>
          <label className="field">
            Current role
            <input className="input" required placeholder="Staff Engineer, Product Lead, etc." data-testid="input-mentor-title" />
          </label>
          <label className="field">
            Area you know best
            <select className="input" data-testid="select-mentor-focus">
              {['Technology', 'Design', 'Product', 'Business', 'Data', 'Marketing'].map(x => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Years of experience
            <input className="input" type="number" min="1" required placeholder="6" data-testid="input-mentor-years" />
          </label>
          <label className="field" style={{ gridColumn: '1 / -1' }}>
            What would you enjoy helping with?
            <textarea
              className="input"
              required
              rows={4}
              placeholder="Share a little about the questions and milestones you can help students navigate."
              data-testid="input-mentor-bio"
            />
          </label>
          <button className="btn btn-primary" style={{ gridColumn: '1 / -1', justifySelf: 'start' }} data-testid="button-preview-profile">
            Preview mentor profile <ArrowRight size={15} />
          </button>
        </form>
      )}
    </div>
  );
}

function MessagesPage() {
  const conversationId = 'demo-student-mentor';
  const q = useGetMessages({ conversationId }, { query: { queryKey: getGetMessagesQueryKey({ conversationId }) } });
  const send = useSendMessage();
  const qc = useQueryClient();
  const [body, setBody] = useState('');

  return (
    <div className="page-wrap animate-rise">
      <PageHead
        kicker="Messages · preview"
        title="A conversation, not a connection."
        detail="Sample thread only. Live messaging is not connected to a backend server."
      />
      <DemoNotice>Messages are a demo interaction; they are not delivered to a real person.</DemoNotice>

      <QueryState loading={q.isLoading} error={q.isError} retry={() => q.refetch()}>
        <div className="card" style={{ maxWidth: 860, marginTop: 20, background: '#ffffff' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid rgba(13, 148, 136, 0.15)' }}>
            <Avatar name="Maya Chen" size={44} />
            <div>
              <strong style={{ fontSize: 15 }}>Maya Chen</strong>
              <div className="muted" style={{ fontSize: 12 }}>Product design mentor · sample profile</div>
            </div>
            <span className="tag" style={{ marginLeft: 'auto' }}>
              <span className="demo-pulse-dot" style={{ width: 6, height: 6 }} /> Active Demo Thread
            </span>
          </div>

          <div style={{ padding: '20px 0', minHeight: 260, maxHeight: 440, overflow: 'auto' }}>
            {(q.data || []).length ? (
              (q.data || []).map((msg: any) => (
                <div
                  key={msg.id}
                  data-testid={`message-item-${msg.id}`}
                  style={{
                    display: 'flex',
                    justifyContent: msg.mine ? 'flex-end' : 'flex-start',
                    margin: '12px 0',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '75%',
                      padding: '13px 16px',
                      borderRadius: 16,
                      background: msg.mine ? 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' : '#f1f5f9',
                      color: msg.mine ? '#ffffff' : 'inherit',
                      fontSize: 13.5,
                      lineHeight: 1.6,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    }}
                  >
                    {msg.body}
                    <div
                      style={{
                        fontSize: 10.5,
                        marginTop: 6,
                        color: msg.mine ? 'rgba(255,255,255,0.75)' : '#64748b',
                        textAlign: msg.mine ? 'right' : 'left',
                      }}
                    >
                      {msg.sender} · {msg.time}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <Empty title="The thread is quiet" text="Send a sample note to start exploring this screen." />
            )}
          </div>

          <form
            onSubmit={e => {
              e.preventDefault();
              send.mutate(
                { data: { conversationId, body } },
                {
                  onSuccess: () => {
                    setBody('');
                    qc.invalidateQueries({ queryKey: getGetMessagesQueryKey({ conversationId }) });
                  },
                }
              );
            }}
            style={{ display: 'flex', gap: 10, borderTop: '1px solid rgba(13, 148, 136, 0.15)', paddingTop: 16 }}
          >
            <input
              className="input"
              value={body}
              onChange={e => setBody(e.target.value)}
              required
              maxLength={2000}
              placeholder="Write a sample message to your mentor…"
              aria-label="Message body"
              data-testid="input-message-body"
            />
            <button className="btn btn-primary" disabled={send.isPending} data-testid="button-send-message">
              {send.isPending ? 'Sending…' : 'Send'} <ArrowRight size={14} />
            </button>
          </form>
          {send.isError && <p role="alert" className="muted" style={{ color: 'red', marginTop: 8 }}>This sample message couldn’t be added. Try again.</p>}
        </div>
      </QueryState>
    </div>
  );
}

function NotificationsPage() {
  const q = useGetNotifications({ query: { queryKey: getGetNotificationsQueryKey() } });
  const mark = useMarkNotificationRead();
  const qc = useQueryClient();

  return (
    <div className="page-wrap animate-rise" style={{ maxWidth: 880 }}>
      <PageHead
        kicker="Your inbox · sample"
        title="A few things to know."
        detail="Notification examples only; no real accounts or events are monitored."
      />
      <DemoNotice />

      <QueryState loading={q.isLoading} error={q.isError} retry={() => q.refetch()}>
        {(q.data || []).length ? (
          <div style={{ display: 'grid', gap: 12, marginTop: 22 }}>
            {q.data!.map((n: any) => (
              <article
                key={n.id}
                className="card"
                data-testid={`notification-${n.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  background: n.unread ? '#f0fdf9' : '#ffffff',
                  borderColor: n.unread ? 'rgba(13, 148, 136, 0.3)' : undefined,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: n.unread ? '#ffedd5' : '#ccfbf1',
                    display: 'grid',
                    placeItems: 'center',
                    color: n.unread ? '#c2410c' : '#0f766e',
                    flexShrink: 0,
                  }}
                >
                  <Bell size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 14.5 }}>{n.title}</strong>
                  <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>{n.detail}</div>
                  <small className="muted" style={{ fontSize: 11 }}>{n.time} · demo notification</small>
                </div>
                {n.unread && (
                  <>
                    <span className="tag" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}>New</span>
                    <button
                      className="btn btn-soft"
                      onClick={() =>
                        mark.mutate(
                          { id: n.id },
                          { onSuccess: () => qc.invalidateQueries({ queryKey: getGetNotificationsQueryKey() }) }
                        )
                      }
                      disabled={mark.isPending}
                      data-testid={`button-mark-read-${n.id}`}
                    >
                      Mark read
                    </button>
                  </>
                )}
              </article>
            ))}
          </div>
        ) : (
          <Empty title="All caught up" text="There are no sample notifications to show right now." />
        )}
      </QueryState>
    </div>
  );
}

const adminRoutes = [
  ['/admin/users', 'Users', 'People preview', 'Directory of sample marketplace participants.'],
  ['/admin/mentors', 'Mentors', 'Mentor profiles', 'Review demo profiles and their directory status.'],
  ['/admin/bookings', 'Bookings', 'Booking activity', 'A sample overview of marketplace sessions.'],
  ['/admin/payments', 'Payments', 'Payment placeholders', 'No payment processor is connected and no money moves here.'],
  ['/admin/reports', 'Reports', 'Reports & review', 'A calm place to scan sample reports and marketplace health.'],
  ['/admin/analytics', 'Analytics', 'Analytics snapshot', 'Illustrative product metrics, not live customer activity.'],
] as const;

function AdminDashboard() {
  const d = useGetDashboard({ role: 'admin' }, { query: { queryKey: getGetDashboardQueryKey({ role: 'admin' }) } });

  return (
    <div className="page-wrap animate-rise">
      <PageHead
        kicker="Operations · demo"
        title="A small window into the marketplace."
        detail="Admin role previews are illustrative; all data here is seeded demo information."
      />
      <DemoNotice>These controls and metrics do not administer real accounts.</DemoNotice>

      <QueryState loading={d.isLoading} error={d.isError} retry={() => d.refetch()}>
        {d.data ? (
          <>
            <div className="grid-auto" style={{ margin: '22px 0' }}>
              {[
                ['Sample sessions', d.data.sessions],
                ['Upcoming sessions', d.data.upcoming],
                ['Mentor profiles', d.data.students],
                ['Marketplace pulse', `${d.data.progress}%`],
              ].map(([a, b]) => (
                <div className="stat" key={String(a)}>
                  <small>{a}</small>
                  <strong>{b}</strong>
                </div>
              ))}
            </div>

            <div className="grid-auto">
              {adminRoutes.map(([path, label, title, detail]) => (
                <Link
                  href={path}
                  key={path}
                  className="card"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                  data-testid={`link-admin-${label.toLowerCase()}`}
                >
                  <span className="eyebrow">{label} · sample</span>
                  <h2 className="serif" style={{ margin: '10px 0 6px', fontSize: 20 }}>{title}</h2>
                  <p className="muted" style={{ fontSize: 13, minHeight: 38 }}>{detail}</p>
                  <span className="tag" style={{ marginTop: 8 }}>
                    Open view <ArrowRight size={12} />
                  </span>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <Empty title="Admin overview unavailable" text="Try reloading the sample dashboard." />
        )}
      </QueryState>
    </div>
  );
}

function AdminData({ path, label, title, detail }: { path: string; label: string; title: string; detail: string }) {
  const role = path.includes('mentors')
    ? 'mentors'
    : path.includes('bookings')
    ? 'bookings'
    : path.includes('users')
    ? 'users'
    : path.includes('payments')
    ? 'payments'
    : path.includes('reports')
    ? 'reports'
    : 'analytics';

  const mentors = useGetMentors();
  const bookings = useGetBookings();
  const notices = useGetNotifications();

  const source = role === 'mentors' ? mentors.data : role === 'bookings' || role === 'payments' ? bookings.data : null;
  const busy = role === 'mentors' ? mentors.isLoading : role === 'bookings' || role === 'payments' ? bookings.isLoading : role === 'users' ? mentors.isLoading || bookings.isLoading : notices.isLoading;
  const error = role === 'mentors' ? mentors.isError : role === 'bookings' || role === 'payments' ? bookings.isError : role === 'users' ? mentors.isError || bookings.isError : notices.isError;
  const retry = () => { mentors.refetch(); bookings.refetch(); notices.refetch(); };

  return (
    <div className="page-wrap animate-rise">
      <PageHead kicker={`Admin · ${label.toLowerCase()} · preview`} title={title} detail={detail} />
      <DemoNotice>Read-only seeded examples; changes here do not affect a real external service.</DemoNotice>

      <div className="section-head" style={{ marginTop: 24, marginBottom: 16 }}>
        <div>
          <div className="eyebrow">Tools</div>
          <h2 className="serif" style={{ margin: '4px 0', fontSize: 22 }}>Admin areas</h2>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {adminRoutes.map(([p, l]) => (
          <Link
            key={p}
            className={`btn ${p === path ? 'btn-primary' : 'btn-soft'}`}
            href={p}
            data-testid={`link-admin-tab-${l.toLowerCase()}`}
          >
            {l}
          </Link>
        ))}
      </div>

      <QueryState loading={busy} error={error} retry={retry}>
        {source || role === 'users' || role === 'reports' || role === 'analytics' ? (
          <div className="card" style={{ overflowX: 'auto', background: '#ffffff', padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid rgba(13, 148, 136, 0.15)' }}>
                  {(role === 'mentors'
                    ? ['Mentor', 'Field', 'Rating', 'Sessions', 'Status']
                    : role === 'bookings'
                    ? ['Booking', 'Student', 'Session', 'Date', 'Status']
                    : role === 'payments'
                    ? ['Reference', 'Participant', 'Amount', 'Payment state']
                    : role === 'users'
                    ? ['Sample person', 'Role', 'Activity']
                    : ['Signal', 'Example', 'State']
                  ).map(h => (
                    <th key={h} style={{ padding: '14px 18px', color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 800 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {role === 'mentors' &&
                  (source as any[]).map(m => (
                    <tr key={m.id} data-testid={`row-admin-mentor-${m.id}`} style={{ borderBottom: '1px solid rgba(13, 148, 136, 0.08)' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <strong>{m.name}</strong>
                        <div className="muted" style={{ fontSize: 12 }}>{m.company}</div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>{m.category}</td>
                      <td style={{ padding: '14px 18px' }}>⭐ {m.rating} / 5</td>
                      <td style={{ padding: '14px 18px' }}>{m.sessions}</td>
                      <td style={{ padding: '14px 18px' }}><span className="status">sample verified</span></td>
                    </tr>
                  ))}

                {role === 'bookings' &&
                  (source as any[]).map(b => (
                    <tr key={b.id} data-testid={`row-admin-booking-${b.id}`} style={{ borderBottom: '1px solid rgba(13, 148, 136, 0.08)' }}>
                      <td style={{ padding: '14px 18px' }}><strong>{b.id}</strong></td>
                      <td style={{ padding: '14px 18px' }}>{b.studentName}</td>
                      <td style={{ padding: '14px 18px' }}>{b.mentorName} · {b.type}</td>
                      <td style={{ padding: '14px 18px' }}>{b.date} · {b.time}</td>
                      <td style={{ padding: '14px 18px' }}><span className={`status ${b.status}`}>{b.status}</span></td>
                    </tr>
                  ))}

                {role === 'payments' &&
                  (source as any[]).map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid rgba(13, 148, 136, 0.08)' }}>
                      <td style={{ padding: '14px 18px' }}><strong>DEMO-{b.id}</strong></td>
                      <td style={{ padding: '14px 18px' }}>{b.studentName} · {b.mentorName}</td>
                      <td style={{ padding: '14px 18px' }}><strong>${b.price}</strong></td>
                      <td style={{ padding: '14px 18px' }}><span className="status pending">Not processed</span></td>
                    </tr>
                  ))}

                {role === 'users' &&
                  [...(mentors.data || []).map((m: any) => ({ name: m.name, role: 'Mentor' })), { name: 'Alex Morgan', role: 'Student' }, { name: 'Jordan Lee', role: 'Student' }].map((u, i) => (
                    <tr key={`${u.name}-${i}`} style={{ borderBottom: '1px solid rgba(13, 148, 136, 0.08)' }}>
                      <td style={{ padding: '14px 18px' }}><strong>{u.name}</strong></td>
                      <td style={{ padding: '14px 18px' }}>{u.role} · demo</td>
                      <td style={{ padding: '14px 18px' }}><span className="status">Seeded activity</span></td>
                    </tr>
                  ))}

                {(role === 'reports' || role === 'analytics') &&
                  [
                    ['Profile completeness', `${mentors.data?.length || 0} sample profiles`, 'Illustrative'],
                    ['Booking volume', `${bookings.data?.length || 0} sample sessions`, 'Not live'],
                    ['Inbox activity', `${notices.data?.length || 0} seeded alerts`, 'Not connected'],
                  ].map(([a, b, c]) => (
                    <tr key={a} style={{ borderBottom: '1px solid rgba(13, 148, 136, 0.08)' }}>
                      <td style={{ padding: '14px 18px' }}><strong>{a}</strong></td>
                      <td style={{ padding: '14px 18px' }}>{b}</td>
                      <td style={{ padding: '14px 18px' }}><span className="status pending">{c}</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No sample records found" text="The demo dataset has no records for this area yet." />
        )}
      </QueryState>

      {role === 'payments' && (
        <div className="notice" style={{ marginTop: 18 }}>
          <CreditCard size={16} />
          Payment rows describe sample booking amounts only. No transactions, card data, or refunds exist.
        </div>
      )}
    </div>
  );
}

function Router() {
  const [loc] = useLocation();

  return (
    <ErrorBoundary resetKey={loc}>
      <Shell>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login"><DemoEntry /></Route>
          <Route path="/register"><DemoEntry register /></Route>
          <Route path="/mentors" component={MentorsPage} />
          <Route path="/mentors/:id" component={MentorProfile} />
          <Route path="/booking/:id" component={BookingPage} />
          <Route path="/student/dashboard"><DashboardPage role="student" /></Route>
          <Route path="/student/progress" component={ProgressPage} />
          <Route path="/mentor/dashboard"><DashboardPage role="mentor" /></Route>
          <Route path="/mentor/onboarding" component={MentorOnboarding} />
          <Route path="/messages" component={MessagesPage} />
          <Route path="/notifications" component={NotificationsPage} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          {adminRoutes.map(([path, label, title, detail]) => (
            <Route key={path} path={path}>
              <AdminData path={path} label={label} title={title} detail={detail} />
            </Route>
          ))}
          <Route component={NotFound} />
        </Switch>
      </Shell>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

