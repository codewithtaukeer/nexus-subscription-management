-- ==============================================================================
-- Migration: 20261020000001_nexus_core_schema.sql
-- NEXUS: Subscription & Membership Management System (Topic 34)
-- ==============================================================================

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name text NOT NULL,
    email text NOT NULL UNIQUE,
    phone text NULL,
    avatar_url text NULL,
    role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'operator', 'member')),
    timezone text DEFAULT 'UTC',
    notification_preferences jsonb NOT NULL DEFAULT '{"email": true, "in_app": true}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz NULL
);

-- 2. MEMBERSHIP PLANS
CREATE TABLE IF NOT EXISTS public.membership_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text NULL,
    price_monthly numeric(12,2) NOT NULL DEFAULT 0 CHECK (price_monthly >= 0),
    price_yearly numeric(12,2) NULL CHECK (price_yearly IS NULL OR price_yearly >= 0),
    currency char(3) NOT NULL DEFAULT 'INR',
    trial_days integer NOT NULL DEFAULT 0 CHECK (trial_days >= 0),
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
    sort_order integer NOT NULL DEFAULT 0,
    max_members integer NULL CHECK (max_members IS NULL OR max_members > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. PLAN FEATURES (Normalized 1:N)
CREATE TABLE IF NOT EXISTS public.plan_features (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id uuid NOT NULL REFERENCES public.membership_plans(id) ON DELETE RESTRICT,
    feature_key text NOT NULL,
    label text NOT NULL,
    description text NULL,
    included boolean NOT NULL DEFAULT true,
    limit_value numeric(14,2) NULL,
    unit text NULL,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(plan_id, feature_key)
);

-- 4. SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    plan_id uuid NOT NULL REFERENCES public.membership_plans(id) ON DELETE RESTRICT,
    status text NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'paused', 'cancelled', 'expired')),
    billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly', 'one_time')),
    current_period_start timestamptz NOT NULL,
    current_period_end timestamptz NOT NULL,
    trial_ends_at timestamptz NULL,
    cancel_at_period_end boolean NOT NULL DEFAULT false,
    cancelled_at timestamptz NULL,
    ended_at timestamptz NULL,
    auto_renew boolean NOT NULL DEFAULT true,
    next_billing_at timestamptz NULL,
    price_at_signup numeric(12,2) NOT NULL CHECK (price_at_signup >= 0),
    currency char(3) NOT NULL DEFAULT 'INR',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (current_period_end > current_period_start)
);

-- 5. SUBSCRIPTION EVENTS
CREATE TABLE IF NOT EXISTS public.subscription_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    actor_id uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    event_type text NOT NULL,
    previous_status text NULL,
    new_status text NULL,
    reason text NULL,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. INVOICES
CREATE TABLE IF NOT EXISTS public.invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number text NOT NULL UNIQUE,
    subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE RESTRICT,
    member_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    period_start timestamptz NOT NULL,
    period_end timestamptz NOT NULL,
    subtotal numeric(12,2) NOT NULL CHECK (subtotal >= 0),
    discount_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    tax_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    total_amount numeric(12,2) NOT NULL CHECK (total_amount >= 0),
    currency char(3) NOT NULL DEFAULT 'INR',
    status text NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'overdue')),
    issued_at timestamptz NOT NULL DEFAULT now(),
    due_at timestamptz NULL,
    paid_at timestamptz NULL,
    description text NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. PAYMENT TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
    provider text NOT NULL DEFAULT 'demo',
    method_label text NOT NULL DEFAULT 'Demo Payment (Simulated)',
    provider_reference text NOT NULL UNIQUE,
    amount numeric(12,2) NOT NULL CHECK (amount >= 0),
    currency char(3) NOT NULL DEFAULT 'INR',
    status text NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
    response_code text NULL,
    safe_message text NULL,
    attempted_at timestamptz NOT NULL DEFAULT now()
);

-- 8. COUPONS & REDEMPTIONS
CREATE TABLE IF NOT EXISTS public.coupons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    discount_type text NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
    discount_value numeric(10,2) NOT NULL CHECK (discount_value > 0),
    starts_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NULL,
    max_redemptions integer NULL CHECK (max_redemptions IS NULL OR max_redemptions > 0),
    per_member_limit integer NOT NULL DEFAULT 1 CHECK (per_member_limit > 0),
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.coupon_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    plan_id uuid NOT NULL REFERENCES public.membership_plans(id) ON DELETE CASCADE,
    UNIQUE(coupon_id, plan_id)
);

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE RESTRICT,
    member_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
    subscription_id uuid NULL REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    discount_amount numeric(12,2) NOT NULL CHECK (discount_amount >= 0),
    redeemed_at timestamptz NOT NULL DEFAULT now()
);

-- 9. USAGE EVENTS
CREATE TABLE IF NOT EXISTS public.usage_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE RESTRICT,
    member_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    feature_key text NOT NULL,
    quantity numeric(14,2) NOT NULL CHECK (quantity > 0),
    unit text NULL,
    source text NULL DEFAULT 'web',
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    occurred_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 10. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    kind text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    related_entity_type text NULL,
    related_entity_id text NULL,
    delivery_channel text NOT NULL DEFAULT 'in_app',
    delivery_status text NOT NULL DEFAULT 'delivered',
    read_at timestamptz NULL,
    dedupe_key text UNIQUE NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 11. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text NULL,
    request_id text NULL,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 12. CHURN PREDICTIONS (AI/ML)
CREATE TABLE IF NOT EXISTS public.churn_predictions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    prediction_date timestamptz NOT NULL DEFAULT now(),
    risk_score numeric(5,4) NOT NULL CHECK (risk_score BETWEEN 0 AND 1),
    risk_level text NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    model_version text NOT NULL DEFAULT 'v1.0-rf',
    top_factors jsonb NOT NULL DEFAULT '[]'::jsonb,
    data_window_start timestamptz NULL,
    data_window_end timestamptz NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subs_member_status ON public.subscriptions(member_id, status);
CREATE INDEX IF NOT EXISTS idx_subs_status_period ON public.subscriptions(status, current_period_end);
CREATE INDEX IF NOT EXISTS idx_subs_plan ON public.subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_invoices_member_status ON public.invoices(member_id, status, due_at);
CREATE INDEX IF NOT EXISTS idx_invoices_subs ON public.invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_tx_invoice_attempted ON public.payment_transactions(invoice_id, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_subs_feature ON public.usage_events(subscription_id, feature_key, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_member_read ON public.notifications(member_id, read_at);
CREATE INDEX IF NOT EXISTS idx_churn_subs_date ON public.churn_predictions(subscription_id, prediction_date DESC);
