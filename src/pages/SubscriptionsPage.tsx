import React, { useState, useEffect } from 'react';
import { 
  Repeat, 
  Search, 
  Play, 
  Pause, 
  XCircle, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { supabase, fetchSubscriptions } from '../lib/supabase';
import type { Subscription, SubscriptionStatus } from '../types/database';
import { Badge } from '../components/common/Badge';

export const SubscriptionsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | SubscriptionStatus>('all');
  const [search, setSearch] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const data = await fetchSubscriptions();
      setSubscriptions(data);
    } catch (err) {
      console.error('Error loading subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const handleStatusTransition = async (
    subId: string, 
    newStatus: SubscriptionStatus, 
    actionName: string,
    extraUpdates: Record<string, any> = {}
  ) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: newStatus,
          ...extraUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subId);

      if (error) throw error;

      setActionSuccess(`Subscription state transitioned to "${newStatus}" (${actionName}). Trigger recorded lifecycle event.`);
      setTimeout(() => setActionSuccess(null), 4000);
      loadSubscriptions();
    } catch (err: any) {
      alert('Could not update status: ' + err.message);
    }
  };

  const filteredSubs = subscriptions.filter((s) => {
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const memberName = s.profiles?.full_name?.toLowerCase() || '';
    const memberEmail = s.profiles?.email?.toLowerCase() || '';
    const planName = s.membership_plans?.name?.toLowerCase() || '';
    const matchesSearch = memberName.includes(search.toLowerCase()) || 
                          memberEmail.includes(search.toLowerCase()) || 
                          planName.includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[rgba(220,255,245,0.1)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F1F5F0]">Subscription Lifecycle</h1>
          <p className="text-xs text-[#8E9F9B] mt-1 font-mono">
            State machine enforcement: trialing, active, past_due, paused, cancelled, and expired.
          </p>
        </div>

        <button
          onClick={loadSubscriptions}
          className="px-3 py-1.5 rounded-lg bg-[#0D1919] border border-[rgba(220,255,245,0.15)] text-xs font-mono text-[#8DFFCB] hover:border-[#8DFFCB]/40 transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Records</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0D1919] p-4 rounded-xl border border-[rgba(220,255,245,0.12)]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#8E9F9B] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search member, email, or plan..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#071112] border border-[rgba(220,255,245,0.15)] text-xs text-[#F1F5F0] placeholder-[#8E9F9B] focus:outline-none focus:border-[#8DFFCB]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <span className="text-[#8E9F9B] mr-1">Status:</span>
          {(['all', 'active', 'trialing', 'past_due', 'paused', 'cancelled', 'expired'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                statusFilter === st ? 'bg-[#8DFFCB] text-[#071112] font-bold' : 'bg-[#071112] text-[#8E9F9B] hover:text-[#F1F5F0]'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table of Subscriptions */}
      <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead>
              <tr className="border-b border-[rgba(220,255,245,0.1)] text-[#8E9F9B] bg-[#071112]/50">
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Plan & Snapshot Price</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Cycle</th>
                <th className="py-3 px-4">Period End</th>
                <th className="py-3 px-4 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(220,255,245,0.05)]">
              {filteredSubs.map((sub) => (
                <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#F1F5F0]">
                      {sub.profiles?.full_name || 'Member'}
                    </div>
                    <div className="text-[11px] text-[#8E9F9B]">{sub.profiles?.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-[#F1F5F0] font-medium">{sub.membership_plans?.name}</div>
                    <div className="text-[11px] text-[#8DFFCB]">
                      {sub.currency} {sub.price_at_signup} / {sub.billing_cycle === 'yearly' ? 'yr' : 'mo'}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge status={sub.status} size="sm" />
                    {sub.cancel_at_period_end && (
                      <div className="text-[10px] text-amber-400 mt-1">Cancels at period end</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[#8E9F9B] capitalize">{sub.billing_cycle}</td>
                  <td className="py-3 px-4 text-[#8E9F9B]">
                    {new Date(sub.current_period_end).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5">
                    {sub.status === 'active' && (
                      <button
                        onClick={() => handleStatusTransition(sub.id, 'paused', 'Pause Subscription')}
                        className="px-2 py-1 rounded bg-[#071112] text-amber-300 hover:bg-amber-950/40 border border-amber-500/30"
                      >
                        Pause
                      </button>
                    )}

                    {sub.status === 'paused' && (
                      <button
                        onClick={() => handleStatusTransition(sub.id, 'active', 'Resume Subscription')}
                        className="px-2 py-1 rounded bg-[#071112] text-emerald-300 hover:bg-emerald-950/40 border border-emerald-500/30"
                      >
                        Resume
                      </button>
                    )}

                    {['active', 'past_due', 'paused'].includes(sub.status) && (
                      <button
                        onClick={() =>
                          handleStatusTransition(sub.id, 'cancelled', 'Cancel Now', {
                            cancelled_at: new Date().toISOString(),
                            ended_at: new Date().toISOString(),
                          })
                        }
                        className="px-2 py-1 rounded bg-[#071112] text-rose-300 hover:bg-rose-950/40 border border-rose-500/30"
                      >
                        Cancel Now
                      </button>
                    )}

                    {['cancelled', 'expired'].includes(sub.status) && (
                      <button
                        onClick={() => handleStatusTransition(sub.id, 'active', 'Reactivate')}
                        className="px-2 py-1 rounded bg-[#071112] text-[#8DFFCB] hover:bg-[#8DFFCB]/20 border border-[#8DFFCB]/30"
                      >
                        Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
