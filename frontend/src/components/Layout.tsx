import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  HeartPulse,
  Home,
  FolderHeart,
  Pill,
  Sparkles,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  User,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

interface PrimaryNav {
  name: string;
  path: string;
  icon: any;
  matchPrefixes: string[];
}

export const Layout: React.FC = () => {
  const { user, logout, selectedPatientId, setSelectedPatientId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sharedPatients, setSharedPatients] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // The 6 Primary Navigation Destinations
  const primaryNavs: PrimaryNav[] = [
    {
      name: 'Home',
      path: '/',
      icon: Home,
      matchPrefixes: ['/'],
    },
    {
      name: 'My Health Records',
      path: '/health-records',
      icon: FolderHeart,
      matchPrefixes: ['/health-records', '/timeline', '/documents', '/daily-readings'],
    },
    {
      name: 'Medicines & Safety',
      path: '/medicines-safety',
      icon: Pill,
      matchPrefixes: ['/medicines-safety', '/medicines', '/supplements', '/medicine-changes'],
    },
    {
      name: 'Reports & AI Assistant',
      path: '/reports-assistant',
      icon: Sparkles,
      matchPrefixes: ['/reports-assistant', '/translator', '/prescription-verify', '/doctor-visit', '/symptoms'],
    },
    {
      name: 'Health Insights',
      path: '/health-insights',
      icon: TrendingUp,
      matchPrefixes: ['/health-insights', '/trends'],
    },
    {
      name: 'Settings & Privacy',
      path: '/settings',
      icon: Settings,
      matchPrefixes: ['/settings', '/family', '/ai-transparency', '/expenses'],
    },
  ];

  // Helper to determine if a destination is currently active
  const isNavActive = (nav: PrimaryNav): boolean => {
    if (nav.path === '/') {
      return location.pathname === '/';
    }
    return nav.matchPrefixes.some(prefix => location.pathname === prefix || location.pathname.startsWith(prefix + '/'));
  };

  useEffect(() => {
    if (user?.role === 'caregiver') {
      api.listSharedPatients().then(setSharedPatients).catch(() => {});
    }
  }, [user]);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F7F9FC]">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-2xs z-50 sticky top-0">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-blue-700 rounded-lg text-white">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-blue-950 text-base leading-tight block">MediChronicle AI</span>
            <span className="text-[10px] text-teal-700 font-semibold block uppercase tracking-wider">Clinical Intelligence</span>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-slate-600 hover:text-blue-900 hover:bg-slate-100 transition"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Main Sidebar Navigation */}
      <aside
        className={`${
          mobileMenuOpen ? 'fixed inset-0 z-50 bg-white' : 'hidden'
        } md:flex flex-col ${
          collapsed ? 'md:w-18' : 'md:w-64'
        } bg-white border-r border-slate-200 flex-shrink-0 h-screen md:sticky top-0 z-40 transition-all duration-200 shadow-2xs`}
      >
        {/* Brand & Collapse Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5 overflow-hidden">
            <div className="p-2 bg-blue-700 rounded-xl text-white shrink-0 shadow-xs">
              <HeartPulse className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="font-bold text-blue-950 text-base tracking-tight leading-tight truncate">
                  MediChronicle AI
                </h1>
                <p className="text-[10px] text-teal-700 font-semibold uppercase tracking-wider">Verified Health</p>
              </div>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
          {mobileMenuOpen && (
            <button onClick={() => setMobileMenuOpen(false)} className="md:hidden p-1 text-slate-500">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Active Patient Identity / Context Banner */}
        {!collapsed ? (
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200/80">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Patient</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full capitalize">
                {user?.role || 'Patient'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user?.full_name?.charAt(0) || 'P'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-blue-950 truncate">{user?.full_name}</p>
                <p className="text-[10px] text-slate-500 truncate font-mono">{user?.email}</p>
              </div>
            </div>

            {/* Caregiver Switcher if delegated patients exist */}
            {user?.role === 'caregiver' && sharedPatients.length > 0 && (
              <div className="mt-2.5 pt-2 border-t border-slate-200">
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">Switch Patient View:</label>
                <select
                  value={selectedPatientId || ''}
                  onChange={(e) => setSelectedPatientId(Number(e.target.value) || null)}
                  className="w-full text-xs bg-white border border-slate-300 rounded p-1 text-slate-800"
                >
                  <option value="">My Profile</option>
                  {sharedPatients.map((sp) => (
                    <option key={sp.patient_id} value={sp.patient_id}>
                      {sp.patient_name} ({sp.relationship})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 text-center border-b border-slate-200">
            <div className="w-8 h-8 mx-auto rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs" title={user?.full_name}>
              {user?.full_name?.charAt(0) || 'P'}
            </div>
          </div>
        )}

        {/* 6 Primary Navigation Destinations */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {primaryNavs.map((nav) => {
            const active = isNavActive(nav);
            const IconComponent = nav.icon;
            return (
              <Link
                key={nav.path}
                to={nav.path}
                title={collapsed ? nav.name : undefined}
                className={`flex items-center px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  active
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-blue-950 hover:bg-slate-100'
                } ${collapsed ? 'justify-center px-2' : ''}`}
              >
                <IconComponent className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-500'} ${collapsed ? '' : 'mr-3'}`} />
                {!collapsed && (
                  <span className="truncate flex-1">{nav.name}</span>
                )}
                {!collapsed && active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white ml-2 shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Clear Account Profile & Sign Out at the Bottom */}
        <div className="p-3 border-t border-slate-200 space-y-2">
          {!collapsed && (
            <Link
              to="/settings"
              className="flex items-center px-3 py-2 text-xs font-medium text-slate-600 hover:text-blue-950 hover:bg-slate-100 rounded-lg transition"
            >
              <User className="w-4 h-4 mr-2.5 text-slate-500 shrink-0" />
              <span className="truncate">Account & Settings</span>
            </Link>
          )}

          <button
            onClick={handleLogout}
            title={collapsed ? 'Sign Out' : undefined}
            className={`w-full flex items-center ${
              collapsed ? 'justify-center p-2' : 'px-3 py-2'
            } text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition`}
          >
            <LogOut className={`w-4 h-4 ${collapsed ? '' : 'mr-2'}`} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Desktop Header Bar */}
        <header className="hidden md:flex bg-white border-b border-slate-200 px-6 py-3 items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center space-x-3 text-xs text-slate-500">
            <span className="font-semibold text-blue-950">MediChronicle AI Platform</span>
            <span>•</span>
            <span className="bg-emerald-50 text-emerald-800 font-medium px-2 py-0.5 rounded-full border border-emerald-200">
              Deterministic Verification Active
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Quick Link to Medicine Safety Checker */}
            <Link
              to="/medicines"
              className="text-xs font-semibold text-teal-800 hover:text-teal-900 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200 flex items-center transition"
            >
              <Pill className="w-3.5 h-3.5 mr-1 text-teal-700" />
              Safety Checker
            </Link>

            {/* Quick Link to AI Sources & Activity */}
            <Link
              to="/ai-transparency"
              className="text-xs font-semibold text-blue-800 hover:text-blue-900 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 flex items-center transition"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-blue-700" />
              AI Sources & Activity
            </Link>

            {/* User Profile Pill linking to Settings */}
            <Link
              to="/settings"
              className="flex items-center space-x-2 pl-3 border-l border-slate-200 text-xs hover:opacity-85 transition"
            >
              <div className="w-7 h-7 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <span className="font-semibold text-blue-950">{user?.full_name}</span>
            </Link>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
