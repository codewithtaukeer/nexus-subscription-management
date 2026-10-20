export type UserRole = 'admin' | 'operator' | 'member';

export type SubscriptionStatus = 
  | 'trialing' 
  | 'active' 
  | 'past_due' 
  | 'paused' 
  | 'cancelled' 
  | 'expired';

export type BillingCycle = 'monthly' | 'yearly' | 'one_time';

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'overdue';

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

export type PlanStatus = 'active' | 'draft' | 'archived';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  timezone?: string | null;
  notification_preferences: {
    email?: boolean;
    in_app?: boolean;
    sms?: boolean;
  };
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface PlanFeature {
  id: string;
  plan_id: string;
  feature_key: string;
  label: string;
  description?: string | null;
  included: boolean;
  limit_value?: number | null;
  unit?: string | null;
  sort_order: number;
  created_at: string;
}

export interface MembershipPlan {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price_monthly: number;
  price_yearly?: number | null;
  currency: string;
  trial_days: number;
  status: PlanStatus;
  sort_order: number;
  max_members?: number | null;
  created_at: string;
  updated_at: string;
  features?: PlanFeature[];
}

export interface Subscription {
  id: string;
  member_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  current_period_start: string;
  current_period_end: string;
  trial_ends_at?: string | null;
  cancel_at_period_end: boolean;
  cancelled_at?: string | null;
  ended_at?: string | null;
  auto_renew: boolean;
  next_billing_at?: string | null;
  price_at_signup: number;
  currency: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  profiles?: Profile;
  membership_plans?: MembershipPlan;
}

export interface SubscriptionEvent {
  id: string;
  subscription_id: string;
  actor_id?: string | null;
  event_type: string;
  previous_status?: string | null;
  new_status?: string | null;
  reason?: string | null;
  metadata: Record<string, any>;
  created_at: string;
  profiles?: Profile | null;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  subscription_id: string;
  member_id: string;
  period_start: string;
  period_end: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: InvoiceStatus;
  issued_at: string;
  due_at?: string | null;
  paid_at?: string | null;
  description?: string | null;
  created_at: string;
  profiles?: Profile;
  subscriptions?: Subscription;
  payment_transactions?: PaymentTransaction[];
}

export interface PaymentTransaction {
  id: string;
  invoice_id: string;
  provider: string;
  method_label: string;
  provider_reference: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  response_code?: string | null;
  safe_message?: string | null;
  attempted_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  starts_at: string;
  expires_at?: string | null;
  max_redemptions?: number | null;
  per_member_limit: number;
  status: 'active' | 'inactive' | 'expired';
  created_at: string;
}

export interface UsageEvent {
  id: string;
  subscription_id: string;
  member_id: string;
  feature_key: string;
  quantity: number;
  unit?: string | null;
  source?: string | null;
  metadata?: Record<string, any>;
  occurred_at: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  member_id: string;
  kind: string;
  title: string;
  body: string;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  delivery_channel: string;
  delivery_status: string;
  read_at?: string | null;
  dedupe_key?: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  request_id?: string | null;
  metadata: Record<string, any>;
  created_at: string;
  profiles?: Profile | null;
}

export interface ChurnPrediction {
  id: string;
  subscription_id: string;
  prediction_date: string;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high';
  model_version: string;
  top_factors: Array<{ factor: string; impact: string }>;
  data_window_start?: string | null;
  data_window_end?: string | null;
  created_at: string;
  subscriptions?: Subscription;
}

// View types
export interface SubscriptionOverviewView {
  subscription_id: string;
  member_id: string;
  member_name: string;
  member_email: string;
  plan_id: string;
  plan_name: string;
  plan_slug: string;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  price_at_signup: number;
  currency: string;
  current_period_start: string;
  current_period_end: string;
  auto_renew: boolean;
  cancel_at_period_end: boolean;
  trial_ends_at?: string | null;
  days_until_renewal: number;
  created_at: string;
}

export interface MonthlyRevenueView {
  revenue_month: string;
  currency: string;
  total_invoices_paid: number;
  total_revenue: number;
  avg_invoice_value: number;
  paying_members_count: number;
}

export interface ExpiringSoonView {
  subscription_id: string;
  member_id: string;
  full_name: string;
  email: string;
  plan_name: string;
  status: SubscriptionStatus;
  current_period_end: string;
  days_remaining: number;
}

export interface PlanPerformanceView {
  plan_id: string;
  plan_name: string;
  slug: string;
  plan_status: PlanStatus;
  price_monthly: number;
  total_all_time_subscribers: number;
  active_subscribers: number;
  cancelled_subscribers: number;
  lifetime_collected_revenue: number;
}
