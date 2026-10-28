import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Layers, 
  Archive, 
  Trash2, 
  Check, 
  X, 
  Search, 
  AlertCircle,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { supabase, fetchPlans } from '../lib/supabase';
import type { MembershipPlan, PlanFeature, PlanStatus } from '../types/database';
import { Badge } from '../components/common/Badge';

export const PlansPage: React.FC = () => {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PlanStatus>('active');
  
  // Dialog state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    slug: '',
    description: '',
    price_monthly: 999,
    price_yearly: 9990,
    trial_days: 14,
    status: 'active' as PlanStatus,
  });
  const [featuresList, setFeaturesList] = useState<Array<{ key: string; label: string; limit?: number; unit?: string }>>([
    { key: 'api_calls', label: 'API Queries / Month', limit: 25000, unit: 'req/mo' },
    { key: 'storage', label: 'Vector Memory', limit: 10, unit: 'GB' },
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
      price_monthly: 999,
      price_yearly: 9990,
      trial_days: 14,
      status: 'active',
    });
    setFeaturesList([
      { key: 'api_calls', label: 'API Queries / Month', limit: 25000, unit: 'req/mo' },
      { key: 'storage', label: 'Vector Memory', limit: 10, unit: 'GB' },
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
      // Check if active subscriptions exist
      const { data: activeSubs } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('plan_id', plan.id)
        .eq('status', 'active');

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
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.slug.includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[rgba(220,255,245,0.1)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F1F5F0]">Plans & Entitlements</h1>
          <p className="text-xs text-[#8E9F9B] mt-1 font-mono">
            Manage subscription tiers, feature quotas, and billing cycle configurations in 3NF.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 rounded-lg bg-[#8DFFCB] text-[#071112] text-xs font-mono font-bold hover:bg-[#A6FFD8] transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(141,255,203,0.25)]"
        >
          <Plus className="w-4 h-4" />
          <span>New Plan</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
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

      {/* Plans Grid */}
      <div className={`grid gap-6 ${statusFilter === 'active' && filteredPlans.length <= 2 ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
        {filteredPlans.map((plan) => (
          <div
            key={plan.id}
            className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] p-5 flex flex-col justify-between space-y-4 hover:border-[#8DFFCB]/30 transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-[#F1F5F0]">{plan.name}</h3>
                <Badge status={plan.status} size="sm" />
              </div>
              <div className="text-[11px] font-mono text-[#8DFFCB] mb-2">{plan.slug}</div>
              <p className="text-xs text-[#8E9F9B] min-h-[36px]">{plan.description}</p>

              <div className="my-4 p-3 rounded-lg bg-[#071112] border border-[rgba(220,255,245,0.06)] font-mono">
                <div className="text-xl font-bold text-[#F1F5F0]">
                  {plan.currency} {Number(plan.price_monthly).toLocaleString()}
                  <span className="text-xs font-normal text-[#8E9F9B]">/mo</span>
                </div>
                {plan.price_yearly && (
                  <div className="text-[11px] text-[#8E9F9B] mt-0.5">
                    Annual: {plan.currency} {Number(plan.price_yearly).toLocaleString()}/yr
                  </div>
                )}
                {plan.trial_days > 0 && (
                  <div className="text-[11px] text-cyan-300 mt-1">
                    ✓ {plan.trial_days}-day complimentary trial
                  </div>
                )}
              </div>

              {/* Feature list preview */}
              <div className="space-y-1.5 pt-2 border-t border-[rgba(220,255,245,0.06)]">
                <div className="text-[10px] font-mono text-[#8E9F9B] uppercase">Feature Limits:</div>
                {plan.features?.map((f) => (
                  <div key={f.id} className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#F1F5F0] flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-[#8DFFCB]" />
                      {f.label}
                    </span>
                    <span className="text-[#8E9F9B] text-[11px]">
                      {f.limit_value ? `${f.limit_value} ${f.unit || ''}` : 'Included'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-[rgba(220,255,245,0.08)] flex items-center justify-between text-xs font-mono">
              <button
                onClick={() => handleArchive(plan)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded transition-colors ${
                  plan.status === 'archived'
                    ? 'text-[#8DFFCB] hover:bg-[#8DFFCB]/10'
                    : 'text-amber-400 hover:bg-amber-400/10'
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                <span>{plan.status === 'archived' ? 'Reactivate' : 'Archive Plan'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
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
