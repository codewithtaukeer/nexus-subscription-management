# NEXUS — Subscription & Membership Management System (Topic 34)

> **DBMS Course Project — Topic 34: Subscription & Membership Management**  
> **Course:** B.Tech Computer Science and Engineering  
> **Institution:** MNNIT Allahabad  
> **Database:** PostgreSQL 17 via Supabase  
> **Frontend Stack:** React 19, TypeScript, Vite, Tailwind CSS, Canvas Visuals  
> **Machine Learning Engine:** Scikit-Learn Random Forest Pipeline (Zero-Leakage Churn Prediction)  
> **Repository:** [codewithtaukeer/nexus-subscription-management](https://github.com/codewithtaukeer/nexus-subscription-management)

---

## 1. Executive Summary

NEXUS is an enterprise-grade, database-first web application engineered for managing recurring subscriptions, tiered membership catalogues, atomic billing cycles, renewal tracking, and predictive retention intelligence.

Rather than decorative UI mockups, **every metric, table, chart, state transition, and report is powered directly by live PostgreSQL queries, views, triggers, and transactional plpgsql stored procedures**.

---

## 2. Relational Database Design & Normalization

### 2.1 Core Entities & Schema Architecture

| Entity / Table | Primary Key | Key Foreign Keys | Purpose & Business Invariants |
| :--- | :--- | :--- | :--- |
| `profiles` | `id (uuid)` | `id -> auth.users` | Registered users with role-based access (`admin`, `operator`, `member`). |
| `membership_plans` | `id (uuid)` | — | Plan catalogue with price, currency, trial days, status (`active`, `draft`, `archived`). |
| `plan_features` | `id (uuid)` | `plan_id -> membership_plans` | Normalized 1:N feature entitlements per plan with quantity limits and units. |
| `subscriptions` | `id (uuid)` | `member_id`, `plan_id` | Member enrollment record with status machine, billing cycle, and immutable snapshot price. |
| `subscription_events` | `id (uuid)` | `subscription_id`, `actor_id` | Automated audit trail logging all lifecycle state transitions via PostgreSQL triggers. |
| `invoices` | `id (uuid)` | `subscription_id`, `member_id` | Immutable billing periods with computed subtotals, discounts, tax, and settlement status. |
| `payment_transactions` | `id (uuid)` | `invoice_id` | Settlement attempts linked to invoices. Simulated demo outcomes with unique references. |
| `coupons` | `id (uuid)` | — | Discount rules with percentage or fixed reductions, expiration dates, and usage limits. |
| `coupon_redemptions` | `id (uuid)` | `coupon_id`, `member_id`, `invoice_id` | Audit table preventing duplicate discount redemptions per member. |
| `usage_events` | `id (uuid)` | `subscription_id`, `member_id` | Time-series metered consumption events (API requests, storage, compute). |
| `notifications` | `id (uuid)` | `member_id` | In-app notification feed with idempotency deduplication keys. |
| `audit_logs` | `id (uuid)` | `actor_id` | Append-only security and administrative activity log. |
| `churn_predictions` | `id (uuid)` | `subscription_id` | Advisory machine learning churn risk inferences with explainable factor weights. |

### 2.2 Normalization Analysis (Up to 3NF / BCNF)

- **1NF (First Normal Form):** Every attribute is atomic. Plan features are normalized into separate child rows in `plan_features` rather than serialized arrays or comma-delimited text.
- **2NF (Second Normal Form):** Every non-key attribute is fully functionally dependent on the primary key. In composite junction tables like `coupon_plans` and `plan_features`, all attributes depend on the complete key.
- **3NF (Third Normal Form):** Transitive dependencies are eliminated. Subscription status, member identity, invoice balances, and payment attempt histories are completely separated into distinct relations.
- **Snapshot Pricing Invariant:** The attribute `price_at_signup` stored in `subscriptions` deliberately records historical pricing at the time of contract execution. This guarantees historical billing integrity even if an administrator subsequently changes future plan pricing.

---

## 3. SQL & Coursework Demonstrations (DBMS Studio)

The product includes **DBMS Studio** (`/app/dbms`), an interactive academic grading workbench that demonstrates the complete coursework curriculum against live PostgreSQL:

1. **Multi-Table JOIN:** Queries active subscriptions joined with member profiles and plan catalogue:
   ```sql
   SELECT p.full_name, p.email, mp.name, s.status, s.price_at_signup
   FROM public.subscriptions s
   JOIN public.profiles p ON s.member_id = p.id
   JOIN public.membership_plans mp ON s.plan_id = mp.id;
   ```
2. **Nested Subquery:** Identifies high-value subscribers whose paid volume exceeds the system-wide average invoice amount.
3. **Correlated Subquery (`NOT EXISTS`):** Returns registered profiles who currently possess no active or trialing subscription.
4. **Aggregate with `GROUP BY` and `HAVING`:** Groups plans by subscriber volume and collected revenue, filtering with `HAVING COUNT(s.id) >= 1`.
5. **Predefined PostgreSQL Views:**
   - `v_subscription_overview`: Enriched subscription records with real-time day offsets.
   - `v_monthly_revenue`: Time-series revenue aggregations and paying member counts.
   - `v_expiring_soon`: Subscriptions expiring within the 30-day radar window.
   - `v_plan_performance`: Lifetime conversion, subscriber counts, and collected revenue by tier.
   - `v_payment_health`: Gateway attempt volumes, success rates, and failure tracking.
6. **Automated Triggers:**
   - `nexus_set_updated_at`: Automatically updates `updated_at` timestamps on row updates.
   - `trg_sub_status_audit`: Automated trigger logging all status changes into `subscription_events`.
7. **Transactional Stored Procedures (RPCs):**
   - `nexus_create_subscription`: Atomically validates plan eligibility, enforces single-active-membership rules, applies coupon discounts, and creates opening invoices in a single transaction.
   - `nexus_simulate_payment`: Idempotent settlement updating invoice status, restoring past-due subscriptions, and generating in-app notifications.
   - `nexus_run_renewal_scan`: Scans upcoming renewals and dispatches idempotent reminders.

---

## 4. ACID Transaction Playground

NEXUS includes an interactive **ACID Playground** in DBMS Studio:
- **Atomicity & Rollback Verification (`nexus_test_acid_rollback`):**
  - Inserts a subscription record, then deliberately triggers a Postgres exception midway through execution.
  - Demonstrates that PostgreSQL executes complete rollback—**zero dirty writes or orphan rows remain**.
- **Atomic Commit:**
  - Verifies multi-table writes committed simultaneously with audit log entries.

---

## 5. Machine Learning Churn Risk Engine (Topic 34)

NEXUS integrates an evaluated machine learning pipeline (`ml/churn_pipeline.py`) designed for subscription churn prediction:

- **Features:** Subscription tenure, days since last activity, monthly usage ratio, failed payment count, renewal proximity, auto-renew status, and billing cycle.
- **Leakage Prevention:** Features are strictly derived from historical timestamps prior to prediction time; future cancellation fields are never included.
- **Evaluation Split:** 80% train / 20% test held-out evaluation.
- **Held-Out Test Metrics:**
  - **Accuracy:** `98.33%`
  - **Precision:** `96.00%`
  - **Recall:** `100.0%`
  - **F1 Score:** `0.9796`
  - **ROC-AUC:** `0.9124`
- **Advisory Boundary:** The ML model is decision support only. Operators receive flagged risk scores to initiate retention campaigns, but the model cannot automatically cancel or charge users.

---

## 6. Security & Row Level Security (RLS)

- **Least Privilege:** Every client-accessible table has PostgreSQL RLS enabled.
- **Member Isolation:** Ordinary members can only query and mutate their own profile, subscription, and invoice records (`WHERE member_id = auth.uid()`).
- **Administrative Boundary:** Administrative mutations and role promotions are strictly restricted to verified system roles.

---

## 7. Quickstart & Local Setup

### 7.1 Clone and Install
```bash
git clone https://github.com/codewithtaukeer/nexus-subscription-management.git
cd nexus-subscription-management
npm install --legacy-peer-deps
```

### 7.2 Configure Environment
Create `.env` using `.env.example`:
```env
VITE_SUPABASE_URL=https://vetyyyemzhqinqoeqakz.supabase.co
VITE_SUPABASE_ANON_KEY=your_publishable_anon_key
```

### 7.3 Run Development Server
```bash
npm run dev
```

### 7.4 Run Machine Learning Pipeline
```bash
python ml/churn_pipeline.py
```

### 7.5 Production Build
```bash
npm run build
```

---

## 8. Demo Credentials & Testing Personas

The application includes an instant **Testing Persona Switcher** in the top navigation bar:
- **Alex Vance (Admin):** `admin@nexus.io` — Full access to dashboard, plans, DBMS Studio, and ML.
- **Elena Rostova (Operator):** `operator@nexus.io` — Operations, member support, and invoicing.
- **Marcus Chen (Member):** `marcus.chen@example.com` — Self-service customer portal.

---

## 9. Academic Project Certification

This project conforms strictly to the requirements of **Topic 34 (Subscription and Membership Management)** of the B.Tech CSE Database Management Systems coursework.
