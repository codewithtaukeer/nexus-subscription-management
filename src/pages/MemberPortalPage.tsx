import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Repeat, 
  CreditCard, 
  Calendar, 
  Clock, 
  Check, 
  ArrowRight, 
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  supabase, 
  fetchSubscriptions, 
  fetchInvoices, 
  fetchPlans, 
  simulatePaymentRpc 
} from '../lib/supabase';
import type { Subscription, Invoice, MembershipPlan } from '../types/database';
import { Badge } from '../components/common/Badge';

export const MemberPortalPage: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [payMessage, setPayMessage] = useState<string | null>(null);

  const loadMemberData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [allSubs, allInvs, allPlans] = await Promise.all([
        fetchSubscriptions(),
        fetchInvoices(),
        fetchPlans(),
      ]);

      const mySub = allSubs.find((s) => s.member_id === currentUser.id) || null;
      const myInvs = allInvs.filter((i) => i.member_id === currentUser.id);

      setSubscription(mySub);
      setInvoices(myInvs);
      setPlans(allPlans.filter((p) => p.status === 'active'));
    } catch (err) {
      console.error('Error fetching member portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemberData();
  }, [currentUser]);

  const handlePayInvoice = async (invoiceId: string) => {
    try {
      const res = await simulatePaymentRpc({
        invoiceId,
        simulateSuccess: true,
        methodLabel: 'Demo Member UPI AutoPay',
      });
      setPayMessage('Payment successful! Your invoice is settled and subscription active.');
      setTimeout(() => setPayMessage(null), 4000);
      loadMemberData();
    } catch (err: any) {
      alert('Error processing payment: ' + err.message);
    }
  };

  const handleCancelRequest = async () => {
    if (!subscription) return;
    const confirm = window.confirm('Are you sure you want to cancel your active membership at the end of the current billing cycle?');
    if (!confirm) return;

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);

      if (error) throw error;
      setPayMessage('Cancellation requested. You will retain full access until your current period ends.');
      setTimeout(() => setPayMessage(null), 4000);
      loadMemberData();
    } catch (err: any) {
      alert('Could not cancel: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[rgba(220,255,245,0.1)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F1F5F0]">
              Welcome, {currentUser?.full_name}
            </h1>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#8DFFCB]/10 text-[#8DFFCB] border border-[#8DFFCB]/20">
              Member Self-Service
            </span>
          </div>
          <p className="text-xs text-[#8E9F9B] mt-1 font-mono">
            Manage your plan, review settled invoices, and check feature usage limits.
          </p>
        </div>

        <button
          onClick={() => onNavigate('plans')}
          className="px-4 py-2 rounded-lg bg-[#8DFFCB] text-[#071112] text-xs font-mono font-bold hover:bg-[#A6FFD8] transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(141,255,203,0.25)]"
        >
          <span>Upgrade Plan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {payMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{payMessage}</span>
        </div>
      )}

      {/* ACTIVE SUBSCRIPTION OVERVIEW */}
      <div className="rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.15)] p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[rgba(220,255,245,0.08)]">
          <div className="flex items-center gap-2 text-xs font-mono text-[#F1F5F0]">
            <Repeat className="w-4 h-4 text-[#8DFFCB]" />
            <span className="font-bold text-sm">Your Current Membership</span>
          </div>
          {subscription ? (
            <Badge status={subscription.status} size="md" />
          ) : (
            <span className="text-xs font-mono text-[#8E9F9B]">No Active Plan</span>
          )}
        </div>

        {subscription ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
            <div className="p-4 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.08)] space-y-1">
              <div className="text-[10px] text-[#8E9F9B]">PLAN TIER</div>
              <div className="text-xl font-bold text-[#F1F5F0]">
                {subscription.membership_plans?.name}
              </div>
              <div className="text-[#8DFFCB]">
                {subscription.currency} {subscription.price_at_signup} / {subscription.billing_cycle === 'yearly' ? 'yr' : 'mo'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.08)] space-y-1">
              <div className="text-[10px] text-[#8E9F9B]">NEXT RENEWAL DATE</div>
              <div className="text-xl font-bold text-[#F1F5F0]">
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </div>
              <div className="text-[#8E9F9B]">
                {subscription.auto_renew ? 'Auto-renew enabled' : 'Auto-renew disabled'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.08)] space-y-1">
              <div className="text-[10px] text-[#8E9F9B]">MEMBERSHIP ACTIONS</div>
              <div className="pt-2 flex flex-col gap-2">
                {!subscription.cancel_at_period_end ? (
                  <button
                    onClick={handleCancelRequest}
                    className="w-full py-1.5 rounded bg-[#071112] text-rose-300 hover:bg-rose-950/40 border border-rose-500/30 text-left px-3 text-[11px]"
                  >
                    Cancel at Period End
                  </button>
                ) : (
                  <span className="text-amber-400 text-[11px]">
                    ✓ Scheduled to end on {new Date(subscription.current_period_end).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-xs font-mono text-[#8E9F9B] space-y-3">
            <p>You do not have an active membership subscription yet.</p>
            <button
              onClick={() => onNavigate('plans')}
              className="px-4 py-2 rounded-lg bg-[#8DFFCB] text-[#071112] font-bold"
            >
              Choose a Membership Plan
            </button>
          </div>
        )}
      </div>

      {/* MEMBER INVOICES LIST */}
      <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(220,255,245,0.08)] font-mono text-xs">
          <div className="flex items-center gap-2 text-[#F1F5F0]">
            <CreditCard className="w-4 h-4 text-[#8DFFCB]" />
            <span className="font-semibold">Your Invoices & Receipts</span>
          </div>
          <span className="text-[#8E9F9B]">{invoices.length} invoices found</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead>
              <tr className="border-b border-[rgba(220,255,245,0.08)] text-[#8E9F9B]">
                <th className="py-2.5 px-3">Invoice Number</th>
                <th className="py-2.5 px-3">Billing Period</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(220,255,245,0.04)]">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-3 text-[#8DFFCB] font-semibold">{inv.invoice_number}</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">
                    {new Date(inv.period_start).toLocaleDateString()} – {new Date(inv.period_end).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-3 text-[#F1F5F0] font-bold">
                    {inv.currency} {Number(inv.total_amount).toLocaleString()}
                  </td>
                  <td className="py-3 px-3">
                    <Badge status={inv.status} size="sm" />
                  </td>
                  <td className="py-3 px-3 text-right">
                    {inv.status !== 'paid' ? (
                      <button
                        onClick={() => handlePayInvoice(inv.id)}
                        className="px-3 py-1 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/60 font-bold"
                      >
                        Pay Invoice (Demo)
                      </button>
                    ) : (
                      <span className="text-emerald-400 font-semibold">✓ Settled</span>
                    )}
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[#8E9F9B]">
                    No invoices generated yet for your account.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
