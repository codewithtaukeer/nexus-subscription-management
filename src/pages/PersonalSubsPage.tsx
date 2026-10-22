import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  ExternalLink, 
  Filter, 
  Trash2, 
  Edit3, 
  Archive, 
  X, 
  Upload, 
  FileText, 
  Download, 
  ShieldAlert, 
  ChevronRight, 
  Sparkles, 
  Check, 
  RotateCcw,
  Layers,
  ArrowUpRight,
  Info,
  LogIn,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  personalSubscriptionService, 
  computeNextBillingDate, 
  normalizeToMonthly 
} from '../services/personalSubscriptionService';
import type { DashboardMetrics } from '../services/personalSubscriptionService';
import type { 
  PersonalSubscription, 
  SubProvider, 
  PersonalSubPayment, 
  PersonalSubHistory, 
  StoredInvoiceDocument,
  BillingFrequency, 
  PersonalSubStatus 
} from '../types/database';

export const PersonalSubsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const userId = currentUser?.id || 'a0000000-0000-0000-0000-000000000001';

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'subscriptions' | 'add' | 'payments' | 'invoices'>('dashboard');

  // Core Data
  const [loading, setLoading] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [subscriptions, setSubscriptions] = useState<PersonalSubscription[]>([]);
  const [providers, setProviders] = useState<SubProvider[]>([]);
  const [payments, setPayments] = useState<PersonalSubPayment[]>([]);
  const [documents, setDocuments] = useState<StoredInvoiceDocument[]>([]);

  // Filtering
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showArchived, setShowArchived] = useState<boolean>(false);

  // Detail Modal
  const [selectedSub, setSelectedSub] = useState<PersonalSubscription | null>(null);
  const [subHistory, setSubHistory] = useState<PersonalSubHistory[]>([]);
  const [subPayments, setSubPayments] = useState<PersonalSubPayment[]>([]);
  const [subDocs, setSubDocs] = useState<StoredInvoiceDocument[]>([]);
  const [cancelModalOpen, setCancelModalOpen] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');

  // Editing state
  const [editingSub, setEditingSub] = useState<PersonalSubscription | null>(null);

  // Success / Alert banner
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Add Subscription Form State
  const initialFormState = {
    provider_id: '',
    custom_provider_name: '',
    is_custom_provider: false,
    plan_name: '',
    plan_tier: '',
    category: 'entertainment',
    amount: '',
    currency: 'INR',
    billing_frequency: 'monthly' as BillingFrequency,
    custom_frequency_days: 30,
    start_date: new Date().toISOString().split('T')[0],
    purchase_date: new Date().toISOString().split('T')[0],
    next_billing_date: '',
    expiry_date: '',
    trial_start_date: '',
    trial_end_date: '',
    auto_renew: true,
    status: 'active' as PersonalSubStatus,
    payment_method_label: 'Credit Card',
    account_nickname: '',
    manage_url: '',
    notes: ''
  };

  const [form, setForm] = useState(initialFormState);
  const [providerSearch, setProviderSearch] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');

  // Load everything
  const loadData = async () => {
    setLoading(true);
    try {
      const [provs, mtr, subs, pays, docs] = await Promise.all([
        personalSubscriptionService.fetchProviders(),
        personalSubscriptionService.getDashboardMetrics(userId),
        personalSubscriptionService.fetchMySubscriptions(userId, {
          showArchived,
          statusFilter,
          categoryFilter,
          search
        }),
        personalSubscriptionService.fetchPayments(userId),
        personalSubscriptionService.fetchInvoiceDocuments(userId)
      ]);

      setProviders(provs);
      setMetrics(mtr);
      setSubscriptions(subs);
      setPayments(pays);
      setDocuments(docs);
    } catch (e: any) {
      console.error('Error loading subscription tracker data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId, showArchived, statusFilter, categoryFilter, search]);

  // Load modal sub data
  const handleOpenDetail = async (sub: PersonalSubscription) => {
    setSelectedSub(sub);
    const [hist, pays, docs] = await Promise.all([
      personalSubscriptionService.fetchHistory(userId, sub.id),
      personalSubscriptionService.fetchPayments(userId, sub.id),
      personalSubscriptionService.fetchInvoiceDocuments(userId, sub.id)
    ]);
    setSubHistory(hist);
    setSubPayments(pays);
    setSubDocs(docs);
  };

  // Add Subscription Handler
  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.plan_name.trim()) {
      showFeedback('Plan name is required.', 'error');
      return;
    }
    if (Number(form.amount) < 0) {
      showFeedback('Amount must be positive.', 'error');
      return;
    }

    try {
      let provId = form.provider_id;
      let custName = form.custom_provider_name;

      if (form.is_custom_provider && form.custom_provider_name.trim()) {
        const custProv = await personalSubscriptionService.createCustomProvider(userId, {
          name: form.custom_provider_name.trim(),
          category: form.category,
          website_url: form.manage_url || undefined,
          manage_url: form.manage_url || undefined
        });
        provId = custProv.id;
      }

      await personalSubscriptionService.addSubscription(userId, {
        provider_id: provId || null,
        custom_provider_name: custName || null,
        plan_name: form.plan_name.trim(),
        plan_tier: form.plan_tier || null,
        category: form.category,
        amount: Number(form.amount) || 0,
        currency: form.currency,
        billing_frequency: form.billing_frequency,
        custom_frequency_days: form.billing_frequency === 'custom' ? Number(form.custom_frequency_days) : null,
        start_date: form.start_date,
        purchase_date: form.purchase_date || null,
        next_billing_date: form.next_billing_date || computeNextBillingDate(form.start_date, form.billing_frequency, Number(form.custom_frequency_days)),
        expiry_date: form.expiry_date || null,
        trial_start_date: form.trial_start_date || null,
        trial_end_date: form.trial_end_date || null,
        auto_renew: form.auto_renew,
        status: form.status,
        payment_method_label: form.payment_method_label,
        account_nickname: form.account_nickname || null,
        manage_url: form.manage_url || null,
        notes: form.notes || null
      });

      showFeedback('Subscription successfully added to your centralized dashboard!');
      setForm(initialFormState);
      setActiveTab('subscriptions');
      loadData();
    } catch (err: any) {
      showFeedback('Failed to save subscription: ' + err.message, 'error');
    }
  };

  // Cancellation Flow
  const handleConfirmCancel = async () => {
    if (!selectedSub) return;
    try {
      const updated = await personalSubscriptionService.requestCancellation(selectedSub.id, userId, cancelReason);
      setSelectedSub(updated);
      setCancelModalOpen(false);
      setCancelReason('');
      showFeedback(`Cancellation recorded. Service remains accessible until ${updated.next_billing_date || 'period end'}.`);
      loadData();
    } catch (err: any) {
      showFeedback('Cancellation error: ' + err.message, 'error');
    }
  };

  const handleReactivate = async (sub: PersonalSubscription) => {
    try {
      const updated = await personalSubscriptionService.reactivateSubscription(sub.id, userId);
      setSelectedSub(updated);
      showFeedback(`Subscription "${updated.plan_name}" reactivated!`);
      loadData();
    } catch (err: any) {
      showFeedback('Reactivation error: ' + err.message, 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from tracking? This will remove its payment history.`)) return;
    try {
      await personalSubscriptionService.deleteSubscription(id, userId);
      setSelectedSub(null);
      showFeedback(`Subscription "${name}" permanently deleted.`);
      loadData();
    } catch (err: any) {
      showFeedback('Delete failed: ' + err.message, 'error');
    }
  };

  const handleArchiveToggle = async (sub: PersonalSubscription) => {
    try {
      if (sub.is_archived) {
        await personalSubscriptionService.unarchiveSubscription(sub.id, userId);
        showFeedback(`Restored "${sub.plan_name}" to active list.`);
      } else {
        await personalSubscriptionService.archiveSubscription(sub.id, userId);
        showFeedback(`Archived "${sub.plan_name}".`);
      }
      setSelectedSub(null);
      loadData();
    } catch (err: any) {
      showFeedback('Archive update failed: ' + err.message, 'error');
    }
  };

  // Invoice file upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, subId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showFeedback('File exceeds 5MB size limit.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await personalSubscriptionService.storeInvoiceDocument(userId, {
          subscription_id: subId,
          user_id: userId,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type || 'application/octet-stream',
          file_data: reader.result as string,
          notes: `Uploaded for subscription on ${new Date().toLocaleDateString()}`
        });
        showFeedback('Receipt document attached successfully.');
        loadData();
        if (selectedSub) {
          const docs = await personalSubscriptionService.fetchInvoiceDocuments(userId, selectedSub.id);
          setSubDocs(docs);
        }
      } catch (err: any) {
        showFeedback('Upload error: ' + err.message, 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  // Status badge styling helper
  const renderStatusBadge = (status: PersonalSubStatus) => {
    switch (status) {
      case 'active':
        return <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Active</span>;
      case 'trialing':
        return <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">Free Trial</span>;
      case 'cancelled_active':
        return <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">Active till Paid-End</span>;
      case 'cancellation_pending':
      case 'cancellation_scheduled':
        return <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">Cancelling</span>;
      case 'cancelled':
        return <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">Cancelled</span>;
      case 'payment_failed':
        return <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-red-600/30 text-red-200 border border-red-600/40">Payment Failed</span>;
      case 'paused':
        return <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">Paused</span>;
      case 'expired':
        return <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 border border-slate-600/40">Expired</span>;
      default:
        return <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30">Unknown</span>;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* Top Banner / Header */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0D1919] via-[#071112] to-[#0D1919] border border-[rgba(220,255,245,0.15)] p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#8DFFCB]/10 text-[#8DFFCB] border border-[#8DFFCB]/30 font-semibold">
                Centralized Subscription Hub
              </span>
              <span className="text-xs font-mono text-[#8E9F9B]">3rd-Party & Custom Memberships</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F1F5F0] tracking-tight flex items-center gap-2">
              <span>My Subscriptions</span>
            </h1>
            <p className="text-xs text-[#8E9F9B] mt-1 max-w-2xl">
              Track, manage, and audit all your recurring memberships across entertainment, software, cloud, and delivery in one central portal.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('add')}
              className="px-4 py-2.5 rounded-xl bg-[#8DFFCB] text-[#071112] text-xs font-mono font-bold hover:bg-[#A6FFD8] hover:shadow-[0_0_20px_rgba(141,255,203,0.3)] transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subscription</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className={`p-4 rounded-xl text-xs font-mono flex items-center gap-3 border shadow-lg ${
          feedback.type === 'success' 
            ? 'bg-[#0D2420] text-[#8DFFCB] border-[#8DFFCB]/30' 
            : 'bg-[#2A1010] text-red-300 border-red-500/30'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-[rgba(220,255,245,0.12)] overflow-x-auto gap-2 pb-1">
        {[
          { id: 'dashboard', label: 'Dashboard & Metrics', icon: TrendingUp },
          { id: 'subscriptions', label: `My Subscriptions (${subscriptions.length})`, icon: CreditCard },
          { id: 'add', label: 'Add Subscription', icon: Plus },
          { id: 'payments', label: `Payment History (${payments.length})`, icon: Clock },
          { id: 'invoices', label: `Invoices & Receipts (${documents.length})`, icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-mono font-medium rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
                isActive
                  ? 'bg-[#0D1919] border-[#8DFFCB] text-[#8DFFCB] shadow-md'
                  : 'border-transparent text-[#8E9F9B] hover:text-[#F1F5F0] hover:bg-[#0D1919]/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: DASHBOARD */}
      {activeTab === 'dashboard' && metrics && (
        <div className="space-y-8">
          {/* 4 Core Financial KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] space-y-2">
              <div className="text-xs font-mono text-[#8E9F9B] flex items-center justify-between">
                <span>Active Subscriptions</span>
                <CreditCard className="w-4 h-4 text-[#8DFFCB]" />
              </div>
              <div className="text-3xl font-mono font-bold text-[#F1F5F0]">{metrics.totalActive}</div>
              <div className="text-[11px] text-[#8E9F9B]">Across all connected providers</div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] space-y-2">
              <div className="text-xs font-mono text-[#8E9F9B] flex items-center justify-between">
                <span>Monthly Recurring Expense</span>
                <TrendingUp className="w-4 h-4 text-[#8DFFCB]" />
              </div>
              <div className="text-3xl font-mono font-bold text-[#8DFFCB]">₹{metrics.totalMonthlyExpense.toLocaleString()}</div>
              <div className="text-[11px] text-[#8E9F9B]">Normalized monthly equivalent</div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] space-y-2">
              <div className="text-xs font-mono text-[#8E9F9B] flex items-center justify-between">
                <span>Projected Annual Expense</span>
                <Calendar className="w-4 h-4 text-cyan-300" />
              </div>
              <div className="text-3xl font-mono font-bold text-[#F1F5F0]">₹{metrics.estimatedAnnualExpense.toLocaleString()}</div>
              <div className="text-[11px] text-[#8E9F9B]">12-month forward commitment</div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] space-y-2">
              <div className="text-xs font-mono text-[#8E9F9B] flex items-center justify-between">
                <span>Actual Paid (This Month)</span>
                <Clock className="w-4 h-4 text-amber-300" />
              </div>
              <div className="text-3xl font-mono font-bold text-[#F1F5F0]">₹{metrics.totalSpentThisMonth.toLocaleString()}</div>
              <div className="text-[11px] text-[#8E9F9B]">From confirmed payment transactions</div>
            </div>
          </div>

          {/* Attention Alerts (if any) */}
          {metrics.requiresAttention.length > 0 && (
            <div className="p-5 rounded-2xl bg-[#2A1515] border border-red-500/30 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-300">
                <AlertCircle className="w-4 h-4" />
                <span>Action Required ({metrics.requiresAttention.length} Subscriptions)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {metrics.requiresAttention.map((sub) => (
                  <div key={sub.id} className="p-3 rounded-xl bg-[#0D1919] border border-red-500/20 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-[#F1F5F0]">{sub.sub_providers?.name || sub.custom_provider_name} • {sub.plan_name}</div>
                      <div className="text-xs text-red-300 font-mono">Status: {sub.status.replace('_', ' ')}</div>
                    </div>
                    <button
                      onClick={() => handleOpenDetail(sub)}
                      className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-200 text-xs font-mono hover:bg-red-500/30"
                    >
                      Inspect
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Breakdown Section: Category Spending & Upcoming Renewals */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Category Breakdown */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] space-y-4">
              <h3 className="text-sm font-bold text-[#F1F5F0] font-mono flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#8DFFCB]" />
                <span>Monthly Spending by Category</span>
              </h3>

              <div className="space-y-3">
                {Object.keys(metrics.byCategory).length === 0 ? (
                  <div className="text-xs text-[#8E9F9B] py-6 text-center">No active categories.</div>
                ) : (
                  Object.entries(metrics.byCategory).map(([cat, val]) => {
                    const pct = metrics.totalMonthlyExpense > 0 
                      ? Math.round((val.monthlyAmount / metrics.totalMonthlyExpense) * 100) 
                      : 0;
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="capitalize text-[#F1F5F0]">{cat}</span>
                          <span className="text-[#8DFFCB]">₹{Math.round(val.monthlyAmount).toLocaleString()} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#071112] overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-[#8DFFCB] to-[#38BDF8]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Upcoming Renewals in Next 30 Days */}
            <div className="lg:col-span-7 p-6 rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#F1F5F0] font-mono flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#8DFFCB]" />
                  <span>Upcoming Renewals (Next 30 Days)</span>
                </h3>
                <span className="text-xs font-mono text-[#8E9F9B]">{metrics.upcomingRenewals.length} renewals</span>
              </div>

              <div className="space-y-3">
                {metrics.upcomingRenewals.length === 0 ? (
                  <div className="text-xs text-[#8E9F9B] py-8 text-center font-mono">
                    No renewals due within the next 30 days.
                  </div>
                ) : (
                  metrics.upcomingRenewals.slice(0, 5).map((sub) => {
                    const daysUntil = Math.ceil((new Date(sub.next_billing_date!).getTime() - new Date().getTime()) / 86400000);
                    return (
                      <div key={sub.id} className="p-3.5 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.08)] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {sub.sub_providers?.logo_url ? (
                            <img src={sub.sub_providers.logo_url} alt="" className="w-7 h-7 object-contain rounded" />
                          ) : (
                            <div className="w-7 h-7 rounded bg-[#8DFFCB]/10 text-[#8DFFCB] flex items-center justify-center font-bold text-xs font-mono">
                              {(sub.sub_providers?.name || sub.custom_provider_name || 'S')[0]}
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-bold text-[#F1F5F0]">{sub.sub_providers?.name || sub.custom_provider_name}</div>
                            <div className="text-[10px] text-[#8E9F9B] font-mono">{sub.plan_name} • {sub.billing_frequency}</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-bold font-mono text-[#8DFFCB]">₹{sub.amount}</div>
                          <div className={`text-[10px] font-mono ${daysUntil <= 3 ? 'text-red-300 font-bold' : 'text-[#8E9F9B]'}`}>
                            {sub.next_billing_date} ({daysUntil}d left)
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY SUBSCRIPTIONS (GRID & LIST) */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="p-4 rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-[#8E9F9B]" />
              <input
                type="text"
                placeholder="Search by provider, plan, or account nickname..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-xs text-[#F1F5F0] placeholder-[#8E9F9B] focus:outline-none font-mono"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.15)] text-xs font-mono text-[#F1F5F0] focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="entertainment">Entertainment</option>
                <option value="productivity">Productivity</option>
                <option value="shopping">Shopping & Delivery</option>
                <option value="development">Development & Cloud</option>
                <option value="gaming">Gaming</option>
                <option value="education">Education</option>
                <option value="other">Other</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.15)] text-xs font-mono text-[#F1F5F0] focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="trialing">Free Trial</option>
                <option value="cancelled_active">Cancelled (Active till End)</option>
                <option value="cancelled">Cancelled</option>
                <option value="payment_failed">Payment Failed</option>
              </select>

              {/* Archived toggle */}
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-all ${
                  showArchived 
                    ? 'bg-[#8DFFCB] text-[#071112] border-[#8DFFCB] font-bold' 
                    : 'bg-[#071112] text-[#8E9F9B] border-[rgba(220,255,245,0.15)] hover:text-[#F1F5F0]'
                }`}
              >
                {showArchived ? 'Showing Archived' : 'Show Archived'}
              </button>
            </div>
          </div>

          {/* Subscriptions Grid */}
          {subscriptions.length === 0 ? (
            <div className="p-16 rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] text-center space-y-4">
              <CreditCard className="w-12 h-12 text-[#8DFFCB] opacity-40 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#F1F5F0]">No Subscriptions Found</h3>
                <p className="text-xs text-[#8E9F9B] max-w-md mx-auto">
                  {search || statusFilter !== 'all' || categoryFilter !== 'all'
                    ? 'No subscriptions match your filter criteria. Try resetting the filters.'
                    : 'You have not added any third-party or custom subscriptions yet.'}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('add')}
                className="px-5 py-2.5 rounded-xl bg-[#8DFFCB] text-[#071112] text-xs font-mono font-bold hover:bg-[#A6FFD8] transition-colors"
              >
                + Add Your First Subscription
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {subscriptions.map((sub) => {
                const daysUntil = sub.next_billing_date 
                  ? Math.ceil((new Date(sub.next_billing_date).getTime() - new Date().getTime()) / 86400000) 
                  : null;

                return (
                  <div
                    key={sub.id}
                    onClick={() => handleOpenDetail(sub)}
                    className="p-5 rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] hover:border-[#8DFFCB]/40 hover:bg-[#122222]/80 transition-all cursor-pointer flex flex-col justify-between space-y-4 group shadow-lg"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {sub.sub_providers?.logo_url ? (
                          <img src={sub.sub_providers.logo_url} alt="" className="w-10 h-10 object-contain rounded-lg bg-black/40 p-1" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[#8DFFCB]/10 text-[#8DFFCB] flex items-center justify-center font-bold text-sm font-mono">
                            {(sub.sub_providers?.name || sub.custom_provider_name || 'S')[0]}
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-bold text-[#F1F5F0] group-hover:text-[#8DFFCB] transition-colors">
                            {sub.sub_providers?.name || sub.custom_provider_name}
                          </h4>
                          <div className="text-xs text-[#8E9F9B]">{sub.plan_name}</div>
                        </div>
                      </div>

                      <div>{renderStatusBadge(sub.status)}</div>
                    </div>

                    {/* Pricing & Cycle */}
                    <div className="p-3 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.06)] flex items-center justify-between">
                      <div>
                        <div className="text-lg font-mono font-bold text-[#8DFFCB]">₹{sub.amount}</div>
                        <div className="text-[10px] uppercase font-mono text-[#8E9F9B]">per {sub.billing_frequency}</div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-mono text-[#F1F5F0]">
                          {sub.next_billing_date ? sub.next_billing_date : 'N/A'}
                        </div>
                        <div className="text-[10px] font-mono text-[#8E9F9B]">
                          {daysUntil !== null && daysUntil >= 0 ? `${daysUntil} days left` : 'No auto-renewal'}
                        </div>
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex items-center justify-between text-xs text-[#8E9F9B] pt-1">
                      <span className="capitalize font-mono text-[11px] px-2 py-0.5 rounded bg-black/40">
                        {sub.category}
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-[#8DFFCB] group-hover:underline flex items-center gap-1">
                          <span>Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ADD SUBSCRIPTION FORM */}
      {activeTab === 'add' && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Quick Connect Popular Platforms Grid */}
          <div className="p-6 rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.15)] shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#F1F5F0] font-mono flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#8DFFCB]" />
                  <span>Popular Subscription Platforms</span>
                </h3>
                <p className="text-xs text-[#8E9F9B] mt-0.5 font-mono">
                  Search & click any service below to auto-populate logo, category, and renewal settings.
                </p>
              </div>

              {/* Provider Search input */}
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E9F9B]" />
                <input
                  type="text"
                  placeholder="Filter 15+ platforms..."
                  value={providerSearch}
                  onChange={(e) => setProviderSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.15)] text-xs font-mono text-[#F1F5F0] placeholder-[#8E9F9B]/60 focus:outline-none focus:border-[#8DFFCB]"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[rgba(220,255,245,0.06)]">
              {['all', 'entertainment', 'productivity', 'shopping', 'development', 'gaming'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryTab(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono capitalize transition-all ${
                    selectedCategoryTab === cat
                      ? 'bg-[#8DFFCB]/20 text-[#8DFFCB] border border-[#8DFFCB]/40 font-semibold'
                      : 'bg-[#071112] text-[#8E9F9B] border border-[rgba(220,255,245,0.08)] hover:text-[#F1F5F0]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Popular Platform Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
              {providers
                .filter((p) => {
                  const matchSearch = p.name.toLowerCase().includes(providerSearch.toLowerCase()) ||
                    p.category.toLowerCase().includes(providerSearch.toLowerCase());
                  const matchCat = selectedCategoryTab === 'all' || p.category === selectedCategoryTab;
                  return matchSearch && matchCat;
                })
                .slice(0, 15)
                .map((prov) => {
                  const isSelected = form.provider_id === prov.id;
                  return (
                    <button
                      key={prov.id}
                      type="button"
                      onClick={() => {
                        setForm({
                          ...form,
                          provider_id: prov.id,
                          is_custom_provider: false,
                          custom_provider_name: '',
                          plan_name: form.plan_name || `${prov.name} Standard`,
                          category: prov.category || form.category,
                          manage_url: prov.manage_url || form.manage_url
                        });
                        showFeedback(`Selected ${prov.name}`);
                      }}
                      className={`p-3 rounded-xl flex flex-col items-center text-center gap-2 transition-all group ${
                        isSelected
                          ? 'bg-[#8DFFCB]/15 border-2 border-[#8DFFCB] shadow-[0_0_15px_rgba(141,255,203,0.25)]'
                          : 'bg-[#071112] border border-[rgba(220,255,245,0.1)] hover:border-[#8DFFCB]/40 hover:bg-[#122222]'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-1.5 group-hover:scale-110 transition-transform">
                        {prov.logo_url ? (
                          <img src={prov.logo_url} alt={prov.name} className="w-full h-full object-contain" />
                        ) : (
                          <span className="font-mono font-bold text-xs text-[#8DFFCB]">
                            {prov.name[0]}
                          </span>
                        )}
                      </div>
                      <div className="w-full">
                        <div className="text-xs font-bold text-[#F1F5F0] truncate font-mono">
                          {prov.name}
                        </div>
                        <div className="text-[10px] text-[#8E9F9B] capitalize font-mono truncate">
                          {prov.category}
                        </div>
                      </div>
                      {isSelected && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#8DFFCB] text-[#071112] font-bold">
                          Selected
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Form Card */}
          <div className="p-8 rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.15)] shadow-2xl">
            <form onSubmit={handleCreateSubscription} className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[#F1F5F0] font-mono">
                  {form.provider_id
                    ? `Configure ${providers.find((p) => p.id === form.provider_id)?.name || ''} Subscription`
                    : 'Configure Subscription Details'}
                </h2>
                <p className="text-xs text-[#8E9F9B] mt-0.5 font-mono">
                  Review and customize plan tier, billing cycle, renewal date, and payment method.
                </p>
              </div>

              {/* Provider Selection Row */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-[#8DFFCB] uppercase tracking-wider block">
                  Selected Platform / Custom Service *
                </label>

                {!form.is_custom_provider ? (
                  <div className="space-y-2">
                    <select
                      value={form.provider_id}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setForm({ ...form, is_custom_provider: true, provider_id: '' });
                        } else {
                          const prov = providers.find((p) => p.id === e.target.value);
                          setForm({
                            ...form,
                            provider_id: e.target.value,
                            category: prov?.category || form.category,
                            manage_url: prov?.manage_url || form.manage_url
                          });
                        }
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.2)] text-xs font-mono text-[#F1F5F0] focus:outline-none focus:border-[#8DFFCB]"
                    >
                      <option value="">Select a known provider from list...</option>
                      {providers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.category})
                        </option>
                      ))}
                      <option value="custom">+ Other / Custom Platform...</option>
                    </select>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, is_custom_provider: true, provider_id: '' })}
                        className="text-[11px] font-mono text-[#8DFFCB] hover:underline"
                      >
                        Can't find your platform? Type custom service name &rarr;
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Duolingo, Strava, ChatGPT Plus, Claude Pro, Midjourney"
                        value={form.custom_provider_name}
                        onChange={(e) => setForm({ ...form, custom_provider_name: e.target.value })}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.2)] text-xs font-mono text-[#F1F5F0] focus:outline-none focus:border-[#8DFFCB]"
                      />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, is_custom_provider: false })}
                        className="px-3 py-2 rounded-xl bg-[#122222] text-[#8E9F9B] text-xs font-mono hover:text-[#F1F5F0]"
                      >
                        Choose Known
                      </button>
                    </div>
                  </div>
                )}
              </div>

            {/* Plan Name & Tier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#8E9F9B] uppercase block">Plan Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Premium 4K, Family Tier, Standard"
                  value={form.plan_name}
                  onChange={(e) => setForm({ ...form, plan_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.2)] text-xs font-mono text-[#F1F5F0] focus:outline-none focus:border-[#8DFFCB]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#8E9F9B] uppercase block">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.2)] text-xs font-mono text-[#F1F5F0] focus:outline-none"
                >
                  <option value="entertainment">Entertainment</option>
                  <option value="productivity">Productivity</option>
                  <option value="shopping">Shopping & Delivery</option>
                  <option value="development">Development & Cloud</option>
                  <option value="gaming">Gaming</option>
                  <option value="education">Education</option>
                  <option value="news">News & Media</option>
                  <option value="fitness">Fitness & Health</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Amount, Currency & Frequency */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#8E9F9B] uppercase block">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 649"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.2)] text-xs font-mono text-[#F1F5F0] focus:outline-none focus:border-[#8DFFCB]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#8E9F9B] uppercase block">Currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.2)] text-xs font-mono text-[#F1F5F0] focus:outline-none"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#8E9F9B] uppercase block">Billing Frequency</label>
                <select
                  value={form.billing_frequency}
                  onChange={(e) => setForm({ ...form, billing_frequency: e.target.value as BillingFrequency })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.2)] text-xs font-mono text-[#F1F5F0] focus:outline-none"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="half_yearly">Half Yearly</option>
                  <option value="weekly">Weekly</option>
                  <option value="custom">Custom Days</option>
                  <option value="one_time">One Time</option>
                </select>
              </div>
            </div>

            {/* Custom frequency days (if custom) */}
            {form.billing_frequency === 'custom' && (
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#8E9F9B] uppercase block">Cycle Length in Days</label>
                <input
                  type="number"
                  value={form.custom_frequency_days}
                  onChange={(e) => setForm({ ...form, custom_frequency_days: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.2)] text-xs font-mono text-[#F1F5F0]"
                />
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#8E9F9B] uppercase block">Subscription Start Date *</label>
                <input
                  type="date"
                  required
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.2)] text-xs font-mono text-[#F1F5F0] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#8E9F9B] uppercase block">Next Billing / Renewal Date</label>
                <input
                  type="date"
                  value={form.next_billing_date}
                  onChange={(e) => setForm({ ...form, next_billing_date: e.target.value })}
                  placeholder="Auto-calculated if blank"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.2)] text-xs font-mono text-[#F1F5F0] focus:outline-none"
                />
              </div>
            </div>

            {/* Free Trial Dates (optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#8E9F9B] uppercase block">Trial Start (Optional)</label>
                <input
                  type="date"
                  value={form.trial_start_date}
                  onChange={(e) => setForm({ ...form, trial_start_date: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.2)] text-xs font-mono text-[#F1F5F0]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#8E9F9B] uppercase block">Trial End Date (Optional)</label>
                <input
                  type="date"
                  value={form.trial_end_date}
                  onChange={(e) => setForm({ ...form, trial_end_date: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.2)] text-xs font-mono text-[#F1F5F0]"
                />
              </div>
            </div>

            {/* Payment Method & Management URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#8E9F9B] uppercase block">Payment Method Label</label>
                <select
                  value={form.payment_method_label}
                  onChange={(e) => setForm({ ...form, payment_method_label: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.2)] text-xs font-mono text-[#F1F5F0]"
                >
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="UPI / GPay">UPI / GPay / PhonePe</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Apple Pay">Apple Pay</option>
                  <option value="Google Play Store">Google Play Billing</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#8E9F9B] uppercase block">Direct Management URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={form.manage_url}
                  onChange={(e) => setForm({ ...form, manage_url: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.2)] text-xs font-mono text-[#F1F5F0]"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#8E9F9B] uppercase block">Notes & Credentials Reference</label>
              <textarea
                rows={2}
                placeholder="Account email, login profile, or reminder notes..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.2)] text-xs font-mono text-[#F1F5F0]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[rgba(220,255,245,0.1)]">
              <button
                type="button"
                onClick={() => setForm(initialFormState)}
                className="px-4 py-2.5 rounded-xl bg-[#122222] text-[#8E9F9B] text-xs font-mono hover:text-[#F1F5F0]"
              >
                Reset
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#8DFFCB] text-[#071112] text-xs font-mono font-bold hover:bg-[#A6FFD8] transition-colors"
              >
                Save Subscription
              </button>
            </div>
          </form>
          </div>
        </div>
      )}

      {/* TAB 4: PAYMENT HISTORY */}
      {activeTab === 'payments' && (
        <div className="p-6 rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#F1F5F0]">Transaction & Payment Ledger</h3>
              <p className="text-xs text-[#8E9F9B] mt-0.5">
                Historical record of actual verified charges and invoice settlement records.
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono text-[#8E9F9B]">Total Recorded Spending</div>
              <div className="text-lg font-mono font-bold text-[#8DFFCB]">
                ₹{payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[rgba(220,255,245,0.1)] text-[#8E9F9B]">
                  <th className="py-3 px-2">Date</th>
                  <th className="py-3 px-2">Subscription / Plan</th>
                  <th className="py-3 px-2">Method</th>
                  <th className="py-3 px-2">Invoice Ref</th>
                  <th className="py-3 px-2">Amount</th>
                  <th className="py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(220,255,245,0.06)]">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#8E9F9B]">
                      No recorded payments yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-[#122222]/50 transition-colors">
                      <td className="py-3 px-2 text-[#F1F5F0]">{p.payment_date}</td>
                      <td className="py-3 px-2 font-bold text-[#F1F5F0]">
                        {p.personal_subscriptions?.plan_name || 'Tracked Plan'}
                      </td>
                      <td className="py-3 px-2 text-[#8E9F9B]">{p.payment_method_label || 'Default'}</td>
                      <td className="py-3 px-2 text-[#8E9F9B]">{p.invoice_reference || '-'}</td>
                      <td className="py-3 px-2 font-bold text-[#8DFFCB]">₹{p.amount}</td>
                      <td className="py-3 px-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: INVOICES & RECEIPTS */}
      {activeTab === 'invoices' && (
        <div className="p-6 rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#F1F5F0]">Invoice & Receipt Vault</h3>
            <p className="text-xs text-[#8E9F9B] mt-0.5">
              Securely stored billing slips, tax invoices, and renewal proofs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-[#8E9F9B]">
                No invoice receipts attached yet. Open any subscription card to attach an invoice.
              </div>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="p-4 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.1)] space-y-3">
                  <div className="flex items-center justify-between">
                    <FileText className="w-5 h-5 text-[#8DFFCB]" />
                    <span className="text-[10px] font-mono text-[#8E9F9B]">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#F1F5F0] truncate">{doc.file_name}</div>
                    <div className="text-[10px] text-[#8E9F9B] font-mono">{(doc.file_size / 1024).toFixed(1)} KB</div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-[rgba(220,255,245,0.06)]">
                    <a
                      href={doc.file_data}
                      download={doc.file_name}
                      className="px-3 py-1 rounded bg-[#122222] text-[#8DFFCB] text-[11px] font-mono hover:bg-[#8DFFCB] hover:text-[#071112] transition-colors flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </a>
                    <button
                      onClick={() => personalSubscriptionService.deleteInvoiceDocument(userId, doc.id).then(loadData)}
                      className="p-1 rounded text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUBSCRIPTION DETAIL MODAL */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0D1919] border border-[rgba(220,255,245,0.2)] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-[rgba(220,255,245,0.1)] flex items-center justify-between bg-[#071112]">
              <div className="flex items-center gap-3">
                {selectedSub.sub_providers?.logo_url ? (
                  <img src={selectedSub.sub_providers.logo_url} alt="" className="w-10 h-10 object-contain rounded-lg bg-black/40 p-1" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-[#8DFFCB]/10 text-[#8DFFCB] flex items-center justify-center font-bold text-sm font-mono">
                    {(selectedSub.sub_providers?.name || selectedSub.custom_provider_name || 'S')[0]}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-[#F1F5F0]">
                    {selectedSub.sub_providers?.name || selectedSub.custom_provider_name}
                  </h3>
                  <div className="text-xs text-[#8E9F9B]">{selectedSub.plan_name} • {selectedSub.billing_frequency}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {renderStatusBadge(selectedSub.status)}
                <button
                  onClick={() => setSelectedSub(null)}
                  className="p-1.5 rounded-lg text-[#8E9F9B] hover:text-[#F1F5F0] hover:bg-[#122222]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Financial Snapshot */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.08)]">
                <div>
                  <div className="text-[10px] uppercase font-mono text-[#8E9F9B]">Amount</div>
                  <div className="text-base font-bold font-mono text-[#8DFFCB]">₹{selectedSub.amount}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-mono text-[#8E9F9B]">Next Renewal</div>
                  <div className="text-xs font-bold font-mono text-[#F1F5F0]">{selectedSub.next_billing_date || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-mono text-[#8E9F9B]">Payment Mode</div>
                  <div className="text-xs font-mono text-[#F1F5F0]">{selectedSub.payment_method_label || 'Default'}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-mono text-[#8E9F9B]">Auto-Renew</div>
                  <div className="text-xs font-mono text-[#8DFFCB]">{selectedSub.auto_renew ? 'Enabled' : 'Disabled'}</div>
                </div>
              </div>

              {/* Centralized Cancellation & Management Hub */}
              <div className="p-4 rounded-xl bg-[#122424] border border-[#8DFFCB]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#8DFFCB]">
                    <Sparkles className="w-4 h-4" />
                    <span>Provider Action Hub</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#8E9F9B]">Direct & Verified Redirection</span>
                </div>

                <p className="text-xs text-[#8E9F9B]">
                  Manage your subscription without searching provider menus. Open official billing settings directly, then record outcomes here.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {(selectedSub.manage_url || selectedSub.sub_providers?.manage_url) && (
                    <a
                      href={selectedSub.manage_url || selectedSub.sub_providers?.manage_url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg bg-[#8DFFCB] text-[#071112] text-xs font-mono font-bold hover:bg-[#A6FFD8] transition-colors flex items-center gap-1.5"
                    >
                      <span>Manage with {selectedSub.sub_providers?.name || 'Provider'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {selectedSub.status !== 'cancelled' && selectedSub.status !== 'cancelled_active' ? (
                    <button
                      onClick={() => setCancelModalOpen(true)}
                      className="px-4 py-2 rounded-lg bg-red-500/20 text-red-200 border border-red-500/30 text-xs font-mono hover:bg-red-500/30 transition-colors"
                    >
                      Record Cancellation
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReactivate(selectedSub)}
                      className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono hover:bg-emerald-500/30 transition-colors"
                    >
                      Reactivate Subscription
                    </button>
                  )}

                  <button
                    onClick={() => handleArchiveToggle(selectedSub)}
                    className="px-3 py-2 rounded-lg bg-[#071112] border border-[rgba(220,255,245,0.15)] text-xs font-mono text-[#8E9F9B] hover:text-[#F1F5F0]"
                  >
                    {selectedSub.is_archived ? 'Restore' : 'Archive'}
                  </button>

                  <button
                    onClick={() => handleDelete(selectedSub.id, selectedSub.plan_name)}
                    className="px-3 py-2 rounded-lg bg-red-950/40 border border-red-500/30 text-xs font-mono text-red-400 hover:text-red-300"
                  >
                    Delete Record
                  </button>
                </div>
              </div>

              {/* Receipt Upload Box */}
              <div className="p-4 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.1)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono font-bold text-[#F1F5F0] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#8DFFCB]" />
                    <span>Invoices & Receipts ({subDocs.length})</span>
                  </div>
                  <label className="px-3 py-1.5 rounded-lg bg-[#122222] border border-[#8DFFCB]/30 text-xs font-mono text-[#8DFFCB] hover:bg-[#8DFFCB] hover:text-[#071112] cursor-pointer transition-colors flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Attach Receipt</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => handleFileUpload(e, selectedSub.id)}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="space-y-2">
                  {subDocs.length === 0 ? (
                    <div className="text-[11px] text-[#8E9F9B] italic">No receipt documents attached yet.</div>
                  ) : (
                    subDocs.map((doc) => (
                      <div key={doc.id} className="p-2.5 rounded-lg bg-[#0D1919] border border-[rgba(220,255,245,0.06)] flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-3.5 h-3.5 text-[#8DFFCB]" />
                          <span className="text-[#F1F5F0] truncate">{doc.file_name}</span>
                        </div>
                        <a
                          href={doc.file_data}
                          download={doc.file_name}
                          className="text-[11px] text-[#8DFFCB] hover:underline"
                        >
                          Download
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Audit Trail & History */}
              <div className="p-4 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.1)] space-y-3">
                <div className="text-xs font-mono font-bold text-[#F1F5F0] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#8DFFCB]" />
                  <span>Status History & Audit Trail</span>
                </div>

                <div className="space-y-2">
                  {subHistory.length === 0 ? (
                    <div className="text-[11px] text-[#8E9F9B] italic">No historical changes recorded.</div>
                  ) : (
                    subHistory.map((h) => (
                      <div key={h.id} className="p-2.5 rounded-lg bg-[#0D1919] text-xs font-mono space-y-0.5">
                        <div className="flex items-center justify-between text-[10px] text-[#8E9F9B]">
                          <span className="text-[#8DFFCB] uppercase">{h.action.replace('_', ' ')}</span>
                          <span>{new Date(h.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-[#F1F5F0] text-[11px]">{h.user_note || 'Status updated'}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CANCELLATION WORKFLOW MODAL */}
      {cancelModalOpen && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0D1919] border border-red-500/30 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-red-300 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <span>Confirm Subscription Cancellation</span>
            </div>

            <p className="text-xs text-[#8E9F9B] leading-relaxed">
              In accordance with standard consumer billing rules, marking this subscription as cancelled will keep your tracking active until your paid-through date (<strong className="text-[#F1F5F0]">{selectedSub.next_billing_date || 'end of period'}</strong>). No further renewal reminders will be triggered.
            </p>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-[#8E9F9B]">Reason or notes (optional):</label>
              <textarea
                rows={2}
                placeholder="e.g. Too expensive, found alternative, cancelled on official site"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.15)] text-xs font-mono text-[#F1F5F0]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#122222] text-[#8E9F9B] text-xs font-mono hover:text-[#F1F5F0]"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-lg bg-red-500 text-white font-mono text-xs font-bold hover:bg-red-600 transition-colors"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
