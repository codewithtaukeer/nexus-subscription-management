import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Layers, 
  Users, 
  Repeat, 
  CreditCard, 
  CalendarClock, 
  BarChart3, 
  Sparkles, 
  Database, 
  Bell, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck,
  UserCheck,
  UserPlus,
  LogIn,
  BookOpen
} from 'lucide-react';
import type { UserRole } from '../../types/database';
import { AuthModal } from '../auth/AuthModal';

interface AppShellProps {
  currentView: string;
  onNavigate: (view: string) => void;
  children: React.ReactNode;
  unreadCount?: number;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentView,
  onNavigate,
  children,
  unreadCount = 0,
}) => {
  const { currentUser, role, isPremium, switchPersona, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const isCustomUser = !!localStorage.getItem('nexus_custom_user');

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, roles: ['admin', 'member'] },
    { id: 'personal_subs', label: 'My Subscriptions', icon: CreditCard, roles: ['admin', 'member'], badge: 'Central Hub' },
    { id: 'portal', label: 'My Portal', icon: UserCheck, roles: ['admin', 'member'] },
    { id: 'plans', label: 'Plans & Pricing', icon: Layers, roles: ['admin', 'member'] },
    { id: 'members', label: 'Members Directory', icon: Users, roles: ['admin'] },
    { id: 'subscriptions', label: 'Subscriptions', icon: Repeat, roles: ['admin'] },
    { id: 'billing', label: 'Invoices & Billing', icon: CreditCard, roles: ['admin'] },
    { id: 'renewals', label: 'Renewal Radar', icon: CalendarClock, roles: ['admin'] },
    { id: 'analytics', label: 'Reports & Revenue', icon: BarChart3, roles: ['admin'] },
    { id: 'retention', label: 'Retention Intelligence', icon: Sparkles, roles: ['admin'] },
    { 
      id: 'dbms', 
      label: 'DBMS Studio', 
      icon: Database, 
      roles: ['admin', 'member'], 
      badge: role === 'admin' || isPremium ? 'Live SQL' : 'PRO Locked' 
    },
    { id: 'dbms_docs', label: 'DBMS Report & Docs', icon: BookOpen, roles: ['admin', 'member'], badge: 'MNNIT' },
    { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'member'], count: unreadCount },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin', 'member'] },
  ];

  const filteredNav = navItems.filter((item) => item.roles.includes(role));

  return (
    <div className="min-h-screen bg-[#0B0F12] text-[#F1F5F0] flex flex-col md:flex-row p-3 sm:p-5 gap-5">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 rounded-2xl glass-panel sticky top-3 z-40">
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2.5 font-bold text-sm text-[#8DFFCB]"
        >
          <img
            src="/nexus-logo.png"
            alt="NEXUS"
            className="w-7 h-7 object-contain drop-shadow-[0_0_10px_rgba(141,255,203,0.4)]"
          />
          <span className="tracking-tight text-white">NEXUS</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#8DFFCB]/10 text-[#8DFFCB] border border-[#8DFFCB]/20 capitalize">
            {role}
          </span>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-xl bg-white/[0.04] text-[#94A3B8] border border-white/[0.08]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Floating Curved Glass Sidebar Navigation */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:flex w-full md:w-64 rounded-3xl glass-sidebar flex-col shrink-0 z-30 md:sticky md:top-5 md:h-[calc(100vh-2.5rem)] overflow-hidden shadow-2xl`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-3 text-left focus:outline-none group"
          >
            <img
              src="/nexus-logo.png"
              alt="NEXUS Logo"
              className="h-9 w-9 shrink-0 object-contain group-hover:scale-105 transition-transform drop-shadow-[0_0_12px_rgba(141,255,203,0.35)]"
            />
            <div>
              <div className="font-extrabold text-sm tracking-tight text-[#F1F5F0] flex items-center gap-1.5">
                NEXUS <span className="text-[9px] font-mono text-[#8DFFCB] font-bold">34</span>
              </div>
              <div className="text-[10px] text-[#94A3B8]">DBMS Architecture</div>
            </div>
          </button>
        </div>

        {/* User Account Card */}
        <div className="px-4 py-3.5 border-b border-white/[0.06] bg-black/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-mono text-[#94A3B8]">Active Account</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full capitalize font-semibold ${
              role === 'admin' 
                ? 'bg-[#8DFFCB]/15 text-[#8DFFCB] border border-[#8DFFCB]/30' 
                : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
            }`}>
              {role}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-4 h-4 shrink-0 ${role === 'admin' ? 'text-[#8DFFCB]' : 'text-cyan-300'}`} />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#F1F5F0] truncate">
                {currentUser?.full_name || (role === 'admin' ? 'Alex Vance' : 'User')}
              </div>
              <div className="text-[10px] text-[#94A3B8] truncate">
                {currentUser?.email || 'admin@nexus.io'}
              </div>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all text-left ${
                  active
                    ? 'bg-[#8DFFCB]/15 text-[#8DFFCB] font-semibold border border-[#8DFFCB]/35 shadow-[0_4px_16px_rgba(141,255,203,0.15)]'
                    : 'text-[#94A3B8] hover:text-[#F1F5F0] hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#8DFFCB]' : 'text-[#94A3B8]'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-[#8DFFCB]/15 text-[#8DFFCB] border border-[#8DFFCB]/25 font-mono">
                    {item.badge}
                  </span>
                )}
                {item.count && item.count > 0 ? (
                  <span className="w-4 h-4 rounded-full bg-[#8DFFCB] text-[#071112] text-[9px] font-bold flex items-center justify-center">
                    {item.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-white/[0.06] space-y-1.5 text-xs">
          {isCustomUser ? (
            <button
              onClick={() => signOut()}
              className="w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 transition-all text-[11px] font-mono mb-1"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out ({currentUser?.full_name?.split(' ')[0]})</span>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-1.5 mb-1">
              <button
                onClick={() => {
                  setAuthMode('login');
                  setAuthModalOpen(true);
                }}
                className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#94A3B8] hover:text-[#8DFFCB] hover:border-[#8DFFCB]/40 transition-all text-[11px]"
              >
                <LogIn className="w-3 h-3" />
                <span>Login</span>
              </button>
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setAuthModalOpen(true);
                }}
                className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-[#8DFFCB]/10 border border-[#8DFFCB]/30 text-[#8DFFCB] hover:bg-[#8DFFCB]/20 transition-all text-[11px] font-semibold"
              >
                <UserPlus className="w-3 h-3" />
                <span>Sign Up</span>
              </button>
            </div>
          )}

          <button
            onClick={() => onNavigate('landing')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#94A3B8] hover:text-[#F1F5F0] hover:bg-white/[0.04] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Public Landing</span>
          </button>
        </div>
      </aside>

      {/* Main Floating Glass Viewport */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="max-w-7xl w-full mx-auto space-y-6">
          {children}
        </div>
      </main>

      {/* Member Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        onSuccess={() => onNavigate('personal_subs')}
      />
    </div>
  );
};
