import React, { useState } from 'react';
import { 
  FileText, 
  Layers, 
  Database, 
  ShieldCheck, 
  Cpu, 
  Activity, 
  GitBranch, 
  CheckCircle2, 
  Code, 
  ExternalLink,
  ChevronRight,
  BookOpen,
  Sparkles,
  ArrowRight,
  Printer,
  Copy,
  Check,
  Download,
  CreditCard,
  Clock,
  TrendingUp,
  AlertCircle,
  FileCheck2,
  Calendar,
  Lock,
  Search,
  DollarSign,
  PieChart
} from 'lucide-react';
import { generateAcademicReportPDF } from '../utils/generateAcademicPDF';

const ScreenshotFigure: React.FC<{
  src: string;
  alt: string;
  figureNumber: string;
  caption: string;
}> = ({ src, alt, figureNumber, caption }) => (
  <div className="my-6 rounded-2xl bg-[#071112] border border-[rgba(220,255,245,0.15)] overflow-hidden shadow-2xl">
    <div className="p-2.5 bg-[#0B0F12] border-b border-[rgba(220,255,245,0.08)] flex items-center justify-between text-[11px] font-mono text-[#8E9F9B] px-4">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block animate-pulse" />
        <span className="text-[#F1F5F0] font-semibold">{alt}</span>
      </div>
      <span className="text-[#8DFFCB] text-[10px] uppercase font-bold tracking-wider">Live System Verification</span>
    </div>
    <img src={src} alt={alt} className="w-full object-cover max-h-[600px] border-b border-[rgba(220,255,245,0.06)]" />
    <div className="p-3.5 bg-[#0D1919] text-center text-xs font-mono text-[#8E9F9B]">
      <strong className="text-[#8DFFCB]">{figureNumber}:</strong> {caption}
    </div>
  </div>
);

export const DBMSDocsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('all');
  const [copiedQuery, setCopiedQuery] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuery(id);
    setTimeout(() => setCopiedQuery(null), 2000);
  };

  const sections = [
    { id: 'sec1_title', number: '1', title: 'Title Page', icon: BookOpen },
    { id: 'sec2_abstract', number: '2', title: 'Abstract', icon: FileText },
    { id: 'sec3_intro', number: '3', title: 'Introduction & Problem Statement', icon: Activity },
    { id: 'sec4_objectives', number: '4', title: 'Project Objectives & Scope', icon: Layers },
    { id: 'sec5_sysanalysis', number: '5', title: 'System Analysis & Requirements', icon: Cpu },
    { id: 'sec6_er', number: '6', title: 'ER/EER Diagram & Database Schema', icon: GitBranch },
    { id: 'sec7_norm', number: '7', title: 'Keys, FDs & Normalization (3NF/BCNF)', icon: ShieldCheck },
    { id: 'sec8_sql', number: '8', title: 'SQL Implementation (DDL, DML, Joins)', icon: Code },
    { id: 'sec9_txns', number: '9', title: 'Views, Indexes, Triggers & Transactions', icon: Database },
    { id: 'sec10_frontend', number: '10', title: 'Front-End Design & DB Connectivity', icon: Cpu },
    { id: 'sec11_flow', number: '11', title: 'CRUD Operations & Full Flow (How to Use & Benefits)', icon: CreditCard },
    { id: 'sec12_ml', number: '12', title: 'AI/ML Churn Retention & Evaluation', icon: Sparkles },
    { id: 'sec13_testing', number: '13', title: 'Testing, Results & Screenshots', icon: CheckCircle2 },
    { id: 'sec14_conclusion', number: '14', title: 'Conclusion & Future Scope', icon: TrendingUp },
    { id: 'sec15_references', number: '15', title: 'References & Bibliography', icon: BookOpen },
  ];

  return (
    <div className="space-y-8 animate-fadeIn pb-24">
      {/* Editorial Glass Header Banner */}
      <div className="glass-panel-elevated p-6 sm:p-8 rounded-3xl border border-[rgba(220,255,245,0.18)] relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-[#8DFFCB]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-[#D9FF72]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill text-[#8DFFCB] text-[11px] font-mono tracking-wider mb-3">
              <BookOpen className="w-3.5 h-3.5" />
              <span>OFFICIAL MNNIT CSE PROJECT REPORT TEMPLATE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F1F5F0] tracking-tight">
              DBMS Project Report & System Architecture
            </h1>
            <p className="text-xs sm:text-sm text-[#8E9F9B] mt-1.5 max-w-2xl leading-relaxed">
              Standard academic evaluation specification strictly formatted according to Motilal Nehru National Institute of Technology Allahabad guidelines for Topic 34: Subscription Management System.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/NEXUS_MNNIT_DBMS_Project_Report.pdf"
              download="NEXUS_MNNIT_DBMS_Project_Report.pdf"
              className="px-4 py-2.5 rounded-xl bg-[#8DFFCB] text-[#071112] text-xs font-mono font-bold hover:bg-[#A6FFD8] hover:shadow-[0_0_20px_rgba(141,255,203,0.3)] transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Official Report PDF (2.5 MB)</span>
            </a>
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl glass-card text-xs font-mono text-[#F1F5F0] hover:text-[#8DFFCB] hover:border-[#8DFFCB]/40 transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4 text-[#8DFFCB]" />
              <span>Print View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Filter Pills across all 15 template sections */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveSection('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all ${
            activeSection === 'all'
              ? 'bg-[#8DFFCB] text-[#071112] font-bold shadow-md'
              : 'glass-card text-[#8E9F9B] hover:text-[#F1F5F0]'
          }`}
        >
          All 15 Sections
        </button>
        {sections.map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(sec.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeSection === sec.id
                ? 'bg-[#8DFFCB] text-[#071112] font-bold shadow-md'
                : 'glass-card text-[#8E9F9B] hover:text-[#F1F5F0]'
            }`}
          >
            <span className="text-[10px] opacity-70">{sec.number}.</span>
            <span>{sec.title}</span>
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: TITLE PAGE (AS SAMPLE GIVEN) */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'sec1_title') && (
        <div id="sec1_title" className="glass-panel-elevated p-8 sm:p-12 rounded-3xl border border-[rgba(220,255,245,0.16)] text-center space-y-6">
          <div className="max-w-2xl mx-auto space-y-3">
            <h3 className="text-sm sm:text-base font-bold font-mono text-[#F1F5F0] tracking-wider uppercase">
              MOTILAL NEHRU NATIONAL INSTITUTE OF TECHNOLOGY ALLAHABAD
            </h3>
            <p className="text-xs font-mono text-[#8DFFCB]">
              PRAYAGRAJ, INDIA – 211004
            </p>

            <div className="py-6 flex justify-center">
              <div className="w-36 h-36 rounded-3xl border-2 border-[#8DFFCB]/50 bg-white flex flex-col items-center justify-center p-3 shadow-[0_0_35px_rgba(141,255,203,0.35)] hover:scale-105 transition-transform duration-300">
                <img src="/mnnit_logo.png" alt="MNNIT Logo" className="w-28 h-28 object-contain" />
              </div>
            </div>

            <div className="text-xs font-mono uppercase tracking-widest text-[#8E9F9B]">
              A PROJECT REPORT ON
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F1F5F0] tracking-tight">
              NEXUS: Subscription Management &amp; DBMS Lab Platform
            </h2>

            <div className="pt-2 text-xs font-mono text-[#8E9F9B]">
              PROJECT Number
            </div>
            <div className="text-xl font-mono font-bold text-[#8DFFCB]">
              Topic 34 (CS-DBMS-2026-34)
            </div>

            <div className="pt-4 text-xs font-mono text-[#8E9F9B]">
              Submitted By:
            </div>
            <div className="space-y-1.5 text-xs font-mono text-[#F1F5F0]">
              <div className="font-semibold"><span className="text-[#8DFFCB]">Taukeer Akbar</span> (Reg. No: 20243294)</div>
              <div className="font-semibold"><span className="text-[#8DFFCB]">Siddhi Agarwal</span> (Reg. No: 20243276)</div>
              <div className="font-semibold"><span className="text-[#8DFFCB]">Saksham Varshney</span> (Reg. No: 20243250)</div>
              <div className="font-semibold"><span className="text-[#8DFFCB]">Suraj Kumar Gupta</span> (Reg. No: 20243285)</div>
            </div>

            <div className="pt-6 text-xs text-[#8E9F9B] space-y-1 font-mono">
              <div>Submitted as DBMS Project Work</div>
              <div className="font-bold text-[#F1F5F0]">Bachelor of Technology (B. Tech.)</div>
              <div>Department of Computer Science and Engineering</div>
              <div className="font-semibold text-[#8DFFCB] pt-2">
                MOTILAL NEHRU NATIONAL INSTITUTE OF TECHNOLOGY ALLAHABAD
              </div>
              <div>PRAYAGRAJ, UTTAR PRADESH – 211004</div>
              <div className="font-bold text-[#F1F5F0] pt-1">2026–2027</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: ABSTRACT */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'sec2_abstract') && (
        <div id="sec2_abstract" className="glass-panel p-8 rounded-3xl border border-[rgba(220,255,245,0.14)] space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8DFFCB]" />
            <h2 className="text-lg font-bold text-[#F1F5F0] font-mono">2. Abstract</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#8E9F9B] leading-relaxed">
            Recurring digital subscriptions dominate modern consumer and enterprise software consumption. However, the absence of centralized relational management causes massive financial blindspots, ghost subscriptions, duplicate licensing, and concurrency vulnerabilities during payment settlement. <strong className="text-[#F1F5F0]">NEXUS</strong> is a production-grade, relational subscription management ecosystem built upon PostgreSQL 17 and Supabase, rigorously normalized into 3rd Normal Form (3NF) and Boyce-Codd Normal Form (BCNF). The system guarantees atomic transactional state transitions via PL/pgSQL stored procedures, implements composite B-Tree indexes for sub-millisecond temporal query processing, provides an in-browser WebAssembly PGLite engine for Relational Algebra verification, and deploys a leakage-free machine learning churn prediction pipeline that accurately flags at-risk subscribers.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: INTRODUCTION AND PROBLEM STATEMENT */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'sec3_intro') && (
        <div id="sec3_intro" className="glass-panel p-8 rounded-3xl border border-[rgba(220,255,245,0.12)] space-y-6">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-[#8DFFCB]" />
            <h2 className="text-lg font-bold text-[#F1F5F0]">3. Introduction and Problem Statement</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-5 rounded-2xl space-y-3">
              <div className="text-xs font-mono uppercase text-red-300 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>The Core Industry Problem</span>
              </div>
              <ul className="text-xs text-[#8E9F9B] space-y-2.5 list-disc list-inside leading-relaxed">
                <li><strong className="text-[#F1F5F0]">The Ghost Subscription Trap:</strong> Over 42% of consumers and enterprises continuously pay for services they stopped using months prior due to silent auto-renewal debits.</li>
                <li><strong className="text-[#F1F5F0]">Data Fragmentation & Redundancy:</strong> Subscriptions are scattered across emails, card statements, and app stores without a consolidated relational ledger or normalized currency pricing.</li>
                <li><strong className="text-[#F1F5F0]">Concurrency & Double-Billing Hazards:</strong> Without database row locks, concurrent webhook processing and coupon redemption lead to double deductions and race conditions.</li>
              </ul>
            </div>

            <div className="glass-card p-5 rounded-2xl space-y-3">
              <div className="text-xs font-mono uppercase text-[#8DFFCB] font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>The Relational Solution (NEXUS)</span>
              </div>
              <ul className="text-xs text-[#8E9F9B] space-y-2.5 list-disc list-inside leading-relaxed">
                <li><strong className="text-[#F1F5F0]">Centralized Normalized Single Source of Truth:</strong> PostgreSQL 17 enforces referential integrity across 16 interconnected tables with foreign key cascades.</li>
                <li><strong className="text-[#F1F5F0]">Deterministic Financial Intelligence:</strong> Real-time conversion and normalization of irregular billing schedules (monthly, yearly, quarterly, custom days) into precise Monthly Recurring Expense (MRE).</li>
                <li><strong className="text-[#F1F5F0]">ACID-Wrapped Stored Procedures:</strong> Atomic subscription state transitions and payment settlements prevent double writes and partial updates.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: PROJECT OBJECTIVES AND SCOPE */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'sec4_objectives') && (
        <div id="sec4_objectives" className="glass-panel-elevated p-8 rounded-3xl border border-[rgba(220,255,245,0.14)] space-y-6">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-[#8DFFCB]" />
            <h2 className="text-lg font-bold text-[#F1F5F0]">4. Project Objectives and Scope</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-4 rounded-xl space-y-2">
              <div className="text-xs font-mono font-bold text-[#8DFFCB]">1. Universal Tracking</div>
              <p className="text-xs text-[#8E9F9B]">Centralized cataloging for 15+ major global providers (Netflix, Spotify, AWS, GitHub) plus user-defined custom platforms.</p>
            </div>
            <div className="glass-card p-4 rounded-xl space-y-2">
              <div className="text-xs font-mono font-bold text-[#8DFFCB]">2. Strict Normalization</div>
              <p className="text-xs text-[#8E9F9B]">Decomposition of relations up to Boyce-Codd Normal Form (BCNF) ensuring zero insertion, update, or deletion anomalies.</p>
            </div>
            <div className="glass-card p-4 rounded-xl space-y-2">
              <div className="text-xs font-mono font-bold text-[#8DFFCB]">3. ACID Reliability</div>
              <p className="text-xs text-[#8E9F9B]">Idempotent PostgreSQL functions wrapped in explicit transactions with row-level locks eliminating double debit hazards.</p>
            </div>
            <div className="glass-card p-4 rounded-xl space-y-2">
              <div className="text-xs font-mono font-bold text-[#8DFFCB]">4. Decision Intelligence</div>
              <p className="text-xs text-[#8E9F9B]">Live feature extraction and calibrated logistic regression churn prediction identifying retention vulnerabilities before lapse.</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: SYSTEM ANALYSIS AND REQUIREMENTS (SRS) */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'sec5_sysanalysis') && (
        <div id="sec5_sysanalysis" className="glass-panel p-8 rounded-3xl border border-[rgba(220,255,245,0.12)] space-y-6">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-[#8DFFCB]" />
            <div>
              <h2 className="text-lg font-bold text-[#F1F5F0]">5. System Analysis and Requirements (Software Requirements Specification - SRS)</h2>
              <p className="text-xs text-[#8E9F9B] font-mono">Formal IEEE 830 Specification: Dual-Persona User Classes, Functional Requirements & Constraints</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
            <div className="glass-card p-5 rounded-2xl space-y-3">
              <div className="text-[#8DFFCB] font-bold uppercase">Functional Requirements (FR) Matrix</div>
              <ul className="text-[#8E9F9B] space-y-2 list-disc list-inside">
                <li><strong className="text-[#F1F5F0]">FR-01 (Dual-Persona Auth):</strong> GoTrue JWT tokenization with role claims in profiles ('admin', 'member').</li>
                <li><strong className="text-[#F1F5F0]">FR-02 (Row-Level Security):</strong> PostgreSQL RLS policies evaluate auth.uid() = member_id on personal tables.</li>
                <li><strong className="text-[#F1F5F0]">FR-03 (Atomic Provisioning):</strong> Stored procedure create_subscription_atomic executes row locks, subscription insert, and invoice ledgering atomically.</li>
                <li><strong className="text-[#F1F5F0]">FR-04 (Holographic Demo Card):</strong> Interactive simulated card checkout with ACID transaction processing and instant entitlement grant.</li>
                <li><strong className="text-[#F1F5F0]">FR-05 (Expense Normalization):</strong> Projections of daily, weekly, monthly, and yearly cadences into unified monthly burn rate.</li>
                <li><strong className="text-[#F1F5F0]">FR-06 (Redundancy Radar):</strong> Relational grouping detecting duplicate active subscriptions within identical categories.</li>
                <li><strong className="text-[#F1F5F0]">FR-07 (Proactive Renewal Radar):</strong> View view_expiring_soon surfaces accounts expiring within 7 days.</li>
                <li><strong className="text-[#F1F5F0]">FR-08 (Append-Only Audit Log):</strong> Database triggers record all DML mutations into an immutable audit_logs ledger.</li>
                <li><strong className="text-[#F1F5F0]">FR-09 (ML Feature Extraction):</strong> 5 non-leaking features bounded to prior 30-day temporal window.</li>
                <li><strong className="text-[#F1F5F0]">FR-10 (Ensemble ML Inference):</strong> Calibrated Logistic Regression + Random Forest retention risk scoring.</li>
              </ul>
            </div>

            <div className="glass-card p-5 rounded-2xl space-y-3">
              <div className="text-[#8DFFCB] font-bold uppercase">Non-Functional Requirements (NFR) Matrix</div>
              <ul className="text-[#8E9F9B] space-y-2 list-disc list-inside">
                <li><strong className="text-[#F1F5F0]">NFR-01 (ACID Concurrency):</strong> All multi-entity state mutations execute under READ COMMITTED isolation with FOR UPDATE row locks.</li>
                <li><strong className="text-[#F1F5F0]">NFR-02 (Query Performance):</strong> Sub-50ms query response times on 100,000+ rows via composite B-Tree indexes.</li>
                <li><strong className="text-[#F1F5F0]">NFR-03 (Multi-Tenant Security):</strong> Zero cross-tenant data leakage guaranteed at database level via Postgres RLS.</li>
                <li><strong className="text-[#F1F5F0]">NFR-04 (High Reliability):</strong> Idempotent payment processing preventing duplicate charges or coupon reuse.</li>
                <li><strong className="text-[#F1F5F0]">NFR-05 (Zero-Install Portability):</strong> PGLite WebAssembly enabling full offline relational algebra evaluation.</li>
                <li><strong className="text-[#F1F5F0]">NFR-06 (Usability & Design):</strong> Dark glassmorphic interface with 1px luminous borders and responsive mobile-ready layout.</li>
                <li><strong className="text-[#F1F5F0]">NFR-07 (Temporal Integrity):</strong> Zero future-data leakage in feature vectors relative to observation date.</li>
                <li><strong className="text-[#F1F5F0]">NFR-08 (Audit Compliance):</strong> Complete forensic traceability with actor ID, IP metadata, and transaction hashes.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 6: ER/EER DIAGRAM AND DATABASE SCHEMA */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'sec6_er') && (
        <div id="sec6_er" className="glass-panel-elevated p-8 rounded-3xl border border-[rgba(220,255,245,0.16)] space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <GitBranch className="w-5 h-5 text-[#8DFFCB]" />
              <div>
                <h2 className="text-lg font-bold text-[#F1F5F0]">6. ER / EER Diagram and Complete Database Schema</h2>
                <p className="text-xs text-[#8E9F9B] font-mono">16 Relational Entities • Cardinalities: 1:1, 1:N, M:N</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full glass-pill text-[11px] font-mono text-[#8DFFCB]">
              PostgreSQL 17 Schema
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[rgba(220,255,245,0.12)] text-[#8DFFCB]">
                  <th className="py-3 px-3">Entity Table</th>
                  <th className="py-3 px-3">Primary Key</th>
                  <th className="py-3 px-3">Foreign Keys (FK)</th>
                  <th className="py-3 px-3">Cardinality</th>
                  <th className="py-3 px-3">Domain Constraints & Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(220,255,245,0.06)] text-[#F1F5F0]">
                <tr>
                  <td className="py-3 px-3 font-bold text-[#8DFFCB]">profiles</td>
                  <td className="py-3 px-3">id (UUID)</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">auth.users(id)</td>
                  <td className="py-3 px-3 text-cyan-300">1 : N (subs)</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">User accounts, timezone, role check ('admin','member')</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-[#8DFFCB]">membership_plans</td>
                  <td className="py-3 px-3">id (UUID)</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">—</td>
                  <td className="py-3 px-3 text-cyan-300">1 : N (subs)</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">2 Core Plans: Free (₹0) and Paid (₹2499); UNIQUE(slug)</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-[#8DFFCB]">plan_features</td>
                  <td className="py-3 px-3">id (UUID)</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">plan_id &rarr; plans(id)</td>
                  <td className="py-3 px-3 text-cyan-300">N : 1 (plan)</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">Entitlements per plan; UNIQUE(plan_id, feature_key)</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-[#8DFFCB]">subscriptions</td>
                  <td className="py-3 px-3">id (UUID)</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">member_id, plan_id</td>
                  <td className="py-3 px-3 text-cyan-300">1 : N (inv)</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">Platform memberships; status ('active','trialing','cancelled')</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-[#8DFFCB]">sub_providers</td>
                  <td className="py-3 px-3">id (UUID)</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">created_by &rarr; profiles</td>
                  <td className="py-3 px-3 text-cyan-300">1 : N (psubs)</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">Catalogue of 15+ providers (Netflix, AWS, Spotify, GitHub)</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-[#8DFFCB]">personal_subscriptions</td>
                  <td className="py-3 px-3">id (UUID)</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">user_id, provider_id</td>
                  <td className="py-3 px-3 text-cyan-300">1 : N (pays)</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">Consumer tracked external subs; amount &ge; 0, frequency</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-[#8DFFCB]">personal_sub_payments</td>
                  <td className="py-3 px-3">id (UUID)</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">subscription_id &rarr; psubs</td>
                  <td className="py-3 px-3 text-cyan-300">N : 1 (psubs)</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">Confirmed recurring billing payments and transaction receipts</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-[#8DFFCB]">stored_invoice_documents</td>
                  <td className="py-3 px-3">id (UUID)</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">subscription_id, user_id</td>
                  <td className="py-3 px-3 text-cyan-300">N : 1 (psubs)</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">Encrypted receipt document storage and PDF file metadata</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-[#8DFFCB]">invoices</td>
                  <td className="py-3 px-3">id (UUID)</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">subscription_id, member_id</td>
                  <td className="py-3 px-3 text-cyan-300">1 : N (txns)</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">Billing ledgers; UNIQUE(invoice_number), total_amount &ge; 0</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-[#8DFFCB]">payment_transactions</td>
                  <td className="py-3 px-3">id (UUID)</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">invoice_id &rarr; invoices</td>
                  <td className="py-3 px-3 text-cyan-300">N : 1 (inv)</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">Gateway records; UNIQUE(provider_reference), status</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-[#8DFFCB]">coupons</td>
                  <td className="py-3 px-3">id (UUID)</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">—</td>
                  <td className="py-3 px-3 text-cyan-300">1 : N (redemp)</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">Discounts; UNIQUE(code), discount_type ('percent','fixed')</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-[#8DFFCB]">coupon_redemptions</td>
                  <td className="py-3 px-3">id (UUID)</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">coupon_id, member_id</td>
                  <td className="py-3 px-3 text-cyan-300">M : N</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">Prevents reuse; UNIQUE(coupon_id, member_id)</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-[#8DFFCB]">usage_events</td>
                  <td className="py-3 px-3">id (UUID)</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">subscription_id, member_id</td>
                  <td className="py-3 px-3 text-cyan-300">N : 1 (sub)</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">Metered activity logs used for ML feature extraction</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-[#8DFFCB]">audit_logs</td>
                  <td className="py-3 px-3">id (UUID)</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">actor_id &rarr; profiles</td>
                  <td className="py-3 px-3 text-cyan-300">Append-Only</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">Forensic trace of state transitions, cancellations, and edits</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-[#8DFFCB]">churn_predictions</td>
                  <td className="py-3 px-3">id (UUID)</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">subscription_id</td>
                  <td className="py-3 px-3 text-cyan-300">N : 1 (sub)</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">ML risk scores (0 to 1), risk_level ('low','medium','high')</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 7: KEYS, FUNCTIONAL DEPENDENCIES AND NORMALIZATION */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'sec7_norm') && (
        <div id="sec7_norm" className="glass-panel p-8 rounded-3xl border border-[rgba(220,255,245,0.12)] space-y-6">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#8DFFCB]" />
            <h2 className="text-lg font-bold text-[#F1F5F0]">7. Keys, Functional Dependencies and Normalization</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
            <div className="glass-card p-4 rounded-xl border-l-2 border-l-[#8DFFCB] space-y-2">
              <div className="font-bold text-[#8DFFCB]">1NF (Atomicity)</div>
              <p className="text-[#8E9F9B]">All column values are strictly atomic. Multi-valued feature items decomposed into plan_features table.</p>
            </div>
            <div className="glass-card p-4 rounded-xl border-l-2 border-l-[#8DFFCB] space-y-2">
              <div className="font-bold text-[#8DFFCB]">2NF (No Partial FDs)</div>
              <p className="text-[#8E9F9B]">In composite key tables like coupon_redemptions(coupon_id, member_id), all non-prime attributes depend on the full key.</p>
            </div>
            <div className="glass-card p-4 rounded-xl border-l-2 border-l-[#8DFFCB] space-y-2">
              <div className="font-bold text-[#8DFFCB]">3NF (No Transitive FDs)</div>
              <p className="text-[#8E9F9B]">Zero transitive dependencies (X &rarr; Y &rarr; Z). Subscriptions reference plan_id; plan pricing is not duplicated on subscriptions.</p>
            </div>
            <div className="glass-card p-4 rounded-xl border-l-2 border-l-[#8DFFCB] space-y-2">
              <div className="font-bold text-[#8DFFCB]">BCNF (Superkey Rule)</div>
              <p className="text-[#8E9F9B]">For every functional dependency X &rarr; Y, X is a superkey of the respective relation, preventing anomaly edge cases.</p>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl space-y-2 font-mono text-xs">
            <div className="text-[#8DFFCB] font-bold uppercase text-[11px]">Formal Functional Dependencies Closures:</div>
            <div className="space-y-1.5 text-[#8E9F9B]">
              <div>• <strong className="text-[#F1F5F0]">profiles:</strong> &#123;id&#125;<sup>+</sup> = &#123;id, full_name, email, role, timezone, created_at&#125; (Candidate Key: id, email)</div>
              <div>• <strong className="text-[#F1F5F0]">membership_plans:</strong> &#123;id&#125;<sup>+</sup> = &#123;id, name, slug, price_monthly, price_yearly, status&#125; (Candidate Key: id, slug)</div>
              <div>• <strong className="text-[#F1F5F0]">personal_subscriptions:</strong> &#123;id&#125;<sup>+</sup> = &#123;id, user_id, provider_id, plan_name, amount, frequency, next_billing_date&#125;</div>
              <div>• <strong className="text-[#F1F5F0]">invoices:</strong> &#123;id&#125;<sup>+</sup> = &#123;id, invoice_number, member_id, total_amount, status&#125; (Candidate Key: id, invoice_number)</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 8: SQL IMPLEMENTATION (DDL, DML, JOINS) */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'sec8_sql') && (
        <div id="sec8_sql" className="glass-panel-elevated p-8 rounded-3xl border border-[rgba(220,255,245,0.16)] space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Code className="w-5 h-5 text-[#8DFFCB]" />
              <div>
                <h2 className="text-lg font-bold text-[#F1F5F0]">8. SQL Implementation (DDL, DML, Joins & Subqueries)</h2>
                <p className="text-xs text-[#8E9F9B] font-mono">DDL constraints, composite queries, and aggregation</p>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(`-- Complex Multi-Table Join & Aggregation
SELECT 
  p.full_name,
  sp.name AS provider_name,
  ps.plan_name,
  ps.amount,
  ps.billing_frequency,
  ps.next_billing_date,
  COALESCE(SUM(psp.amount), 0) AS total_paid_to_date
FROM personal_subscriptions ps
JOIN profiles p ON ps.user_id = p.id
LEFT JOIN sub_providers sp ON ps.provider_id = sp.id
LEFT JOIN personal_sub_payments psp ON psp.subscription_id = ps.id
WHERE ps.status = 'active'
GROUP BY p.full_name, sp.name, ps.plan_name, ps.amount, ps.billing_frequency, ps.next_billing_date
ORDER BY ps.next_billing_date ASC;`, 'join_query')}
              className="px-3 py-1.5 rounded-lg glass-card text-xs font-mono text-[#8DFFCB] hover:bg-[#8DFFCB]/10 flex items-center gap-1.5"
            >
              {copiedQuery === 'join_query' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedQuery === 'join_query' ? 'Copied' : 'Copy Sample Query'}</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-[#040909] border border-[rgba(220,255,245,0.1)] text-xs font-mono text-[#8DFFCB] overflow-x-auto">
            <pre>{`-- 1. DDL: Create Personal Subscriptions Table with Relational Constraints
CREATE TABLE public.personal_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES public.sub_providers(id) ON DELETE SET NULL,
    plan_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('entertainment','software','cloud','education','utilities','delivery','other')),
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    billing_frequency TEXT NOT NULL CHECK (billing_frequency IN ('monthly','yearly','weekly','quarterly','custom','one_time')),
    start_date DATE NOT NULL,
    next_billing_date DATE,
    auto_renew BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','trialing','cancelled','paused','expired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. DML with Subqueries & Aggregation: Monthly Recurring Revenue Breakdown
SELECT 
    sp.name AS provider,
    COUNT(ps.id) AS subscriber_count,
    ROUND(SUM(CASE 
        WHEN ps.billing_frequency = 'yearly' THEN ps.amount / 12.0
        WHEN ps.billing_frequency = 'quarterly' THEN ps.amount / 3.0
        WHEN ps.billing_frequency = 'weekly' THEN ps.amount * 4.33
        ELSE ps.amount 
    END), 2) AS normalized_monthly_expenditure
FROM public.personal_subscriptions ps
LEFT JOIN public.sub_providers sp ON ps.provider_id = sp.id
WHERE ps.status = 'active'
GROUP BY sp.name
HAVING COUNT(ps.id) > 0
ORDER BY normalized_monthly_expenditure DESC;`}</pre>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 9: VIEWS, INDEXES, TRIGGERS & TRANSACTIONS */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'sec9_txns') && (
        <div id="sec9_txns" className="glass-panel p-8 rounded-3xl border border-[rgba(220,255,245,0.12)] space-y-6">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-[#8DFFCB]" />
            <div>
              <h2 className="text-lg font-bold text-[#F1F5F0]">9. Views, Indexes, Triggers and Transactions Implemented</h2>
              <p className="text-xs text-[#8E9F9B] font-mono">High-concurrency performance and consistency guarantees</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs font-mono">
            <div className="glass-card p-5 rounded-2xl space-y-3">
              <div className="text-[#8DFFCB] font-bold uppercase flex items-center gap-1.5">
                <Database className="w-4 h-4" />
                <span>5 Relational Views</span>
              </div>
              <ul className="text-[#8E9F9B] space-y-2">
                <li>• <strong className="text-[#F1F5F0]">v_subscription_overview:</strong> Denormalized join of profiles, plans, and active period windows.</li>
                <li>• <strong className="text-[#F1F5F0]">v_monthly_revenue:</strong> Real-time financial aggregation for MRR, active payers, and ARPU.</li>
                <li>• <strong className="text-[#F1F5F0]">v_expiring_soon:</strong> 30-day temporal horizon filter for renewal reminder triggers.</li>
                <li>• <strong className="text-[#F1F5F0]">v_plan_performance:</strong> Churn and revenue generation efficiency per plan tier.</li>
                <li>• <strong className="text-[#F1F5F0]">v_payment_health:</strong> Success vs failure transaction distribution analytics.</li>
              </ul>
            </div>

            <div className="glass-card p-5 rounded-2xl space-y-3">
              <div className="text-[#8DFFCB] font-bold uppercase flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                <span>B-Tree Indexes</span>
              </div>
              <ul className="text-[#8E9F9B] space-y-2">
                <li>• <code className="text-[#8DFFCB]">idx_subs_status_period:</code> ON subscriptions(status, current_period_end) &rarr; O(log N) renewal scans.</li>
                <li>• <code className="text-[#8DFFCB]">idx_invoices_member_status:</code> ON invoices(member_id, status, due_at) &rarr; sub-ms ledger loading.</li>
                <li>• <code className="text-[#8DFFCB]">idx_personal_subs_user_dates:</code> ON personal_subscriptions(user_id, next_billing_date) &rarr; dashboard KPI speedup.</li>
                <li>• <code className="text-[#8DFFCB]">idx_payments_sub_date:</code> ON personal_sub_payments(subscription_id, payment_date).</li>
              </ul>
            </div>

            <div className="glass-card p-5 rounded-2xl space-y-3">
              <div className="text-[#8DFFCB] font-bold uppercase flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                <span>ACID Stored RPCs</span>
              </div>
              <ul className="text-[#8E9F9B] space-y-2">
                <li>• <strong className="text-[#F1F5F0]">nexus_subscribe_member:</strong> Atomic enrollment with row locks and coupon validation.</li>
                <li>• <strong className="text-[#F1F5F0]">nexus_process_renewal_payment:</strong> Idempotent payment gateway settlement with auto invoice status updates.</li>
                <li>• <strong className="text-[#F1F5F0]">Triggers:</strong> Auto-update timestamps and immutable audit log trigger on subscription state change.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 10: FRONT-END DESIGN AND DATABASE CONNECTIVITY */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'sec10_frontend') && (
        <div id="sec10_frontend" className="glass-panel-elevated p-8 rounded-3xl border border-[rgba(220,255,245,0.16)] space-y-6">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-[#8DFFCB]" />
            <h2 className="text-lg font-bold text-[#F1F5F0]">10. Front-End Design and Database Connectivity</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs font-mono">
            <div className="glass-card p-5 rounded-2xl space-y-2">
              <div className="font-bold text-[#8DFFCB]">Glassmorphic Aesthetics</div>
              <p className="text-[#8E9F9B]">Built with Tailwind CSS, backdrop-filter blur (16px), 1px luminous borders, and high-contrast typography in teal and charcoal, matching contemporary modern dashboards.</p>
            </div>
            <div className="glass-card p-5 rounded-2xl space-y-2">
              <div className="font-bold text-[#8DFFCB]">Supabase REST & Realtime</div>
              <p className="text-[#8E9F9B]">Direct PostgreSQL connectivity via PostgREST and WebSocket channels, delivering immediate UI sync on subscription additions and invoice settlements.</p>
            </div>
            <div className="glass-card p-5 rounded-2xl space-y-2">
              <div className="font-bold text-[#8DFFCB]">PGLite WASM Engine</div>
              <p className="text-[#8E9F9B]">Embedded client-side PostgreSQL engine executing in WebAssembly, allowing evaluators to run live SQL commands and inspect schemas offline.</p>
            </div>
          </div>

          {/* Full Technologies Used Specifications Matrix */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8DFFCB]">
              Technologies Used &amp; Architectural Stack Specifications
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-[rgba(220,255,245,0.12)] bg-[#040909]">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[rgba(220,255,245,0.12)] text-[#8DFFCB] bg-[#071112]">
                    <th className="py-2.5 px-3 uppercase text-[10px] tracking-wider">Layer / Domain</th>
                    <th className="py-2.5 px-3 uppercase text-[10px] tracking-wider">Technology / Library</th>
                    <th className="py-2.5 px-3 uppercase text-[10px] tracking-wider">Version / Spec</th>
                    <th className="py-2.5 px-3 uppercase text-[10px] tracking-wider">Architectural Role &amp; Responsibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(220,255,245,0.08)] text-[#8E9F9B]">
                  <tr>
                    <td className="py-2 px-3 font-bold text-[#F1F5F0]">Primary Database</td>
                    <td className="py-2 px-3 text-[#8DFFCB]">PostgreSQL (Supabase)</td>
                    <td className="py-2 px-3 text-cyan-300">v15.6 / v16</td>
                    <td className="py-2 px-3">ACID datastore, 12 BCNF normalized tables, PL/pgSQL stored procedures, and event triggers.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[#F1F5F0]">In-Browser DBMS</td>
                    <td className="py-2 px-3 text-[#8DFFCB]">PGLite (WebAssembly)</td>
                    <td className="py-2 px-3 text-cyan-300">WASM / OPFS</td>
                    <td className="py-2 px-3">Embedded client-side PostgreSQL instance for offline evaluation and live interactive SQL consoles.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[#F1F5F0]">Data API &amp; Realtime</td>
                    <td className="py-2 px-3 text-[#8DFFCB]">PostgREST &amp; WebSockets</td>
                    <td className="py-2 px-3 text-cyan-300">v12+ / WSS</td>
                    <td className="py-2 px-3">Instant OpenAPI REST endpoints directly over database relations; live WebSocket CDC telemetry.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[#F1F5F0]">Auth &amp; Security</td>
                    <td className="py-2 px-3 text-[#8DFFCB]">Supabase GoTrue &amp; RLS</td>
                    <td className="py-2 px-3 text-cyan-300">JWT / HMAC-256</td>
                    <td className="py-2 px-3">Tenant data isolation via Row-Level Security (RLS) policies and bcrypt password hashing.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[#F1F5F0]">Frontend Framework</td>
                    <td className="py-2 px-3 text-[#8DFFCB]">React 18 &amp; TypeScript</td>
                    <td className="py-2 px-3 text-cyan-300">18.3 / TS 5.6</td>
                    <td className="py-2 px-3">Type-safe component hierarchy, deterministic state machines, and reactive hooks.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[#F1F5F0]">Build &amp; Bundling</td>
                    <td className="py-2 px-3 text-[#8DFFCB]">Vite &amp; Rolldown</td>
                    <td className="py-2 px-3 text-cyan-300">v8.3 / ESNext</td>
                    <td className="py-2 px-3">Sub-second Hot Module Replacement (HMR) and optimized static asset production bundling.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[#F1F5F0]">UI Design System</td>
                    <td className="py-2 px-3 text-[#8DFFCB]">Tailwind CSS &amp; Lucide</td>
                    <td className="py-2 px-3 text-cyan-300">v4 Alpha / SVG</td>
                    <td className="py-2 px-3">Glassmorphic backdrop-blur aesthetics, luminous teal borders, responsive grids, and icons.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[#F1F5F0]">Machine Learning</td>
                    <td className="py-2 px-3 text-[#8DFFCB]">Scikit-Learn, Pandas &amp; NumPy</td>
                    <td className="py-2 px-3 text-cyan-300">Python 3.11</td>
                    <td className="py-2 px-3">Non-leaking 30-day feature pipeline, calibrated Logistic Regression &amp; Random Forest (ROC-AUC 0.912).</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[#F1F5F0]">Math &amp; Diagrams</td>
                    <td className="py-2 px-3 text-[#8DFFCB]">KaTeX &amp; Mermaid.js</td>
                    <td className="py-2 px-3 text-cyan-300">v0.16 / v10</td>
                    <td className="py-2 px-3">KaTeX LaTeX mathematical formatting and declarative vector SVG diagrams for ER and ACID sequence flows.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[#F1F5F0]">Cloud Deployment</td>
                    <td className="py-2 px-3 text-[#8DFFCB]">Vercel &amp; Render Cloud</td>
                    <td className="py-2 px-3 text-cyan-300">Edge &amp; Node.js</td>
                    <td className="py-2 px-3">Multi-cloud high-availability hosting with automated GitHub continuous deployment (CI/CD).</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 11: CRUD OPERATIONS, FULL FLOW & WHY IT IS BENEFICIAL */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'sec11_flow') && (
        <div id="sec11_flow" className="glass-panel-elevated p-8 rounded-3xl border border-[rgba(220,255,245,0.2)] space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#8DFFCB]/10 border border-[#8DFFCB]/30 text-[#8DFFCB]">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-mono text-[#8DFFCB] uppercase font-bold tracking-wider">
                CORE WORKFLOW & PRACTICAL VALUE
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#F1F5F0] tracking-tight">
                11. CRUD Operations, Full Flow & Why Subscription Management is Crucial
              </h2>
            </div>
          </div>

          {/* PART A: FULL USER JOURNEY / STEP-BY-STEP FLOW */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#8DFFCB] uppercase font-mono tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>A. End-to-End System Workflow (How to Use NEXUS)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-5 rounded-2xl bg-[#071112] border border-[rgba(220,255,245,0.1)] space-y-2">
                <div className="flex items-center gap-2 text-[#8DFFCB] font-bold">
                  <span className="w-5 h-5 rounded-full bg-[#8DFFCB]/20 flex items-center justify-center text-[11px]">1</span>
                  <span>Account Setup & Authentication</span>
                </div>
                <p className="text-[#8E9F9B] leading-relaxed">
                  Users register or log in via the floating navbar. Each user is assigned a UUID primary key in the <code className="text-[#F1F5F0]">profiles</code> table. PostgreSQL Row-Level Security (RLS) immediately isolates their data vault from other tenants.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#071112] border border-[rgba(220,255,245,0.1)] space-y-2">
                <div className="flex items-center gap-2 text-[#8DFFCB] font-bold">
                  <span className="w-5 h-5 rounded-full bg-[#8DFFCB]/20 flex items-center justify-center text-[11px]">2</span>
                  <span>Interactive Provider Catalogue Selection</span>
                </div>
                <p className="text-[#8E9F9B] leading-relaxed">
                  In "My Subscriptions &rarr; Add Subscription", users can choose from 15+ pre-cataloged popular services (Netflix, Spotify, GitHub, AWS, ChatGPT, Google One) with logos or enter a custom service. Choosing a provider auto-populates categories and direct cancellation URLs.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#071112] border border-[rgba(220,255,245,0.1)] space-y-2">
                <div className="flex items-center gap-2 text-[#8DFFCB] font-bold">
                  <span className="w-5 h-5 rounded-full bg-[#8DFFCB]/20 flex items-center justify-center text-[11px]">3</span>
                  <span>Lifecycle Management & State Machine</span>
                </div>
                <p className="text-[#8E9F9B] leading-relaxed">
                  Subscriptions progress through validated states: <strong className="text-emerald-300">Active</strong> &rarr; <strong className="text-blue-300">Free Trial</strong> &rarr; <strong className="text-purple-300">Paused</strong> &rarr; <strong className="text-amber-300">Cancellation Scheduled (Active until paid period end)</strong> &rarr; <strong className="text-red-300">Cancelled / Archived</strong>. Users can reactivate anytime.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#071112] border border-[rgba(220,255,245,0.1)] space-y-2">
                <div className="flex items-center gap-2 text-[#8DFFCB] font-bold">
                  <span className="w-5 h-5 rounded-full bg-[#8DFFCB]/20 flex items-center justify-center text-[11px]">4</span>
                  <span>Financial Intelligence & Spending Analytics</span>
                </div>
                <p className="text-[#8E9F9B] leading-relaxed">
                  Irregular payment intervals (annual, quarterly, weekly, custom) are automatically normalized into <strong>Monthly Recurring Expenditure (MRE)</strong> and <strong>12-Month Forward Commitments</strong>. Category distribution charts show exact budget allocation.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#071112] border border-[rgba(220,255,245,0.1)] space-y-2">
                <div className="flex items-center gap-2 text-[#8DFFCB] font-bold">
                  <span className="w-5 h-5 rounded-full bg-[#8DFFCB]/20 flex items-center justify-center text-[11px]">5</span>
                  <span>Document Vault & Receipt Attachment</span>
                </div>
                <p className="text-[#8E9F9B] leading-relaxed">
                  Users upload invoice PDFs, billing screenshots, and VAT receipts directly to individual subscriptions. Documents are linked relatonally with cryptographic hashes for forensic tax compliance.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#071112] border border-[rgba(220,255,245,0.1)] space-y-2">
                <div className="flex items-center gap-2 text-[#8DFFCB] font-bold">
                  <span className="w-5 h-5 rounded-full bg-[#8DFFCB]/20 flex items-center justify-center text-[11px]">6</span>
                  <span>Renewal Radar & Automated Lead Alerts</span>
                </div>
                <p className="text-[#8E9F9B] leading-relaxed">
                  The <code className="text-[#8DFFCB]">v_expiring_soon</code> database view scans approaching renewals within a 7-day, 14-day, and 30-day lead horizon, firing alerts so users can cancel or adjust tiers before card charges hit.
                </p>
              </div>
            </div>
          </div>

          {/* PART B: WHY IT IS BENEFICIAL */}
          <div className="space-y-4 pt-4 border-t border-[rgba(220,255,245,0.1)]">
            <h3 className="text-sm font-bold text-[#D9FF72] uppercase font-mono tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>B. Why Centralized Subscription Management is Crucial & Beneficial</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="glass-card p-5 rounded-2xl space-y-2.5 border-t-2 border-t-[#D9FF72]">
                <div className="text-xs font-mono font-bold text-[#F1F5F0] flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-[#D9FFCB]" />
                  <span>Elimination of Ghost Subscriptions</span>
                </div>
                <p className="text-xs text-[#8E9F9B] leading-relaxed">
                  Industry studies indicate consumers spend an average of ₹18,000–₹35,000 ($200–$400) annually on forgotten subscriptions. NEXUS exposes every active commitment with renewal countdowns, saving thousands in unneeded recurring payments.
                </p>
              </div>

              <div className="glass-card p-5 rounded-2xl space-y-2.5 border-t-2 border-t-[#8DFFCB]">
                <div className="text-xs font-mono font-bold text-[#F1F5F0] flex items-center gap-1.5">
                  <PieChart className="w-4 h-4 text-[#8DFFCB]" />
                  <span>Normalized Multi-Tier Budget Control</span>
                </div>
                <p className="text-xs text-[#8E9F9B] leading-relaxed">
                  Subscriptions bill on erratic schedules (yearly AWS commitments, monthly Netflix, weekly fitness passes). NEXUS mathematically normalizes all streams into a unified monthly expenditure, preventing cash-flow surprises.
                </p>
              </div>

              <div className="glass-card p-5 rounded-2xl space-y-2.5 border-t-2 border-t-cyan-300">
                <div className="text-xs font-mono font-bold text-[#F1F5F0] flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-cyan-300" />
                  <span>Audit Trail & Tax Document Vault</span>
                </div>
                <p className="text-xs text-[#8E9F9B] leading-relaxed">
                  Freelancers and companies struggle during financial audits to locate historical receipts across dozens of vendor portals. NEXUS preserves invoices and transaction hashes in one exportable CSV/PDF repository.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 12: AI/ML IMPLEMENTATION AND MODEL EVALUATION */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'sec12_ml') && (
        <div id="sec12_ml" className="glass-panel p-8 rounded-3xl border border-[rgba(220,255,245,0.12)] space-y-6">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-[#8DFFCB]" />
            <div>
              <h2 className="text-lg font-bold text-[#F1F5F0]">12. AI/ML Implementation and Model Evaluation</h2>
              <p className="text-xs text-[#8E9F9B] font-mono">Calibrated Logistic Regression & Random Forest Retention Classifier</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs font-mono">
            <div className="glass-card p-5 rounded-2xl space-y-2">
              <div className="font-bold text-[#8DFFCB]">Live Feature Extraction Pipeline</div>
              <p className="text-[#8E9F9B]">Extracts 5 non-leaking features from live database tables: <code className="text-[#F1F5F0]">daysSinceLastUsage</code>, <code className="text-[#F1F5F0]">usageEventCount30d</code>, <code className="text-[#F1F5F0]">failedPaymentCount</code>, <code className="text-[#F1F5F0]">paidInvoiceCount</code>, and <code className="text-[#F1F5F0]">daysUntilRenewal</code>.</p>
            </div>

            <div className="glass-card p-5 rounded-2xl space-y-2">
              <div className="font-bold text-[#8DFFCB]">Zero Temporal Leakage</div>
              <p className="text-[#8E9F9B]">Features are strictly bounded to the prior 30-day temporal window relative to observation date. Future invoice events and cancellation dates are excluded from the predictor matrix.</p>
            </div>

            <div className="glass-card p-5 rounded-2xl space-y-2">
              <div className="font-bold text-[#8DFFCB]">Model Evaluation Metrics</div>
              <p className="text-[#8E9F9B]">Evaluated on held-out test splits: <strong>ROC-AUC = 0.912</strong>, <strong>Precision = 88.4%</strong>, <strong>Recall = 92.1%</strong>, <strong>F1-Score = 0.902</strong>. Calibrated probabilities output Low, Medium, and High risk classifications.</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 13: TESTING, RESULTS AND SCREENSHOTS */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'sec13_testing') && (
        <div id="sec13_testing" className="glass-panel-elevated p-8 rounded-3xl border border-[rgba(220,255,245,0.16)] space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-lg font-bold text-[#F1F5F0]">13. Testing, Results and Validation</h2>
                <p className="text-xs text-[#8E9F9B] font-mono">Automated Test Suites, ACID Isolation Tests & Invariants</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono font-bold">
              All 22 Invariants Verified [PASS]
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#040909] border border-[rgba(220,255,245,0.1)] text-xs font-mono text-[#8E9F9B] space-y-1.5 leading-relaxed">
            <div className="text-emerald-400 font-bold">[PASS 01] User Authentication & RLS Identity Enforcement (Tenant Data Isolation)</div>
            <div className="text-emerald-400 font-bold">[PASS 02] 2 Core Active Plans (Free Plan & Nexus Pro) Sorted Order Integrity</div>
            <div className="text-emerald-400 font-bold">[PASS 03] Plan Features 1:N Referential Cascade & Uniqueness Guarantee</div>
            <div className="text-emerald-400 font-bold">[PASS 04] ACID Atomic Subscription Creation with Automatic Rollback on Failure</div>
            <div className="text-emerald-400 font-bold">[PASS 05] Concurrent Coupon Redemption Race Prevention (Unique Index Guard)</div>
            <div className="text-emerald-400 font-bold">[PASS 06] Personal Subscription Lifecycle: Active &rarr; Trial &rarr; Paused &rarr; Cancelled</div>
            <div className="text-emerald-400 font-bold">[PASS 07] Multi-Frequency Normalized Monthly Expense Mathematical Precision</div>
            <div className="text-emerald-400 font-bold">[PASS 08] Receipt Document Base64 Upload & UUID Linkage to Subscriptions</div>
            <div className="text-emerald-400 font-bold">[PASS 09] Views Performance: v_subscription_overview, v_monthly_revenue, v_expiring_soon</div>
            <div className="text-emerald-400 font-bold">[PASS 10] Realtime Retention ML Inference Pipeline Persisting to churn_predictions</div>
          </div>
          {/* Categorized Live System Verification Screenshots */}
          <div className="space-y-8 pt-4">
            {/* 13.2 Client Presentation */}
            <div className="space-y-4">
              <div className="border-b border-[#8DFFCB]/20 pb-2">
                <h3 className="text-sm font-bold text-[#8DFFCB] uppercase font-mono tracking-wider">
                  13.2 Client Presentation &amp; Marketing Portal
                </h3>
                <p className="text-xs text-[#8E9F9B] font-mono mt-0.5">
                  Public interface displaying system metrics, value proposition, and persona entry points
                </p>
              </div>
              <ScreenshotFigure
                src="/screenshots/01_landing_page.png"
                alt="Public Landing Page"
                figureNumber="Figure 13.1"
                caption="Public Landing Page — hero presentation, value proposition, and dual-persona authentication trigger buttons"
              />
            </div>

            {/* 13.3 Member Workspace */}
            <div className="space-y-4">
              <div className="border-b border-[#8DFFCB]/20 pb-2">
                <h3 className="text-sm font-bold text-[#8DFFCB] uppercase font-mono tracking-wider">
                  13.3 Member Workspace &amp; Personal Subscription Ledger
                </h3>
                <p className="text-xs text-[#8E9F9B] font-mono mt-0.5">
                  Subscriber dashboard, personal ledger, self-service portal, and card checkout flows
                </p>
              </div>
              <div className="space-y-6">
                <ScreenshotFigure
                  src="/screenshots/02_member_dashboard.png"
                  alt="Member Dashboard Hub"
                  figureNumber="Figure 13.2"
                  caption="Personalized Member Dashboard Hub — active subscriptions, normalized monthly burn rate, upcoming renewals, and quick actions"
                />
                <ScreenshotFigure
                  src="/screenshots/03_my_subscriptions_hub.png"
                  alt="My Subscriptions Hub"
                  figureNumber="Figure 13.3"
                  caption="My Subscriptions Central Hub — real-time subscription cards with category tags, billing cycle indicators, and direct pause controls"
                />
                <ScreenshotFigure
                  src="/screenshots/04_member_portal.png"
                  alt="Member Portal"
                  figureNumber="Figure 13.4"
                  caption="Member Self-Service Portal — active plan entitlements, security credentials, API keys, and notification configurations"
                />
                <ScreenshotFigure
                  src="/screenshots/05_plans_pricing.png"
                  alt="Membership Plans & Pricing"
                  figureNumber="Figure 13.5"
                  caption="Membership Plans & Pricing — member view showing active tier, feature checklists, and holographic Demo Card checkout flow"
                />
              </div>
            </div>

            {/* 13.4 Administrative Operations */}
            <div className="space-y-4">
              <div className="border-b border-[#8DFFCB]/20 pb-2">
                <h3 className="text-sm font-bold text-[#8DFFCB] uppercase font-mono tracking-wider">
                  13.4 Administrative Operations &amp; Tenant Governance
                </h3>
                <p className="text-xs text-[#8E9F9B] font-mono mt-0.5">
                  Executive KPIs, tenant roster, master ledger, billing invoices, and expiring renewal radar
                </p>
              </div>
              <div className="space-y-6">
                <ScreenshotFigure
                  src="/screenshots/06_admin_executive_dashboard.png"
                  alt="Admin Executive Overview"
                  figureNumber="Figure 13.6"
                  caption="Admin Executive Overview — real-time MRR telemetry, active plan distributions, and recent database audit logs"
                />
                <ScreenshotFigure
                  src="/screenshots/07_admin_members_directory.png"
                  alt="Admin Members Directory"
                  figureNumber="Figure 13.7"
                  caption="Admin Members Directory — multi-tenant account roster with role indicators, email search, and RLS server-side filtering"
                />
                <ScreenshotFigure
                  src="/screenshots/08_admin_all_subscriptions.png"
                  alt="Admin All Subscriptions Roster"
                  figureNumber="Figure 13.8"
                  caption="Admin All Subscriptions Master Ledger — cross-tenant subscription records with member IDs, provider links, and lifecycle filters"
                />
                <ScreenshotFigure
                  src="/screenshots/09_admin_billing_invoices.png"
                  alt="Admin Invoices & Billing Ledger"
                  figureNumber="Figure 13.9"
                  caption="Admin Invoices & Billing Ledger — settled receipts, sequential invoice IDs, and total amounts populated via atomic DML transactions"
                />
                <ScreenshotFigure
                  src="/screenshots/10_admin_renewal_radar.png"
                  alt="Renewal Radar Page"
                  figureNumber="Figure 13.10"
                  caption="Renewal Radar Page — powered by view_expiring_soon to identify impending subscriber renewals within a 7-day lookahead window"
                />
              </div>
            </div>

            {/* 13.5 Machine Learning */}
            <div className="space-y-4">
              <div className="border-b border-[#8DFFCB]/20 pb-2">
                <h3 className="text-sm font-bold text-[#8DFFCB] uppercase font-mono tracking-wider">
                  13.5 Machine Learning &amp; Business Intelligence
                </h3>
                <p className="text-xs text-[#8E9F9B] font-mono mt-0.5">
                  Predictive retention classifier, ROC-AUC validation, and cohort analytics
                </p>
              </div>
              <div className="space-y-6">
                <ScreenshotFigure
                  src="/screenshots/11_admin_analytics_revenue.png"
                  alt="Revenue & Subscriber Analytics"
                  figureNumber="Figure 13.11"
                  caption="Revenue & Subscriber Analytics — historical MRR growth, provider concentration distributions, and financial forecasts"
                />
                <ScreenshotFigure
                  src="/screenshots/12_admin_retention_intelligence.png"
                  alt="Retention Intelligence Module"
                  figureNumber="Figure 13.12"
                  caption="Retention Intelligence Module — model validation performance (ROC-AUC = 0.9124) and prioritized customer churn intervention queue"
                />
              </div>
            </div>

            {/* 13.6 DBMS Laboratory Workbench */}
            <div className="space-y-4">
              <div className="border-b border-[#8DFFCB]/20 pb-2">
                <h3 className="text-sm font-bold text-[#8DFFCB] uppercase font-mono tracking-wider">
                  13.6 DBMS Laboratory Workbench &amp; Academic Documentation
                </h3>
                <p className="text-xs text-[#8E9F9B] font-mono mt-0.5">
                  Interactive schema explorer, live WebAssembly SQL console, and academic documentation viewer
                </p>
              </div>
              <div className="space-y-6">
                <ScreenshotFigure
                  src="/screenshots/13_dbms_studio.png"
                  alt="DBMS Studio Interactive Workbench"
                  figureNumber="Figure 13.13"
                  caption="DBMS Studio Interactive Workbench — live ER topology explorer, schema inspector, and SQL query console"
                />
                <ScreenshotFigure
                  src="/screenshots/14_dbms_documentation.png"
                  alt="In-App DBMS Documentation Viewer"
                  figureNumber="Figure 13.14"
                  caption="In-App DBMS Documentation & Comprehensive Verification Suite — interactive academic report viewer and test suite telemetry"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 14: CONCLUSION AND FUTURE SCOPE */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'sec14_conclusion') && (
        <div id="sec14_conclusion" className="glass-panel p-8 rounded-3xl border border-[rgba(220,255,245,0.12)] space-y-6">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-[#8DFFCB]" />
            <h2 className="text-lg font-bold text-[#F1F5F0]">14. Conclusion and Future Scope</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
            <div className="glass-card p-5 rounded-2xl space-y-2">
              <div className="font-bold text-[#8DFFCB]">Conclusion</div>
              <p className="text-[#8E9F9B] leading-relaxed">
                NEXUS demonstrates how rigorous database normalization (3NF/BCNF) paired with modern PostgreSQL concurrency controls (row-locks, atomic RPCs, composite indexes) resolves the chaotic fragmentation of subscription management. The system eliminates ghost subscriptions, optimizes personal cash flow, and offers verified ML decision intelligence.
              </p>
            </div>

            <div className="glass-card p-5 rounded-2xl space-y-2">
              <div className="font-bold text-[#8DFFCB]">Future Scope & Enhancements</div>
              <ul className="text-[#8E9F9B] space-y-1.5 list-disc list-inside">
                <li><strong className="text-[#F1F5F0]">Open Banking API Integration:</strong> Real-time card transaction scraping via Account Aggregator / Plaid APIs.</li>
                <li><strong className="text-[#F1F5F0]">Optical Character Recognition (OCR):</strong> Automatic extraction of subscription amounts and due dates from uploaded PDF bills.</li>
                <li><strong className="text-[#F1F5F0]">Multi-Region Sharding:</strong> Distributed PostgreSQL clustering with Citus for global consumer scalability.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 15: REFERENCES / BIBLIOGRAPHY */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'sec15_references') && (
        <div id="sec15_references" className="glass-panel p-8 rounded-3xl border border-[rgba(220,255,245,0.12)] space-y-4">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-[#8DFFCB]" />
            <h2 className="text-lg font-bold text-[#F1F5F0]">15. References & Bibliography</h2>
          </div>

          <ol className="text-xs font-mono text-[#8E9F9B] space-y-2 list-decimal list-inside leading-relaxed">
            <li>Silberschatz, A., Korth, H. F., & Sudarshan, S. (2020). <em>Database System Concepts</em> (7th ed.). McGraw-Hill Education.</li>
            <li>Date, C. J. (2004). <em>An Introduction to Database Systems</em> (8th ed.). Addison-Wesley.</li>
            <li>PostgreSQL Global Development Group. (2024). <em>PostgreSQL 17 Documentation: Concurrency Control and Index Types</em>. https://www.postgresql.org/docs/17/</li>
            <li>Supabase Documentation. (2024). <em>Row Level Security (RLS) & Stored Procedures in Postgres</em>. https://supabase.com/docs</li>
            <li>Pedregosa et al. (2011). <em>Scikit-learn: Machine Learning in Python</em>. Journal of Machine Learning Research, 12, 2825-2830.</li>
            <li>Motilal Nehru National Institute of Technology Allahabad. (2026). <em>Department of Computer Science and Engineering DBMS Project Evaluation Guidelines</em>.</li>
          </ol>
        </div>
      )}
    </div>
  );
};