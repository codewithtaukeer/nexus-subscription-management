import React, { useState } from 'react';
import { Settings, Shield, User, Globe, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { UserRole } from '../types/database';

export const SettingsPage: React.FC = () => {
  const { currentUser, role, switchPersona, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [timezone, setTimezone] = useState(currentUser?.timezone || 'Asia/Kolkata');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          timezone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);

      if (error) throw error;
      setMessage('Profile settings updated successfully in PostgreSQL.');
      setTimeout(() => setMessage(null), 3000);
      refreshUser();
    } catch (err: any) {
      alert('Error updating profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-6 border-b border-[rgba(220,255,245,0.1)]">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F1F5F0]">Settings & Configuration</h1>
        <p className="text-xs text-[#8E9F9B] mt-1 font-mono">
          User preferences, timezone configurations, and database RBAC role management.
        </p>
      </div>

      {message && (
        <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* Profile Form */}
      <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] p-6 space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono text-[#F1F5F0] pb-2 border-b border-[rgba(220,255,245,0.08)]">
          <User className="w-4 h-4 text-[#8DFFCB]" />
          <span className="font-bold">Profile & Display Preferences</span>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-mono max-w-md">
          <div className="space-y-1">
            <label className="text-[#8E9F9B]">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#071112] border border-[rgba(220,255,245,0.15)] text-[#F1F5F0] focus:outline-none focus:border-[#8DFFCB]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[#8E9F9B]">Email Address (System Unique)</label>
            <input
              type="text"
              disabled
              value={currentUser?.email || ''}
              className="w-full px-3 py-2 rounded-lg bg-[#071112]/50 border border-[rgba(220,255,245,0.08)] text-[#8E9F9B] cursor-not-allowed"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[#8E9F9B]">Display Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#071112] border border-[rgba(220,255,245,0.15)] text-[#F1F5F0] focus:outline-none focus:border-[#8DFFCB]"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#8DFFCB] text-[#071112] font-bold hover:bg-[#A6FFD8] transition-all"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </form>
      </div>

      {/* Account & Session Security Section */}
      <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] p-6 space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono text-[#F1F5F0] pb-2 border-b border-[rgba(220,255,245,0.08)]">
          <Shield className="w-4 h-4 text-[#8DFFCB]" />
          <span className="font-bold">Active Account & Row-Level Security (RLS) Status</span>
        </div>

        <p className="text-xs text-[#8E9F9B] font-mono leading-relaxed">
          PostgreSQL Row Level Security (RLS) enforces cryptographic tenant boundary isolation for all subscription, payment, and document records.
        </p>

        <div className="p-4 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.1)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#F1F5F0]">{currentUser?.full_name || 'Administrator'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#8DFFCB]/20 text-[#8DFFCB] uppercase font-bold">
                {role}
              </span>
            </div>
            <div className="text-[11px] text-[#8E9F9B] mt-0.5">
              {currentUser?.email || 'admin@nexus.io'} • User ID: {currentUser?.id}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              RLS Policy Enforced
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
