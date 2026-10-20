-- ==============================================================================
-- Migration: 20261020000002_nexus_views_and_rpcs.sql
-- Views, Stored Functions & Transactional RPCs for Topic 34
-- ==============================================================================

-- 1. VIEWS FOR REPORTING & SQL STUDIO
CREATE OR REPLACE VIEW public.v_subscription_overview AS
SELECT 
    s.id AS subscription_id,
    s.member_id,
    p.full_name AS member_name,
    p.email AS member_email,
    s.plan_id,
    mp.name AS plan_name,
    mp.slug AS plan_slug,
    s.status,
    s.billing_cycle,
    s.price_at_signup,
    s.currency,
    s.current_period_start,
    s.current_period_end,
    s.auto_renew,
    s.cancel_at_period_end,
    s.trial_ends_at,
    ROUND(EXTRACT(EPOCH FROM (s.current_period_end - now())) / 86400) AS days_until_renewal,
    s.created_at
FROM public.subscriptions s
JOIN public.profiles p ON s.member_id = p.id
JOIN public.membership_plans mp ON s.plan_id = mp.id;

CREATE OR REPLACE VIEW public.v_monthly_revenue AS
SELECT 
    TO_CHAR(i.paid_at, 'YYYY-MM') AS revenue_month,
    i.currency,
    COUNT(i.id) AS total_invoices_paid,
    SUM(i.total_amount) AS total_revenue,
    AVG(i.total_amount) AS avg_invoice_value,
    COUNT(DISTINCT i.member_id) AS paying_members_count
FROM public.invoices i
WHERE i.status = 'paid' AND i.paid_at IS NOT NULL
GROUP BY TO_CHAR(i.paid_at, 'YYYY-MM'), i.currency
ORDER BY revenue_month DESC;

CREATE OR REPLACE VIEW public.v_expiring_soon AS
SELECT 
    s.id AS subscription_id,
    s.member_id,
    p.full_name,
    p.email,
    mp.name AS plan_name,
    s.status,
    s.current_period_end,
    ROUND(EXTRACT(EPOCH FROM (s.current_period_end - now())) / 86400) AS days_remaining
FROM public.subscriptions s
JOIN public.profiles p ON s.member_id = p.id
JOIN public.membership_plans mp ON s.plan_id = mp.id
WHERE s.status IN ('active', 'trialing')
  AND s.current_period_end >= now()
  AND s.current_period_end <= (now() + INTERVAL '30 days')
ORDER BY s.current_period_end ASC;

CREATE OR REPLACE VIEW public.v_plan_performance AS
SELECT 
    mp.id AS plan_id,
    mp.name AS plan_name,
    mp.slug,
    mp.status AS plan_status,
    mp.price_monthly,
    COUNT(s.id) AS total_all_time_subscribers,
    COUNT(CASE WHEN s.status = 'active' THEN 1 END) AS active_subscribers,
    COUNT(CASE WHEN s.status = 'cancelled' THEN 1 END) AS cancelled_subscribers,
    COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.total_amount ELSE 0 END), 0) AS lifetime_collected_revenue
FROM public.membership_plans mp
LEFT JOIN public.subscriptions s ON mp.id = s.plan_id
LEFT JOIN public.invoices i ON s.id = i.subscription_id
GROUP BY mp.id, mp.name, mp.slug, mp.status, mp.price_monthly;

CREATE OR REPLACE VIEW public.v_payment_health AS
SELECT 
    pt.provider,
    COUNT(pt.id) AS total_attempts,
    COUNT(CASE WHEN pt.status = 'succeeded' THEN 1 END) AS successful_attempts,
    COUNT(CASE WHEN pt.status = 'failed' THEN 1 END) AS failed_attempts,
    ROUND(
        (COUNT(CASE WHEN pt.status = 'succeeded' THEN 1 END)::numeric / NULLIF(COUNT(pt.id), 0)) * 100, 
        2
    ) AS success_rate_percent,
    SUM(CASE WHEN pt.status = 'succeeded' THEN pt.amount ELSE 0 END) AS settled_volume
FROM public.payment_transactions pt
GROUP BY pt.provider;


-- 2. PROCEDURES / TRANSACTIONAL RPCS
CREATE OR REPLACE FUNCTION public.nexus_create_subscription(
    p_member_id uuid,
    p_plan_id uuid,
    p_billing_cycle text DEFAULT 'monthly',
    p_coupon_code text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
    v_plan record;
    v_member record;
    v_existing_active_count integer;
    v_price numeric(12,2);
    v_period_start timestamptz := now();
    v_period_end timestamptz;
    v_trial_end timestamptz := NULL;
    v_status text := 'active';
    v_sub_id uuid;
    v_inv_id uuid;
    v_inv_number text;
    v_coupon record;
    v_discount numeric(12,2) := 0;
    v_total numeric(12,2);
BEGIN
    SELECT * INTO v_member FROM public.profiles WHERE id = p_member_id AND deleted_at IS NULL;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Member profile % not found or archived.', p_member_id;
    END IF;

    SELECT * INTO v_plan FROM public.membership_plans WHERE id = p_plan_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Membership plan % does not exist.', p_plan_id;
    END IF;
    IF v_plan.status != 'active' THEN
        RAISE EXCEPTION 'Plan % is not active (status: %). Cannot create new subscriptions.', v_plan.name, v_plan.status;
    END IF;

    SELECT COUNT(*) INTO v_existing_active_count
    FROM public.subscriptions
    WHERE member_id = p_member_id AND status IN ('active', 'trialing', 'past_due');
    IF v_existing_active_count > 0 THEN
        RAISE EXCEPTION 'Member already has an active or in-progress subscription. Please upgrade or cancel first.';
    END IF;

    IF p_billing_cycle = 'yearly' THEN
        v_price := COALESCE(v_plan.price_yearly, v_plan.price_monthly * 12);
        v_period_end := v_period_start + INTERVAL '1 year';
    ELSE
        v_price := v_plan.price_monthly;
        v_period_end := v_period_start + INTERVAL '1 month';
    END IF;

    IF v_plan.trial_days > 0 THEN
        v_trial_end := v_period_start + (v_plan.trial_days || ' days')::interval;
        v_status := 'trialing';
    END IF;

    IF p_coupon_code IS NOT NULL AND TRIM(p_coupon_code) <> '' THEN
        SELECT * INTO v_coupon FROM public.coupons 
        WHERE UPPER(code) = UPPER(TRIM(p_coupon_code)) AND status = 'active';
        
        IF FOUND THEN
            IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < now() THEN
                RAISE EXCEPTION 'Coupon % has expired.', p_coupon_code;
            END IF;
            
            IF v_coupon.discount_type = 'percent' THEN
                v_discount := ROUND((v_price * v_coupon.discount_value) / 100, 2);
            ELSE
                v_discount := LEAST(v_price, v_coupon.discount_value);
            END IF;
        ELSE
            RAISE EXCEPTION 'Invalid or inactive coupon code: %', p_coupon_code;
        END IF;
    END IF;

    v_total := GREATEST(0, v_price - v_discount);

    INSERT INTO public.subscriptions (
        member_id,
        plan_id,
        status,
        billing_cycle,
        current_period_start,
        current_period_end,
        trial_ends_at,
        auto_renew,
        price_at_signup,
        currency
    ) VALUES (
        p_member_id,
        p_plan_id,
        v_status,
        p_billing_cycle,
        v_period_start,
        v_period_end,
        v_trial_end,
        true,
        v_price,
        v_plan.currency
    ) RETURNING id INTO v_sub_id;

    v_inv_number := 'INV-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 6));

    INSERT INTO public.invoices (
        invoice_number,
        subscription_id,
        member_id,
        period_start,
        period_end,
        subtotal,
        discount_amount,
        tax_amount,
        total_amount,
        currency,
        status,
        due_at,
        description
    ) VALUES (
        v_inv_number,
        v_sub_id,
        p_member_id,
        v_period_start,
        v_period_end,
        v_price,
        v_discount,
        0,
        v_total,
        v_plan.currency,
        CASE WHEN v_status = 'trialing' OR v_total = 0 THEN 'paid' ELSE 'open' END,
        v_period_start + INTERVAL '7 days',
        'Enrollment in ' || v_plan.name || ' (' || p_billing_cycle || ')'
    ) RETURNING id INTO v_inv_id;

    IF v_coupon.id IS NOT NULL THEN
        INSERT INTO public.coupon_redemptions (
            coupon_id,
            member_id,
            invoice_id,
            subscription_id,
            discount_amount
        ) VALUES (
            v_coupon.id,
            p_member_id,
            v_inv_id,
            v_sub_id,
            v_discount
        );
    END IF;

    INSERT INTO public.subscription_events (
        subscription_id,
        actor_id,
        event_type,
        new_status,
        reason,
        metadata
    ) VALUES (
        v_sub_id,
        p_member_id,
        'INITIAL_ENROLLMENT',
        v_status,
        'Member enrolled in plan',
        jsonb_build_object(
            'plan_name', v_plan.name,
            'price', v_price,
            'discount', v_discount,
            'total', v_total
        )
    );

    INSERT INTO public.audit_logs (
        actor_id,
        action,
        entity_type,
        entity_id,
        metadata
    ) VALUES (
        p_member_id,
        'CREATE_SUBSCRIPTION',
        'subscription',
        v_sub_id::text,
        jsonb_build_object('member_id', p_member_id, 'plan_id', p_plan_id, 'invoice_id', v_inv_id)
    );

    RETURN jsonb_build_object(
        'success', true,
        'subscription_id', v_sub_id,
        'invoice_id', v_inv_id,
        'invoice_number', v_inv_number,
        'status', v_status,
        'total_amount', v_total
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.nexus_simulate_payment(
    p_invoice_id uuid,
    p_simulate_success boolean DEFAULT true,
    p_method_label text DEFAULT 'Simulated Demo Gateway'
)
RETURNS jsonb AS $$
DECLARE
    v_inv record;
    v_sub record;
    v_tx_id uuid;
    v_ref text;
BEGIN
    SELECT * INTO v_inv FROM public.invoices WHERE id = p_invoice_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice % not found.', p_invoice_id;
    END IF;

    IF v_inv.status = 'paid' THEN
        RAISE EXCEPTION 'Invoice % is already paid. Cannot re-process.', v_inv.invoice_number;
    END IF;

    SELECT * INTO v_sub FROM public.subscriptions WHERE id = v_inv.subscription_id FOR UPDATE;

    v_ref := 'TX-' || TO_CHAR(now(), 'YYYYMMDD-HH24MISS') || '-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 5));

    IF p_simulate_success THEN
        INSERT INTO public.payment_transactions (
            invoice_id,
            provider,
            method_label,
            provider_reference,
            amount,
            currency,
            status,
            response_code,
            safe_message
        ) VALUES (
            p_invoice_id,
            'demo',
            p_method_label,
            v_ref,
            v_inv.total_amount,
            v_inv.currency,
            'succeeded',
            'SUCCESS_200',
            'Simulated payment authorized successfully'
        ) RETURNING id INTO v_tx_id;

        UPDATE public.invoices
        SET status = 'paid', paid_at = now()
        WHERE id = p_invoice_id;

        IF v_sub.status = 'past_due' THEN
            UPDATE public.subscriptions
            SET status = 'active'
            WHERE id = v_sub.id;
        END IF;

        INSERT INTO public.notifications (
            member_id,
            kind,
            title,
            body,
            related_entity_type,
            related_entity_id,
            dedupe_key
        ) VALUES (
            v_inv.member_id,
            'payment_success',
            'Payment Settled: ' || v_inv.invoice_number,
            'Your payment of ' || v_inv.currency || ' ' || v_inv.total_amount || ' has been processed successfully.',
            'invoice',
            p_invoice_id::text,
            'pay_success_' || v_tx_id::text
        );

        RETURN jsonb_build_object(
            'success', true,
            'transaction_id', v_tx_id,
            'reference', v_ref,
            'invoice_status', 'paid',
            'message', 'Payment simulated successfully'
        );
    ELSE
        INSERT INTO public.payment_transactions (
            invoice_id,
            provider,
            method_label,
            provider_reference,
            amount,
            currency,
            status,
            response_code,
            safe_message
        ) VALUES (
            p_invoice_id,
            'demo',
            p_method_label,
            v_ref,
            v_inv.total_amount,
            v_inv.currency,
            'failed',
            'ERR_INSUFFICIENT_FUNDS',
            'Simulated payment declined by card network'
        ) RETURNING id INTO v_tx_id;

        IF v_sub.status = 'active' THEN
            UPDATE public.subscriptions
            SET status = 'past_due'
            WHERE id = v_sub.id;
        END IF;

        INSERT INTO public.notifications (
            member_id,
            kind,
            title,
            body,
            related_entity_type,
            related_entity_id,
            dedupe_key
        ) VALUES (
            v_inv.member_id,
            'payment_failure',
            'Payment Failed: ' || v_inv.invoice_number,
            'A payment attempt of ' || v_inv.currency || ' ' || v_inv.total_amount || ' failed. Please retry your payment.',
            'invoice',
            p_invoice_id::text,
            'pay_fail_' || v_tx_id::text
        );

        RETURN jsonb_build_object(
            'success', false,
            'transaction_id', v_tx_id,
            'reference', v_ref,
            'invoice_status', v_inv.status,
            'message', 'Payment failed simulation recorded'
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.nexus_run_renewal_scan()
RETURNS jsonb AS $$
DECLARE
    v_sub record;
    v_notif_count integer := 0;
    v_dedupe text;
BEGIN
    FOR v_sub IN
        SELECT s.id, s.member_id, s.current_period_end, mp.name AS plan_name
        FROM public.subscriptions s
        JOIN public.membership_plans mp ON s.plan_id = mp.id
        WHERE s.status = 'active'
          AND s.current_period_end >= now()
          AND s.current_period_end <= (now() + INTERVAL '7 days')
    LOOP
        v_dedupe := 'renewal_scan_' || v_sub.id::text || '_' || TO_CHAR(v_sub.current_period_end, 'YYYYMMDD');
        
        INSERT INTO public.notifications (
            member_id,
            kind,
            title,
            body,
            related_entity_type,
            related_entity_id,
            dedupe_key
        ) VALUES (
            v_sub.member_id,
            'renewal_reminder',
            'Upcoming Renewal for ' || v_sub.plan_name,
            'Your ' || v_sub.plan_name || ' membership is scheduled to renew on ' || TO_CHAR(v_sub.current_period_end, 'Mon DD, YYYY') || '.',
            'subscription',
            v_sub.id::text,
            v_dedupe
        )
        ON CONFLICT (dedupe_key) DO NOTHING;

        IF FOUND THEN
            v_notif_count := v_notif_count + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'notifications_created', v_notif_count,
        'scanned_at', now()
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.nexus_test_acid_rollback(
    p_member_id uuid,
    p_trigger_error boolean DEFAULT true
)
RETURNS jsonb AS $$
DECLARE
    v_sub_id uuid;
    v_test_plan_id uuid;
BEGIN
    SELECT id INTO v_test_plan_id FROM public.membership_plans WHERE status = 'active' LIMIT 1;
    IF v_test_plan_id IS NULL THEN
        RAISE EXCEPTION 'No active plan available to test ACID transaction.';
    END IF;

    INSERT INTO public.subscriptions (
        member_id,
        plan_id,
        status,
        billing_cycle,
        current_period_start,
        current_period_end,
        price_at_signup,
        currency
    ) VALUES (
        p_member_id,
        v_test_plan_id,
        'trialing',
        'monthly',
        now(),
        now() + INTERVAL '14 days',
        0,
        'INR'
    ) RETURNING id INTO v_sub_id;

    IF p_trigger_error THEN
        RAISE EXCEPTION 'DELIBERATE_ACID_ROLLBACK: Atomicity test simulated failure midway through multi-table writes. Postgres will roll back subscription write %.', v_sub_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'subscription_id', v_sub_id, 'committed', true);
END;
$$ LANGUAGE plpgsql;
