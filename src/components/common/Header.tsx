import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Database, Shield, Bell, Terminal, Sparkles, ChevronDown, Check, UserPlus, LogIn, CreditCard, BookOpen } from 'lucide-react';
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
    <header className="fixed top-0 left-0 right-0 z-50 py-4 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3 rounded-full glass-nav-pill border border-[rgba(255,255,255,0.08)] shadow-[0_12px_36px_rgba(0,0,0,0.5)]">
        {/* Brand */}
        <div className="flex items-center gap-7">
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 group text-left focus:outline-none"
          >
            <img
              src="/nexus-logo.png"
              alt="NEXUS Logo"
              className="h-8 w-8 shrink-0 object-contain group-hover:scale-105 transition-transform drop-shadow-[0_0_12px_rgba(141,255,203,0.35)]"
            />
            <span className="font-extrabold text-base tracking-tight text-[#F1F5F0]">
              NEXUS
            </span>
          </button>

          {/* Clean Navigation Links with proper padding & orientation */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-medium">
            <button
              onClick={() => onNavigate('landing')}
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                currentView === 'landing'
                  ? 'text-[#8DFFCB] bg-white/[0.06] font-semibold'
                  : 'text-[#94A3B8] hover:text-[#F1F5F0] hover:bg-white/[0.03]'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => onNavigate('plans')}
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                currentView === 'plans'
                  ? 'text-[#8DFFCB] bg-white/[0.06] font-semibold'
                  : 'text-[#94A3B8] hover:text-[#F1F5F0] hover:bg-white/[0.03]'
              }`}
            >
              Plans & Pricing
            </button>
            <button
              onClick={() => onNavigate('personal_subs')}
              className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${
                currentView === 'personal_subs'
                  ? 'text-[#8DFFCB] bg-white/[0.06] font-semibold'
                  : 'text-[#94A3B8] hover:text-[#F1F5F0] hover:bg-white/[0.03]'
              }`}
            >
              <span>Subscriptions</span>
            </button>
            <button
              onClick={() => onNavigate('dbms')}
              className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${
                currentView === 'dbms'
                  ? 'text-[#8DFFCB] bg-white/[0.06] font-semibold'
                  : 'text-[#94A3B8] hover:text-[#F1F5F0] hover:bg-white/[0.03]'
              }`}
            >
              <span>DBMS Studio</span>
            </button>
            <button
              onClick={() => onNavigate('dbms_docs')}
              className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${
                currentView === 'dbms_docs'
                  ? 'text-[#8DFFCB] bg-white/[0.06] font-semibold'
                  : 'text-[#94A3B8] hover:text-[#F1F5F0] hover:bg-white/[0.03]'
              }`}
            >
              <span>DBMS Report</span>
            </button>
            <button
              onClick={() => onNavigate('retention')}
              className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${
                currentView === 'retention'
                  ? 'text-[#8DFFCB] bg-white/[0.06] font-semibold'
                  : 'text-[#94A3B8] hover:text-[#F1F5F0] hover:bg-white/[0.03]'
              }`}
            >
              <span>AI Retention</span>
            </button>
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Member Login / Sign Up buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setAuthMode('login');
                setAuthModalOpen(true);
              }}
              className="px-3.5 py-1.5 text-xs font-medium rounded-full text-[#F1F5F0] hover:text-[#8DFFCB] hover:bg-white/[0.04] transition-colors"
            >
              Log In
            </button>
            <button
              onClick={() => {
                setAuthMode('signup');
                setAuthModalOpen(true);
              }}
              className="px-4 py-1.5 text-xs font-semibold rounded-full bg-[#8DFFCB] text-[#071112] hover:bg-[#A6FFD8] hover:shadow-[0_0_20px_rgba(141,255,203,0.35)] transition-all"
            >
              Sign Up
            </button>
          </div>

          {/* Testing Persona Pill */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-full bg-white/[0.04] border border-white/[0.08] hover:border-[#8DFFCB]/40 transition-all text-[#94A3B8] hover:text-[#F1F5F0]"
            >
              <Shield className="w-3.5 h-3.5 text-[#8DFFCB]" />
              <span className="capitalize text-[#F1F5F0]">{role}</span>
              <ChevronDown className="w-3 h-3 text-[#94A3B8]" />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-3 w-64 rounded-2xl glass-panel-elevated p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                <div className="text-[10px] uppercase font-mono text-[#94A3B8] px-3 py-1.5 border-b border-white/[0.06]">
                  Switch Testing Persona
                </div>
                {(['admin', 'operator', 'member'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      switchPersona(r);
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-colors text-left ${
                      role === r ? 'bg-[#8DFFCB]/15 text-[#8DFFCB]' : 'text-[#F1F5F0] hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <div className="font-semibold capitalize">{r}</div>
                      <div className="text-[10px] text-[#94A3B8]">
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
            className="relative p-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-[#94A3B8] hover:text-[#8DFFCB] hover:border-[#8DFFCB]/30 transition-all"
            title="Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#8DFFCB] text-[#071112] text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Primary App CTA */}
          <button
            onClick={() => onNavigate(role === 'member' ? 'personal_subs' : 'dashboard')}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-[#F1F5F0] text-xs font-medium hover:bg-white/[0.1] hover:text-[#8DFFCB] transition-all"
          >
            <Terminal className="w-3 h-3 text-[#8DFFCB]" />
            <span>{role === 'member' ? 'Dashboard' : 'Console'}</span>
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
