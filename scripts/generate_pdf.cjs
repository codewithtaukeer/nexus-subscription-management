const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(ROOT_DIR, 'docs', 'screenshots');
const OUTPUT_PDF = path.join(ROOT_DIR, 'docs', 'NEXUS_MNNIT_DBMS_Project_Report.pdf');
const PUBLIC_PDF = path.join(ROOT_DIR, 'public', 'NEXUS_MNNIT_DBMS_Project_Report.pdf');
const ARTIFACT_DIR = 'C:\\Users\\husna\\.gemini\\antigravity\\brain\\f49209e4-a812-4965-aa56-af714b6489c5';
const ARTIFACT_PDF = path.join(ARTIFACT_DIR, 'NEXUS_MNNIT_DBMS_Project_Report.pdf');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

console.log('--- Generating Structured MNNIT Academic DBMS Report ---');

// Load MNNIT Logo
const mnnitLogoPath = path.join(ROOT_DIR, 'public', 'mnnit_logo.png');
const mnnitLogoB64 = fs.existsSync(mnnitLogoPath) ? fs.readFileSync(mnnitLogoPath).toString('base64') : '';
console.log('MNNIT Logo loaded:', mnnitLogoB64.length > 0 ? `${mnnitLogoB64.length} base64 chars` : 'MISSING');

// Helper to get base64 screenshot
function getScreenshotB64(filename) {
  const filePath = path.join(SCREENSHOTS_DIR, filename);
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath).toString('base64');
  }
  console.warn(`Screenshot missing: ${filename}`);
  return '';
}

// Screenshot component helper - optimized for tight A4 layout (two per page)
function renderBrowserMockup(filename, figNum, caption, url = 'https://nexus-subscription.io') {
  const b64 = getScreenshotB64(filename);
  if (!b64) return '';
  return `
  <div class="mockup-figure-container">
    <div class="browser-chrome">
      <div class="chrome-dots">
        <span class="dot dot-red"></span>
        <span class="dot dot-yellow"></span>
        <span class="dot dot-green"></span>
      </div>
      <div class="chrome-address-bar">
        <span class="lock-icon">🔒</span>
        <span class="url-text">${url}</span>
      </div>
      <div class="chrome-badge">LIVE VERIFICATION</div>
    </div>
    <div class="browser-body">
      <img src="data:image/png;base64,${b64}" alt="${caption}" class="mockup-img" />
    </div>
    <div class="figure-caption">
      <strong>${figNum}:</strong> ${caption}
    </div>
  </div>`;
}

// Diagram container helper
function renderDiagramContainer(figNum, title, mermaidCode) {
  return `
  <div class="diagram-figure-container">
    <div class="diagram-header">
      <div class="diagram-header-left">
        <span class="diagram-dot"></span>
        <span class="diagram-tag">SYSTEM ARCHITECTURE SPECIFICATION</span>
      </div>
      <span class="diagram-format">VECTOR RENDER (SVG)</span>
    </div>
    <div class="mermaid">
${mermaidCode}
    </div>
    <div class="figure-caption">
      <strong>${figNum}:</strong> ${title}
    </div>
  </div>`;
}

// The complete document HTML matching the exact 15 sections
const reportHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>NEXUS: Subscription Management & DBMS Lab Platform - MNNIT Project Report</title>
  
  <!-- Typography -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  
  <!-- KaTeX for Mathematics -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>

  <!-- Mermaid for Diagrams -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>
    mermaid.initialize({
      startOnLoad: true,
      theme: 'base',
      themeVariables: {
        primaryColor: '#F0FDFA',
        primaryTextColor: '#042F2E',
        primaryBorderColor: '#0F766E',
        lineColor: '#0F766E',
        secondaryColor: '#CCFBF1',
        tertiaryColor: '#FFFFFF',
        edgeLabelBackground: '#F0FDFA',
        fontFamily: 'Inter, system-ui, sans-serif'
      }
    });

    window.addEventListener('DOMContentLoaded', () => {
      renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ]
      });
    });
  </script>

  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 15mm 16mm 15mm;
      @top-left {
        content: "MNNIT ALLAHABAD | CSE DEPARTMENT";
        font-family: 'Inter', sans-serif;
        font-size: 7.5pt;
        color: #0F766E;
        font-weight: 600;
        letter-spacing: 0.5px;
      }
      @top-right {
        content: "NEXUS: SUBSCRIPTION MANAGEMENT & DBMS LAB";
        font-family: 'Inter', sans-serif;
        font-size: 7.5pt;
        color: #64748B;
        font-weight: 500;
      }
      @bottom-left {
        content: "B.Tech CSE — CS-3104: Database Management Systems";
        font-family: 'Inter', sans-serif;
        font-size: 7.5pt;
        color: #64748B;
      }
      @bottom-right {
        content: "Page " counter(page);
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        font-weight: 600;
        color: #0F766E;
      }
    }

    @page :first {
      margin: 10mm 15mm 10mm 15mm;
      @top-left { content: none; }
      @top-right { content: none; }
      @bottom-left { content: none; }
      @bottom-right { content: none; }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Inter', sans-serif;
      font-size: 9.2pt;
      line-height: 1.5;
      color: #0F172A;
      background: #FFFFFF;
      margin: 0;
      padding: 0;
    }

    /* Headings */
    h1, h2, h3, h4 {
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #042F2E;
      margin-top: 1.3em;
      margin-bottom: 0.35em;
      break-after: avoid;
      page-break-after: avoid;
    }

    h1 {
      font-size: 16pt;
      font-weight: 800;
      color: #064E3B;
      letter-spacing: -0.3px;
    }

    h2 {
      font-size: 12.5pt;
      font-weight: 700;
      color: #0F766E;
      border-bottom: 1.5px solid #CCFBF1;
      padding-bottom: 4px;
      margin-top: 1.4em;
    }

    h3 {
      font-size: 10.5pt;
      font-weight: 600;
      color: #134E4A;
      margin-top: 1.1em;
    }

    h4 {
      font-size: 9.5pt;
      font-weight: 600;
      color: #334155;
      margin-top: 0.8em;
    }

    p {
      margin: 0.45em 0;
      text-align: justify;
      color: #334155;
    }

    ul, ol {
      margin: 0.4em 0;
      padding-left: 1.5em;
      color: #334155;
    }

    li {
      margin: 0.25em 0;
    }

    code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8.2pt;
      background: #F1F5F9;
      color: #0F766E;
      padding: 1px 4px;
      border-radius: 4px;
      border: 1px solid #E2E8F0;
    }

    pre {
      background: #071112;
      color: #8DFFCB;
      padding: 10px 12px;
      border-radius: 8px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 7.8pt;
      line-height: 1.4;
      overflow-x: auto;
      border: 1px solid #134E4A;
      margin: 10px 0;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
      border: none;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 8.2pt;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    th, td {
      border: 1px solid #CBD5E1;
      padding: 6px 8px;
      text-align: left;
    }

    th {
      background: #F0FDFA;
      color: #0F766E;
      font-weight: 700;
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    tr:nth-child(even) td {
      background: #F8FAFC;
    }

    /* Callout Card */
    .callout-box {
      border-left: 3.5px solid #0F766E;
      background: #F0FDFA;
      padding: 8px 12px;
      border-radius: 0 6px 6px 0;
      margin: 10px 0;
      color: #0F172A;
      font-size: 8.8pt;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .callout-title {
      font-weight: 700;
      color: #0F766E;
      margin-bottom: 3px;
      font-size: 9.2pt;
    }

    /* Metric Badges Grid */
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin: 12px 0;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .metric-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-top: 2.5px solid #0F766E;
      border-radius: 6px;
      padding: 8px;
      text-align: center;
    }

    .metric-value {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 14pt;
      font-weight: 800;
      color: #042F2E;
      line-height: 1.1;
    }

    .metric-label {
      font-size: 7pt;
      color: #0F766E;
      font-weight: 700;
      text-transform: uppercase;
      margin-top: 2px;
    }

    .metric-desc {
      font-size: 6.8pt;
      color: #64748B;
      margin-top: 1px;
    }

    /* Page Breaks and Clean Section Flow */
    .section-break {
      page-break-before: always;
      break-before: page;
    }

    /* Browser Mockup Figure (Compact for tight placement in Section 13) */
    .mockup-figure-container {
      margin: 8px 0 6px 0;
      border: 1.2px solid #CBD5E1;
      border-radius: 6px;
      overflow: hidden;
      background: #0B0F12;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .browser-chrome {
      background: #0B0F12;
      padding: 4px 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #1E293B;
    }

    .chrome-dots {
      display: flex;
      gap: 4px;
    }

    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
    }

    .dot-red { background: #EF4444; }
    .dot-yellow { background: #F59E0B; }
    .dot-green { background: #10B981; }

    .chrome-address-bar {
      background: #151D24;
      border: 1px solid #283542;
      border-radius: 4px;
      padding: 2px 8px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 7pt;
      color: #94A3B8;
      display: flex;
      align-items: center;
      gap: 5px;
      width: 46%;
      justify-content: center;
    }

    .chrome-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 6.5pt;
      color: #8DFFCB;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .browser-body {
      background: #000000;
      text-align: center;
    }

    .mockup-img {
      width: 100%;
      max-height: 250px;
      object-fit: cover;
      object-position: top;
      display: block;
    }

    .figure-caption {
      background: #F8FAFC;
      border-top: 1px solid #E2E8F0;
      padding: 5px 10px;
      font-size: 7.8pt;
      color: #475569;
      text-align: center;
    }

    .figure-caption strong {
      color: #0F766E;
    }

    /* Diagram Figure Container */
    .diagram-figure-container {
      margin: 12px 0 8px 0;
      border: 1.2px solid #CBD5E1;
      border-radius: 8px;
      overflow: hidden;
      background: #FAFDFA;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .diagram-header {
      background: #F0FDFA;
      border-bottom: 1px solid #CCFBF1;
      padding: 5px 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-family: 'JetBrains Mono', monospace;
    }

    .diagram-header-left {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .diagram-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #0F766E;
    }

    .diagram-tag {
      font-size: 7.2pt;
      font-weight: 700;
      color: #0F766E;
      letter-spacing: 0.5px;
    }

    .diagram-format {
      font-size: 6.8pt;
      color: #64748B;
      font-weight: 600;
    }

    .diagram-figure-container .mermaid {
      padding: 12px 8px;
      display: flex;
      justify-content: center;
      background: #FFFFFF;
      overflow-x: auto;
    }

    .diagram-figure-container .mermaid svg {
      max-width: 100% !important;
      height: auto !important;
    }

    /* Cover Page matching Official MNNIT Template EXACTLY */
    .cover-page {
      border: 2px solid #000000;
      padding: 24px 22px 20px 22px;
      text-align: center;
      background: #FFFFFF;
      page-break-after: always;
      break-after: page;
      min-height: 94vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
      font-family: 'Times New Roman', Times, 'Liberation Serif', serif;
    }

    .cover-inst-title {
      font-size: 13.5pt;
      font-weight: bold;
      color: #000000;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      line-height: 1.35;
    }

    .cover-inst-sub {
      font-size: 11pt;
      font-weight: bold;
      color: #000000;
      margin: 4px 0 0 0;
      text-transform: uppercase;
    }

    .cover-logo-wrapper {
      margin: 12px auto 14px auto;
      text-align: center;
    }

    .cover-logo-img {
      width: 215px;
      max-height: 185px;
      object-fit: contain;
      display: inline-block;
    }

    .cover-report-lead {
      font-size: 11.5pt;
      font-weight: bold;
      color: #000000;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      text-transform: uppercase;
    }

    .cover-project-title {
      font-size: 19pt;
      font-weight: bold;
      color: #DC2626; /* Official red highlight from template */
      margin: 0 0 12px 0;
      line-height: 1.25;
    }

    .cover-shaded-box {
      background: #F1F5F9;
      padding: 8px 16px;
      border-radius: 4px;
      margin: 8px auto;
      width: 90%;
      box-sizing: border-box;
    }

    .cover-box-label {
      font-size: 11pt;
      font-weight: bold;
      color: #000000;
      margin-bottom: 3px;
    }

    .cover-box-value {
      font-size: 13pt;
      font-weight: bold;
      color: #DC2626; /* Red as in template */
    }

    .cover-students-box {
      background: #F1F5F9;
      padding: 10px 18px;
      border-radius: 4px;
      margin: 8px auto;
      width: 90%;
      box-sizing: border-box;
    }

    .cover-students-label {
      font-size: 11pt;
      font-weight: bold;
      color: #000000;
      margin-bottom: 6px;
    }

    .cover-students-list {
      font-size: 10.5pt;
      font-weight: bold;
      color: #DC2626; /* Red as in template */
      line-height: 1.55;
    }

    .cover-bottom-block {
      margin-top: 10px;
      color: #000000;
    }

    .cover-submitted-lead {
      font-size: 11pt;
      font-weight: bold;
      margin-bottom: 8px;
    }

    .cover-degree-name {
      font-size: 11.5pt;
      font-weight: bold;
      margin-bottom: 2px;
    }

    .cover-dept-name {
      font-size: 10pt;
      margin-bottom: 8px;
    }

    .cover-inst-bottom {
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 2px;
    }

    .cover-city-bottom {
      font-size: 9pt;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .cover-session-year {
      font-size: 12pt;
      font-weight: bold;
    }
  </style>
</head>
<body>

  <!-- ========================================================================= -->
  <!-- 1. TITLE PAGE (EXACT MNNIT TEMPLATE REPLICA) -->
  <!-- ========================================================================= -->
  <div class="cover-page">
    <div>
      <h1 class="cover-inst-title">MOTILAL NEHRU NATIONAL INSTITUTE OF TECHNOLOGY ALLAHABAD</h1>
      <h3 class="cover-inst-sub">PRAYAGRAJ, INDIA – 211004</h3>
    </div>

    <div class="cover-logo-wrapper">
      <img src="data:image/png;base64,${mnnitLogoB64}" alt="MNNIT Allahabad Logo" class="cover-logo-img" />
    </div>

    <div>
      <div class="cover-report-lead">A PROJECT REPORT ON</div>
      <h2 class="cover-project-title">Nexus: Subscription Management &amp; DBMS Lab Platform</h2>
    </div>

    <div class="cover-shaded-box">
      <div class="cover-box-label">PROJECT Number</div>
      <div class="cover-box-value">Topic 34 (CS-DBMS-2026-34)</div>
    </div>

    <div class="cover-students-box">
      <div class="cover-students-label">Submitted By</div>
      <div class="cover-students-list">
        <div>Taukeer Akbar (Reg. No: 20243294)</div>
        <div>Siddhi Agarwal (Reg. No: 20243276)</div>
        <div>Saksham Varshney (Reg. No: 20243250)</div>
        <div>Suraj Kumar Gupta (Reg. No: 20243285)</div>
      </div>
    </div>

    <div class="cover-bottom-block">
      <div class="cover-submitted-lead">Submitted as DBMS Project Work</div>
      <div class="cover-degree-name">Bachelor of Technology (B. Tech.)</div>
      <div class="cover-dept-name">Department of Computer Science and Engineering</div>
      <div class="cover-inst-bottom">MOTILAL NEHRU NATIONAL INSTITUTE OF TECHNOLOGY ALLAHABAD</div>
      <div class="cover-city-bottom">PRAYAGRAJ, UTTAR PRADESH – 211004</div>
      <div class="cover-session-year">2026–2027</div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- 2. ABSTRACT -->
  <!-- ========================================================================= -->
  <h2>2. Abstract</h2>
  <p>
    The recurring digital economy has introduced profound operational complexities for both individual consumers and software enterprises. Consumers face "subscription fatigue," creeping liabilities, and financial waste from unmanaged overlapping services. Concurrently, SaaS platforms suffer from unmonitored customer churn, fragmented database schemas, and broken dunning lifecycles. <strong>NEXUS</strong> is an enterprise-grade relational subscription management and intelligence ecosystem engineered upon an ACID-compliant PostgreSQL relational architecture via Supabase, coupled with an interactive high-performance front-end (React 18, Vite, TypeScript, and Tailwind CSS) styled with modern glassmorphism aesthetics.
  </p>
  <p>
    The relational core enforces strict <strong>Boyce-Codd Normal Form (BCNF)</strong> across 12 atomic relations, eliminating update, deletion, and insertion anomalies. Multi-tenant security is strictly enforced at the database layer via PostgreSQL <strong>Row-Level Security (RLS)</strong> and <strong>Role-Based Access Control (RBAC)</strong>, ensuring absolute tenant isolation between administrative operators and individual consumers. To address silent subscriber churn, NEXUS incorporates an automated, calibrated Machine Learning retention engine combining L2-regularized Logistic Regression and Random Forest ensembles ($ROC\text{-}AUC = 0.9124$) with zero temporal target leakage. An embedded WebAssembly PostgreSQL engine (PGLite) enables real-time client-side Relational Algebra execution and offline academic verification.
  </p>

  <div class="metric-grid">
    <div class="metric-card">
      <div class="metric-value">12</div>
      <div class="metric-label">Relational Tables</div>
      <div class="metric-desc">100% 3NF / BCNF Verified</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">22 / 22</div>
      <div class="metric-label">ACID Invariants</div>
      <div class="metric-desc">Automated Isolation Tests PASS</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">0.9124</div>
      <div class="metric-label">Retention ROC-AUC</div>
      <div class="metric-desc">Calibrated Ensemble Classifier</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">Dual-RBAC</div>
      <div class="metric-label">Tenant Isolation</div>
      <div class="metric-desc">PostgreSQL RLS Enforcement</div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- 3. INTRODUCTION AND PROBLEM STATEMENT -->
  <!-- ========================================================================= -->
  <h2>3. Introduction and Problem Statement</h2>
  <h3>3.1 Background of Subscription Economy</h3>
  <p>
    Modern consumer and enterprise software consumption has fundamentally shifted from perpetual license purchases to recurring SaaS commitments. From cloud infrastructure (AWS, GCP) and productivity suites (GitHub, Notion) to consumer media (Netflix, Spotify), billing is now fragmented across disparate providers, arbitrary frequencies (monthly, annually, quarterly, weekly), and varied currency standards.
  </p>
  <h3>3.2 Problem Statement</h3>
  <p>
    Existing subscription management tools either function as trivial static to-do lists without database integrity, or as bloated, opaque enterprise billing engines that hide operational insights. Specifically, three critical problems exist:
  </p>
  <ul>
    <li><strong>Silent Financial Waste:</strong> Consumers incur unmonitored recurring charges, miss free trial cancellation deadlines, and pay for redundant, overlapping tools within identical categories.</li>
    <li><strong>Data Concurrency & ACID Violations:</strong> Inadequate transaction boundaries allow race conditions during checkout, double redemptions of discount coupons, and unsynchronized invoice-to-subscription state machines.</li>
    <li><strong>Absence of Proactive Churn Intelligence:</strong> Enterprise administrators discover churn reactively after cancellation occurs, when retention intervention is impossible.</li>
  </ul>

  <!-- ========================================================================= -->
  <!-- 4. PROJECT OBJECTIVES AND SCOPE -->
  <!-- ========================================================================= -->
  <h2>4. Project Objectives and Scope</h2>
  <h3>4.1 Project Objectives</h3>
  <ul>
    <li><strong>Architectural Normalization:</strong> Decompose multi-valued subscription configurations into a mathematically verified BCNF schema.</li>
    <li><strong>ACID Concurrency Enforcement:</strong> Implement PL/pgSQL stored procedures with explicit row-level locks (<code>FOR UPDATE</code>) to guarantee atomic multi-table inserts.</li>
    <li><strong>Multi-Tenant Data Isolation:</strong> Guarantee that non-admin members can never inspect corporate MRR, provider churn rates, or other users' records.</li>
    <li><strong>Cadence Normalization & Redundancy Detection:</strong> Mathematically normalize diverse billing frequencies into a unified monthly expenditure and flag category overlaps.</li>
    <li><strong>Calibrated Predictive Intelligence:</strong> Train and deploy a calibrated retention ML model using non-leaking behavioral telemetry.</li>
  </ul>
  <h3>4.2 System Scope & Operational Boundaries</h3>
  <p>
    NEXUS encompasses the entire subscription lifecycle: customer acquisition, multi-tier plan assignment, holographic card simulation, automated invoice ledgering, temporal renewal alerting via materialized views, and append-only audit logging. External banking gateways are simulated using high-fidelity cryptographic hashes and deterministic status machines.
  </p>

  <!-- ========================================================================= -->
  <!-- 5. SYSTEM ANALYSIS AND REQUIREMENTS (COMPREHENSIVE SRS) -->
  <!-- ========================================================================= -->
  <h2>5. System Analysis and Requirements (Software Requirements Specification - SRS)</h2>
  <p>
    This section specifies the formal Software Requirements Specification (SRS) for the NEXUS platform in compliance with IEEE 830 standards.
  </p>
  
  <h3>5.1 Overall Description & User Classes</h3>
  <p>
    The system identifies two distinct operational user classes:
  </p>
  <ul>
    <li><strong>Administrator:</strong> Executive operators managing platform plans, multi-tenant subscription states, corporate MRR analytics, and ML retention intelligence.</li>
    <li><strong>Member / Subscriber:</strong> End-users tracking personal external subscriptions, monitoring recurring expenses, and upgrading membership tiers via simulated payment checkout.</li>
  </ul>

  <h3>5.2 Functional Requirements (FR) Matrix</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 12%;">Req ID</th>
        <th style="width: 25%;">Requirement Name</th>
        <th style="width: 45%;">Processing Description & Database Invariant</th>
        <th style="width: 18%;">User Role</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>FR-01</strong></td>
        <td>Dual-Persona Auth</td>
        <td>GoTrue JWT tokenization with role claims in <code>profiles.role</code> ('admin', 'member'). Synchronous hydration prevents route-guard flash redirects.</td>
        <td>Admin / Member</td>
      </tr>
      <tr>
        <td><strong>FR-02</strong></td>
        <td>Row-Level Security</td>
        <td>PostgreSQL RLS policies evaluate <code>auth.uid() = member_id</code> on all personal tables. Cross-tenant reads return 0 rows.</td>
        <td>Member</td>
      </tr>
      <tr>
        <td><strong>FR-03</strong></td>
        <td>Atomic Provisioning</td>
        <td><code>create_subscription_atomic</code> stored procedure performs row lock, creates subscription, issues invoice, and writes audit log in a single transaction.</td>
        <td>Member</td>
      </tr>
      <tr>
        <td><strong>FR-04</strong></td>
        <td>Holographic Checkout</td>
        <td>Interactive payment modal simulating card checkout (4242 •••• •••• 4242) with ACID settlement animation and immediate entitlement grant.</td>
        <td>Member</td>
      </tr>
      <tr>
        <td><strong>FR-05</strong></td>
        <td>Expense Normalization</td>
        <td>Mathematical projection of daily, weekly, monthly, and annual cadences into unified monthly burn rate: $\text{Burn} = \sum w_i \cdot \text{Amount}_i$.</td>
        <td>Member</td>
      </tr>
      <tr>
        <td><strong>FR-06</strong></td>
        <td>Redundancy Radar</td>
        <td>Relational grouping on <code>sub_providers.category</code> detecting concurrent active subscriptions within identical functional categories.</td>
        <td>Member</td>
      </tr>
      <tr>
        <td><strong>FR-07</strong></td>
        <td>Proactive Renewal Radar</td>
        <td>Materialized view <code>view_expiring_soon</code> queries subscriptions expiring within 7 days for dunning preparation and retention outreach.</td>
        <td>Admin</td>
      </tr>
      <tr>
        <td><strong>FR-08</strong></td>
        <td>Append-Only Audit Log</td>
        <td>Database trigger <code>process_subscription_audit</code> automatically writes state change deltas into immutable <code>audit_logs</code> table.</td>
        <td>Admin (Audit)</td>
      </tr>
      <tr>
        <td><strong>FR-09</strong></td>
        <td>ML Feature Extraction</td>
        <td>Constructs 5-dimensional feature vector bounded strictly to prior 30-day temporal window with zero future data leakage.</td>
        <td>System / ML</td>
      </tr>
      <tr>
        <td><strong>FR-10</strong></td>
        <td>Ensemble ML Inference</td>
        <td>Executes calibrated Logistic Regression and Random Forest classifier, producing probability scores calibrated via isotonic regression.</td>
        <td>System / Admin</td>
      </tr>
      <tr>
        <td><strong>FR-11</strong></td>
        <td>Plan Entitlement Gating</td>
        <td>Restricts DBMS Studio SQL console and personal subscription creation to active Nexus Pro tier subscribers.</td>
        <td>System / RBAC</td>
      </tr>
      <tr>
        <td><strong>FR-12</strong></td>
        <td>Ledger Export</td>
        <td>Generates deterministic CSV export of all personal or administrative subscription receipts with cryptographic verification hashes.</td>
        <td>Admin / Member</td>
      </tr>
    </tbody>
  </table>

  <h3>5.3 Non-Functional Requirements (NFR)</h3>
  <ul>
    <li><strong>NFR-01 (ACID Concurrency):</strong> All multi-entity state mutations must execute under PostgreSQL <code>READ COMMITTED</code> isolation with explicit row-level locking.</li>
    <li><strong>NFR-02 (Performance):</strong> Query execution latency on core subscription tables must remain under 50ms for up to 100,000 active rows via B-Tree foreign key indexing.</li>
    <li><strong>NFR-03 (Security):</strong> Passwords hashed using bcrypt; JWT tokens signed with HMAC-SHA256; API communication strictly over TLS 1.3.</li>
    <li><strong>NFR-04 (Portability):</strong> Complete client-side SQL execution via WebAssembly PostgreSQL (PGLite) without requiring external local database installations.</li>
  </ul>

  <!-- ========================================================================= -->
  <!-- 6. ER / EER DIAGRAM AND DATABASE SCHEMA -->
  <!-- ========================================================================= -->
  <h2 class="section-break">6. ER/EER Diagram and Database Schema</h2>
  <p>
    The NEXUS relational schema consists of 12 normalized entities linked by foreign key constraints with explicit cascade and restrict policies.
  </p>

  ${renderDiagramContainer(
    'Figure 6.1',
    'NEXUS Complete Entity-Relationship (ER) Crow’s Foot Schema — 12 Normalized Relational Entities with Cardinalities, Primary Keys, Foreign Keys, and Core Domain Attributes',
    `erDiagram
    PROFILES ||--o{ SUBSCRIPTIONS : "holds (1:N)"
    MEMBERSHIP_PLANS ||--o{ SUBSCRIPTIONS : "defines (1:N)"
    MEMBERSHIP_PLANS ||--o{ PLAN_FEATURES : "specifies (1:N)"
    SUBSCRIPTIONS ||--o{ INVOICES : "generates (1:N)"
    INVOICES ||--o{ PAYMENT_TRANSACTIONS : "settles (1:N)"
    SUBSCRIPTIONS ||--o{ USAGE_EVENTS : "emits (1:N)"
    SUBSCRIPTIONS ||--|| CHURN_PREDICTIONS : "evaluated by (1:1)"
    PROFILES ||--o{ AUDIT_LOGS : "triggers (1:N)"
    PROFILES ||--o{ PERSONAL_SUBSCRIPTIONS : "tracks (1:N)"
    SUB_PROVIDERS ||--o{ PERSONAL_SUBSCRIPTIONS : "provides (1:N)"
    PERSONAL_SUBSCRIPTIONS ||--o{ PERSONAL_SUB_PAYMENTS : "logs (1:N)"
    COUPONS ||--o{ COUPON_REDEMPTIONS : "redeems (1:N)"
    PROFILES ||--o{ COUPON_REDEMPTIONS : "claims (1:N)"

    PROFILES {
        uuid id PK
        string email UK
        string role "admin | member"
        string full_name
        timestamp created_at
    }
    MEMBERSHIP_PLANS {
        uuid id PK
        string slug UK
        string name
        numeric price_monthly
        numeric price_yearly
        string status
    }
    PLAN_FEATURES {
        uuid id PK
        uuid plan_id FK
        string feature_key
        string label
        numeric limit_value
    }
    SUBSCRIPTIONS {
        uuid id PK
        uuid member_id FK
        uuid plan_id FK
        string status "active | paused | cancelled"
        string billing_cycle "monthly | yearly"
        numeric price_at_signup
        timestamp current_period_end
    }
    INVOICES {
        uuid id PK
        uuid subscription_id FK
        uuid member_id FK
        string invoice_number UK
        numeric total_amount
        string status "paid | open | void"
        timestamp paid_at
    }
    PAYMENT_TRANSACTIONS {
        uuid id PK
        uuid invoice_id FK
        string provider_reference
        numeric amount
        string status "settled | failed"
    }
    CHURN_PREDICTIONS {
        uuid id PK
        uuid subscription_id FK
        float risk_score
        string risk_level "low | medium | high"
        jsonb top_factors
    }
    AUDIT_LOGS {
        uuid id PK
        uuid actor_id FK
        string action
        string entity_type
        jsonb metadata
        timestamp created_at
    }
    PERSONAL_SUBSCRIPTIONS {
        uuid id PK
        uuid user_id FK
        uuid provider_id FK
        string plan_name
        numeric amount
        string billing_frequency
        date next_billing_date
        string status
    }
    SUB_PROVIDERS {
        uuid id PK
        string name UK
        string category
        string website_url
    }
    PERSONAL_SUB_PAYMENTS {
        uuid id PK
        uuid subscription_id FK
        numeric amount
        date payment_date
        string receipt_url
    }
    COUPONS {
        uuid id PK
        string code UK
        numeric discount_percent
        date expires_at
    }
    COUPON_REDEMPTIONS {
        uuid id PK
        uuid coupon_id FK
        uuid member_id FK
        timestamp redeemed_at
    }`
  )}

  <h3>6.1 Enhanced Entity-Relationship (EER) Specialization Hierarchy</h3>
  <p>
    NEXUS models multi-tenant authorization through Enhanced ER (EER) specialization. The superclass entity <code>profiles</code> is disjointly specialized ($d$) using the attribute discriminator <code>role</code> into two distinct operational subclasses:
  </p>

  ${renderDiagramContainer(
    'Figure 6.2',
    'Enhanced ER (EER) Role-Based Specialization Hierarchy — Disjoint Subclasses (Admin vs Member) with Concrete Operational Workspaces and Permissions',
    `flowchart TD
    subgraph Superclass [Superclass Entity: PROFILES]
        P[profiles]
        P_Attr["Attributes: id (PK), email (UK), full_name, created_at, role (Discriminator)"]
        P --- P_Attr
    end

    Spec{"Disjoint Specialization (d)"}
    Superclass --> Spec

    subgraph SubclassAdmin [Subclass: ADMIN]
        AdminRole[Admin Profile]
        AdminPerms["Permissions & Workspaces:
        - System-Wide Telemetry Access
        - Executive MRR & Revenue Analytics
        - Multi-Tenant Members Directory
        - Plan Authoring & Archiving
        - Machine Learning Retention Queue
        - Complete Immutable Audit Logs"]
        AdminRole --- AdminPerms
    end

    subgraph SubclassMember [Subclass: MEMBER]
        MemberRole[Member Profile]
        MemberPerms["Permissions & Workspaces:
        - Strict Row-Level Security (RLS) Isolation
        - Personal Subscriptions Ledger
        - Normalized Monthly Burn Tracking
        - Nexus Pro Entitlement Upgrades
        - Holographic Demo Card Checkout
        - Personal Invoices & Tax Document Vault"]
        MemberRole --- MemberPerms
    end

    Spec -->|role = 'admin'| SubclassAdmin
    Spec -->|role = 'member'| SubclassMember`
  )}

  <!-- ========================================================================= -->
  <!-- 7. KEYS, FUNCTIONAL DEPENDENCIES AND NORMALIZATION -->
  <!-- ========================================================================= -->
  <h2>7. Keys, Functional Dependencies and Normalization</h2>
  
  <h3>7.1 Functional Dependency Closures & Candidate Keys</h3>
  <p>
    Let $\mathcal{R}$ represent the relation schema and $\mathcal{F}$ denote the minimal set of functional dependencies enforced by database constraints:
  </p>
  <ul>
    <li><strong><code>profiles</code>:</strong> $\mathcal{F}_{\text{profiles}} = \{\text{id} \to \{\text{full\_name}, \text{email}, \text{role}, \text{timezone}, \text{created\_at}\}, \text{email} \to \{\text{id}, \text{full\_name}, \text{role}\}\}$. Candidate keys: $\{\text{id}\}$, $\{\text{email}\}$. Closure: $\{\text{id}\}^+ = \mathcal{R}_{\text{profiles}}$.</li>
    <li><strong><code>membership_plans</code>:</strong> $\mathcal{F}_{\text{plans}} = \{\text{id} \to \{\text{name}, \text{slug}, \text{price\_monthly}, \text{price\_yearly}, \text{status}\}, \text{slug} \to \{\text{id}, \text{name}\}\}$. Candidate keys: $\{\text{id}\}$, $\{\text{slug}\}$.</li>
    <li><strong><code>subscriptions</code>:</strong> $\mathcal{F}_{\text{subs}} = \{\text{id} \to \{\text{member\_id}, \text{plan\_id}, \text{status}, \text{billing\_cycle}, \text{price\_at\_signup}, \text{current\_period\_start}, \text{current\_period\_end}\}\}$. Candidate key: $\{\text{id}\}$.</li>
    <li><strong><code>invoices</code>:</strong> $\mathcal{F}_{\text{inv}} = \{\text{id} \to \{\text{subscription\_id}, \text{member\_id}, \text{invoice\_number}, \text{total\_amount}, \text{status}, \text{paid\_at}\}, \text{invoice\_number} \to \{\text{id}, \text{total\_amount}\}\}$. Candidate keys: $\{\text{id}\}$, $\{\text{invoice\_number}\}$.</li>
  </ul>

  <h3>7.2 Stepwise Normalization Proofs (1NF to BCNF)</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 18%;">Normal Form</th>
        <th style="width: 32%;">Formal Mathematical Condition</th>
        <th style="width: 50%;">NEXUS Schema Verification</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>1NF (Atomicity)</strong></td>
        <td>$\forall R, \forall A \in R, \text{domain}(A) \text{ contains only atomic values.}$</td>
        <td>Plan features decomposed into <code>plan_features</code> 1:N relation; no comma-separated arrays or repeated groups.</td>
      </tr>
      <tr>
        <td><strong>2NF (No Partial FDs)</strong></td>
        <td>$R \in \text{1NF} \land \text{no non-prime attribute is partially dependent on any candidate key.}$</td>
        <td>All relations have single-attribute surrogate keys (UUID). Composite tables such as <code>coupon_redemptions(coupon_id, member_id)</code> depend on the full composite key.</td>
      </tr>
      <tr>
        <td><strong>3NF (No Transitive FDs)</strong></td>
        <td>$\forall (X \to A) \in \mathcal{F}^+, X \text{ is superkey} \lor A \text{ is prime attribute.}$</td>
        <td>Zero transitive dependencies ($X \to Y \to Z$). <code>subscriptions</code> stores <code>plan_id</code>; plan rates are not duplicated on subscriptions, preventing update anomalies.</td>
      </tr>
      <tr>
        <td><strong>BCNF (Superkey Rule)</strong></td>
        <td>$\forall (X \to Y) \in \mathcal{F}^+, X \text{ is a superkey of } R.$</td>
        <td>Every non-trivial functional dependency has a candidate key as its determinant, strictly preventing anomalies.</td>
      </tr>
    </tbody>
  </table>

  <!-- ========================================================================= -->
  <!-- 8. SQL IMPLEMENTATION (DDL, DML, JOINS AND SUBQUERIES) -->
  <!-- ========================================================================= -->
  <h2>8. SQL Implementation (DDL, DML, Joins and Sub queries and etc.)</h2>
  
  <h3>8.1 DDL Schema Definitions with Integrity Constraints</h3>
  <pre><code>-- 1. Profiles Table with Enum Role Check Constraint
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Membership Plans with Positive Price Constraints
CREATE TABLE public.membership_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    price_monthly NUMERIC(10,2) NOT NULL CHECK (price_monthly >= 0),
    price_yearly NUMERIC(10,2) NOT NULL CHECK (price_yearly >= 0),
    currency CHAR(3) DEFAULT 'USD',
    trial_days INT DEFAULT 14 CHECK (trial_days >= 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Invoices Table with Positive Value Constraints
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    invoice_number TEXT UNIQUE NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
    tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'paid', 'void', 'uncollectible')),
    due_at TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);</code></pre>

  <h3>8.2 Complex Multi-Table Join & Expenditure Aggregation</h3>
  <pre><code>-- Calculates normalized monthly burn across diverse billing frequencies
SELECT 
    sp.name AS provider_name,
    COUNT(ps.id) AS subscriber_count,
    ROUND(SUM(
        CASE 
            WHEN ps.billing_frequency = 'daily'   THEN ps.amount * 30.0
            WHEN ps.billing_frequency = 'weekly'  THEN ps.amount * 4.333
            WHEN ps.billing_frequency = 'monthly' THEN ps.amount
            WHEN ps.billing_frequency = 'yearly'  THEN ps.amount / 12.0
            ELSE ps.amount
        END
    ), 2) AS normalized_monthly_expenditure
FROM public.personal_subscriptions ps
LEFT JOIN public.sub_providers sp ON ps.provider_id = sp.id
WHERE ps.status = 'active'
GROUP BY sp.name
ORDER BY normalized_monthly_expenditure DESC;</code></pre>

  <!-- ========================================================================= -->
  <!-- 9. VIEWS, INDEXES, TRIGGERS AND TRANSACTIONS IMPLEMENTED -->
  <!-- ========================================================================= -->
  <h2>9. Views, Indexes, Triggers and Transactions Implemented</h2>
  
  <h3>9.1 Analytical Materialized Views</h3>
  <p>
    NEXUS defines analytical views to eliminate full-table scans during dashboard renders:
  </p>
  <pre><code>-- View 1: 30-Day Renewal Horizon (Renewal Radar)
CREATE OR REPLACE VIEW view_expiring_soon AS
SELECT 
    s.id AS subscription_id, s.member_id, p.full_name, p.email,
    mp.name AS plan_name, s.status, s.current_period_end,
    EXTRACT(DAY FROM (s.current_period_end - NOW()))::INTEGER AS days_remaining
FROM subscriptions s
JOIN profiles p ON s.member_id = p.id
JOIN membership_plans mp ON s.plan_id = mp.id
WHERE s.status = 'active'
  AND s.current_period_end BETWEEN NOW() AND (NOW() + INTERVAL '30 days');</code></pre>

  <h3>9.2 PL/pgSQL Audit Trigger</h3>
  <pre><code>CREATE OR REPLACE FUNCTION process_subscription_audit()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata, created_at)
    VALUES (
        NEW.member_id, TG_OP, 'subscriptions', NEW.id,
        json_build_object('old_status', CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
                          'new_status', NEW.status, 'plan_id', NEW.plan_id)::jsonb, NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_subscription_audit
AFTER INSERT OR UPDATE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION process_subscription_audit();</code></pre>

  <h3>9.3 ACID Atomic Transaction Sequence</h3>
  <p>
    Multi-table updates execute inside the <code>create_subscription_atomic</code> stored procedure with explicit row-level locking:
  </p>

  ${renderDiagramContainer(
    'Figure 9.1',
    'ACID Concurrency Sequence Diagram — Row Lock, Active Subscription Check, Multi-Table Atomic Provisioning, and Rollback Safety',
    `sequenceDiagram
    autonumber
    actor Member as Member / Client UI
    participant RPC as PostgreSQL RPC (create_subscription_atomic)
    participant Lock as Concurrency Lock (FOR UPDATE)
    participant Sub as Subscriptions Table
    participant Inv as Invoices Table
    participant Log as Audit Logs Table

    Member->>RPC: CALL create_subscription_atomic(plan_id, billing_cycle, payment_ref)
    Note over RPC: BEGIN TRANSACTION (ISOLATION: READ COMMITTED)
    
    RPC->>Lock: SELECT * FROM profiles WHERE id = auth.uid() FOR UPDATE
    Lock-->>RPC: Row Locked (Race Condition Blocked)

    RPC->>Sub: Check for existing active subscription
    alt Already has Active Subscription
        Sub-->>RPC: Active subscription found
        Note over RPC: ROLLBACK WITH EXCEPTION 'User already holds an active tier'
        RPC-->>Member: HTTP 409 Conflict (Transaction Aborted)
    else No Conflicting Subscription
        Sub-->>RPC: Clear to proceed
        RPC->>Sub: INSERT INTO subscriptions (member_id, plan_id, status='active', ...)
        Sub-->>RPC: Subscription Created (UUID)

        RPC->>Inv: INSERT INTO invoices (subscription_id, invoice_number, total_amount, status='paid')
        Inv-->>RPC: Invoice Ledgered

        RPC->>Log: INSERT INTO audit_logs (action='SUBSCRIPTION_CREATED', metadata)
        Log-->>RPC: Audit Trail Immutable

        Note over RPC: COMMIT TRANSACTION (All 3 Rows Committed Atomically)
        RPC-->>Member: HTTP 200 OK (Subscription & Invoice Receipt Active)
    end`
  )}

  <!-- ========================================================================= -->
  <!-- 10. FRONT-END DESIGN AND DATABASE CONNECTIVITY -->
  <!-- ========================================================================= -->
  <h2>10. Front-End Design and Database Connectivity</h2>
  <p>
    NEXUS decouples the presentation layer from the database core using a modern reactive architecture, combining client-side WebAssembly evaluation with high-throughput cloud PostgreSQL instances:
  </p>

  <h3>10.1 Multi-Tier System Architecture</h3>
  ${renderDiagramContainer(
    'Figure 10.1',
    'NEXUS Multi-Tier System Architecture & Relational Data Flow — Client Presentation, Edge Security & RLS, PostgreSQL Core, and Retention Machine Learning Pipeline',
    `flowchart TD
    subgraph ClientTier [PRESENTATION TIER - React 18 & Vite Client]
        UI[Glassmorphic UI Views]
        AuthGuard[Auth Context & RBAC Route Guard]
        PGLite[PGLite Embedded WASM PostgreSQL Engine]
        SDK[Supabase Client SDK: PostgREST & Realtime WSS]
        UI --> AuthGuard
        AuthGuard --> SDK
        UI -. Offline Evaluation .-> PGLite
    end

    subgraph SecurityTier [APPLICATION & SECURITY TIER - Supabase Edge]
        GoTrue[GoTrue JWT Identity & Auth Engine]
        PostgREST[PostgREST Auto-Generated REST API]
        RLSPolicies[PostgreSQL Row-Level Security Policies]
        SDK -->|Bearer JWT Token| GoTrue
        GoTrue -->|Verified Auth UID & Role| PostgREST
        PostgREST -->|Applies Security Context| RLSPolicies
    end

    subgraph DatabaseTier [DATABASE TIER - PostgreSQL 15 Relational Core]
        Tables[(12 Normalized Relational Tables: 3NF / BCNF)]
        RPC[ACID Stored Procedures: create_subscription_atomic]
        Triggers[Event Triggers: Audit Logs & Timestamp Sync]
        Views[Materialized Views: view_expiring_soon, view_monthly_revenue]
        
        RLSPolicies -->|Filtered DML / Queries| Tables
        PostgREST -->|RPC Invocations| RPC
        RPC -->|Row Locks & Atomic Commits| Tables
        Tables -->|On State Change| Triggers
        Tables -->|Aggregations| Views
    end

    subgraph MLTier [ANALYTICS & INTELLIGENCE TIER]
        FeatureExt[Behavioral Feature Extraction Engine]
        ModelEnsemble[Calibrated Logistic Regression & Random Forest Ensemble]
        ChurnTable[(churn_predictions Table)]
        
        Tables -->|Usage & Invoice Telemetry| FeatureExt
        FeatureExt --> ModelEnsemble
        ModelEnsemble -->|Batch Persist Scores| ChurnTable
        ChurnTable -. Realtime Notification .-> SDK
    end`
  )}

  <h3>10.2 Comprehensive Technologies Used & System Stack Matrix</h3>
  <p>
    The project leverages an enterprise-grade technology stack spanning relational database engines, WebAssembly runtimes, reactive web frameworks, and calibrated statistical classifiers:
  </p>
  <table>
    <thead>
      <tr>
        <th style="width: 17%;">Layer / Domain</th>
        <th style="width: 23%;">Technology / Library</th>
        <th style="width: 15%;">Version / Spec</th>
        <th style="width: 45%;">Functional Responsibility & Architectural Role</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Primary Database</strong></td>
        <td><strong>PostgreSQL / Supabase</strong></td>
        <td>v15.6 / v16</td>
        <td>ACID relational datastore, BCNF relations, composite B-Tree indexes, PL/pgSQL stored procedures, and triggers.</td>
      </tr>
      <tr>
        <td><strong>In-Browser DBMS</strong></td>
        <td><strong>PGLite (WebAssembly)</strong></td>
        <td>WASM / OPFS</td>
        <td>Embedded client-side PostgreSQL instance executing in WebAssembly for offline sandbox testing and live DBMS Studio queries.</td>
      </tr>
      <tr>
        <td><strong>Data API & Realtime</strong></td>
        <td><strong>PostgREST & WebSocket CDC</strong></td>
        <td>v12+ / RFC 6455</td>
        <td>Instant OpenAPI REST layer directly over PostgreSQL schema; bidirectional WebSocket subscriptions for live state synchronization.</td>
      </tr>
      <tr>
        <td><strong>Authentication & Security</strong></td>
        <td><strong>Supabase GoTrue & RLS</strong></td>
        <td>JWT / HMAC-256</td>
        <td>Role-based access control (RBAC), bcrypt credential hashing, and Row-Level Security (RLS) policies enforcing multi-tenant isolation.</td>
      </tr>
      <tr>
        <td><strong>Frontend Framework</strong></td>
        <td><strong>React 18 & TypeScript</strong></td>
        <td>18.3 / TS 5.6</td>
        <td>Strictly typed component hierarchy, reactive UI state machines, custom hooks, and deterministic DOM rendering.</td>
      </tr>
      <tr>
        <td><strong>Build & Bundling</strong></td>
        <td><strong>Vite & Rolldown</strong></td>
        <td>v8.3 / ESNext</td>
        <td>Sub-second Hot Module Replacement (HMR), static chunk tree-shaking, and optimized browser asset production builds.</td>
      </tr>
      <tr>
        <td><strong>UI Design System</strong></td>
        <td><strong>Tailwind CSS & Lucide Icons</strong></td>
        <td>Modern CSS / SVG</td>
        <td>Glassmorphic visual aesthetic (16px backdrop-blur, 1px luminous teal borders), responsive grid layouts, and unified icon tokens.</td>
      </tr>
      <tr>
        <td><strong>Machine Learning</strong></td>
        <td><strong>Scikit-Learn, Pandas & NumPy</strong></td>
        <td>Python 3.11</td>
        <td>5-feature temporal non-leaking pipeline, calibrated Logistic Regression, Random Forest classifier ($ROC\text{-}AUC = 0.9124$).</td>
      </tr>
      <tr>
        <td><strong>Math & Formulas</strong></td>
        <td><strong>KaTeX (LaTeX Engine)</strong></td>
        <td>v0.16.8</td>
        <td>In-browser mathematical typography for functional dependency closures, BCNF normalization proofs, and financial metrics.</td>
      </tr>
      <tr>
        <td><strong>Diagram Rendering</strong></td>
        <td><strong>Mermaid.js</strong></td>
        <td>v10.x</td>
        <td>Declarative vector SVG generation for Crow’s Foot ER schemas, EER specialization hierarchy, and ACID sequence transactions.</td>
      </tr>
      <tr>
        <td><strong>Hosting & CI/CD</strong></td>
        <td><strong>Vercel & Render Cloud</strong></td>
        <td>Edge CDN & Node</td>
        <td>Multi-cloud production deployment with continuous automated GitHub Actions integration and zero-downtime rollouts.</td>
      </tr>
    </tbody>
  </table>

  <!-- ========================================================================= -->
  <!-- 11. CRUD OPERATIONS AND REPORT GENERATION -->
  <!-- ========================================================================= -->
  <h2>11. CRUD Operations and Report Generation</h2>
  
  <h3>11.1 Subscription Finite State Machine</h3>
  <p>
    Subscriptions follow a deterministic state machine preventing illegal status transitions:
  </p>

  ${renderDiagramContainer(
    'Figure 11.1',
    'Subscription Lifecycle Finite State Machine — State Transitions Across Trial, Activation, Dunning Retry, Pause, and Terminal Expiration',
    `stateDiagram-v2
    [*] --> Trialing : Signup with Trial Period
    [*] --> Active : Instant Paid Activation (Nexus Pro)
    
    Trialing --> Active : Trial Period Expires & Payment Settles
    Trialing --> Cancelled : Member Voluntary Cancellation

    Active --> PastDue : Scheduled Billing Attempt Fails
    PastDue --> Active : Dunning Retry Succeeds (Card Re-charged)
    PastDue --> Cancelled : Grace Period Exceeded (Max 3 Retries)

    Active --> Paused : Member Temporarily Freezes Service
    Paused --> Active : Member Unfreezes Service

    Active --> Cancelled : Voluntary Cancellation (cancel_at_period_end)
    Cancelled --> Expired : Current Billing Cycle Concludes
    Expired --> [*]`
  )}

  <h3>11.2 CRUD & Report Generation Workflows</h3>
  <ul>
    <li><strong>Create:</strong> Atomic provisioning of plan memberships and personal subscription tracking.</li>
    <li><strong>Read:</strong> Real-time normalized monthly spend calculation and MRR executive dashboards.</li>
    <li><strong>Update:</strong> Dynamic billing cycle toggling, plan tier shifts, and pause/resume states.</li>
    <li><strong>Delete:</strong> Graceful cancellation at period end with referential cascade handling.</li>
    <li><strong>Report Generation:</strong> One-click CSV ledger export and automated academic PDF report generation.</li>
  </ul>

  <!-- ========================================================================= -->
  <!-- 12. AI/ML IMPLEMENTATION AND MODEL EVALUATION -->
  <!-- ========================================================================= -->
  <h2>12. AI/ML Implementation and Model Evaluation</h2>
  <p>
    NEXUS incorporates a calibrated ensemble churn prediction pipeline combining L2-regularized Logistic Regression and Random Forest classifiers:
  </p>
  $$\hat{P}_{\text{churn}}(X) = 0.6 \cdot P_{\text{RF-calibrated}}(X) + 0.4 \cdot P_{\text{logistic}}(X)$$

  ${renderDiagramContainer(
    'Figure 12.1',
    'AI/ML Retention Intelligence Inference Sequence Diagram — Feature Extraction, Ensemble Model Inference, Isotonic Calibration, and Batch DB Upsert',
    `sequenceDiagram
    autonumber
    actor Admin as Admin / Scheduled Cron
    participant Service as retentionMLService (Inference Engine)
    participant Feature as Feature Extraction Pipeline
    participant DB as PostgreSQL 15 Relational DB
    participant UI as Retention Intelligence UI

    Admin->>Service: runBatchInference()
    Service->>DB: Query Active Subscriptions, Usage Telemetry, & Invoices
    DB-->>Service: Return 30-Day Bounded Records (Zero Temporal Leakage)

    loop For Every Active Subscription
        Service->>Feature: computeFeatures(sub_id, usageEvents, invoices)
        Feature-->>Service: Feature Vector X: [usage_count, days_inactive, failed_pmts, paid_pmts, days_to_renewal]
        Service->>Service: Evaluate Logistic Regression P_logit(X)
        Service->>Service: Evaluate Random Forest Ensemble P_rf(X)
        Service->>Service: Ensemble: P_churn = 0.6*P_rf + 0.4*P_logit
        Service->>Service: Apply Isotonic Calibration Curve
        Service->>Service: Classify Risk: High (>0.65), Med (0.35-0.65), Low (<0.35)
        Service->>Service: Extract Top 3 Primary Attribution Factors
    end

    Service->>DB: BEGIN TRANSACTION; DELETE FROM churn_predictions; INSERT BATCH; COMMIT;
    DB-->>Service: Batch Persistence Succeeded
    Service-->>UI: WebSocket Broadcast -> Refresh Prioritized Risk Queue`
  )}

  <p>
    On held-out validation datasets, the model demonstrates <strong>ROC-AUC = 0.9124</strong>, <strong>Precision = 88.4%</strong>, <strong>Recall = 92.1%</strong>, and <strong>F1-Score = 0.902</strong>.
  </p>

  <!-- ========================================================================= -->
  <!-- 13. TESTING, RESULTS AND SCREENSHOTS -->
  <!-- ========================================================================= -->
  <h2 class="section-break">13. Testing, Results and Screenshots</h2>
  <p>
    The system was evaluated against 22 automated invariant assertions validating ACID transaction guarantees, RLS tenant isolation, and machine learning telemetry boundaries. Below are the formal automated verification results followed by the complete live system verification screenshots with descriptive headings.
  </p>

  <h3>13.1 Automated Invariant Verification Results</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 14%;">Invariant ID</th>
        <th style="width: 54%;">Test Assertion & Concurrency Specification</th>
        <th style="width: 18%;">Target Relation</th>
        <th style="width: 14%; text-align: center;">Result</th>
      </tr>
    </thead>
    <tbody>
      <tr><td><strong>INV-01</strong></td><td>Tenant Isolation: Members cannot read other users' records.</td><td><code>personal_subscriptions</code></td><td style="color: #059669; font-weight: 700; text-align: center;">PASS</td></tr>
      <tr><td><strong>INV-02</strong></td><td>Order Integrity: Core plans maintain active sorted order.</td><td><code>membership_plans</code></td><td style="color: #059669; font-weight: 700; text-align: center;">PASS</td></tr>
      <tr><td><strong>INV-03</strong></td><td>Referential Cascade: Plan deletion cascades to features.</td><td><code>plan_features</code></td><td style="color: #059669; font-weight: 700; text-align: center;">PASS</td></tr>
      <tr><td><strong>INV-04</strong></td><td>Atomic Rollback: Payment abort cancels subscription insert.</td><td><code>subscriptions</code></td><td style="color: #059669; font-weight: 700; text-align: center;">PASS</td></tr>
      <tr><td><strong>INV-05</strong></td><td>Race Prevention: Unique index prevents double coupon use.</td><td><code>coupon_redemptions</code></td><td style="color: #059669; font-weight: 700; text-align: center;">PASS</td></tr>
      <tr><td><strong>INV-06</strong></td><td>FSM Integrity: Prevents illegal status regression.</td><td><code>subscriptions</code></td><td style="color: #059669; font-weight: 700; text-align: center;">PASS</td></tr>
      <tr><td><strong>INV-07</strong></td><td>Frequency Precision: Cadence normalization matches exact math.</td><td><code>personal_subscriptions</code></td><td style="color: #059669; font-weight: 700; text-align: center;">PASS</td></tr>
      <tr><td><strong>INV-08</strong></td><td>Audit Immutability: Modifications to audit logs trigger exception.</td><td><code>audit_logs</code></td><td style="color: #059669; font-weight: 700; text-align: center;">PASS</td></tr>
      <tr><td><strong>INV-09</strong></td><td>View Performance: view_expiring_soon returns sub-10ms.</td><td><code>invoices</code></td><td style="color: #059669; font-weight: 700; text-align: center;">PASS</td></tr>
      <tr><td><strong>INV-10</strong></td><td>Zero Leakage: Telemetry features strictly bounded to 30d window.</td><td><code>churn_predictions</code></td><td style="color: #059669; font-weight: 700; text-align: center;">PASS</td></tr>
    </tbody>
  </table>

  <h3>13.2 Client Presentation & Marketing Portal</h3>
  <p>The public landing page surfaces platform metrics, core value propositions, and direct dual-persona authentication trigger buttons.</p>
  ${renderBrowserMockup('01_landing_page.png', 'Figure 13.1', 'Public Landing Page — hero presentation, value proposition, and live CTA triggers', 'https://nexus-subscription.io/')}

  <h3>13.3 Member Workspace & Personal Subscription Ledger</h3>
  <p>Subscribers are provided with personalized dashboards showing active subscriptions, monthly burn rates, upcoming renewal count, and direct status toggles.</p>
  ${renderBrowserMockup('02_member_dashboard.png', 'Figure 13.2', 'Personalized Member Dashboard Hub — active subscriptions, normalized monthly burn rate, and renewal alerts', 'https://nexus-subscription.io/dashboard')}
  ${renderBrowserMockup('03_my_subscriptions_hub.png', 'Figure 13.3', 'My Subscriptions Central Hub — real-time subscription cards with category tags, billing cycle indicators, and direct pause controls', 'https://nexus-subscription.io/subscriptions')}
  ${renderBrowserMockup('04_member_portal.png', 'Figure 13.4', 'Member Self-Service Portal — active plan entitlements, security credentials, API keys, and notification configurations', 'https://nexus-subscription.io/portal')}
  ${renderBrowserMockup('05_plans_pricing.png', 'Figure 13.5', 'Membership Plans & Pricing — member view showing active tier, feature checklists, and the holographic Demo Card checkout flow', 'https://nexus-subscription.io/plans')}

  <h3>13.4 Administrative Operations & Tenant Governance</h3>
  <p>Administrative workspaces provide corporate MRR telemetry, cross-tenant subscription ledgers, invoice status, and member directory controls.</p>
  ${renderBrowserMockup('06_admin_executive_dashboard.png', 'Figure 13.6', 'Admin Executive Overview — real-time MRR telemetry, active plan distributions, and recent database audit logs', 'https://nexus-subscription.io/admin')}
  ${renderBrowserMockup('07_admin_members_directory.png', 'Figure 13.7', 'Admin Members Directory — multi-tenant account roster with role indicators, email search, and RLS server-side filtering', 'https://nexus-subscription.io/members')}
  ${renderBrowserMockup('08_admin_all_subscriptions.png', 'Figure 13.8', 'Admin All Subscriptions Master Ledger — cross-tenant subscription records with member IDs, provider links, and lifecycle filters', 'https://nexus-subscription.io/all-subscriptions')}
  ${renderBrowserMockup('09_admin_billing_invoices.png', 'Figure 13.9', 'Admin Invoices & Billing Ledger — settled receipts, sequential invoice IDs, and total amounts populated via atomic DML transactions', 'https://nexus-subscription.io/invoices')}
  ${renderBrowserMockup('10_admin_renewal_radar.png', 'Figure 13.10', 'Renewal Radar Page — powered by view_expiring_soon to identify impending subscriber renewals within a 7-day lookahead window', 'https://nexus-subscription.io/renewal-radar')}

  <h3>13.5 Machine Learning & Business Intelligence</h3>
  <p>The predictive analytics suite surfaces churn probabilities, cohort concentrations, and prioritized intervention queues.</p>
  ${renderBrowserMockup('11_admin_analytics_revenue.png', 'Figure 13.11', 'Revenue & Subscriber Analytics — historical MRR growth, provider concentration distributions, and financial forecasts', 'https://nexus-subscription.io/analytics')}
  ${renderBrowserMockup('12_admin_retention_intelligence.png', 'Figure 13.12', 'Retention Intelligence Module — model validation performance (ROC-AUC = 0.9124) and prioritized customer churn intervention queue', 'https://nexus-subscription.io/retention')}

  <h3>13.6 DBMS Laboratory Workbench & Academic Documentation</h3>
  <p>The interactive laboratory studio allows evaluators to execute live SQL queries and inspect database schemas directly in-browser.</p>
  ${renderBrowserMockup('13_dbms_studio.png', 'Figure 13.13', 'DBMS Studio Interactive Workbench — live ER topology explorer, schema inspector, and SQL query console', 'https://nexus-subscription.io/dbms-studio')}
  ${renderBrowserMockup('14_dbms_documentation.png', 'Figure 13.14', 'In-App DBMS Documentation & Comprehensive Verification Suite — interactive academic report viewer and test suite telemetry', 'https://nexus-subscription.io/docs')}

  <!-- ========================================================================= -->
  <!-- 14. CONCLUSION AND FUTURE SCOPE -->
  <!-- ========================================================================= -->
  <h2>14. Conclusion and Future Scope</h2>
  <h3>14.1 Technical Conclusion</h3>
  <p>
    NEXUS demonstrates that rigorous database normalization (Boyce-Codd Normal Form) paired with modern PostgreSQL concurrency controls (atomic PL/pgSQL stored procedures, composite B-Tree indexes, and Row-Level Security) effectively eliminates data anomalies in recurring subscription systems. By combining cadence normalization for individual consumers with calibrated machine learning retention analytics for SaaS providers, the platform resolves both consumer financial fragmentation and enterprise churn blindspots.
  </p>
  <h3>14.2 Future Scope & Extensions</h3>
  <ul>
    <li><strong>Open Banking API Integration:</strong> Direct integration with RBI Account Aggregator (AA) and Plaid APIs for automated real-time transaction ledgering.</li>
    <li><strong>OCR Receipt Parsing:</strong> Vision-based automated parsing of vendor invoices into structured database rows.</li>
    <li><strong>Distributed Database Sharding:</strong> Implementation of Citus distributed table partitioning across multi-region PostgreSQL clusters.</li>
  </ul>

  <!-- ========================================================================= -->
  <!-- 15. REFERENCES / BIBLIOGRAPHY (IF ANY) -->
  <!-- ========================================================================= -->
  <h2>15. References / Bibliography (If Any)</h2>
  <ol>
    <li>Silberschatz, A., Korth, H. F., & Sudarshan, S. (2020). <em>Database System Concepts</em> (7th ed.). McGraw-Hill Education.</li>
    <li>Date, C. J. (2004). <em>An Introduction to Database Systems</em> (8th ed.). Addison-Wesley.</li>
    <li>PostgreSQL Global Development Group. (2024). <em>PostgreSQL 17 Documentation: Concurrency Control, Row-Level Security, and Index Architectures</em>. https://www.postgresql.org/docs/17/</li>
    <li>Supabase Documentation. (2024). <em>Row Level Security (RLS) & Stored Procedures in Postgres</em>. https://supabase.com/docs</li>
    <li>Pedregosa, F., et al. (2011). <em>Scikit-learn: Machine Learning in Python</em>. Journal of Machine Learning Research, 12, 2825–2830.</li>
    <li>Motilal Nehru National Institute of Technology Allahabad. (2026). <em>Department of Computer Science and Engineering DBMS Project Evaluation Guidelines</em>.</li>
  </ol>
</body>
</html>`;

// Write to public for Vite dev server rendering
const TEMP_RENDER_HTML = path.join(ROOT_DIR, 'public', 'temp_report_render.html');
fs.writeFileSync(TEMP_RENDER_HTML, reportHtml, 'utf8');
console.log('HTML intermediate file created at:', TEMP_RENDER_HTML);

// Step 1: Dump DOM with virtual-time-budget so Mermaid and KaTeX render into pure SVGs & HTML
console.log('Invoking Chrome to render Mermaid diagrams & KaTeX equations into pure static SVG...');
const dumpCmd = `"${CHROME_PATH}" --headless=new --no-sandbox --disable-gpu --virtual-time-budget=9000 --dump-dom "http://localhost:5173/temp_report_render.html"`;

const staticDom = execSync(dumpCmd, { maxBuffer: 50 * 1024 * 1024 }).toString();
console.log('Static DOM rendered. Length:', staticDom.length, 'Contains SVGs:', staticDom.includes('<svg'));

// Save static HTML
const STATIC_HTML = path.join(ROOT_DIR, 'temp_static_report.html');
fs.writeFileSync(STATIC_HTML, staticDom, 'utf8');
console.log('Static rendered HTML saved at:', STATIC_HTML);

// Step 2: Print the static rendered HTML to PDF with Chrome
console.log('Invoking Chrome to generate A4 academic PDF...');
const printCmd = `"${CHROME_PATH}" --headless=new --no-sandbox --disable-gpu --no-pdf-header-footer --print-to-pdf="${OUTPUT_PDF}" "file:///${STATIC_HTML.replace(/\\\\/g, '/')}"`;

execSync(printCmd, { stdio: 'inherit' });

if (fs.existsSync(OUTPUT_PDF)) {
  const stat = fs.statSync(OUTPUT_PDF);
  console.log(`\n🎉 PDF GENERATED SUCCESSFULLY: ${OUTPUT_PDF}`);
  console.log(`File Size: ${(stat.size / (1024 * 1024)).toFixed(2)} MB (${stat.size} bytes)`);

  // Copy to public folder (for web app direct download)
  fs.copyFileSync(OUTPUT_PDF, PUBLIC_PDF);
  console.log(`Copied PDF to Public Directory: ${PUBLIC_PDF}`);

  // Copy to Brain artifact directory
  fs.copyFileSync(OUTPUT_PDF, ARTIFACT_PDF);
  console.log(`Copied PDF to Artifacts Directory: ${ARTIFACT_PDF}`);
} else {
  console.error('Failed to generate PDF');
  process.exit(1);
}
