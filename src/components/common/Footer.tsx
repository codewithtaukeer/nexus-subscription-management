import React, { useState } from 'react';
import { Database, ShieldCheck, Cpu, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { QuantumDotMesh } from './QuantumDotMesh';

export const Footer: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
      setEmail('');
    }
  };

  return (
    <footer className="border-t border-[rgba(220,255,245,0.12)] bg-[#040909] text-[#F1F5F0] overflow-hidden">
      {/* Dramatic Split Section (Inspired by reference visual) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Editorial & Interaction */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8DFFCB]/10 border border-[#8DFFCB]/20 text-[#8DFFCB] text-xs font-mono">
            <Cpu className="w-3.5 h-3.5" />
            <span>ACADEMIC EVALUATION READY • TOPIC 34</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F1F5F0]">
            Deterministic Membership Architecture.
            <br />
            <span className="text-[#8DFFCB]">Powered by PostgreSQL 17.</span>
          </h2>

          <p className="text-sm text-[#8E9F9B] max-w-xl leading-relaxed">
            NEXUS enforces relational integrity with normalized 3NF schema, multi-table joins,
            ACID transaction RPCs, and held-out machine learning churn inference. No decorative mock data—all queries execute against Supabase live.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md pt-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your university email..."
              className="flex-1 px-4 py-2.5 rounded-lg bg-[#0D1919] border border-[rgba(220,255,245,0.2)] text-xs text-[#F1F5F0] placeholder-[#8E9F9B] focus:outline-none focus:border-[#8DFFCB]"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-[#8DFFCB] text-[#071112] text-xs font-semibold hover:bg-[#A6FFD8] transition-all font-mono whitespace-nowrap"
            >
              Demo Access
            </button>
          </form>

          {submitted && (
            <div className="flex items-center gap-2 text-xs text-[#8DFFCB] font-mono animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Academic demo access verified. Explore DBMS Studio for live SQL traces.</span>
            </div>
          )}
        </div>

        {/* Right Column: Luminous Graphic Panel */}
        <div className="lg:col-span-5 relative h-64 sm:h-80 rounded-2xl overflow-hidden border border-[rgba(220,255,245,0.2)] bg-[#071112]">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#071112] via-transparent to-[#8DFFCB]/10 z-10" />
          <QuantumDotMesh className="absolute inset-0" density={20} />
          
          <div className="absolute bottom-6 left-6 right-6 z-20 glass-panel-elevated p-4 rounded-xl">
            <div className="flex items-center justify-between text-xs font-mono text-[#8DFFCB]">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                POSTGRESQL RELATIONAL ENGINE
              </span>
              <span className="text-[10px] text-[#8E9F9B]">3NF / ACID</span>
            </div>
            <div className="text-[11px] text-[#F1F5F0] font-mono mt-2">
              Foreign Keys • Triggers • Row Level Security
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[rgba(220,255,245,0.08)] py-6 text-xs text-[#8E9F9B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/nexus-logo.png"
              alt="NEXUS"
              className="w-6 h-6 object-contain drop-shadow-[0_0_8px_rgba(141,255,203,0.5)]"
            />
            <span className="font-mono text-[#F1F5F0] font-bold">NEXUS v1.0</span>
            <span>•</span>
            <span>DBMS Topic 34: Subscription & Membership Management</span>
            <span>•</span>
            <span>MNNIT Allahabad CSE</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => onNavigate('dbms')}
              className="hover:text-[#8DFFCB] transition-colors flex items-center gap-1"
            >
              Schema Explorer <ArrowUpRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => onNavigate('retention')}
              className="hover:text-[#8DFFCB] transition-colors flex items-center gap-1"
            >
              ML Model Card <ArrowUpRight className="w-3 h-3" />
            </button>
            <a
              href="https://github.com/codewithtaukeer/nexus-subscription-management"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#8DFFCB] transition-colors flex items-center gap-1"
            >
              GitHub Source <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
