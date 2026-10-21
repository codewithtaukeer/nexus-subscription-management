-- Migration: 20261021000004_personal_subscriptions.sql
-- Personal Subscription Management, Provider Catalog, Audit History, Payments, and Renewal Reminders

-- 1. SUB PROVIDERS TABLE
CREATE TABLE IF NOT EXISTS public.sub_providers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    name text NOT NULL,
    category text NOT NULL CHECK (category IN ('entertainment','productivity','shopping','development','education','gaming','fitness','news','finance','health','other')),
    logo_url text NULL,
    website_url text NULL,
    manage_url text NULL,  -- Official subscription management page URL
    supports_direct_cancel boolean NOT NULL DEFAULT false,
    supports_direct_reactivate boolean NOT NULL DEFAULT false,
    notes text NULL,
    is_custom boolean NOT NULL DEFAULT false,
    created_by uuid NULL REFERENCES public.profiles(id),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. PERSONAL SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.personal_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider_id uuid REFERENCES public.sub_providers(id) ON DELETE SET NULL,
    custom_provider_name text NULL,  -- when no provider_id
    plan_name text NOT NULL,
    plan_tier text NULL,
    category text NOT NULL DEFAULT 'other',
    amount numeric(12,2) NOT NULL CHECK (amount >= 0),
    currency char(3) NOT NULL DEFAULT 'INR',
    billing_frequency text NOT NULL CHECK (billing_frequency IN ('weekly','monthly','quarterly','half_yearly','yearly','one_time','custom')),
    custom_frequency_days integer NULL CHECK (custom_frequency_days IS NULL OR custom_frequency_days > 0),
    start_date date NOT NULL,
    purchase_date date NULL,
    next_billing_date date NULL,
    expiry_date date NULL,
    trial_start_date date NULL,
    trial_end_date date NULL,
    auto_renew boolean NOT NULL DEFAULT true,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('trialing','active','cancellation_pending','cancellation_scheduled','cancelled_active','cancelled','expired','paused','payment_failed','reactivation_pending','unknown')),
    status_source text NOT NULL DEFAULT 'user_reported' CHECK (status_source IN ('user_reported','provider_verified','integration_synced')),
    payment_method_label text NULL,
    account_nickname text NULL,
    manage_url text NULL,
    notes text NULL,
    is_archived boolean NOT NULL DEFAULT false,
    is_tracking_paused boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. PERSONAL SUB HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.personal_sub_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id uuid NOT NULL REFERENCES public.personal_subscriptions(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id),
    action text NOT NULL,
    previous_status text NULL,
    new_status text NULL,
    user_note text NULL,
    metadata jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. PERSONAL SUB PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.personal_sub_payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id uuid NOT NULL REFERENCES public.personal_subscriptions(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id),
    amount numeric(12,2) NOT NULL,
    currency char(3) NOT NULL DEFAULT 'INR',
    payment_date date NOT NULL,
    billing_period_start date NULL,
    billing_period_end date NULL,
    payment_method_label text NULL,
    invoice_reference text NULL,
    status text NOT NULL DEFAULT 'paid' CHECK (status IN ('paid','pending','failed','refunded')),
    notes text NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. SUB RENEWAL REMINDERS TABLE
CREATE TABLE IF NOT EXISTS public.sub_renewal_reminders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id uuid NOT NULL REFERENCES public.personal_subscriptions(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id),
    remind_date date NOT NULL,
    reminder_type text NOT NULL DEFAULT '7_day' CHECK (reminder_type IN ('trial_end','1_day','3_day','7_day','30_day','custom')),
    is_sent boolean NOT NULL DEFAULT false,
    sent_at timestamptz NULL,
    dedupe_key text NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_personal_subs_user ON public.personal_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_subs_status ON public.personal_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_personal_subs_next_billing ON public.personal_subscriptions(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_personal_subs_provider ON public.personal_subscriptions(provider_id);
CREATE INDEX IF NOT EXISTS idx_personal_sub_payments_sub ON public.personal_sub_payments(subscription_id, user_id);
CREATE INDEX IF NOT EXISTS idx_personal_sub_payments_date ON public.personal_sub_payments(user_id, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_personal_sub_history_sub ON public.personal_sub_history(subscription_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sub_renewal_reminders_date ON public.sub_renewal_reminders(remind_date, is_sent);

-- 6. SEED WELL-KNOWN PROVIDERS
INSERT INTO public.sub_providers (slug, name, category, logo_url, website_url, manage_url, supports_direct_cancel, is_custom) VALUES
('netflix','Netflix','entertainment','https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg','https://netflix.com','https://netflix.com/cancelplan',false,false),
('spotify','Spotify Premium','entertainment','https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg','https://spotify.com','https://spotify.com/account/subscription',false,false),
('youtube-premium','YouTube Premium','entertainment','https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg','https://youtube.com','https://youtube.com/paid_memberships',false,false),
('amazon-prime','Amazon Prime','shopping','https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg','https://amazon.in','https://amazon.in/mc/pipelines/home',false,false),
('microsoft-365','Microsoft 365','productivity','https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/1024px-Microsoft_logo.svg.png','https://microsoft.com','https://account.microsoft.com/services',false,false),
('google-one','Google One','productivity','https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg','https://one.google.com','https://one.google.com/storage',false,false),
('github-pro','GitHub Pro','development','https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png','https://github.com','https://github.com/settings/billing',false,false),
('notion','Notion','productivity',NULL,'https://notion.so','https://notion.so/profile/billing',false,false),
('canva-pro','Canva Pro','productivity',NULL,'https://canva.com','https://canva.com/settings/billing',false,false),
('hotstar','Disney+ Hotstar','entertainment',NULL,'https://hotstar.com','https://hotstar.com/in/account/manage-subscription',false,false),
('zee5','ZEE5','entertainment',NULL,'https://zee5.com','https://zee5.com/subscription/manage',false,false),
('prime-video','Amazon Prime Video','entertainment',NULL,'https://primevideo.com','https://primevideo.com/settings',false,false),
('apple-icloud','Apple iCloud+','productivity',NULL,'https://icloud.com','https://appleid.apple.com',false,false),
('discord-nitro','Discord Nitro','gaming',NULL,'https://discord.com','https://discord.com/billing',false,false),
('linkedin-premium','LinkedIn Premium','productivity',NULL,'https://linkedin.com','https://linkedin.com/premium/manage',false,false)
ON CONFLICT (slug) DO NOTHING;

-- 7. RLS POLICIES
ALTER TABLE public.personal_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "personal_subs_own" ON public.personal_subscriptions FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "personal_subs_demo" ON public.personal_subscriptions FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.personal_sub_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "personal_sub_hist_own" ON public.personal_sub_history FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "personal_sub_hist_demo" ON public.personal_sub_history FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.personal_sub_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "personal_sub_pay_own" ON public.personal_sub_payments FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "personal_sub_pay_demo" ON public.personal_sub_payments FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.sub_renewal_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sub_reminders_own" ON public.sub_renewal_reminders FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "sub_reminders_demo" ON public.sub_renewal_reminders FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.sub_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sub_providers_read" ON public.sub_providers FOR SELECT USING (true);
CREATE POLICY "sub_providers_own_custom" ON public.sub_providers FOR INSERT WITH CHECK (is_custom = true AND created_by = auth.uid());
CREATE POLICY "sub_providers_anon_custom" ON public.sub_providers FOR INSERT TO anon WITH CHECK (is_custom = true);
