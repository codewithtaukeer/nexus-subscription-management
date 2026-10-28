import { supabase } from '../lib/supabase';
import type {
  PersonalSubscription,
  SubProvider,
  PersonalSubPayment,
  PersonalSubHistory,
  SubRenewalReminder,
  StoredInvoiceDocument,
  BillingFrequency,
  PersonalSubStatus
} from '../types/database';

export interface DashboardMetrics {
  totalActive: number;
  totalMonthlyExpense: number;
  estimatedAnnualExpense: number;
  totalSpentThisMonth: number;
  totalSpentThisYear: number;
  upcomingRenewals: PersonalSubscription[];
  expiringTrials: PersonalSubscription[];
  requiresAttention: PersonalSubscription[];
  byCategory: Record<string, { count: number; monthlyAmount: number }>;
  byFrequency: Record<string, { count: number; monthlyAmount: number }>;
  byProvider: Record<string, { count: number; monthlyAmount: number }>;
}

export const FALLBACK_PROVIDERS: SubProvider[] = [
  {
    id: '62019b3a-6a9a-4de9-ad38-e0d492d4d6b3',
    slug: 'netflix',
    name: 'Netflix',
    category: 'entertainment',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
    website_url: 'https://netflix.com',
    manage_url: 'https://netflix.com/cancelplan',
    supports_direct_cancel: false,
    supports_direct_reactivate: false,
    supports_status_sync: false,
    supports_billing_sync: false,
    supports_invoice_retrieval: false,
    supports_webhooks: false,
    is_custom: false,
    created_at: new Date().toISOString()
  },
  {
    id: 'adc37daf-0602-4473-b9a8-48f33f62b87c',
    slug: 'spotify',
    name: 'Spotify Premium',
    category: 'entertainment',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg',
    website_url: 'https://spotify.com',
    manage_url: 'https://spotify.com/account/subscription',
    supports_direct_cancel: false,
    supports_direct_reactivate: false,
    supports_status_sync: false,
    supports_billing_sync: false,
    supports_invoice_retrieval: false,
    supports_webhooks: false,
    is_custom: false,
    created_at: new Date().toISOString()
  },
  {
    id: 'bc279df2-e8b0-47d5-833f-9d059d2f862b',
    slug: 'youtube-premium',
    name: 'YouTube Premium',
    category: 'entertainment',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg',
    website_url: 'https://youtube.com',
    manage_url: 'https://youtube.com/paid_memberships',
    supports_direct_cancel: false,
    supports_direct_reactivate: false,
    supports_status_sync: false,
    supports_billing_sync: false,
    supports_invoice_retrieval: false,
    supports_webhooks: false,
    is_custom: false,
    created_at: new Date().toISOString()
  },
  {
    id: '0276002f-ac36-4f74-9376-524175573756',
    slug: 'amazon-prime',
    name: 'Amazon Prime',
    category: 'shopping',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
    website_url: 'https://amazon.in',
    manage_url: 'https://amazon.in/mc/pipelines/home',
    supports_direct_cancel: false,
    supports_direct_reactivate: false,
    supports_status_sync: false,
    supports_billing_sync: false,
    supports_invoice_retrieval: false,
    supports_webhooks: false,
    is_custom: false,
    created_at: new Date().toISOString()
  },
  {
    id: 'a7e14e7a-5537-41a9-aada-731e879098d8',
    slug: 'microsoft-365',
    name: 'Microsoft 365',
    category: 'productivity',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/1024px-Microsoft_logo.svg.png',
    website_url: 'https://microsoft.com',
    manage_url: 'https://account.microsoft.com/services',
    supports_direct_cancel: false,
    supports_direct_reactivate: false,
    supports_status_sync: false,
    supports_billing_sync: false,
    supports_invoice_retrieval: false,
    supports_webhooks: false,
    is_custom: false,
    created_at: new Date().toISOString()
  },
  {
    id: '80eaebaa-b02e-4b68-80e5-78eec9315fe2',
    slug: 'google-one',
    name: 'Google One',
    category: 'productivity',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg',
    website_url: 'https://one.google.com',
    manage_url: 'https://one.google.com/storage',
    supports_direct_cancel: false,
    supports_direct_reactivate: false,
    supports_status_sync: false,
    supports_billing_sync: false,
    supports_invoice_retrieval: false,
    supports_webhooks: false,
    is_custom: false,
    created_at: new Date().toISOString()
  },
  {
    id: '50e96035-6aa9-4ce8-be26-9f449a0da7ea',
    slug: 'github-pro',
    name: 'GitHub Pro',
    category: 'development',
    logo_url: 'https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png',
    website_url: 'https://github.com',
    manage_url: 'https://github.com/settings/billing',
    supports_direct_cancel: false,
    supports_direct_reactivate: false,
    supports_status_sync: false,
    supports_billing_sync: false,
    supports_invoice_retrieval: false,
    supports_webhooks: false,
    is_custom: false,
    created_at: new Date().toISOString()
  },
  {
    id: '3ef7e98a-2117-48f8-b1ad-380ff98cf542',
    slug: 'notion',
    name: 'Notion',
    category: 'productivity',
    website_url: 'https://notion.so',
    manage_url: 'https://notion.so/profile/billing',
    supports_direct_cancel: false,
    supports_direct_reactivate: false,
    supports_status_sync: false,
    supports_billing_sync: false,
    supports_invoice_retrieval: false,
    supports_webhooks: false,
    is_custom: false,
    created_at: new Date().toISOString()
  },
  {
    id: '264be489-0cb9-4c10-ba3e-00eeb38ff247',
    slug: 'canva-pro',
    name: 'Canva Pro',
    category: 'productivity',
    website_url: 'https://canva.com',
    manage_url: 'https://canva.com/settings/billing',
    supports_direct_cancel: false,
    supports_direct_reactivate: false,
    supports_status_sync: false,
    supports_billing_sync: false,
    supports_invoice_retrieval: false,
    supports_webhooks: false,
    is_custom: false,
    created_at: new Date().toISOString()
  },
  {
    id: 'c86c123d-07d0-4592-a9b0-96f30a905a5a',
    slug: 'hotstar',
    name: 'Disney+ Hotstar',
    category: 'entertainment',
    website_url: 'https://hotstar.com',
    manage_url: 'https://hotstar.com/in/account/manage-subscription',
    supports_direct_cancel: false,
    supports_direct_reactivate: false,
    supports_status_sync: false,
    supports_billing_sync: false,
    supports_invoice_retrieval: false,
    supports_webhooks: false,
    is_custom: false,
    created_at: new Date().toISOString()
  },
  {
    id: '50ea7ff2-3c22-416b-a2eb-d1e9bb8aa93e',
    slug: 'discord-nitro',
    name: 'Discord Nitro',
    category: 'gaming',
    website_url: 'https://discord.com',
    manage_url: 'https://discord.com/billing',
    supports_direct_cancel: false,
    supports_direct_reactivate: false,
    supports_status_sync: false,
    supports_billing_sync: false,
    supports_invoice_retrieval: false,
    supports_webhooks: false,
    is_custom: false,
    created_at: new Date().toISOString()
  },
  {
    id: '9fbb78b3-c154-4680-a6ad-902319c536eb',
    slug: 'apple-icloud',
    name: 'Apple iCloud+',
    category: 'productivity',
    website_url: 'https://icloud.com',
    manage_url: 'https://appleid.apple.com',
    supports_direct_cancel: false,
    supports_direct_reactivate: false,
    supports_status_sync: false,
    supports_billing_sync: false,
    supports_invoice_retrieval: false,
    supports_webhooks: false,
    is_custom: false,
    created_at: new Date().toISOString()
  }
];

export function normalizeToMonthly(amount: number, frequency: BillingFrequency, customDays?: number | null): number {
  const num = Number(amount) || 0;
  switch (frequency) {
    case 'weekly':
      return (num * 52) / 12;
    case 'monthly':
      return num;
    case 'quarterly':
      return num / 3;
    case 'half_yearly':
      return num / 6;
    case 'yearly':
      return num / 12;
    case 'one_time':
      return 0; // One-time payments don't count towards monthly recurring commitment
    case 'custom':
      if (customDays && customDays > 0) {
        return (num / customDays) * 30.4375;
      }
      return num;
    default:
      return num;
  }
}

export function computeNextBillingDate(startDate: string, frequency: BillingFrequency, customDays?: number | null): string {
  const start = new Date(startDate || new Date().toISOString().split('T')[0]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let candidate = new Date(start);

  const addStep = (d: Date) => {
    switch (frequency) {
      case 'weekly':
        d.setDate(d.getDate() + 7);
        break;
      case 'monthly':
        d.setMonth(d.getMonth() + 1);
        break;
      case 'quarterly':
        d.setMonth(d.getMonth() + 3);
        break;
      case 'half_yearly':
        d.setMonth(d.getMonth() + 6);
        break;
      case 'yearly':
        d.setFullYear(d.getFullYear() + 1);
        break;
      case 'custom':
        d.setDate(d.getDate() + (customDays && customDays > 0 ? customDays : 30));
        break;
      case 'one_time':
        // no recurrence
        break;
    }
  };

  if (frequency === 'one_time') {
    return start.toISOString().split('T')[0];
  }

  // Fast forward until candidate is strictly in the future
  while (candidate <= today) {
    const prev = candidate.getTime();
    addStep(candidate);
    if (candidate.getTime() <= prev) {
      // guard against infinite loop
      candidate.setDate(candidate.getDate() + 30);
    }
  }

  return candidate.toISOString().split('T')[0];
}

class PersonalSubscriptionService {
  private getStorageKey(type: string, userId: string): string {
    return `nexus_${type}_${userId}`;
  }

  // Local storage helpers for 100% resilient persistence across sessions
  private getLocalList<T>(key: string): T[] {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private setLocalList<T>(key: string, data: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Local storage save error:', e);
    }
  }

  // 1. Providers
  public async fetchProviders(): Promise<SubProvider[]> {
    try {
      const { data, error } = await supabase
        .from('sub_providers')
        .select('*')
        .order('name');
      if (!error && data && data.length > 0) {
        return data as SubProvider[];
      }
    } catch (e) {
      console.warn('Supabase fetchProviders fallback to catalogue:', e);
    }
    return FALLBACK_PROVIDERS;
  }

  public async createCustomProvider(userId: string, data: Partial<SubProvider>): Promise<SubProvider> {
    const newProvider: SubProvider = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'prov-' + Date.now(),
      slug: (data.name || 'custom').toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString(36),
      name: data.name || 'Custom Provider',
      category: data.category || 'other',
      website_url: data.website_url || null,
      manage_url: data.manage_url || null,
      logo_url: data.logo_url || null,
      supports_direct_cancel: false,
      supports_direct_reactivate: false,
      notes: data.notes || null,
      is_custom: true,
      created_by: userId,
      created_at: new Date().toISOString()
    };

    // Attempt save to Supabase
    try {
      const { data: dbData, error } = await supabase.from('sub_providers').insert([newProvider]).select().single();
      if (!error && dbData) {
        return dbData as SubProvider;
      }
    } catch (e) {
      console.warn('Custom provider saved in local memory:', e);
    }

    // Persist in local storage custom providers list
    const key = `nexus_custom_providers_${userId}`;
    const list = this.getLocalList<SubProvider>(key);
    list.push(newProvider);
    this.setLocalList(key, list);
    return newProvider;
  }

  // 2. Personal Subscriptions
  public async fetchMySubscriptions(
    userId: string,
    filters?: { showArchived?: boolean; statusFilter?: string; categoryFilter?: string; search?: string }
  ): Promise<PersonalSubscription[]> {
    const key = this.getStorageKey('personal_subs', userId);
    let subs: PersonalSubscription[] = [];

    // Try Supabase first
    try {
      const { data, error } = await supabase
        .from('personal_subscriptions')
        .select('*, sub_providers(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        subs = data as PersonalSubscription[];
        this.setLocalList(key, subs); // sync local cache
      } else {
        subs = this.getLocalList<PersonalSubscription>(key);
      }
    } catch {
      subs = this.getLocalList<PersonalSubscription>(key);
    }

    // Apply in-memory filters
    return subs.filter((s) => {
      if (!filters?.showArchived && s.is_archived) return false;
      if (filters?.showArchived && !s.is_archived) return false;
      if (filters?.statusFilter && filters.statusFilter !== 'all' && s.status !== filters.statusFilter) return false;
      if (filters?.categoryFilter && filters.categoryFilter !== 'all' && s.category !== filters.categoryFilter) return false;
      if (filters?.search && filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const pName = (s.sub_providers?.name || s.custom_provider_name || '').toLowerCase();
        const plan = (s.plan_name || '').toLowerCase();
        const nick = (s.account_nickname || '').toLowerCase();
        if (!pName.includes(q) && !plan.includes(q) && !nick.includes(q)) return false;
      }
      return true;
    });
  }

  public async getSubscription(id: string, userId: string): Promise<PersonalSubscription | null> {
    const subs = await this.fetchMySubscriptions(userId, { showArchived: true });
    return subs.find((s) => s.id === id) || null;
  }

  public async addSubscription(userId: string, input: Partial<PersonalSubscription>): Promise<PersonalSubscription> {
    const nextDate = input.next_billing_date || computeNextBillingDate(
      input.start_date || new Date().toISOString().split('T')[0],
      input.billing_frequency || 'monthly',
      input.custom_frequency_days
    );

    const newSub: PersonalSubscription = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'sub-' + Date.now(),
      user_id: userId,
      provider_id: input.provider_id || null,
      custom_provider_name: input.custom_provider_name || null,
      plan_name: input.plan_name || 'Standard Plan',
      plan_tier: input.plan_tier || null,
      category: input.category || 'other',
      amount: Number(input.amount) || 0,
      currency: input.currency || 'INR',
      billing_frequency: input.billing_frequency || 'monthly',
      custom_frequency_days: input.custom_frequency_days || null,
      start_date: input.start_date || new Date().toISOString().split('T')[0],
      purchase_date: input.purchase_date || null,
      next_billing_date: nextDate,
      expiry_date: input.expiry_date || null,
      trial_start_date: input.trial_start_date || null,
      trial_end_date: input.trial_end_date || null,
      auto_renew: input.auto_renew !== undefined ? input.auto_renew : true,
      status: input.status || (input.trial_end_date ? 'trialing' : 'active'),
      status_source: 'user_reported',
      payment_method_label: input.payment_method_label || null,
      account_nickname: input.account_nickname || null,
      manage_url: input.manage_url || null,
      notes: input.notes || null,
      is_archived: false,
      is_tracking_paused: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sub_providers: input.sub_providers || null
    };

    // If sub_providers is not attached, look it up
    if (!newSub.sub_providers && newSub.provider_id) {
      const providers = await this.fetchProviders();
      newSub.sub_providers = providers.find((p) => p.id === newSub.provider_id) || null;
    }

    // Try Supabase insert
    try {
      const { data, error } = await supabase
        .from('personal_subscriptions')
        .insert([{
          ...newSub,
          sub_providers: undefined // don't send joined object to column
        }])
        .select('*, sub_providers(*)')
        .single();
      if (!error && data) {
        newSub.id = data.id;
        newSub.sub_providers = data.sub_providers;
      }
    } catch (e) {
      console.warn('Personal sub fallback to local storage:', e);
    }

    // Always update local list for immediate reactivity and offline safety
    const key = this.getStorageKey('personal_subs', userId);
    const list = this.getLocalList<PersonalSubscription>(key);
    list.unshift(newSub);
    this.setLocalList(key, list);

    // Initial payment record
    if (newSub.amount > 0) {
      await this.addPayment(userId, {
        subscription_id: newSub.id,
        amount: newSub.amount,
        currency: newSub.currency,
        payment_date: newSub.purchase_date || newSub.start_date,
        payment_method_label: newSub.payment_method_label || 'Default Method',
        status: 'paid',
        notes: `Initial subscription setup for ${newSub.plan_name}`
      });
    }

    // Initial audit log entry
    await this.logHistory(userId, newSub.id, 'subscription_created', null, newSub.status, 'Tracked subscription created.');

    // Generate reminders
    await this.generateReminders(newSub);

    return newSub;
  }

  public async updateSubscription(id: string, userId: string, patch: Partial<PersonalSubscription>): Promise<PersonalSubscription> {
    const key = this.getStorageKey('personal_subs', userId);
    const list = this.getLocalList<PersonalSubscription>(key);
    const index = list.findIndex((s) => s.id === id);

    let prevStatus: PersonalSubStatus | null = null;
    if (index !== -1) {
      prevStatus = list[index].status;
    }

    // Recompute next_billing_date if frequency or start_date changed and not provided explicitly
    let updatedNextDate = patch.next_billing_date;
    if (!updatedNextDate && patch.billing_frequency && list[index]) {
      updatedNextDate = computeNextBillingDate(
        patch.start_date || list[index].start_date,
        patch.billing_frequency,
        patch.custom_frequency_days !== undefined ? patch.custom_frequency_days : list[index].custom_frequency_days
      );
    }

    const updatedSub: PersonalSubscription = {
      ...(list[index] || {}),
      ...patch,
      next_billing_date: updatedNextDate !== undefined ? updatedNextDate : list[index]?.next_billing_date,
      updated_at: new Date().toISOString()
    } as PersonalSubscription;

    // Try Supabase update
    try {
      await supabase
        .from('personal_subscriptions')
        .update({
          ...patch,
          next_billing_date: updatedSub.next_billing_date,
          updated_at: updatedSub.updated_at,
          sub_providers: undefined
        })
        .eq('id', id)
        .eq('user_id', userId);
    } catch (e) {
      console.warn('Personal sub update fallback to local storage:', e);
    }

    if (index !== -1) {
      list[index] = updatedSub;
    } else {
      list.push(updatedSub);
    }
    this.setLocalList(key, list);

    if (patch.status && patch.status !== prevStatus) {
      await this.logHistory(
        userId,
        id,
        'status_updated',
        prevStatus,
        patch.status,
        `Status changed from ${prevStatus} to ${patch.status}`
      );
    } else {
      await this.logHistory(userId, id, 'subscription_edited', null, updatedSub.status, 'Subscription details updated');
    }

    await this.generateReminders(updatedSub);
    return updatedSub;
  }

  public async archiveSubscription(id: string, userId: string): Promise<void> {
    await this.updateSubscription(id, userId, { is_archived: true });
    await this.logHistory(userId, id, 'subscription_archived', null, null, 'Subscription moved to archive');
  }

  public async unarchiveSubscription(id: string, userId: string): Promise<void> {
    await this.updateSubscription(id, userId, { is_archived: false });
    await this.logHistory(userId, id, 'subscription_unarchived', null, null, 'Subscription restored from archive');
  }

  public async deleteSubscription(id: string, userId: string): Promise<void> {
    try {
      await supabase
        .from('personal_subscriptions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
    } catch (e) {
      console.warn('Delete sub fallback to local storage:', e);
    }

    const key = this.getStorageKey('personal_subs', userId);
    const list = this.getLocalList<PersonalSubscription>(key).filter((s) => s.id !== id);
    this.setLocalList(key, list);

    // Also cleanup payments and reminders
    const payKey = this.getStorageKey('personal_payments', userId);
    this.setLocalList(payKey, this.getLocalList<PersonalSubPayment>(payKey).filter((p) => p.subscription_id !== id));

    const remKey = this.getStorageKey('personal_reminders', userId);
    this.setLocalList(remKey, this.getLocalList<SubRenewalReminder>(remKey).filter((r) => r.subscription_id !== id));

    const docKey = this.getStorageKey('personal_docs', userId);
    this.setLocalList(docKey, this.getLocalList<StoredInvoiceDocument>(docKey).filter((d) => d.subscription_id !== id));
  }

  // Lifecycle workflow actions
  public async requestCancellation(id: string, userId: string, reason?: string): Promise<PersonalSubscription> {
    const sub = await this.getSubscription(id, userId);
    if (!sub) throw new Error('Subscription not found');

    // Keep active until period end if next billing / expiry date is present
    const newStatus: PersonalSubStatus = sub.next_billing_date ? 'cancelled_active' : 'cancelled';
    const updated = await this.updateSubscription(id, userId, {
      status: newStatus,
      auto_renew: false,
      notes: reason ? `${sub.notes ? sub.notes + '\n' : ''}[Cancellation Note]: ${reason}` : sub.notes
    });

    await this.logHistory(
      userId,
      id,
      'cancellation_confirmed',
      sub.status,
      newStatus,
      `Cancellation requested. Active until paid-through date: ${sub.next_billing_date || 'immediate'}. Note: ${reason || 'User confirmed.'}`
    );

    return updated;
  }

  public async reactivateSubscription(id: string, userId: string): Promise<PersonalSubscription> {
    const sub = await this.getSubscription(id, userId);
    if (!sub) throw new Error('Subscription not found');

    const updated = await this.updateSubscription(id, userId, {
      status: 'active',
      auto_renew: true
    });

    await this.logHistory(userId, id, 'reactivation_confirmed', sub.status, 'active', 'Subscription successfully reactivated.');
    return updated;
  }

  // 3. Payment history
  public async fetchPayments(userId: string, subscriptionId?: string): Promise<PersonalSubPayment[]> {
    const key = this.getStorageKey('personal_payments', userId);
    let list: PersonalSubPayment[] = [];

    try {
      let query = supabase.from('personal_sub_payments').select('*, personal_subscriptions(*)').eq('user_id', userId).order('payment_date', { ascending: false });
      if (subscriptionId) {
        query = query.eq('subscription_id', subscriptionId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        list = data as PersonalSubPayment[];
        this.setLocalList(key, list);
      } else {
        list = this.getLocalList<PersonalSubPayment>(key);
      }
    } catch {
      list = this.getLocalList<PersonalSubPayment>(key);
    }

    if (subscriptionId) {
      return list.filter((p) => p.subscription_id === subscriptionId);
    }
    return list;
  }

  public async addPayment(userId: string, input: Partial<PersonalSubPayment>): Promise<PersonalSubPayment> {
    const newPayment: PersonalSubPayment = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'pay-' + Date.now(),
      subscription_id: input.subscription_id || '',
      user_id: userId,
      amount: Number(input.amount) || 0,
      currency: input.currency || 'INR',
      payment_date: input.payment_date || new Date().toISOString().split('T')[0],
      billing_period_start: input.billing_period_start || null,
      billing_period_end: input.billing_period_end || null,
      payment_method_label: input.payment_method_label || 'Online',
      invoice_reference: input.invoice_reference || `INV-${Date.now().toString().slice(-6)}`,
      status: input.status || 'paid',
      notes: input.notes || null,
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('personal_sub_payments').insert([newPayment]);
    } catch (e) {
      console.warn('Payment fallback to local storage:', e);
    }

    const key = this.getStorageKey('personal_payments', userId);
    const list = this.getLocalList<PersonalSubPayment>(key);
    list.unshift(newPayment);
    this.setLocalList(key, list);
    return newPayment;
  }

  // 4. Audit History
  public async fetchHistory(userId: string, subscriptionId: string): Promise<PersonalSubHistory[]> {
    const key = this.getStorageKey('personal_hist', userId);
    try {
      const { data, error } = await supabase
        .from('personal_sub_history')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .order('created_at', { ascending: false });
      if (!error && data) {
        return data as PersonalSubHistory[];
      }
    } catch {
      // fallback
    }

    const list = this.getLocalList<PersonalSubHistory>(key);
    return list.filter((h) => h.subscription_id === subscriptionId);
  }

  public async logHistory(
    userId: string,
    subscriptionId: string,
    action: string,
    prevStatus: string | null,
    newStatus: string | null,
    note?: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const entry: PersonalSubHistory = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'hist-' + Date.now(),
      subscription_id: subscriptionId,
      user_id: userId,
      action,
      previous_status: prevStatus,
      new_status: newStatus,
      user_note: note || null,
      metadata,
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('personal_sub_history').insert([entry]);
    } catch (e) {
      console.warn('History fallback to local storage:', e);
    }

    const key = this.getStorageKey('personal_hist', userId);
    const list = this.getLocalList<PersonalSubHistory>(key);
    list.unshift(entry);
    this.setLocalList(key, list);
  }

  // 5. Invoices & Receipts Management
  public async fetchInvoiceDocuments(userId: string, subscriptionId?: string): Promise<StoredInvoiceDocument[]> {
    const key = this.getStorageKey('personal_docs', userId);
    const localDocs = this.getLocalList<StoredInvoiceDocument>(key);

    try {
      let query = supabase.from('personal_sub_invoices').select('*').eq('user_id', userId);
      if (subscriptionId) {
        query = query.eq('subscription_id', subscriptionId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const remoteDocs: StoredInvoiceDocument[] = data.map((d: any) => ({
          id: d.id,
          subscription_id: d.subscription_id,
          user_id: d.user_id,
          file_name: d.original_file_name || d.invoice_number || 'receipt.pdf',
          file_size: Number(d.file_size_bytes) || 24000,
          file_type: d.mime_type || 'application/pdf',
          file_data: d.file_path || '',
          uploaded_at: d.created_at,
          notes: d.notes || undefined
        }));
        const merged = [...remoteDocs];
        for (const ld of localDocs) {
          if (!merged.find((m) => m.id === ld.id)) merged.push(ld);
        }
        return subscriptionId ? merged.filter((m) => m.subscription_id === subscriptionId) : merged;
      }
    } catch {
      // fallback
    }

    if (subscriptionId) {
      return localDocs.filter((d) => d.subscription_id === subscriptionId);
    }
    return localDocs;
  }

  public async storeInvoiceDocument(userId: string, doc: Omit<StoredInvoiceDocument, 'id' | 'uploaded_at'>): Promise<StoredInvoiceDocument> {
    const newDoc: StoredInvoiceDocument = {
      ...doc,
      id: crypto.randomUUID ? crypto.randomUUID() : 'doc-' + Date.now(),
      uploaded_at: new Date().toISOString()
    };

    try {
      await supabase.from('personal_sub_invoices').insert([{
        id: newDoc.id,
        subscription_id: newDoc.subscription_id,
        user_id: userId,
        invoice_number: 'INV-' + Date.now().toString().slice(-6),
        amount: 0,
        total_amount: 0,
        original_file_name: newDoc.file_name,
        file_size_bytes: newDoc.file_size,
        mime_type: newDoc.file_type,
        file_path: newDoc.file_data?.substring(0, 500) || '',
        notes: newDoc.notes || null,
        payment_status: 'paid'
      }]);
    } catch {
      // fallback
    }

    const key = this.getStorageKey('personal_docs', userId);
    const docs = this.getLocalList<StoredInvoiceDocument>(key);
    docs.unshift(newDoc);
    this.setLocalList(key, docs);
    return newDoc;
  }

  public async deleteInvoiceDocument(userId: string, docId: string): Promise<void> {
    try {
      await supabase.from('personal_sub_invoices').delete().eq('id', docId);
    } catch {
      // fallback
    }
    const key = this.getStorageKey('personal_docs', userId);
    const docs = this.getLocalList<StoredInvoiceDocument>(key).filter((d) => d.id !== docId);
    this.setLocalList(key, docs);
  }

  // 6. Renewal reminders scheduler
  public async generateReminders(sub: PersonalSubscription): Promise<void> {
    if (!sub.next_billing_date) return;
    const targetDate = new Date(sub.next_billing_date);

    // Generate 7-day, 3-day, and 1-day reminders
    const remindersConfig = [
      { type: '7_day', daysBefore: 7 },
      { type: '3_day', daysBefore: 3 },
      { type: '1_day', daysBefore: 1 }
    ];

    if (sub.trial_end_date) {
      remindersConfig.push({ type: 'trial_end', daysBefore: 2 });
    }

    const key = this.getStorageKey('personal_reminders', sub.user_id);
    const existing = this.getLocalList<SubRenewalReminder>(key);

    for (const cfg of remindersConfig) {
      const remindD = new Date(targetDate);
      remindD.setDate(remindD.getDate() - cfg.daysBefore);
      const remindDateStr = remindD.toISOString().split('T')[0];
      const dedupeKey = `${sub.id}_${remindDateStr}_${cfg.type}`;

      if (!existing.some((r) => r.dedupe_key === dedupeKey)) {
        const item: SubRenewalReminder = {
          id: crypto.randomUUID ? crypto.randomUUID() : 'rem-' + Date.now(),
          subscription_id: sub.id,
          user_id: sub.user_id,
          remind_date: remindDateStr,
          reminder_type: cfg.type,
          is_sent: false,
          dedupe_key: dedupeKey,
          created_at: new Date().toISOString()
        };
        existing.push(item);

        try {
          await supabase.from('sub_renewal_reminders').insert([item]);
        } catch {
          // ignore
        }
      }
    }

    this.setLocalList(key, existing);
  }

  // 7. Dashboard Metrics Calculation
  public async getDashboardMetrics(userId: string): Promise<DashboardMetrics> {
    const subs = await this.fetchMySubscriptions(userId, { showArchived: false });
    const payments = await this.fetchPayments(userId);

    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentYearStr = `${now.getFullYear()}`;

    let totalMonthlyExpense = 0;
    let totalActive = 0;
    const byCategory: Record<string, { count: number; monthlyAmount: number }> = {};
    const byFrequency: Record<string, { count: number; monthlyAmount: number }> = {};
    const byProvider: Record<string, { count: number; monthlyAmount: number }> = {};
    const upcomingRenewals: PersonalSubscription[] = [];
    const expiringTrials: PersonalSubscription[] = [];
    const requiresAttention: PersonalSubscription[] = [];

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    for (const s of subs) {
      const isCountedAsActive = s.status === 'active' || s.status === 'trialing' || s.status === 'cancelled_active';
      if (isCountedAsActive) {
        totalActive += 1;
        const monthlyEq = normalizeToMonthly(s.amount, s.billing_frequency, s.custom_frequency_days);
        totalMonthlyExpense += monthlyEq;

        // by category
        const cat = s.category || 'other';
        if (!byCategory[cat]) byCategory[cat] = { count: 0, monthlyAmount: 0 };
        byCategory[cat].count += 1;
        byCategory[cat].monthlyAmount += monthlyEq;

        // by frequency
        const freq = s.billing_frequency || 'monthly';
        if (!byFrequency[freq]) byFrequency[freq] = { count: 0, monthlyAmount: 0 };
        byFrequency[freq].count += 1;
        byFrequency[freq].monthlyAmount += monthlyEq;

        // by provider
        const provName = s.sub_providers?.name || s.custom_provider_name || 'Other';
        if (!byProvider[provName]) byProvider[provName] = { count: 0, monthlyAmount: 0 };
        byProvider[provName].count += 1;
        byProvider[provName].monthlyAmount += monthlyEq;
      }

      // Upcoming renewals check
      if (s.next_billing_date && s.status !== 'cancelled' && s.status !== 'expired') {
        const nextD = new Date(s.next_billing_date);
        if (nextD >= now && nextD <= thirtyDaysFromNow) {
          upcomingRenewals.push(s);
        }
      }

      // Expiring trials
      if (s.status === 'trialing' && s.trial_end_date) {
        const trialD = new Date(s.trial_end_date);
        if (trialD >= now && trialD <= sevenDaysFromNow) {
          expiringTrials.push(s);
        }
      }

      // Attention needed
      if (s.status === 'payment_failed' || s.status === 'unknown' || s.status === 'cancellation_pending') {
        requiresAttention.push(s);
      }
    }

    // Sort upcoming renewals
    upcomingRenewals.sort((a, b) => new Date(a.next_billing_date!).getTime() - new Date(b.next_billing_date!).getTime());

    // Compute actual historical spending from confirmed payments
    let totalSpentThisMonth = 0;
    let totalSpentThisYear = 0;

    for (const p of payments) {
      if (p.status === 'paid' && p.payment_date) {
        if (p.payment_date.startsWith(currentMonthStr)) {
          totalSpentThisMonth += Number(p.amount) || 0;
        }
        if (p.payment_date.startsWith(currentYearStr)) {
          totalSpentThisYear += Number(p.amount) || 0;
        }
      }
    }

    return {
      totalActive,
      totalMonthlyExpense: Math.round(totalMonthlyExpense * 100) / 100,
      estimatedAnnualExpense: Math.round(totalMonthlyExpense * 12 * 100) / 100,
      totalSpentThisMonth: Math.round(totalSpentThisMonth * 100) / 100,
      totalSpentThisYear: Math.round(totalSpentThisYear * 100) / 100,
      upcomingRenewals,
      expiringTrials,
      requiresAttention,
      byCategory,
      byFrequency,
      byProvider
    };
  }
}

export const personalSubscriptionService = new PersonalSubscriptionService();
