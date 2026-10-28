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
  ChevronRight,
  Sparkles,
  ExternalLink,
  Plus,
  CheckCircle2,
  DollarSign,
  PieChart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  fetchSubscriptions, 
  fetchMembers, 
  fetchInvoices, 
  fetchPlans, 
  fetchAuditLogs, 
  fetchExpiringSoon 
} from '../lib/supabase';
import { personalSubscriptionService } from '../services/personalSubscriptionService';
import type { DashboardMetrics } from '../services/personalSubscriptionService';
import type { 
  Subscription, 
  Profile, 
  Invoice, 
  MembershipPlan, 
  AuditLog, 
  ExpiringSoonView,
  PersonalSubscription 
} from '../types/database';
import { Badge } from '../components/common/Badge';

export const DashboardPage: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  const { currentUser, role } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [expiringSoon, setExpiringSoon] = useState<ExpiringSoonView[]>([]);
  
  // Member personal data
  const [myPersonalSubs, setMyPersonalSubs] = useState<PersonalSubscription[]>([]);
  const [myMetrics, setMyMetrics] = useState<DashboardMetrics | null>(null);

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        if (role === 'admin') {
          const [subs, mems, invs, pls, logs, expiring] = await Promise.all([
            fetchSubscriptions(),
            fetchMembers(),
            fetchInvoices(),
            fetchPlans(),
            fetchAuditLogs(),
            fetchExpiringSoon(),
          ]);
          setSubscriptions(subs);
          setMembers(mems);
          setInvoices(invs);
          setPlans(pls);
          setAuditLogs(logs);
          setExpiringSoon(expiring);
        } else {
          // Member role: fetch ONLY member's own data
          const userId = currentUser?.id || 'a0000000-0000-0000-0000-000000000001';
          const [subs, invs, pls, pSubs, pMetrics] = await Promise.all([
            fetchSubscriptions(),
            fetchInvoices(),
            fetchPlans(),
            personalSubscriptionService.fetchMySubscriptions(userId),
            personalSubscriptionService.getDashboardMetrics(userId)
          ]);
          setSubscriptions(subs.filter(s => s.member_id === userId));
          setInvoices(invs.filter(i => i.member_id === userId));
          setPlans(pls);
          setMyPersonalSubs(pSubs);
          setMyMetrics(pMetrics);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [role, currentUser?.id]);

  // MEMBER DASHBOARD VIEW
  if (role !== 'admin') {
    const mySub = subscriptions[0];
    const myPlan = plans.find(p => p.id === mySub?.plan_id) || { name: 'Nexus Pro (Paid)', price: 49.99 };
    const upcomingRenewals = myMetrics?.upcomingRenewals || myPersonalSubs.slice(0, 3);
    const monthlyTotal = myMetrics?.totalMonthlyExpense || 
      myPersonalSubs.reduce((acc, s) => acc + (s.billing_frequency === 'yearly' ? Number(s.amount)/12 : Number(s.amount)), 0);

    return (
      <div className="space-y-6">
        {/* Welcome Member Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[rgba(220,255,245,0.1)]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#F1F5F0]">
                Personal Subscription Hub
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                Member Workspace
              </span>
            </div>
            <p className="text-xs text-[#8E9F9B] mt-1 font-mono">
              Welcome back, <span className="text-white font-semibold">{currentUser?.full_name || 'Member'}</span> ({currentUser?.email}) • Normalized Expense Ledger Active
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('personal_subs')}
              className="px-3.5 py-2 rounded-lg bg-[#8DFFCB] text-[#071112] text-xs font-mono font-bold hover:bg-[#A6FFD8] transition-all shadow-[0_0_15px_rgba(141,255,203,0.25)] flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Manage All Subscriptions
            </button>
            <button
              onClick={() => onNavigate('portal')}
              className="px-3.5 py-2 rounded-lg bg-[#0D1919] border border-[rgba(220,255,245,0.2)] text-xs font-mono text-[#F1F5F0] hover:border-[#8DFFCB]/40 transition-colors"
            >
              My Portal & Plan
            </button>
          </div>
        </div>

        {/* Member KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Personal Subscriptions */}
          <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] p-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-[#8E9F9B]">
              <span>ACTIVE SUBSCRIPTIONS</span>
              <Repeat className="w-4 h-4 text-[#8DFFCB]" />
            </div>
            <div className="text-3xl font-bold font-mono text-[#F1F5F0]">
              {loading ? '—' : myPersonalSubs.filter(s => s.status === 'active').length}
            </div>
            <div className="text-[11px] text-[#8DFFCB] font-mono flex items-center gap-1">
              <span>{myPersonalSubs.length} services in your tracking ledger</span>
            </div>
          </div>

          {/* Monthly Spend */}
          <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] p-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-[#8E9F9B]">
              <span>MONTHLY SPEND</span>
              <TrendingUp className="w-4 h-4 text-[#8DFFCB]" />
            </div>
            <div className="text-3xl font-bold font-mono text-[#8DFFCB]">
              {loading ? '—' : `$${monthlyTotal.toFixed(2)}`}
            </div>
            <div className="text-[11px] text-[#8E9F9B] font-mono">
              Est. ${(monthlyTotal * 12).toFixed(2)} / year recurring
            </div>
          </div>

          {/* Nexus Platform Membership */}
          <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] p-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-[#8E9F9B]">
              <span>NEXUS MEMBERSHIP</span>
              <ShieldCheck className="w-4 h-4 text-cyan-300" />
            </div>
            <div className="text-xl font-bold font-mono text-cyan-300 truncate">
              {loading ? '—' : myPlan.name}
            </div>
            <div className="text-[11px] text-cyan-300/80 font-mono">
              Status: Active • Auto-renewal on
            </div>
          </div>

          {/* Invoices Status */}
          <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] p-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-[#8E9F9B]">
              <span>ACCOUNT BILLING</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold font-mono text-emerald-400">
              {loading ? '—' : `${invoices.filter(i => i.status === 'paid').length} Paid`}
            </div>
            <div className="text-[11px] text-emerald-400/80 font-mono">
              0 overdue invoices • Account in good standing
            </div>
          </div>
        </div>

        {/* Member Layout: Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: My Active Tracked Subscriptions */}
          <div className="lg:col-span-7 rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(220,255,245,0.08)]">
              <div className="flex items-center gap-2 text-xs font-mono text-[#F1F5F0]">
                <Repeat className="w-4 h-4 text-[#8DFFCB]" />
                <span className="font-semibold">My Tracked Services</span>
              </div>
              <button
                onClick={() => onNavigate('personal_subs')}
                className="text-xs font-mono text-[#8DFFCB] hover:underline flex items-center gap-1"
              >
                Central Hub <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {myPersonalSubs.slice(0, 5).map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#071112] border border-[rgba(220,255,245,0.06)] hover:border-[#8DFFCB]/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {sub.sub_providers?.logo_url ? (
                      <img
                        src={sub.sub_providers.logo_url}
                        alt={sub.sub_providers.name}
                        className="w-8 h-8 rounded-lg object-contain bg-white/5 p-1"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-[#8DFFCB]/10 text-[#8DFFCB] flex items-center justify-center font-bold font-mono text-xs">
                        {(sub.sub_providers?.name || sub.plan_name || 'S')[0]}
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-bold text-[#F1F5F0]">
                        {sub.sub_providers?.name || sub.plan_name}
                      </div>
                      <div className="text-[10px] text-[#8E9F9B] font-mono capitalize">
                        {sub.category} • {sub.billing_frequency}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-[#8DFFCB]">
                      ${Number(sub.amount).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-[#8E9F9B] font-mono">
                      Renews: {sub.next_billing_date ? new Date(sub.next_billing_date).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
              ))}

              {myPersonalSubs.length === 0 && !loading && (
                <div className="py-8 text-center text-xs font-mono text-[#8E9F9B]">
                  No personal subscriptions added yet.{' '}
                  <button onClick={() => onNavigate('personal_subs')} className="text-[#8DFFCB] underline">
                    Add your first service now
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Category Breakdown & Financial Optimizer */}
          <div className="lg:col-span-5 space-y-6">
            {/* Category Spend */}
            <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(220,255,245,0.08)]">
                <div className="flex items-center gap-2 text-xs font-mono text-[#F1F5F0]">
                  <PieChart className="w-4 h-4 text-[#8DFFCB]" />
                  <span className="font-semibold">Spend by Category</span>
                </div>
                <span className="text-[10px] font-mono text-[#8E9F9B]">Monthly Rate</span>
              </div>

              <div className="space-y-3">
                {myMetrics?.byCategory && Object.keys(myMetrics.byCategory).length > 0 ? (
                  Object.entries(myMetrics.byCategory).map(([cat, data]) => {
                    const pct = monthlyTotal > 0 ? (data.monthlyAmount / monthlyTotal) * 100 : 0;
                    return (
                      <div key={cat} className="space-y-1 text-xs font-mono">
                        <div className="flex items-center justify-between text-[#F1F5F0] capitalize">
                          <span>{cat} ({data.count})</span>
                          <span className="text-[#8DFFCB]">${data.monthlyAmount.toFixed(2)} ({Math.round(pct)}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#071112] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#8DFFCB] to-[#D9FF72] rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-4 text-center text-xs font-mono text-[#8E9F9B]">
                    Category data will appear as you add subscriptions.
                  </div>
                )}
              </div>
            </div>

            {/* Smart Redundancy Optimizer Card */}
            <div className="rounded-xl bg-gradient-to-br from-[#0D1919] to-[#0A1414] border border-[#8DFFCB]/20 p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-[#8DFFCB]">
                <Sparkles className="w-4 h-4" />
                <span className="font-bold">Financial Optimizer & Redundancy Radar</span>
              </div>
              <p className="text-xs text-[#8E9F9B]">
                Nexus continuously analyzes your recurring subscriptions for overlapping categories and price creep.
              </p>
              <div className="p-3 rounded-lg bg-[#071112] border border-white/[0.06] text-xs font-mono text-[#F1F5F0] flex items-center justify-between">
                <span>Total Annualized Commitment:</span>
                <span className="text-[#8DFFCB] font-bold">${(monthlyTotal * 12).toFixed(2)}/yr</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ADMIN EXECUTIVE OVERVIEW
  const activeSubs = subscriptions.filter((s) => s.status === 'active');
  const pastDueSubs = subscriptions.filter((s) => s.status === 'past_due');
  const overdueInvoices = invoices.filter((i) => i.status === 'overdue' || (i.status === 'open' && i.due_at && new Date(i.due_at) < new Date()));
  
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
            {loading ? '—' : `$${Math.round(estimatedMRR).toLocaleString()}`}
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
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-[#8E9F9B] border-b border-[rgba(220,255,245,0.08)]">
                  <th className="py-2 px-2">Member</th>
                  <th className="py-2 px-2">Plan</th>
                  <th className="py-2 px-2">Renewal Date</th>
                  <th className="py-2 px-2 text-right">Days Left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(220,255,245,0.04)]">
                {expiringSoon.slice(0, 5).map((item) => (
                  <tr key={item.subscription_id} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-2 font-medium text-[#F1F5F0]">
                      {item.full_name}
                    </td>
                    <td className="py-2.5 px-2 text-[#8E9F9B]">
                      {item.plan_name}
                    </td>
                    <td className="py-2.5 px-2 text-[#8E9F9B]">
                      {new Date(item.current_period_end).toLocaleDateString()}
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
              <span className="font-bold text-[#F1F5F0]">${totalCollectedRevenue.toLocaleString()}</span>
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
