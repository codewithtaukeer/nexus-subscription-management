import { createClient } from '@supabase/supabase-js';
import type { 
  Profile, 
  MembershipPlan, 
  PlanFeature, 
  Subscription, 
  Invoice, 
  PaymentTransaction, 
  Coupon, 
  NotificationItem, 
  AuditLog, 
  ChurnPrediction,
  SubscriptionOverviewView,
  MonthlyRevenueView,
  PlanPerformanceView,
  ExpiringSoonView
} from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vetyyyemzhqinqoeqakz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldHl5eWVtemhxaW5xb2VxYWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNzA2OTYsImV4cCI6MjEwNzY0NjY5Nn0.xJnXjekIYjzw1QRP9MkFFfku6NPzfePgGwyy6mR1QoI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================================
// DATA ACCESS & RPC METHODS
// ============================================================================

export async function fetchPlans(): Promise<MembershipPlan[]> {
  const { data, error } = await supabase
    .from('membership_plans')
    .select(`
      *,
      features:plan_features(*)
    `)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching plans:', error);
    throw error;
  }
  return data || [];
}

export async function fetchMembers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching members:', error);
    throw error;
  }
  return data || [];
}

export async function fetchSubscriptions(): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      profiles:member_id(*),
      membership_plans:plan_id(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching subscriptions:', error);
    throw error;
  }
  return data || [];
}

export async function fetchSubscriptionOverview(): Promise<SubscriptionOverviewView[]> {
  const { data, error } = await supabase
    .from('v_subscription_overview')
    .select('*');

  if (error) {
    console.error('Error fetching v_subscription_overview:', error);
    throw error;
  }
  return data || [];
}

export async function fetchInvoices(): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      profiles:member_id(*),
      subscriptions:subscription_id(*),
      payment_transactions(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
  return data || [];
}

export async function fetchCoupons(): Promise<Coupon[]> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchNotifications(memberId?: string): Promise<NotificationItem[]> {
  let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });
  if (memberId) {
    query = query.eq('member_id', memberId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsAsRead(memberId?: string): Promise<void> {
  let query = supabase.from('notifications').update({ read_at: new Date().toISOString() });
  if (memberId) {
    query = query.eq('member_id', memberId);
  } else {
    query = query.is('read_at', null);
  }
  const { error } = await query;
  if (error) throw error;
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*, profiles:actor_id(full_name, email, role)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
}

export async function fetchChurnPredictions(): Promise<ChurnPrediction[]> {
  const { data, error } = await supabase
    .from('churn_predictions')
    .select(`
      *,
      subscriptions:subscription_id(
        id,
        status,
        current_period_end,
        profiles:member_id(full_name, email),
        membership_plans:plan_id(name, price_monthly)
      )
    `)
    .order('risk_score', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchExpiringSoon(): Promise<ExpiringSoonView[]> {
  const { data, error } = await supabase
    .from('v_expiring_soon')
    .select('*');
  if (error) throw error;
  return data || [];
}

export async function fetchPlanPerformance(): Promise<PlanPerformanceView[]> {
  const { data, error } = await supabase
    .from('v_plan_performance')
    .select('*');
  if (error) throw error;
  return data || [];
}

export async function fetchMonthlyRevenue(): Promise<MonthlyRevenueView[]> {
  const { data, error } = await supabase
    .from('v_monthly_revenue')
    .select('*');
  if (error) throw error;
  return data || [];
}

// ============================================================================
// TRANSACTIONAL RPCS (Supabase Postgres Functions)
// ============================================================================

export async function createSubscriptionRpc(params: {
  memberId: string;
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  couponCode?: string;
}) {
  const { data, error } = await supabase.rpc('nexus_create_subscription', {
    p_member_id: params.memberId,
    p_plan_id: params.planId,
    p_billing_cycle: params.billingCycle,
    p_coupon_code: params.couponCode || null,
  });

  if (error) throw error;
  return data;
}

export async function simulatePaymentRpc(params: {
  invoiceId: string;
  simulateSuccess: boolean;
  methodLabel?: string;
}) {
  const { data, error } = await supabase.rpc('nexus_simulate_payment', {
    p_invoice_id: params.invoiceId,
    p_simulate_success: params.simulateSuccess,
    p_method_label: params.methodLabel || 'Demo Payment Simulator',
  });

  if (error) throw error;
  return data;
}

export async function runRenewalScanRpc() {
  const { data, error } = await supabase.rpc('nexus_run_renewal_scan');
  if (error) throw error;
  return data;
}

export async function testAcidRollbackRpc(params: {
  memberId: string;
  triggerError: boolean;
}) {
  const { data, error } = await supabase.rpc('nexus_test_acid_rollback', {
    p_member_id: params.memberId,
    p_trigger_error: params.triggerError,
  });

  if (error) throw error;
  return data;
}
