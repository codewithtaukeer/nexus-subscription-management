-- ==============================================================================
-- Migration: 20261020000003_nexus_seed_data.sql
-- Seed Data for Topic 34 Subscription & Membership Management
-- ==============================================================================

DO $$
DECLARE
    v_admin_id uuid := 'a0000000-0000-0000-0000-000000000001';
    v_oper_id  uuid := 'a0000000-0000-0000-0000-000000000002';
    v_m1_id    uuid := 'b0000000-0000-0000-0000-000000000001';
    v_m2_id    uuid := 'b0000000-0000-0000-0000-000000000002';
    v_m3_id    uuid := 'b0000000-0000-0000-0000-000000000003';
    v_m4_id    uuid := 'b0000000-0000-0000-0000-000000000004';
    v_m5_id    uuid := 'b0000000-0000-0000-0000-000000000005';
    v_m6_id    uuid := 'b0000000-0000-0000-0000-000000000006';
    v_m7_id    uuid := 'b0000000-0000-0000-0000-000000000007';

    v_p_starter uuid := 'c0000000-0000-0000-0000-000000000001';
    v_p_pro     uuid := 'c0000000-0000-0000-0000-000000000002';
    v_p_apex    uuid := 'c0000000-0000-0000-0000-000000000003';
    v_p_legacy  uuid := 'c0000000-0000-0000-0000-000000000004';

    v_sub1 uuid := 'd0000000-0000-0000-0000-000000000001';
    v_sub2 uuid := 'd0000000-0000-0000-0000-000000000002';
    v_sub3 uuid := 'd0000000-0000-0000-0000-000000000003';
    v_sub4 uuid := 'd0000000-0000-0000-0000-000000000004';
    v_sub5 uuid := 'd0000000-0000-0000-0000-000000000005';
    v_sub6 uuid := 'd0000000-0000-0000-0000-000000000006';
    v_sub7 uuid := 'd0000000-0000-0000-0000-000000000007';

    v_inv1 uuid := 'e0000000-0000-0000-0000-000000000001';
    v_inv2 uuid := 'e0000000-0000-0000-0000-000000000002';
    v_inv3 uuid := 'e0000000-0000-0000-0000-000000000003';
    v_inv4 uuid := 'e0000000-0000-0000-0000-000000000004';
    v_inv5 uuid := 'e0000000-0000-0000-0000-000000000005';

    v_cp1 uuid := 'f0000000-0000-0000-0000-000000000001';
    v_cp2 uuid := 'f0000000-0000-0000-0000-000000000002';
BEGIN
    INSERT INTO public.profiles (id, full_name, email, phone, role, timezone)
    VALUES 
    (v_admin_id, 'Alex Vance (Admin)', 'admin@nexus.io', '+91 9876543210', 'admin', 'Asia/Kolkata'),
    (v_oper_id,  'Elena Rostova (Operator)', 'operator@nexus.io', '+91 9876543211', 'operator', 'Asia/Kolkata'),
    (v_m1_id,    'Marcus Chen', 'marcus.chen@example.com', '+91 9876543212', 'member', 'UTC'),
    (v_m2_id,    'Priya Sharma', 'priya.sharma@example.com', '+91 9876543213', 'member', 'Asia/Kolkata'),
    (v_m3_id,    'David Miller', 'david.miller@example.com', '+91 9876543214', 'member', 'America/New_York'),
    (v_m4_id,    'Sarah Jenkins', 'sarah.j@example.com', '+91 9876543215', 'member', 'Europe/London'),
    (v_m5_id,    'Kenji Sato', 'kenji.sato@example.com', '+91 9876543216', 'member', 'Asia/Tokyo'),
    (v_m6_id,    'Aisha Patel', 'aisha.patel@example.com', '+91 9876543217', 'member', 'Asia/Kolkata'),
    (v_m7_id,    'Robert Torres', 'robert.t@example.com', '+91 9876543218', 'member', 'America/Los_Angeles')
    ON CONFLICT (email) DO NOTHING;

    INSERT INTO public.membership_plans (id, name, slug, description, price_monthly, price_yearly, currency, trial_days, status, sort_order)
    VALUES
    (v_p_starter, 'Quantum Starter', 'quantum-starter', 'Essential features for developer prototyping and evaluation.', 0.00, 0.00, 'INR', 14, 'active', 1),
    (v_p_pro,     'Nexus Pro',        'nexus-pro',        'Advanced computing power with multi-model analytics and priority support.', 2499.00, 24990.00, 'INR', 7, 'active', 2),
    (v_p_apex,    'Enterprise Apex', 'enterprise-apex',  'Dedicated cluster resources, SLA guarantees, and limitless retention models.', 7999.00, 79990.00, 'INR', 0, 'active', 3),
    (v_p_legacy,  'Legacy Core',     'legacy-core',      'Archived legacy tier preserved for historical subscriptions.', 1499.00, 14990.00, 'INR', 0, 'archived', 4)
    ON CONFLICT (slug) DO NOTHING;

    INSERT INTO public.plan_features (plan_id, feature_key, label, description, included, limit_value, unit, sort_order)
    VALUES
    (v_p_starter, 'api_calls', 'API Queries / Month', 'Standard API requests', true, 10000, 'req/mo', 1),
    (v_p_starter, 'storage', 'Vector Storage', 'Indexed cloud memory', true, 5, 'GB', 2),
    (v_p_starter, 'analytics', 'Basic Churn Insights', 'Weekly retention batch score', true, NULL, NULL, 3),
    (v_p_starter, 'sla', 'Guaranteed SLA', 'Service uptime commitment', false, NULL, NULL, 4),

    (v_p_pro, 'api_calls', 'API Queries / Month', 'Priority high-speed gateway', true, 100000, 'req/mo', 1),
    (v_p_pro, 'storage', 'Vector Storage', 'Ultra-fast memory tier', true, 50, 'GB', 2),
    (v_p_pro, 'analytics', 'Real-time Churn Intelligence', 'Live ML inference scoring', true, NULL, NULL, 3),
    (v_p_pro, 'sla', '99.9% High Availability SLA', 'Enterprise SLA backed by refunds', true, NULL, NULL, 4),

    (v_p_apex, 'api_calls', 'API Queries / Month', 'Unlimited unmetered requests', true, NULL, 'Unlimited', 1),
    (v_p_apex, 'storage', 'Vector Storage', 'Distributed dedicated volume', true, 500, 'GB', 2),
    (v_p_apex, 'analytics', 'Dedicated ML Cluster', 'Custom retrained weights', true, NULL, NULL, 3),
    (v_p_apex, 'sla', '99.99% Mission-Critical SLA', '24/7 dedicated telephone support', true, NULL, NULL, 4)
    ON CONFLICT (plan_id, feature_key) DO NOTHING;

    INSERT INTO public.subscriptions (id, member_id, plan_id, status, billing_cycle, current_period_start, current_period_end, auto_renew, price_at_signup, currency)
    VALUES
    (v_sub1, v_m1_id, v_p_pro, 'active', 'monthly', now() - INTERVAL '25 days', now() + INTERVAL '5 days', true, 2499.00, 'INR'),
    (v_sub2, v_m2_id, v_p_apex, 'active', 'yearly', now() - INTERVAL '165 days', now() + INTERVAL '200 days', true, 79990.00, 'INR'),
    (v_sub3, v_m3_id, v_p_starter, 'trialing', 'monthly', now() - INTERVAL '10 days', now() + INTERVAL '4 days', true, 0.00, 'INR'),
    (v_sub4, v_m4_id, v_p_pro, 'past_due', 'monthly', now() - INTERVAL '33 days', now() - INTERVAL '3 days', true, 2499.00, 'INR'),
    (v_sub5, v_m5_id, v_p_pro, 'paused', 'monthly', now() - INTERVAL '40 days', now() + INTERVAL '20 days', false, 2499.00, 'INR'),
    (v_sub6, v_m6_id, v_p_apex, 'cancelled', 'monthly', now() - INTERVAL '60 days', now() - INTERVAL '30 days', false, 7999.00, 'INR'),
    (v_sub7, v_m7_id, v_p_starter, 'expired', 'monthly', now() - INTERVAL '90 days', now() - INTERVAL '60 days', false, 0.00, 'INR')
    ON CONFLICT (id) DO NOTHING;

    UPDATE public.subscriptions SET trial_ends_at = now() + INTERVAL '4 days' WHERE id = v_sub3;
    UPDATE public.subscriptions SET cancelled_at = now() - INTERVAL '35 days', ended_at = now() - INTERVAL '30 days' WHERE id = v_sub6;

    INSERT INTO public.invoices (id, invoice_number, subscription_id, member_id, period_start, period_end, subtotal, discount_amount, tax_amount, total_amount, currency, status, issued_at, paid_at)
    VALUES
    (v_inv1, 'INV-202610-001', v_sub1, v_m1_id, now() - INTERVAL '25 days', now() + INTERVAL '5 days', 2499.00, 0, 0, 2499.00, 'INR', 'paid', now() - INTERVAL '25 days', now() - INTERVAL '25 days'),
    (v_inv2, 'INV-202605-002', v_sub2, v_m2_id, now() - INTERVAL '165 days', now() + INTERVAL '200 days', 79990.00, 7999.00, 0, 71991.00, 'INR', 'paid', now() - INTERVAL '165 days', now() - INTERVAL '165 days'),
    (v_inv3, 'INV-202610-003', v_sub4, v_m4_id, now() - INTERVAL '33 days', now() - INTERVAL '3 days', 2499.00, 0, 0, 2499.00, 'INR', 'overdue', now() - INTERVAL '3 days', NULL),
    (v_inv4, 'INV-202610-004', v_sub1, v_m1_id, now() + INTERVAL '5 days', now() + INTERVAL '35 days', 2499.00, 0, 0, 2499.00, 'INR', 'open', now() - INTERVAL '1 day', NULL),
    (v_inv5, 'INV-202608-005', v_sub6, v_m6_id, now() - INTERVAL '60 days', now() - INTERVAL '30 days', 7999.00, 0, 0, 7999.00, 'INR', 'paid', now() - INTERVAL '60 days', now() - INTERVAL '60 days')
    ON CONFLICT (invoice_number) DO NOTHING;

    INSERT INTO public.payment_transactions (id, invoice_id, provider, method_label, provider_reference, amount, currency, status, safe_message, attempted_at)
    VALUES
    (gen_random_uuid(), v_inv1, 'demo', 'Demo NetBanking (Simulated)', 'TX-DEMO-202610-01', 2499.00, 'INR', 'succeeded', 'Approved with simulated auth', now() - INTERVAL '25 days'),
    (gen_random_uuid(), v_inv2, 'demo', 'Demo UPI AutoPay (Simulated)', 'TX-DEMO-202605-02', 71991.00, 'INR', 'succeeded', 'Settled via instant UPI intent', now() - INTERVAL '165 days'),
    (gen_random_uuid(), v_inv3, 'demo', 'Demo Credit Card (Simulated)', 'TX-DEMO-202610-03F', 2499.00, 'INR', 'failed', 'Declined: Insufficient balance on card', now() - INTERVAL '3 days'),
    (gen_random_uuid(), v_inv5, 'demo', 'Demo Corporate Wire', 'TX-DEMO-202608-05', 7999.00, 'INR', 'succeeded', 'Manual settlement confirmed', now() - INTERVAL '60 days');

    INSERT INTO public.coupons (id, code, discount_type, discount_value, starts_at, expires_at, max_redemptions, per_member_limit, status)
    VALUES
    (v_cp1, 'NEXUS20', 'percent', 20.00, now() - INTERVAL '30 days', now() + INTERVAL '90 days', 500, 1, 'active'),
    (v_cp2, 'WELCOME500', 'fixed', 500.00, now() - INTERVAL '30 days', now() + INTERVAL '60 days', 1000, 1, 'active')
    ON CONFLICT (code) DO NOTHING;

    INSERT INTO public.notifications (member_id, kind, title, body, related_entity_type, related_entity_id, dedupe_key, created_at)
    VALUES
    (v_m1_id, 'renewal_reminder', 'Upcoming Renewal for Nexus Pro', 'Your Nexus Pro membership will renew in 5 days on ' || TO_CHAR(now() + INTERVAL '5 days', 'Mon DD, YYYY') || '.', 'subscription', v_sub1::text, 'notif_sub1_seed', now() - INTERVAL '1 day'),
    (v_m4_id, 'payment_failure', 'Action Required: Payment Overdue', 'Your scheduled invoice INV-202610-003 was declined. Please retry to maintain active service.', 'invoice', v_inv3::text, 'notif_inv3_seed', now() - INTERVAL '2 days'),
    (v_m2_id, 'payment_success', 'Payment Settled: INV-202605-002', 'Receipt confirmed for ₹71,991.00 Enterprise Apex Annual.', 'invoice', v_inv2::text, 'notif_inv2_seed', now() - INTERVAL '165 days');

    INSERT INTO public.churn_predictions (subscription_id, risk_score, risk_level, model_version, top_factors)
    VALUES
    (v_sub4, 0.8842, 'high', 'v1.0-rf', jsonb_build_array(
        jsonb_build_object('factor', 'Failed payment attempts', 'impact', '+0.45'),
        jsonb_build_object('factor', 'Days since active API usage (>14d)', 'impact', '+0.25'),
        jsonb_build_object('factor', 'Approaching period end without auto-pay', 'impact', '+0.18')
    )),
    (v_sub5, 0.6520, 'medium', 'v1.0-rf', jsonb_build_array(
        jsonb_build_object('factor', 'Subscription currently paused', 'impact', '+0.35'),
        jsonb_build_object('factor', 'Decline in weekly query volume', 'impact', '+0.20'),
        jsonb_build_object('factor', 'Long tenure (>120 days)', 'impact', '-0.15')
    )),
    (v_sub1, 0.1250, 'low', 'v1.0-rf', jsonb_build_array(
        jsonb_build_object('factor', 'Consistent daily active usage', 'impact', '-0.40'),
        jsonb_build_object('factor', 'Zero failed invoice records', 'impact', '-0.30'),
        jsonb_build_object('factor', 'Auto-renew enabled', 'impact', '-0.20')
    )),
    (v_sub2, 0.0520, 'low', 'v1.0-rf', jsonb_build_array(
        jsonb_build_object('factor', 'Annual commitment paid in full', 'impact', '-0.50'),
        jsonb_build_object('factor', 'High vector storage utilization', 'impact', '-0.35')
    ));

    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
    VALUES
    (v_admin_id, 'SYSTEM_INIT', 'system', 'nexus_core', jsonb_build_object('version', '1.0.0', 'environment', 'production_baseline')),
    (v_admin_id, 'CREATE_PLAN', 'plan', v_p_pro::text, jsonb_build_object('slug', 'nexus-pro', 'price', 2499)),
    (v_oper_id,  'OVERDUE_ALERT', 'invoice', v_inv3::text, jsonb_build_object('member', 'sarah.j@example.com', 'days_overdue', 3));

END $$;
