import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Repeat, 
  CreditCard, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Calendar, 
  ArrowUpRight,
  ShieldCheck,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';
import { 
  fetchSubscriptions, 
  fetchMembers, 
  fetchInvoices, 
  fetchPlans, 
  fetchAuditLogs, 
  fetchExpiringSoon 
} from '../lib/supabase';
import type { Subscription, Profile, Invoice, MembershipPlan, AuditLog, ExpiringSoonView } from '../types/database';
import { Badge } from '../components/common/Badge';

export const DashboardPage: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [expiringSoon, setExpiringSoon] = useState<ExpiringSoonView[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([
      fetchSubscriptions(),
      fetchMembers(),
      fetchInvoices(),
      fetchPlans(),
      fetchAuditLogs(),
      fetchExpiringSoon(),
    ])
      .then(([subs, mems, invs, pls, logs, expiring]) => {
        setSubscriptions(subs);
        setMembers(mems);
        setInvoices(invs);
        setPlans(pls);
        setAuditLogs(logs);
        setExpiringSoon(expiring);
      })
      .catch((err) => console.error('Dashboard fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  // Compute live KPI aggregates from database records
  const activeSubs = subscriptions.filter((s) => s.status === 'active');
  const pastDueSubs = subscriptions.filter((s) => s.status === 'past_due');
  const overdueInvoices = invoices.filter((i) => i.status === 'overdue' || (i.status === 'open' && i.due_at && new Date(i.due_at) < new Date()));
  
  // Calculate normalized Monthly Recurring Revenue (MRR)
  const estimatedMRR = activeSubs.reduce((acc, sub) => {
    const monthlyRate = sub.billing_cycle === 'yearly' ? sub.price_at_signup / 12 : sub.price_at_signup;
    return acc + Number(monthlyRate);
  }, 0);

  const totalCollectedRevenue = invoices
    .filter((i) => i.status === 'paid')
    .reduce((acc, i) => acc + Number(i.total_amount), 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[rgba(220,255,245,0.1)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F1F5F0]">Executive Overview</h1>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#8DFFCB]/10 text-[#8DFFCB] border border-[#8DFFCB]/20">
              Live PostgreSQL Metrics
            </span>
          </div>
          <p className="text-xs text-[#8E9F9B] mt-1 font-mono">
            System status: Operational • Normalized Relational Data Model Active
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('plans')}
            className="px-3.5 py-2 rounded-lg bg-[#0D1919] border border-[rgba(220,255,245,0.2)] text-xs font-mono text-[#F1F5F0] hover:border-[#8DFFCB]/40 transition-colors"
          >
            Manage Plans
          </button>
          <button
            onClick={() => onNavigate('renewals')}
            className="px-3.5 py-2 rounded-lg bg-[#8DFFCB] text-[#071112] text-xs font-mono font-bold hover:bg-[#A6FFD8] transition-all shadow-[0_0_15px_rgba(141,255,203,0.25)]"
          >
            Renewal Radar
          </button>
        </div>
      </div>

      {/* KPI STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Subscriptions */}
        <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-[#8E9F9B]">
            <span>ACTIVE SUBSCRIPTIONS</span>
            <Repeat className="w-4 h-4 text-[#8DFFCB]" />
          </div>
          <div className="text-3xl font-bold font-mono text-[#F1F5F0]">
            {loading ? '—' : activeSubs.length}
          </div>
          <div className="text-[11px] text-[#8DFFCB] font-mono flex items-center gap-1">
            <span>{subscriptions.length} total across all statuses</span>
          </div>
        </div>

        {/* Estimated MRR */}
        <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-[#8E9F9B]">
            <span>ESTIMATED MRR</span>
            <TrendingUp className="w-4 h-4 text-[#8DFFCB]" />
          </div>
          <div className="text-3xl font-bold font-mono text-[#8DFFCB]">
            {loading ? '—' : `₹${Math.round(estimatedMRR).toLocaleString()}`}
          </div>
          <div className="text-[11px] text-[#8E9F9B] font-mono">
            Normalized monthly recurring volume
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-[#8E9F9B]">
            <span>EXPIRING SOON (30D)</span>
            <Clock className="w-4 h-4 text-cyan-300" />
          </div>
          <div className="text-3xl font-bold font-mono text-cyan-300">
            {loading ? '—' : expiringSoon.length}
          </div>
          <div className="text-[11px] text-[#8E9F9B] font-mono">
            Renewal Radar window
          </div>
        </div>

        {/* Past Due / Attention */}
        <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-[#8E9F9B]">
            <span>ATTENTION QUEUE</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-rose-300">
            {loading ? '—' : pastDueSubs.length + overdueInvoices.length}
          </div>
          <div className="text-[11px] text-rose-300/80 font-mono">
            {pastDueSubs.length} past-due subs, {overdueInvoices.length} overdue invoices
          </div>
        </div>
      </div>

      {/* TWO COLUMN ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Upcoming Renewals (Renewal Radar Mini) */}
        <div className="lg:col-span-7 rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(220,255,245,0.08)]">
            <div className="flex items-center gap-2 text-xs font-mono text-[#F1F5F0]">
              <Calendar className="w-4 h-4 text-[#8DFFCB]" />
              <span className="font-semibold">Upcoming Renewals (Next 30 Days)</span>
            </div>
            <button
              onClick={() => onNavigate('renewals')}
              className="text-xs font-mono text-[#8DFFCB] hover:underline flex items-center gap-1"
            >
              View Radar <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left">
              <thead>
                <tr className="border-b border-[rgba(220,255,245,0.06)] text-[#8E9F9B]">
                  <th className="py-2 px-2">Member</th>
                  <th className="py-2 px-2">Plan</th>
                  <th className="py-2 px-2">Status</th>
                  <th className="py-2 px-2 text-right">Days Left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(220,255,245,0.04)]">
                {expiringSoon.slice(0, 5).map((item) => (
                  <tr key={item.subscription_id} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-2">
                      <div className="font-semibold text-[#F1F5F0]">{item.full_name}</div>
                      <div className="text-[10px] text-[#8E9F9B]">{item.email}</div>
                    </td>
                    <td className="py-2.5 px-2 text-[#F1F5F0]">{item.plan_name}</td>
                    <td className="py-2.5 px-2">
                      <Badge status={item.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-2 text-right font-bold text-[#8DFFCB]">
                      {item.days_remaining}d
                    </td>
                  </tr>
                ))}
                {expiringSoon.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-[#8E9F9B]">
                      No subscriptions expiring in the next 30 days.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Plan Distribution & Revenue Stats */}
        <div className="lg:col-span-5 rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(220,255,245,0.08)]">
            <div className="flex items-center gap-2 text-xs font-mono text-[#F1F5F0]">
              <Layers className="w-4 h-4 text-[#8DFFCB]" />
              <span className="font-semibold">Active Plan Distribution</span>
            </div>
            <button
              onClick={() => onNavigate('plans')}
              className="text-xs font-mono text-[#8DFFCB] hover:underline"
            >
              Plans
            </button>
          </div>

          <div className="space-y-3">
            {plans.filter((p) => p.status === 'active').map((plan) => {
              const subCount = subscriptions.filter((s) => s.plan_id === plan.id && s.status === 'active').length;
              const percent = activeSubs.length > 0 ? (subCount / activeSubs.length) * 100 : 0;

              return (
                <div key={plan.id} className="space-y-1 text-xs font-mono">
                  <div className="flex items-center justify-between text-[#F1F5F0]">
                    <span>{plan.name}</span>
                    <span className="text-[#8DFFCB]">{subCount} active ({Math.round(percent)}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#071112] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#8DFFCB] to-[#D9FF72] rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-[rgba(220,255,245,0.08)] space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-[#8E9F9B]">
              <span>Total Settled Invoices Volume:</span>
              <span className="font-bold text-[#F1F5F0]">₹{totalCollectedRevenue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-[#8E9F9B]">
              <span>Verified Invoices Count:</span>
              <span className="text-[#F1F5F0]">{invoices.length} invoices</span>
            </div>
          </div>
        </div>
      </div>

      {/* AUDIT LOG TIMELINE */}
      <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(220,255,245,0.08)]">
          <div className="flex items-center gap-2 text-xs font-mono text-[#F1F5F0]">
            <Activity className="w-4 h-4 text-[#8DFFCB]" />
            <span className="font-semibold">Recent Database Audit Trail</span>
          </div>
          <span className="text-[10px] font-mono text-[#8E9F9B]">PostgreSQL Append-Only Log</span>
        </div>

        <div className="space-y-3">
          {auditLogs.slice(0, 5).map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-3 rounded-lg bg-[#071112] border border-[rgba(220,255,245,0.06)] text-xs font-mono"
            >
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8DFFCB]" />
                <div>
                  <span className="font-bold text-[#8DFFCB] uppercase">{log.action}</span>
                  <span className="text-[#8E9F9B] ml-2">on {log.entity_type} ({log.entity_id?.slice(0, 8)}...)</span>
                </div>
              </div>
              <div className="text-[10px] text-[#8E9F9B]">
                {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString()}
              </div>
            </div>
          ))}
          {auditLogs.length === 0 && !loading && (
            <div className="py-4 text-center text-xs font-mono text-[#8E9F9B]">
              No audit records recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
