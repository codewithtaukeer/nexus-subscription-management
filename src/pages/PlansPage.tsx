import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Layers, 
  Archive, 
  Check, 
  X, 
  Search, 
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Sparkles,
  Zap,
  Lock,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { supabase, fetchPlans } from '../lib/supabase';
import type { MembershipPlan, PlanFeature, PlanStatus } from '../types/database';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { DemoCheckoutModal } from '../components/common/DemoCheckoutModal';

export const PlansPage: React.FC = () => {
  const { role, isPremium, activePlanSlug, currentUser } = useAuth();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PlanStatus>('active');
  
  // Checkout Modal State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<MembershipPlan | null>(null);

  // Admin Plan Creation Dialog state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    slug: '',
    description: '',
    price_monthly: 2499,
    price_yearly: 24990,
    trial_days: 7,
    status: 'active' as PlanStatus,
  });
  const [featuresList, setFeaturesList] = useState<Array<{ key: string; label: string; limit?: number; unit?: string }>>([
    { key: 'api_calls', label: 'API Queries / Month', limit: 100000, unit: 'req/mo' },
    { key: 'storage', label: 'Vector Storage', limit: 50, unit: 'GB' },
    { key: 'ml_churn', label: 'Real-time Churn Intelligence', limit: 0, unit: 'Included' },
  ]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const data = await fetchPlans();
      setPlans(data);
    } catch (err) {
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setPlanForm({
      name: '',
      slug: '',
      description: '',
      price_monthly: 2499,
      price_yearly: 24990,
      trial_days: 7,
      status: 'active',
    });
    setFeaturesList([
      { key: 'api_calls', label: 'API Queries / Month', limit: 100000, unit: 'req/mo' },
      { key: 'storage', label: 'Vector Storage', limit: 50, unit: 'GB' },
      { key: 'ml_churn', label: 'Real-time Churn Intelligence', limit: 0, unit: 'Included' },
    ]);
    setModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.name || !planForm.slug) return;

    try {
      const payload = {
        name: planForm.name,
        slug: planForm.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        description: planForm.description,
        price_monthly: Number(planForm.price_monthly),
        price_yearly: Number(planForm.price_yearly),
        trial_days: Number(planForm.trial_days),
        status: planForm.status,
      };

      let planId: string;

      if (editingPlan) {
        const { error } = await supabase
          .from('membership_plans')
          .update(payload)
          .eq('id', editingPlan.id);
        if (error) throw error;
        planId = editingPlan.id;
      } else {
        const { data, error } = await supabase
          .from('membership_plans')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        planId = data.id;

        // Insert normalized feature rows
        for (const [idx, f] of featuresList.entries()) {
          await supabase.from('plan_features').insert({
            plan_id: planId,
            feature_key: f.key,
            label: f.label,
            included: true,
            limit_value: f.limit || null,
            unit: f.unit || null,
            sort_order: idx + 1,
          });
        }
      }

      setModalOpen(false);
      setActionMessage('Plan saved successfully in PostgreSQL.');
      setTimeout(() => setActionMessage(null), 3000);
      loadPlans();
    } catch (err: any) {
      alert('Error saving plan: ' + err.message);
    }
  };

  const handleArchive = async (plan: MembershipPlan) => {
    try {
      const nextStatus = plan.status === 'archived' ? 'active' : 'archived';
      const { error } = await supabase
        .from('membership_plans')
        .update({ status: nextStatus })
        .eq('id', plan.id);

      if (error) throw error;

      setActionMessage(
        nextStatus === 'archived'
          ? `Plan "${plan.name}" archived safely. Existing subscriptions remain preserved.`
          : `Plan "${plan.name}" reactivated for new enrollments.`
      );
      setTimeout(() => setActionMessage(null), 4000);
      loadPlans();
    } catch (err: any) {
      alert('Could not update plan status: ' + err.message);
    }
  };

  const filteredPlans = plans.filter((p) => {
    if (role !== 'admin') {
      return p.status === 'active';
    }
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.slug.includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[rgba(220,255,245,0.1)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F1F5F0]">
            {role === 'admin' ? 'Plans & Entitlements Management' : 'Membership Plans & Pricing'}
          </h1>
          <p className="text-xs text-[#8E9F9B] mt-1 font-mono">
            {role === 'admin' 
              ? 'Configure subscription tiers, feature quotas, and billing cycle schemas in 3NF.'
              : 'Select your platform tier. Upgrade to Nexus Pro with a demo card to unlock live DBMS Studio and unlimited subscriptions.'}
          </p>
        </div>

        {/* Admin-only: New Plan creation button */}
        {role === 'admin' && (
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-lg bg-[#8DFFCB] text-[#071112] text-xs font-mono font-bold hover:bg-[#A6FFD8] transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(141,255,203,0.25)]"
          >
            <Plus className="w-4 h-4" />
            <span>New Plan</span>
          </button>
        )}
      </div>

      {actionMessage && (
        <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Admin-only: Filter & Search Bar */}
      {role === 'admin' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0D1919] p-4 rounded-xl border border-[rgba(220,255,245,0.12)]">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#8E9F9B] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search plans by name or slug..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#071112] border border-[rgba(220,255,245,0.15)] text-xs text-[#F1F5F0] placeholder-[#8E9F9B] focus:outline-none focus:border-[#8DFFCB]"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#8E9F9B]">Status:</span>
            {(['all', 'active', 'archived'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md capitalize transition-colors ${
                  statusFilter === st ? 'bg-[#8DFFCB] text-[#071112] font-bold' : 'bg-[#071112] text-[#8E9F9B] hover:text-[#F1F5F0]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto">
        {filteredPlans.map((plan) => {
          const isProPlan = plan.slug === 'nexus-pro' || Number(plan.price_monthly) > 0;
          const isUserActivePlan = isProPlan ? isPremium : !isPremium;

          return (
            <div
              key={plan.id}
              className={`rounded-2xl bg-[#0D1919] p-6 flex flex-col justify-between space-y-5 transition-all relative overflow-hidden ${
                isProPlan
                  ? 'border-2 border-[#8DFFCB]/40 shadow-[0_0_30px_rgba(141,255,203,0.12)] hover:border-[#8DFFCB]'
                  : 'border border-[rgba(220,255,245,0.12)] hover:border-[rgba(220,255,245,0.25)]'
              }`}
            >
              {isProPlan && (
                <div className="absolute top-0 right-0 bg-[#8DFFCB] text-[#071112] text-[10px] font-mono font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Recommended</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-[#F1F5F0]">{plan.name}</h3>
                  {role === 'admin' ? (
                    <Badge status={plan.status} size="sm" />
                  ) : (
                    isUserActivePlan && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-semibold">
                        Current Plan
                      </span>
                    )
                  )}
                </div>
                <div className="text-[11px] font-mono text-[#8DFFCB] mb-2">{plan.slug}</div>
                <p className="text-xs text-[#8E9F9B] min-h-[36px]">{plan.description}</p>

                <div className="my-5 p-4 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.08)] font-mono">
                  <div className="text-2xl font-extrabold text-[#F1F5F0]">
                    {plan.currency} {Number(plan.price_monthly).toLocaleString()}
                    <span className="text-xs font-normal text-[#8E9F9B]">/mo</span>
                  </div>
                  {plan.price_yearly && (
                    <div className="text-[11px] text-[#8E9F9B] mt-1">
                      Annual: {plan.currency} {Number(plan.price_yearly).toLocaleString()}/yr
                    </div>
                  )}
                  {plan.trial_days > 0 && (
                    <div className="text-[11px] text-[#8DFFCB] mt-1.5 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      <span>{plan.trial_days}-day complimentary trial included</span>
                    </div>
                  )}
                </div>

                {/* Feature list preview */}
                <div className="space-y-2 pt-3 border-t border-[rgba(220,255,245,0.08)]">
                  <div className="text-[10px] font-mono text-[#8E9F9B] uppercase tracking-wider">Feature Limits:</div>
                  {plan.features?.map((f) => (
                    <div key={f.id} className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#F1F5F0] flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#8DFFCB] shrink-0" />
                        <span>{f.label}</span>
                      </span>
                      <span className="text-[#8E9F9B] text-[11px]">
                        {f.limit_value ? `${f.limit_value} ${f.unit || ''}` : 'Included'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Bottom Actions */}
              <div className="pt-5 border-t border-[rgba(220,255,245,0.08)]">
                {role === 'admin' ? (
                  /* Admin Actions */
                  <div className="flex items-center justify-between text-xs font-mono">
                    <button
                      onClick={() => handleArchive(plan)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
                        plan.status === 'archived'
                          ? 'text-[#8DFFCB] hover:bg-[#8DFFCB]/10'
                          : 'text-amber-400 hover:bg-amber-400/10'
                      }`}
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>{plan.status === 'archived' ? 'Reactivate' : 'Archive Plan'}</span>
                    </button>
                    <span className="text-[11px] text-[#8E9F9B]">Admin Controls</span>
                  </div>
                ) : (
                  /* Member Actions: Buy / Upgrade with Demo Card */
                  <div>
                    {isProPlan ? (
                      isPremium ? (
                        <div className="w-full py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold text-center flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#8DFFCB]" />
                          <span>Active Nexus Pro Membership</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedPlanForCheckout(plan);
                            setCheckoutModalOpen(true);
                          }}
                          className="w-full py-3 px-4 rounded-xl bg-[#8DFFCB] hover:bg-[#A6FFD8] text-[#071112] font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(141,255,203,0.3)] hover:scale-[1.02]"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Buy with Demo Card</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )
                    ) : (
                      /* Free Plan */
                      <div className="w-full py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#8E9F9B] font-mono text-xs text-center">
                        {!isPremium ? 'Currently Active (Base Tier)' : 'Included in Pro'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* DEMO CARD CHECKOUT MODAL */}
      <DemoCheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        onSuccess={() => {
          setActionMessage('🎉 Nexus Pro activated successfully! You now have full access to DBMS Studio & unlimited subscriptions.');
          setTimeout(() => setActionMessage(null), 5000);
          loadPlans();
        }}
        planName={selectedPlanForCheckout?.name || 'Nexus Pro (Paid)'}
        priceMonthly={Number(selectedPlanForCheckout?.price_monthly) || 2499}
        planId={selectedPlanForCheckout?.id || 'c0000000-0000-0000-0000-000000000002'}
      />

      {/* ADMIN-ONLY CREATE / EDIT MODAL */}
      {role === 'admin' && modalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.2)] max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(220,255,245,0.1)]">
              <h2 className="text-lg font-bold text-[#F1F5F0]">Create Membership Plan</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[#8E9F9B] hover:text-[#F1F5F0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-[#8E9F9B]">Plan Name</label>
                <input
                  type="text"
                  required
                  value={planForm.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPlanForm({
                      ...planForm,
                      name: val,
                      slug: val.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                    });
                  }}
                  placeholder="e.g. Nexus Developer Tier"
                  className="w-full px-3 py-2 rounded-lg bg-[#071112] border border-[rgba(220,255,245,0.15)] text-[#F1F5F0] focus:outline-none focus:border-[#8DFFCB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#8E9F9B]">Monthly Price (INR)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={planForm.price_monthly}
                    onChange={(e) => setPlanForm({ ...planForm, price_monthly: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-[#071112] border border-[rgba(220,255,245,0.15)] text-[#F1F5F0]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#8E9F9B]">Yearly Price (INR)</label>
                  <input
                    type="number"
                    min="0"
                    value={planForm.price_yearly}
                    onChange={(e) => setPlanForm({ ...planForm, price_yearly: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-[#071112] border border-[rgba(220,255,245,0.15)] text-[#F1F5F0]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#8E9F9B]">Description</label>
                <textarea
                  rows={2}
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  placeholder="Plan benefits overview..."
                  className="w-full px-3 py-2 rounded-lg bg-[#071112] border border-[rgba(220,255,245,0.15)] text-[#F1F5F0]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[rgba(220,255,245,0.1)]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-transparent text-[#8E9F9B] hover:text-[#F1F5F0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#8DFFCB] text-[#071112] font-bold hover:bg-[#A6FFD8]"
                >
                  Save to PostgreSQL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
