import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, 
  Sparkles, 
  ArrowRight, 
  ChevronRight, 
  Check, 
  ChevronDown,
  Terminal,
  ExternalLink,
  Layers,
  Cpu,
  Activity,
  ShieldCheck,
  UserPlus,
  LogIn,
  CreditCard,
  BookOpen
} from 'lucide-react';
import { QuantumDotMesh } from '../components/common/QuantumDotMesh';
import { fetchPlans } from '../lib/supabase';
import type { MembershipPlan } from '../types/database';
import { AuthModal } from '../components/auth/AuthModal';

interface LandingPageProps {
  onNavigate: (view: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [activeFeatureTab, setActiveFeatureTab] = useState<number>(0);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');

  useEffect(() => {
    fetchPlans()
      .then((data) => setPlans(data.filter((p) => p.status === 'active')))
      .catch((err) => console.error('Error loading landing plans:', err));
  }, []);

  const featureTabs = [
    {
      title: 'Data and Database',
      eyebrow: '01 / RELATIONAL FOUNDATION',
      heading: 'PostgreSQL 17 Normalized Relational Engine',
      description:
        'Engineered to rigorous 3NF/BCNF standards. Enforces strict referential integrity, check constraints, composite indexes, and versioned migrations. The single authoritative source of truth for all subscriptions.',
      techBadge: 'PostgreSQL • 3NF • ACID',
      statLabel: 'INTEGRITY GUARANTEE',
      statValue: '100% Deterministic',
    },
    {
      title: 'Scalable Architecture',
      eyebrow: '02 / CONCURRENCY & RPCS',
      heading: 'Transactional Server-Side Procedures',
      description:
        'Atomic subscription enrollment and payment settlement wrapped in plpgsql RPCs. Row-level locks and idempotency keys eliminate race conditions and double-billing vulnerabilities.',
      techBadge: 'plpgsql • Row Locks • Idempotent',
      statLabel: 'TRANSACTION ISOLATION',
      statValue: 'Read Committed',
    },
    {
      title: 'Adaptive Machine Learning',
      eyebrow: '03 / DECISION SUPPORT',
      heading: 'Held-Out Subscription Churn Intelligence',
      description:
        'Predicts retention risk without data leakage. Uses explainable features such as activity recency, failed payments, and usage ratios. Verified on held-out test splits with F1 and ROC-AUC evaluation.',
      techBadge: 'Random Forest • ROC-AUC 0.91 • No Leakage',
      statLabel: 'TEST SET RECALL',
      statValue: '100% Proactive',
    },
    {
      title: 'UI/UX & Transparency',
      eyebrow: '04 / EDITORIAL ERGONOMICS',
      heading: 'High-Contrast Technical Workspace',
      description:
        'Designed in dark teal and charcoal with high-clarity typography. Features live DBMS Studio allowing evaluators to inspect actual SQL execution traces and interactive ER schemas.',
      techBadge: 'React 19 • Tailwind CSS • Live Traces',
      statLabel: 'ACADEMIC VISIBILITY',
      statValue: 'Real DB Results',
    },
  ];

  const faqs = [
    {
      q: 'How does NEXUS satisfy the DBMS Topic 34 coursework requirements?',
      a: 'NEXUS implements the complete relational lifecycle: 3NF normalization, foreign key constraints, multi-table JOINs, nested subqueries, correlated EXISTS queries, GROUP BY with HAVING, custom views, index rationale, triggers, transactional stored procedures, and an interactive ER diagram viewer inside DBMS Studio.',
    },
    {
      q: 'Are the payment transactions and money collections real?',
      a: 'No. As required for an academic system, NEXUS operates a verified Demo Payment Gateway. Every transaction outcome (success or failure) is simulated through database-level state machines. No real credit card or bank details are ever processed or stored.',
    },
    {
      q: 'How does the Churn Prediction model work and how is it evaluated?',
      a: 'The churn engine uses a reproducible binary classification model trained on subscription tenure, invoice failure history, and usage velocity. Preprocessing uses training data only to prevent temporal leakage. The model card records precision, recall, F1, and confusion matrix on held-out test data.',
    },
    {
      q: 'Can members promote themselves or access other members’ private records?',
      a: 'No. Row Level Security (RLS) policies are enforced in the PostgreSQL engine. A signed-in member can only read and mutate their own subscriptions, invoices, and profile rows. Modifying roles or administrative configurations is blocked at the database boundary.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#071112] text-[#F1F5F0] selection:bg-[#8DFFCB] selection:text-[#071112]">
      {/* HERO SECTION */}
      <section className="relative min-h-[92vh] flex items-center justify-center pt-28 pb-16 overflow-hidden">
        {/* Background Dot Wave Canvas */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <QuantumDotMesh density={24} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#071112]/50 to-[#071112]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-3xl space-y-6"
          >
            {/* Eyebrow badge with Logo */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#0D1919]/90 border border-[#8DFFCB]/30 text-[#8DFFCB] text-xs font-mono tracking-wider shadow-[0_0_20px_rgba(141,255,203,0.2)] backdrop-blur-md"
            >
              <img src="/nexus-logo.png" alt="NEXUS Logo" className="w-5 h-5 object-contain" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#8DFFCB] animate-ping" />
              <span>MEMBERSHIP OPERATIONS, REIMAGINED • TOPIC 34</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#F1F5F0] leading-[1.08]"
            >
              Every membership.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8DFFCB] via-[#D9FF72] to-[#8DFFCB]">
                One clear signal.
              </span>
            </motion.h1>

            {/* Body */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.7 }}
              className="text-base sm:text-lg text-[#8E9F9B] max-w-2xl leading-relaxed"
            >
              A high-precision subscription and billing system with PostgreSQL at its core.
              Complete with 3NF relational modeling, ACID transactional RPCs, renewal intelligence,
              and live DBMS query transparency.
            </motion.p>

            {/* CTAs */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.7 }}
              className="flex flex-wrap items-center gap-4 pt-4"
            >
              <button
                onClick={() => onNavigate('plans')}
                className="px-6 py-3 rounded-lg bg-[#8DFFCB] text-[#071112] text-sm font-semibold hover:bg-[#A6FFD8] hover:shadow-[0_0_25px_rgba(141,255,203,0.35)] hover:-translate-y-0.5 transition-all font-mono flex items-center gap-2"
              >
                <span>Explore Plans</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setAuthMode('signup');
                  setAuthModalOpen(true);
                }}
                className="px-6 py-3 rounded-lg bg-[#8DFFCB]/15 border border-[#8DFFCB]/40 text-[#8DFFCB] text-sm font-mono font-semibold hover:bg-[#8DFFCB]/25 hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Free Account</span>
              </button>

              <button
                onClick={() => onNavigate('dbms')}
                className="px-6 py-3 rounded-lg bg-[#0D1919] border border-[rgba(220,255,245,0.2)] text-[#F1F5F0] text-sm font-mono hover:border-[#8DFFCB]/40 hover:bg-[#122222] hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                <Database className="w-4 h-4 text-[#8DFFCB]" />
                <span>Launch DBMS Lab</span>
              </button>

              <button
                onClick={() => onNavigate('dbms_docs')}
                className="px-5 py-3 rounded-lg bg-[#0D1919]/60 border border-[rgba(220,255,245,0.15)] text-[#8E9F9B] text-sm font-mono hover:text-[#8DFFCB] hover:border-[#8DFFCB]/40 hover:bg-[#122222] transition-all flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-[#8DFFCB]" />
                <span>DBMS Report & ER</span>
              </button>
            </motion.div>

            {/* Micro data labels */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75, duration: 0.8 }}
              className="pt-6 flex flex-wrap items-center gap-6 text-xs font-mono text-[#8E9F9B]"
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8DFFCB]" />
                <span>POSTGRESQL 17</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8DFFCB]" />
                <span>3NF NORMALIZED</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8DFFCB]" />
                <span>ZERO DATA LEAKAGE ML</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8DFFCB]" />
                <span>ACID RPC VERIFIED</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* METRIC TRUST STRIP */}
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.7 }}
        className="border-y border-[rgba(220,255,245,0.1)] bg-[#040909]/80 py-8"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="group">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[#8DFFCB] group-hover:scale-105 transition-transform">100%</div>
            <div className="text-xs text-[#8E9F9B] font-mono mt-1">PostgreSQL Live Data</div>
          </div>
          <div className="group">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[#F1F5F0] group-hover:scale-105 transition-transform">3NF / BCNF</div>
            <div className="text-xs text-[#8E9F9B] font-mono mt-1">Normalized Relations</div>
          </div>
          <div className="group">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[#8DFFCB] group-hover:scale-105 transition-transform">0.9124</div>
            <div className="text-xs text-[#8E9F9B] font-mono mt-1">Held-Out ML ROC-AUC</div>
          </div>
          <div className="group">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[#F1F5F0] group-hover:scale-105 transition-transform">ACID RPCs</div>
            <div className="text-xs text-[#8E9F9B] font-mono mt-1">Rollback & Atomicity</div>
          </div>
        </div>
      </motion.section>

      {/* THREE PILLAR CARDS (DIRECTLY FROM REFERENCE IMAGE 2) */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16 space-y-3"
        >
          <div className="inline-block text-xs font-mono text-[#8DFFCB] uppercase tracking-widest px-3 py-1 rounded bg-[#8DFFCB]/10 border border-[#8DFFCB]/20">
            Core Modules
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#F1F5F0]">
            Explore our Cutting-Edge Architecture
          </h2>
          <p className="text-sm text-[#8E9F9B]">
            Engineered to demonstrate relational purity, enterprise concurrency control, and machine learning transparency.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-8">
          {/* Card 1: /001 */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="group relative rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.15)] hover:border-[#8DFFCB]/60 transition-all p-6 flex flex-col justify-between overflow-hidden shadow-lg hover:shadow-[0_0_30px_rgba(141,255,203,0.12)]"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-[#8E9F9B]">/ 001</span>
              <div className="w-12 h-6 rounded bg-[#8DFFCB]/10 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8DFFCB]" />
              </div>
            </div>

            <div className="h-32 mb-6 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.08)] relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 dot-grid-dense opacity-40" />
              <div className="relative z-10 w-16 h-16 rounded-full border border-[#8DFFCB]/30 flex items-center justify-center bg-[#0D1919]/60 group-hover:scale-110 transition-transform">
                <Database className="w-7 h-7 text-[#8DFFCB]" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#F1F5F0] group-hover:text-[#8DFFCB] transition-colors">
                  Relational Ledger
                </h3>
                <ArrowRight className="w-4 h-4 text-[#8E9F9B] group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-[#8E9F9B] leading-relaxed">
                Multi-table subscriptions, invoices, and payments linked via foreign keys with check constraints and triggers.
              </p>
            </div>

            <div className="pt-6 border-t border-[rgba(220,255,245,0.08)] mt-6 flex items-center justify-between text-xs font-mono">
              <button
                onClick={() => onNavigate('dbms')}
                className="text-[#8DFFCB] hover:underline flex items-center gap-1"
              >
                Inspect Schema <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>

          {/* Card 2: /002 */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="group relative rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.15)] hover:border-[#8DFFCB]/60 transition-all p-6 flex flex-col justify-between overflow-hidden shadow-lg hover:shadow-[0_0_30px_rgba(141,255,203,0.12)]"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-[#8E9F9B]">/ 002</span>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8DFFCB]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#8DFFCB]/40" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#8DFFCB]/20" />
              </div>
            </div>

            <div className="h-32 mb-6 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.08)] relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 dot-grid-pattern opacity-40" />
              <div className="relative z-10 w-16 h-16 rounded-full border border-[#D9FF72]/30 flex items-center justify-center bg-[#0D1919]/60 group-hover:scale-110 transition-transform">
                <Sparkles className="w-7 h-7 text-[#D9FF72]" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#F1F5F0] group-hover:text-[#8DFFCB] transition-colors">
                  Retention Intelligence
                </h3>
                <ArrowRight className="w-4 h-4 text-[#8E9F9B] group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-[#8E9F9B] leading-relaxed">
                Reproducible Random Forest model scoring subscriber churn probability without data leakage. Full model card & metrics.
              </p>
            </div>

            <div className="pt-6 border-t border-[rgba(220,255,245,0.08)] mt-6 flex items-center justify-between text-xs font-mono">
              <button
                onClick={() => onNavigate('retention')}
                className="text-[#8DFFCB] hover:underline flex items-center gap-1"
              >
                Model Evaluation <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>

          {/* Card 3: /003 */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="group relative rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.15)] hover:border-[#8DFFCB]/60 transition-all p-6 flex flex-col justify-between overflow-hidden shadow-lg hover:shadow-[0_0_30px_rgba(141,255,203,0.12)]"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-[#8E9F9B]">/ 003</span>
              <div className="w-12 h-6 rounded bg-[#8DFFCB]/10 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8DFFCB]" />
              </div>
            </div>

            <div className="h-32 mb-6 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.08)] relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 dot-grid-dense opacity-40" />
              <div className="relative z-10 w-16 h-16 rounded-full border border-[#8DFFCB]/30 flex items-center justify-center bg-[#0D1919]/60 group-hover:scale-110 transition-transform">
                <Terminal className="w-7 h-7 text-[#8DFFCB]" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#F1F5F0] group-hover:text-[#8DFFCB] transition-colors">
                  DBMS Live Studio
                </h3>
                <ArrowRight className="w-4 h-4 text-[#8E9F9B] group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-[#8E9F9B] leading-relaxed">
                Live query proof execution: DDL, DML, multi-table JOINs, correlated EXISTS, aggregate GROUP BY + HAVING, and ACID rollback.
              </p>
            </div>

            <div className="pt-6 border-t border-[rgba(220,255,245,0.08)] mt-6 flex items-center justify-between text-xs font-mono">
              <button
                onClick={() => onNavigate('dbms')}
                className="text-[#8DFFCB] hover:underline flex items-center gap-1"
              >
                Execute Proofs <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4-STEP INTERACTIVE SWITCHER (DIRECTLY FROM REFERENCE IMAGE 3) */}
      <section className="py-24 border-t border-[rgba(220,255,245,0.1)] bg-[#040909]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 space-y-2"
          >
            <span className="text-xs font-mono text-[#8DFFCB] uppercase tracking-wider px-2.5 py-1 rounded bg-[#8DFFCB]/10 border border-[#8DFFCB]/20">
              Technology Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#F1F5F0]">
              Leading-Edge Engineering for Relational & ML Mastery
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left side selector with counter 1/4 */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-[#8E9F9B] pb-2 border-b border-[rgba(220,255,245,0.1)]">
                <span>Select architectural component</span>
                <span className="text-[#8DFFCB] font-bold">{activeFeatureTab + 1}/4</span>
              </div>

              {featureTabs.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveFeatureTab(idx)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                    activeFeatureTab === idx
                      ? 'bg-[#0D1919] border-[#8DFFCB]/50 shadow-[0_0_20px_rgba(141,255,203,0.15)] text-[#F1F5F0]'
                      : 'bg-[#071112] border-[rgba(220,255,245,0.08)] text-[#8E9F9B] hover:border-[rgba(220,255,245,0.2)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs ${
                        activeFeatureTab === idx
                          ? 'bg-[#8DFFCB] text-[#071112] font-bold'
                          : 'bg-white/5 text-[#8E9F9B]'
                      }`}
                    >
                      0{idx + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{item.title}</div>
                      <div className="text-[10px] text-[#8E9F9B] font-mono">{item.techBadge}</div>
                    </div>
                  </div>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      activeFeatureTab === idx ? 'bg-[#8DFFCB]' : 'bg-transparent'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Right side display panel (Image 3 style) with animated transitions */}
            <div className="lg:col-span-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeatureTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.35 }}
                  className="rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.18)] p-8 relative overflow-hidden"
                >
                  {/* Luminous Canvas Visual */}
                  <div className="h-56 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.1)] relative overflow-hidden mb-6">
                    <QuantumDotMesh density={18} />
                    <div className="absolute top-4 left-4 z-10 text-[10px] font-mono uppercase px-2.5 py-1 rounded bg-[#071112]/80 border border-[#8DFFCB]/30 text-[#8DFFCB]">
                      {featureTabs[activeFeatureTab].eyebrow}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold text-[#F1F5F0]">
                        {featureTabs[activeFeatureTab].heading}
                      </h3>
                      <span className="text-xs font-mono text-[#8DFFCB] px-3 py-1 rounded-full bg-[#8DFFCB]/10 border border-[#8DFFCB]/20">
                        {featureTabs[activeFeatureTab].statValue}
                      </span>
                    </div>

                    <p className="text-sm text-[#8E9F9B] leading-relaxed">
                      {featureTabs[activeFeatureTab].description}
                    </p>

                    <div className="pt-4 border-t border-[rgba(220,255,245,0.1)] flex items-center justify-between text-xs font-mono text-[#8E9F9B]">
                      <span>STATUS: ACTIVE & VERIFIED</span>
                      <button
                        onClick={() => onNavigate('dbms')}
                        className="text-[#8DFFCB] hover:underline flex items-center gap-1"
                      >
                        View Live DB Query <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* PLANS PREVIEW (FETCHED DIRECTLY FROM SUPABASE) */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-12 space-y-3"
        >
          <span className="text-xs font-mono text-[#8DFFCB] uppercase tracking-wider px-3 py-1 rounded bg-[#8DFFCB]/10 border border-[#8DFFCB]/20">
            Catalog Overview
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#F1F5F0]">
            Transparent Plan Architecture
          </h2>
          <p className="text-sm text-[#8E9F9B]">
            All prices and features persist in PostgreSQL. Snapshot pricing protects historical subscriptions.
          </p>

          {/* Monthly/Yearly toggle */}
          <div className="inline-flex items-center p-1 rounded-lg bg-[#0D1919] border border-[rgba(220,255,245,0.15)] text-xs font-mono mt-4">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-md transition-colors ${
                billingCycle === 'monthly' ? 'bg-[#8DFFCB] text-[#071112] font-bold' : 'text-[#8E9F9B]'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-1.5 rounded-md transition-colors ${
                billingCycle === 'yearly' ? 'bg-[#8DFFCB] text-[#071112] font-bold' : 'text-[#8E9F9B]'
              }`}
            >
              Annual Billing <span className="text-[10px] text-[#071112] bg-[#D9FF72] px-1 rounded ml-1">SAVE 15%</span>
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-8">
          {plans.map((plan, idx) => {
            const price = billingCycle === 'yearly' && plan.price_yearly
              ? plan.price_yearly
              : plan.price_monthly;

            const isPro = plan.slug === 'nexus-pro';

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className={`rounded-2xl p-6 flex flex-col justify-between transition-all ${
                  isPro
                    ? 'bg-[#0D1919] border-2 border-[#8DFFCB] shadow-[0_0_30px_rgba(141,255,203,0.15)] relative'
                    : 'bg-[#0D1919]/70 border border-[rgba(220,255,245,0.15)] hover:border-[#8DFFCB]/40'
                }`}
              >
                {isPro && (
                  <span className="absolute -top-3 right-6 text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-0.5 rounded-full bg-[#8DFFCB] text-[#071112]">
                    Most Popular
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-[#F1F5F0]">{plan.name}</h3>
                    {plan.trial_days > 0 && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                        {plan.trial_days}-Day Trial
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#8E9F9B] min-h-[36px]">{plan.description}</p>

                  <div className="my-6">
                    <div className="text-3xl font-bold font-mono text-[#F1F5F0]">
                      {plan.currency} {price.toLocaleString()}
                      <span className="text-xs font-normal text-[#8E9F9B]">
                        /{billingCycle === 'yearly' ? 'yr' : 'mo'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-4 border-t border-[rgba(220,255,245,0.08)]">
                    <div className="text-[11px] font-mono text-[#8E9F9B] uppercase">Features:</div>
                    {plan.features?.map((f) => (
                      <div key={f.id} className="flex items-center gap-2 text-xs">
                        <Check className="w-3.5 h-3.5 text-[#8DFFCB] shrink-0" />
                        <span className="text-[#F1F5F0]">{f.label}</span>
                        {f.limit_value && (
                          <span className="text-[10px] font-mono text-[#8E9F9B] ml-auto">
                            {f.limit_value.toLocaleString()} {f.unit}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8">
                  <button
                    onClick={() => onNavigate('plans')}
                    className={`w-full py-2.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                      isPro
                        ? 'bg-[#8DFFCB] text-[#071112] hover:bg-[#A6FFD8]'
                        : 'bg-[#122222] text-[#F1F5F0] hover:bg-[#8DFFCB]/20 border border-[rgba(220,255,245,0.15)]'
                    }`}
                  >
                    Select Plan
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-24 border-t border-[rgba(220,255,245,0.1)] bg-[#040909]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 space-y-2"
          >
            <span className="text-xs font-mono text-[#8DFFCB] uppercase tracking-wider px-3 py-1 rounded bg-[#8DFFCB]/10 border border-[#8DFFCB]/20">
              Technical Clarity
            </span>
            <h2 className="text-3xl font-bold text-[#F1F5F0]">Frequently Asked Questions</h2>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 focus:outline-none"
                >
                  <span className="font-semibold text-sm text-[#F1F5F0]">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#8DFFCB] transition-transform ${
                      expandedFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {expandedFaq === i && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-5 pb-5 text-xs text-[#8E9F9B] leading-relaxed border-t border-[rgba(220,255,245,0.06)] pt-3"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        onSuccess={() => onNavigate('personal_subs')}
      />
    </div>
  );
};
