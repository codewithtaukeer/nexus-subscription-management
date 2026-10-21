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
  UserCheck
} from 'lucide-react';
import type { UserRole } from '../../types/database';

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
  const { currentUser, role, switchPersona } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, roles: ['admin', 'operator'] },
    { id: 'portal', label: 'My Portal', icon: UserCheck, roles: ['member'] },
    { id: 'plans', label: 'Plans & Pricing', icon: Layers, roles: ['admin', 'operator', 'member'] },
    { id: 'members', label: 'Members Directory', icon: Users, roles: ['admin', 'operator'] },
    { id: 'subscriptions', label: 'Subscriptions', icon: Repeat, roles: ['admin', 'operator'] },
    { id: 'billing', label: 'Invoices & Billing', icon: CreditCard, roles: ['admin', 'operator', 'member'] },
    { id: 'renewals', label: 'Renewal Radar', icon: CalendarClock, roles: ['admin', 'operator'] },
    { id: 'analytics', label: 'Reports & Revenue', icon: BarChart3, roles: ['admin', 'operator'] },
    { id: 'retention', label: 'Retention Intelligence', icon: Sparkles, roles: ['admin', 'operator'] },
    { id: 'dbms', label: 'DBMS Studio', icon: Database, roles: ['admin', 'operator', 'member'], badge: 'Live SQL' },
    { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'operator', 'member'], count: unreadCount },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin', 'operator', 'member'] },
  ];

  const filteredNav = navItems.filter((item) => item.roles.includes(role));

  return (
    <div className="min-h-screen bg-[#071112] text-[#F1F5F0] flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0D1919] border-b border-[rgba(220,255,245,0.12)] sticky top-0 z-40">
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2.5 font-mono font-bold text-sm text-[#8DFFCB]"
        >
          <img
            src="/nexus-logo.png"
            alt="NEXUS"
            className="w-7 h-7 object-contain drop-shadow-[0_0_10px_rgba(141,255,203,0.4)]"
          />
          <span>NEXUS</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#8DFFCB]/10 text-[#8DFFCB] border border-[#8DFFCB]/20 capitalize">
            {role}
          </span>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg bg-[#071112] text-[#8E9F9B] border border-[rgba(220,255,245,0.1)]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Desktop Sidebar Navigation */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-[#0D1919] border-r border-[rgba(220,255,245,0.1)] flex flex-col shrink-0 z-30 md:sticky md:top-0 md:h-screen`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[rgba(220,255,245,0.08)] flex items-center justify-between">
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-3 text-left focus:outline-none group"
          >
            <img
              src="/nexus-logo.png"
              alt="NEXUS Logo"
              className="h-11 w-11 shrink-0 object-contain bg-transparent rounded-none shadow-none group-hover:scale-105 transition-transform"
            />
            <div>
              <div className="font-bold text-sm tracking-wide text-[#F1F5F0] flex items-center gap-1.5">
                NEXUS <span className="text-[9px] font-mono text-[#8DFFCB]">34</span>
              </div>
              <div className="text-[10px] text-[#8E9F9B] font-mono">Postgres Subscriptions</div>
            </div>
          </button>
        </div>

        {/* Persona Pill */}
        <div className="px-4 py-3 border-b border-[rgba(220,255,245,0.06)] bg-[#071112]/40">
          <div className="text-[10px] uppercase font-mono text-[#8E9F9B] mb-1">Active Role</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#8DFFCB]" />
              <span className="text-xs font-semibold capitalize text-[#F1F5F0]">{role}</span>
            </div>
            <select
              value={role}
              onChange={(e) => switchPersona(e.target.value as UserRole)}
              className="text-[11px] font-mono bg-[#0D1919] text-[#8DFFCB] border border-[rgba(220,255,245,0.2)] rounded px-1.5 py-0.5 focus:outline-none"
            >
              <option value="admin">Admin</option>
              <option value="operator">Operator</option>
              <option value="member">Member</option>
            </select>
          </div>
          <div className="text-[10px] text-[#8E9F9B] truncate mt-0.5">
            {currentUser?.email || 'authenticated'}
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
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-all text-left ${
                  active
                    ? 'bg-[#8DFFCB]/15 text-[#8DFFCB] font-semibold border border-[#8DFFCB]/30 shadow-[0_0_12px_rgba(141,255,203,0.15)]'
                    : 'text-[#8E9F9B] hover:text-[#F1F5F0] hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#8DFFCB]' : 'text-[#8E9F9B]'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#8DFFCB]/20 text-[#8DFFCB] border border-[#8DFFCB]/30">
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
        <div className="p-3 border-t border-[rgba(220,255,245,0.08)] space-y-1 text-xs font-mono">
          <button
            onClick={() => onNavigate('landing')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#8E9F9B] hover:text-[#F1F5F0] hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Public Landing</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
};
