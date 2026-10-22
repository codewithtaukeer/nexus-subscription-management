import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Database, Shield, Bell, Terminal, Sparkles, ChevronDown, Check, UserPlus, LogIn, CreditCard } from 'lucide-react';
import type { UserRole } from '../../types/database';
import { AuthModal } from '../auth/AuthModal';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, unreadCount = 2 }) => {
  const { currentUser, role, switchPersona } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#071112]/90 backdrop-blur-md border-b border-[rgba(220,255,245,0.12)] py-3 shadow-xl shadow-black/40'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-3 group text-left focus:outline-none"
          >
            <img
              src="/nexus-logo.png"
              alt="NEXUS Logo"
              className="h-11 w-11 shrink-0 object-contain bg-transparent rounded-none shadow-none group-hover:scale-105 transition-transform"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-[#F1F5F0]">NEXUS</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#8DFFCB]/10 text-[#8DFFCB] border border-[#8DFFCB]/20">
                  Topic 34
                </span>
              </div>
              <p className="text-[10px] text-[#8E9F9B] font-mono tracking-wider hidden sm:block">
                SUBSCRIPTION ARCHITECTURE
              </p>
            </div>
          </button>

          {/* Quick links */}
          <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-[rgba(220,255,245,0.1)] text-xs font-medium">
            <button
              onClick={() => onNavigate('landing')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                currentView === 'landing' ? 'text-[#8DFFCB] bg-[#8DFFCB]/10' : 'text-[#8E9F9B] hover:text-[#F1F5F0]'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => onNavigate('plans')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                currentView === 'plans' ? 'text-[#8DFFCB] bg-[#8DFFCB]/10' : 'text-[#8E9F9B] hover:text-[#F1F5F0]'
              }`}
            >
              Plans & Pricing
            </button>
            <button
              onClick={() => onNavigate('personal_subs')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                currentView === 'personal_subs' ? 'text-[#8DFFCB] bg-[#8DFFCB]/10' : 'text-[#8E9F9B] hover:text-[#F1F5F0]'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Subscriptions
            </button>
            <button
              onClick={() => onNavigate('dbms')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                currentView === 'dbms'
                  ? 'text-[#8DFFCB] bg-[#8DFFCB]/15 font-semibold border border-[#8DFFCB]/30'
                  : 'text-[#8DFFCB] hover:bg-[#8DFFCB]/10'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              DBMS Studio
            </button>
            <button
              onClick={() => onNavigate('retention')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                currentView === 'retention' ? 'text-[#8DFFCB] bg-[#8DFFCB]/10' : 'text-[#8E9F9B] hover:text-[#F1F5F0]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Intelligence
            </button>
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Member Login / Sign Up buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => {
                setAuthMode('login');
                setAuthModalOpen(true);
              }}
              className="px-3 py-1.5 text-xs font-mono rounded-lg text-[#F1F5F0] hover:text-[#8DFFCB] hover:bg-white/5 transition-colors flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In</span>
            </button>
            <button
              onClick={() => {
                setAuthMode('signup');
                setAuthModalOpen(true);
              }}
              className="px-3 py-1.5 text-xs font-mono font-semibold rounded-lg bg-[#8DFFCB]/15 text-[#8DFFCB] border border-[#8DFFCB]/30 hover:bg-[#8DFFCB]/25 transition-all flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
          </div>

          {/* Persona Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-full bg-[#0D1919] border border-[rgba(220,255,245,0.2)] hover:border-[#8DFFCB]/40 transition-all text-[#F1F5F0]"
            >
              <Shield className="w-3.5 h-3.5 text-[#8DFFCB]" />
              <span className="capitalize">{role}</span>
              <span className="text-[10px] text-[#8E9F9B] hidden sm:inline">({currentUser?.full_name?.split(' ')[0]})</span>
              <ChevronDown className="w-3 h-3 text-[#8E9F9B]" />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.2)] p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                <div className="text-[11px] uppercase font-mono text-[#8E9F9B] px-3 py-1 border-b border-[rgba(220,255,245,0.1)]">
                  Switch Testing Persona
                </div>
                {(['admin', 'operator', 'member'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      switchPersona(r);
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-colors text-left ${
                      role === r ? 'bg-[#8DFFCB]/15 text-[#8DFFCB]' : 'text-[#F1F5F0] hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <div className="font-semibold capitalize">{r}</div>
                      <div className="text-[10px] text-[#8E9F9B]">
                        {r === 'admin'
                          ? 'Alex Vance (Full DBMS & System Access)'
                          : r === 'operator'
                          ? 'Elena Rostova (Operations & Invoicing)'
                          : 'Marcus Chen (Self-Service Portal)'}
                      </div>
                    </div>
                    {role === r && <Check className="w-3.5 h-3.5 text-[#8DFFCB]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications button */}
          <button
            onClick={() => onNavigate('notifications')}
            className="relative p-2 rounded-lg bg-[#0D1919] border border-[rgba(220,255,245,0.15)] text-[#8E9F9B] hover:text-[#8DFFCB] hover:border-[#8DFFCB]/30 transition-all"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#8DFFCB] text-[#071112] text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Primary App CTA */}
          <button
            onClick={() => onNavigate(role === 'member' ? 'personal_subs' : 'dashboard')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8DFFCB] text-[#071112] text-xs font-semibold hover:bg-[#A6FFD8] hover:shadow-[0_0_20px_rgba(141,255,203,0.3)] transition-all font-mono"
          >
            <Terminal className="w-3.5 h-3.5" />
            {role === 'member' ? 'My Subscriptions' : 'Open Console'}
          </button>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        onSuccess={() => onNavigate('personal_subs')}
      />
    </header>
  );
};
