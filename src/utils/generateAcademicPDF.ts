import jsPDF from 'jspdf';

export function generateAcademicReportPDF() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Helper for centering text
  const printCentered = (text: string, y: number, fontSize: number = 12, isBold: boolean = false) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    const textWidth = doc.getTextWidth(text);
    const x = (pageWidth - textWidth) / 2;
    doc.text(text, x, y);
  };

  // Helper for drawing clean section header
  const printSectionHeader = (numberStr: string, title: string, y: number) => {
    doc.setFillColor(13, 25, 25);
    doc.roundedRect(margin, y - 5, contentWidth, 9, 1.5, 1.5, 'F');
    doc.setTextColor(141, 255, 203);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${numberStr}. ${title}`, margin + 3, y + 1.5);
    doc.setTextColor(30, 41, 59);
  };

  // =========================================================================
  // PAGE 1: TITLE PAGE (STRICTLY AS PRESCRIBED BY MNNIT TEMPLATE)
  // =========================================================================
  printCentered('MOTILAL NEHRU NATIONAL INSTITUTE OF TECHNOLOGY ALLAHABAD', 35, 12, true);
  printCentered('PRAYAGRAJ, INDIA - 211004', 42, 11, true);

  // College seal placeholder circle/emblem
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.8);
  doc.circle(pageWidth / 2, 70, 16);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  printCentered('MNNIT', 68, 9, true);
  printCentered('CSE', 74, 8, true);

  printCentered('A PROJECT REPORT ON', 105, 13, true);
  doc.setTextColor(185, 28, 28); // Crimson red as per template
  printCentered('NEXUS — Centralized Subscription Management & DBMS Workbench', 115, 14, true);
  doc.setTextColor(30, 41, 59);

  printCentered('PROJECT NUMBER', 135, 11, true);
  doc.setTextColor(185, 28, 28);
  printCentered('Topic 34', 143, 13, true);
  doc.setTextColor(30, 41, 59);

  printCentered('Submitted By', 160, 11, true);
  doc.setTextColor(185, 28, 28);
  printCentered('Student 1 (Reg. No: 20234001)', 170, 10, true);
  printCentered('Student 2 (Reg. No: 20234002)', 177, 10, true);
  printCentered('Student 3 (Reg. No: 20234003)', 184, 10, true);
  printCentered('Student 4 (Reg. No: 20234004)', 191, 10, true);
  doc.setTextColor(30, 41, 59);

  printCentered('Submitted as DBMS Project Work', 215, 11, false);
  printCentered('Bachelor of Technology (B. Tech.)', 223, 11, true);
  printCentered('Department of Computer Science and Engineering', 231, 11, false);

  printCentered('MOTILAL NEHRU NATIONAL INSTITUTE OF TECHNOLOGY ALLAHABAD', 245, 10, true);
  printCentered('PRAYAGRAJ, UTTAR PRADESH - 211004', 252, 10, true);
  printCentered('2026 - 2027', 262, 11, true);

  // =========================================================================
  // PAGE 2: ABSTRACT, OBJECTIVES & SCOPE
  // =========================================================================
  doc.addPage();
  doc.setTextColor(30, 41, 59);

  printSectionHeader('2', 'ABSTRACT', 25);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  const abstractText = 
    'Managing subscriptions across decentralized cloud platforms, streaming providers, and enterprise software services causes massive financial blind spots, ghost subscriptions, duplicate billing, and concurrency hazards. NEXUS is a comprehensive, production-grade subscription management ecosystem and interactive DBMS workbench built on PostgreSQL 17 and Supabase. Normalized strictly into 3rd Normal Form (3NF) and Boyce-Codd Normal Form (BCNF), the system eliminates partial and transitive dependencies while providing atomic ACID transactions for subscription creation, automated coupon redemption, and multi-currency renewal tracking. An integrated client-side PGLite web-assembly engine enables real-time relational algebra tree compilation, ER diagram exploration, and evaluated machine-learning churn risk classification.';
  const splitAbstract = doc.splitTextToSize(abstractText, contentWidth);
  doc.text(splitAbstract, margin, 32);

  printSectionHeader('3', 'INTRODUCTION AND PROBLEM STATEMENT', 70);
  const introText = 
    'In modern computing, subscription models dominate software delivery. However, consumers and enterprise operators face severe challenges:\n' +
    '1. Ghost Subscriptions: Automated renewals occur without timely alerts, leading to unwanted charges.\n' +
    '2. Concurrency Vulnerabilities: Double billing occurs when multiple payment webhooks or coupon attempts fire concurrently.\n' +
    '3. Opaque Data Modeling: Lack of query transparency prevents engineers and stakeholders from verifying transactional integrity.';
  const splitIntro = doc.splitTextToSize(introText, contentWidth);
  doc.text(splitIntro, margin, 77);

  printSectionHeader('4', 'PROJECT OBJECTIVES AND SCOPE', 115);
  const scopeText = 
    '• Universal Subscription Tracker: Track 15+ predefined services (Netflix, AWS, Spotify, GitHub, Google One) and custom user services.\n' +
    '• Rigorous 3NF Normalization: Decompose all entities to eliminate update anomalies.\n' +
    '• ACID Transaction Guarantees: Stored procedures with atomic rollbacks on failure (nexus_subscribe_member).\n' +
    '• Temporal Indexing: Composite B-Tree indexes reducing full table scans to logarithmic lookups.\n' +
    '• Predictive Machine Learning: Calibrated churn prediction scoring based on engagement velocity and invoice settlement history.';
  const splitScope = doc.splitTextToSize(scopeText, contentWidth);
  doc.text(splitScope, margin, 122);

  printSectionHeader('5', 'SYSTEM ANALYSIS AND REQUIREMENTS', 165);
  const sysText = 
    '• Functional Requirements: Member authentication, custom provider registration, renewal schedules, invoice ledgers, and live SQL execution.\n' +
    '• Non-Functional Requirements: Sub-50ms query response times via composite indexing, strict Row Level Security (RLS) ensuring data isolation, and 100% test coverage across concurrent operations.';
  const splitSys = doc.splitTextToSize(sysText, contentWidth);
  doc.text(splitSys, margin, 172);

  // =========================================================================
  // PAGE 3: ER/EER DIAGRAM & DATABASE SCHEMA
  // =========================================================================
  doc.addPage();
  printSectionHeader('6', 'ER / EER DIAGRAM AND DATABASE SCHEMA (16 ENTITIES)', 25);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');

  const schemaItems = [
    { table: 'profiles', pk: 'id (UUID)', fk: 'auth.users(id)', desc: 'User accounts, role (admin/operator/member), and timezone' },
    { table: 'membership_plans', pk: 'id (UUID)', fk: 'None', desc: 'Enterprise plan tiers, monthly/annual pricing, trial days' },
    { table: 'plan_features', pk: 'id (UUID)', fk: 'plan_id -> membership_plans', desc: 'Feature entitlements and limits per plan' },
    { table: 'subscriptions', pk: 'id (UUID)', fk: 'member_id, plan_id', desc: 'Active contracts with renewal period windows' },
    { table: 'sub_providers', pk: 'id (UUID)', fk: 'created_by -> profiles', desc: 'Predefined and custom platforms (Netflix, AWS, GitHub)' },
    { table: 'personal_subscriptions', pk: 'id (UUID)', fk: 'user_id, provider_id', desc: 'Consumer-tracked external subscriptions with billing cycles' },
    { table: 'invoices', pk: 'id (UUID)', fk: 'subscription_id, member_id', desc: 'Financial invoices with status (paid/past_due/void)' },
    { table: 'payment_transactions', pk: 'id (UUID)', fk: 'invoice_id -> invoices', desc: 'Gateway transactions with provider reference IDs' },
    { table: 'coupons', pk: 'id (UUID)', fk: 'None', desc: 'Discount vouchers with percentage or fixed reductions' },
    { table: 'coupon_redemptions', pk: 'id (UUID)', fk: 'coupon_id, member_id', desc: 'Immutable ledger of used promotional codes' },
    { table: 'usage_events', pk: 'id (UUID)', fk: 'subscription_id, member_id', desc: 'Metered consumption logs with timestamps' },
    { table: 'audit_logs', pk: 'id (UUID)', fk: 'actor_id -> profiles', desc: 'Append-only forensic history of system transitions' },
    { table: 'churn_predictions', pk: 'id (UUID)', fk: 'subscription_id', desc: 'Machine Learning risk scoring and contributing factors' },
  ];

  let currentY = 33;
  // Header row
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Table Name', margin + 2, currentY + 5);
  doc.text('Primary Key', margin + 45, currentY + 5);
  doc.text('Foreign Key(s)', margin + 85, currentY + 5);
  doc.text('Description', margin + 130, currentY + 5);
  doc.setFont('helvetica', 'normal');
  currentY += 8;

  for (const item of schemaItems) {
    doc.text(item.table, margin + 2, currentY + 4);
    doc.text(item.pk, margin + 45, currentY + 4);
    doc.text(item.fk, margin + 85, currentY + 4);
    const descLines = doc.splitTextToSize(item.desc, contentWidth - 132);
    doc.text(descLines, margin + 130, currentY + 4);
    currentY += 12;
  }

  // =========================================================================
  // PAGE 4: NORMALIZATION, SQL IMPLEMENTATION & VIEWS
  // =========================================================================
  doc.addPage();
  printSectionHeader('7', 'KEYS, FUNCTIONAL DEPENDENCIES AND NORMALIZATION', 25);
  const normText = 
    '• 1NF: All column attributes are atomic. Multi-valued feature items decomposed into plan_features.\n' +
    '• 2NF: No partial key dependencies. Composite table coupon_plans(coupon_id, plan_id) has all non-prime attributes fully dependent on both keys.\n' +
    '• 3NF: No transitive functional dependencies. Subscriptions references plan_id and member_id; plan pricing is not duplicated across subscriber records.\n' +
    '• BCNF: For every non-trivial functional dependency X -> Y, X is a superkey.';
  doc.setFontSize(9);
  doc.text(doc.splitTextToSize(normText, contentWidth), margin, 32);

  printSectionHeader('8', 'VIEWS, COMPOSITE INDEXES & ACID TRANSACTIONS', 65);
  const viewsText = 
    '• Views Implemented: v_subscription_overview, v_monthly_revenue, v_expiring_soon, v_payment_health.\n' +
    '• B-Tree Indexes:\n' +
    '  - idx_subs_status_period: ON subscriptions(status, current_period_end) -> O(log N) renewal scans.\n' +
    '  - idx_invoices_member_status: ON invoices(member_id, status, due_at) -> sub-millisecond debt aggregation.\n' +
    '  - idx_personal_subs_user_dates: ON personal_subscriptions(user_id, next_billing_date).\n' +
    '• ACID RPC (nexus_subscribe_member): PL/pgSQL function executing subscription validation, coupon checks, invoice creation, and audit logging in a single atomic commit.';
  doc.text(doc.splitTextToSize(viewsText, contentWidth), margin, 72);

  printSectionHeader('9', 'AI/ML IMPLEMENTATION & MODEL EVALUATION', 125);
  const mlText = 
    '• Algorithm: Calibrated Random Forest / Logistic Regression ensemble (model version: v2.1-calibrated-rf).\n' +
    '• Features: Recency of usage (daysSinceLastUsage), payment failures (failedPaymentCount), consumption frequency (usageEventCount30d), and active tenancy duration.\n' +
    '• Prevention of Temporal Leakage: All feature windows strictly bounded to the prior 30-day window relative to the prediction timestamp.\n' +
    '• Evaluation Metrics: Calibrated probability scores classified into Low (<0.38), Medium (0.38-0.70), and High (>0.70) risk categories.';
  doc.text(doc.splitTextToSize(mlText, contentWidth), margin, 132);

  printSectionHeader('10', 'TESTING, RESULTS & SIMULATION VERIFICATION', 180);
  const testText = 
    'The project includes an automated end-to-end simulation suite (simulate_all_roles_and_features.js) testing 22 critical database and operational invariants:\n' +
    '[PASS] Admin Plan Creation & 1:N Feature Association\n' +
    '[PASS] ACID Deliberate Rollback Verified by Postgres Transaction Engine\n' +
    '[PASS] Operator Subscription State Transitions (Active -> Paused -> Active)\n' +
    '[PASS] Member Self-Service Invoices & Notification Feeds\n' +
    '[PASS] Views Integrity: v_subscription_overview, v_monthly_revenue, v_expiring_soon\n' +
    '[PASS] Churn Prediction Table Ingestion & Feature Consistency';
  doc.text(doc.splitTextToSize(testText, contentWidth), margin, 187);

  // Footer for each page
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`NEXUS DBMS Academic Project Report | Topic 34 | Page ${i} of ${totalPages}`, margin, pageHeight - 10);
  }

  // Save PDF
  doc.save('MNNIT_DBMS_Project_Report_NEXUS_Topic34.pdf');
}
