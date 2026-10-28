import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  ExternalLink,
  X,
  CreditCard,
  Repeat,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, fetchMembers, fetchSubscriptions, fetchInvoices } from '../lib/supabase';
import type { Profile, Subscription, Invoice } from '../types/database';
import { Badge } from '../components/common/Badge';

export const MembersPage: React.FC = () => {
  const { role } = useAuth();
  const [members, setMembers] = useState<Profile[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'member'>('all');
  
  // Member Detail Modal
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null);

  const loadData = async () => {
    if (role !== 'admin') return;
    setLoading(true);
    try {
      const [mems, subs, invs] = await Promise.all([
        fetchMembers(),
        fetchSubscriptions(),
        fetchInvoices(),
      ]);
      setMembers(mems);
      setSubscriptions(subs);
      setInvoices(invs);
    } catch (err) {
      console.error('Error fetching members data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role]);

  if (role !== 'admin') {
    return (
      <div className="rounded-2xl glass-panel p-8 text-center max-w-lg mx-auto my-12 border border-rose-500/20">
        <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[#F1F5F0] mb-2">Access Restricted</h2>
        <p className="text-sm text-[#94A3B8]">The Member Directory is restricted to system administrators. As a member, your personal subscriptions and profile can be managed in My Subscriptions and My Portal.</p>
      </div>
    );
  }

  const filteredMembers = members.filter((m) => {
    const matchesSearch = 
      m.full_name.toLowerCase().includes(search.toLowerCase()) || 
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const memberSub = selectedMember
    ? subscriptions.find((s) => s.member_id === selectedMember.id)
    : null;

  const memberInvoices = selectedMember
    ? invoices.filter((i) => i.member_id === selectedMember.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[rgba(220,255,245,0.1)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F1F5F0]">Member Directory</h1>
          <p className="text-xs text-[#8E9F9B] mt-1 font-mono">
            Direct profile table management with role segregation and subscription linkages.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0D1919] p-4 rounded-xl border border-[rgba(220,255,245,0.12)]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#8E9F9B] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search member name or email..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#071112] border border-[rgba(220,255,245,0.15)] text-xs text-[#F1F5F0] placeholder-[#8E9F9B] focus:outline-none focus:border-[#8DFFCB]"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[#8E9F9B]">Role:</span>
          {(['all', 'admin', 'member'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1 rounded-md capitalize transition-colors ${
                roleFilter === r ? 'bg-[#8DFFCB] text-[#071112] font-bold' : 'bg-[#071112] text-[#8E9F9B] hover:text-[#F1F5F0]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Members Table */}
      <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead>
              <tr className="border-b border-[rgba(220,255,245,0.1)] text-[#8E9F9B] bg-[#071112]/50">
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Current Plan</th>
                <th className="py-3 px-4">Subscription Status</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(220,255,245,0.05)]">
              {filteredMembers.map((m) => {
                const sub = subscriptions.find((s) => s.member_id === m.id);
                return (
                  <tr key={m.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#F1F5F0]">{m.full_name}</div>
                      <div className="text-[11px] text-[#8E9F9B]">{m.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={m.role} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-[#F1F5F0]">
                      {sub?.membership_plans?.name || 'No Plan'}
                    </td>
                    <td className="py-3 px-4">
                      {sub ? <Badge status={sub.status} size="sm" /> : <span className="text-[#8E9F9B]">—</span>}
                    </td>
                    <td className="py-3 px-4 text-[#8E9F9B]">
                      {new Date(m.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedMember(m)}
                        className="px-2.5 py-1 rounded bg-[#071112] hover:bg-[#8DFFCB]/20 text-[#8DFFCB] border border-[rgba(220,255,245,0.15)] transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MEMBER DETAIL MODAL */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.2)] max-w-2xl w-full p-6 space-y-6 animate-in fade-in zoom-in-95 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(220,255,245,0.1)]">
              <div>
                <h2 className="text-lg font-bold text-[#F1F5F0]">{selectedMember.full_name}</h2>
                <p className="text-[11px] text-[#8E9F9B]">{selectedMember.email}</p>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-[#8E9F9B] hover:text-[#F1F5F0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Subscription Section */}
            <div className="p-4 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.1)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[#8DFFCB] font-bold flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5" />
                  Active Subscription Record
                </span>
                {memberSub ? <Badge status={memberSub.status} size="sm" /> : <span>None</span>}
              </div>

              {memberSub ? (
                <div className="grid grid-cols-2 gap-3 text-[#F1F5F0]">
                  <div>
                    <span className="text-[#8E9F9B]">Plan: </span>
                    {memberSub.membership_plans?.name}
                  </div>
                  <div>
                    <span className="text-[#8E9F9B]">Billing Cycle: </span>
                    <span className="capitalize">{memberSub.billing_cycle}</span>
                  </div>
                  <div>
                    <span className="text-[#8E9F9B]">Committed Price: </span>
                    {memberSub.currency} {memberSub.price_at_signup}
                  </div>
                  <div>
                    <span className="text-[#8E9F9B]">Current Period End: </span>
                    {new Date(memberSub.current_period_end).toLocaleDateString()}
                  </div>
                </div>
              ) : (
                <p className="text-[#8E9F9B]">This member currently holds no subscription.</p>
              )}
            </div>

            {/* Invoices History */}
            <div className="space-y-2">
              <span className="text-[#8DFFCB] font-bold flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                Invoices & Payment History
              </span>
              <div className="space-y-1.5">
                {memberInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3 rounded-lg bg-[#071112] border border-[rgba(220,255,245,0.06)] flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-[#F1F5F0]">{inv.invoice_number}</div>
                      <div className="text-[10px] text-[#8E9F9B]">
                        Issued: {new Date(inv.issued_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#F1F5F0] font-bold">
                        {inv.currency} {Number(inv.total_amount).toLocaleString()}
                      </span>
                      <Badge status={inv.status} size="sm" />
                    </div>
                  </div>
                ))}
                {memberInvoices.length === 0 && (
                  <p className="text-[#8E9F9B] py-2">No invoices recorded for this member.</p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[rgba(220,255,245,0.1)] flex justify-end">
              <button
                onClick={() => setSelectedMember(null)}
                className="px-4 py-2 rounded-lg bg-[#8DFFCB] text-[#071112] font-bold hover:bg-[#A6FFD8]"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
