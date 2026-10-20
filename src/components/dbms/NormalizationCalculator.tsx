import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { 
  analyzeRelation, 
  type FunctionalDependency, 
  type NormalizationAnalysis 
} from '../../lib/normalizationEngine';

export const NormalizationCalculator: React.FC = () => {
  const [attributesInput, setAttributesInput] = useState<string>(
    'SubscriptionId, MemberId, PlanId, MemberEmail, PlanName, Price, Status'
  );
  const [fds, setFds] = useState<FunctionalDependency[]>([
    { id: '1', lhs: ['SubscriptionId'], rhs: ['MemberId', 'PlanId', 'Status'] },
    { id: '2', lhs: ['MemberId'], rhs: ['MemberEmail'] },
    { id: '3', lhs: ['PlanId'], rhs: ['PlanName', 'Price'] },
  ]);

  const [newLhs, setNewLhs] = useState('');
  const [newRhs, setNewRhs] = useState('');
  const [analysis, setAnalysis] = useState<NormalizationAnalysis | null>(null);

  // Presets
  const presets = [
    {
      name: 'Subscription & Membership (NEXUS)',
      attrs: 'SubscriptionId, MemberId, PlanId, MemberEmail, PlanName, Price, Status',
      fds: [
        { id: '1', lhs: ['SubscriptionId'], rhs: ['MemberId', 'PlanId', 'Status'] },
        { id: '2', lhs: ['MemberId'], rhs: ['MemberEmail'] },
        { id: '3', lhs: ['PlanId'], rhs: ['PlanName', 'Price'] },
      ],
    },
    {
      name: 'Student Course Enrollment (Classic Partial & Transitive)',
      attrs: 'StudentId, CourseId, StudentName, CourseName, Instructor, InstructorRoom',
      fds: [
        { id: '1', lhs: ['StudentId'], rhs: ['StudentName'] },
        { id: '2', lhs: ['CourseId'], rhs: ['CourseName', 'Instructor'] },
        { id: '3', lhs: ['Instructor'], rhs: ['InstructorRoom'] },
      ],
    },
    {
      name: 'Order Item & Supplier Delivery',
      attrs: 'OrderId, ItemId, SupplierId, OrderDate, ItemName, SupplierAddress',
      fds: [
        { id: '1', lhs: ['OrderId'], rhs: ['OrderDate'] },
        { id: '2', lhs: ['ItemId'], rhs: ['ItemName', 'SupplierId'] },
        { id: '3', lhs: ['SupplierId'], rhs: ['SupplierAddress'] },
      ],
    },
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    setAttributesInput(p.attrs);
    setFds(p.fds);
  };

  const handleAddFd = () => {
    if (!newLhs || !newRhs) return;
    const lhs = newLhs.split(',').map((s) => s.trim()).filter(Boolean);
    const rhs = newRhs.split(',').map((s) => s.trim()).filter(Boolean);
    setFds([...fds, { id: Date.now().toString(), lhs, rhs }]);
    setNewLhs('');
    setNewRhs('');
  };

  const handleRemoveFd = (id: string) => {
    setFds(fds.filter((f) => f.id !== id));
  };

  const runAnalysis = () => {
    const rawAttrs = attributesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const result = analyzeRelation(rawAttrs, fds);
    setAnalysis(result);
  };

  useEffect(() => {
    runAnalysis();
  }, [attributesInput, fds]);

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="p-5 rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.15)] space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(220,255,245,0.1)]">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F1F5F0]">
            <Calculator className="w-4 h-4 text-[#8DFFCB]" />
            <span>Relational Normalization Engine & Decomposition Prover</span>
          </div>
          <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-[#8DFFCB]/10 text-[#8DFFCB] border border-[#8DFFCB]/20">
            1NF • 2NF • 3NF • BCNF
          </span>
        </div>

        <p className="text-[#8E9F9B] text-xs leading-relaxed">
          Input any relational schema $R(A_1, A_2, \dots)$ and functional dependencies $F$.
          The engine computes attribute closures, candidate keys, proves normal form compliance,
          identifies partial/transitive violations, and outputs 3NF and BCNF lossless decompositions!
        </p>

        {/* Preset Selector */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[#8E9F9B] text-[11px]">Load Sample Relation:</span>
          {presets.map((p, i) => (
            <button
              key={i}
              onClick={() => handleApplyPreset(p)}
              className="px-2.5 py-1 rounded bg-[#071112] hover:bg-[#8DFFCB]/20 text-[#8DFFCB] border border-[rgba(220,255,245,0.15)] transition-colors text-[11px]"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Relation Schema & FDs Input Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Relation Input */}
        <div className="p-4 rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] space-y-3">
          <label className="text-[#F1F5F0] font-bold block">1. Relation Attributes $R(A, B, C, \dots)$</label>
          <input
            type="text"
            value={attributesInput}
            onChange={(e) => setAttributesInput(e.target.value)}
            placeholder="Attr1, Attr2, Attr3..."
            className="w-full px-3 py-2 rounded-lg bg-[#071112] border border-[rgba(220,255,245,0.15)] text-[#8DFFCB] focus:outline-none focus:border-[#8DFFCB]"
          />
          <p className="text-[10px] text-[#8E9F9B]">Comma-separated attribute names.</p>
        </div>

        {/* Functional Dependencies Input */}
        <div className="p-4 rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] space-y-3">
          <label className="text-[#F1F5F0] font-bold block">2. Functional Dependencies $F$</label>

          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {fds.map((fd) => (
              <div
                key={fd.id}
                className="flex items-center justify-between p-2 rounded bg-[#071112] border border-[rgba(220,255,245,0.06)]"
              >
                <span className="text-[#F1F5F0]">
                  <strong className="text-[#8DFFCB]">{fd.lhs.join(', ')}</strong> &rarr; {fd.rhs.join(', ')}
                </span>
                <button
                  onClick={() => handleRemoveFd(fd.id)}
                  className="text-rose-400 hover:text-rose-300 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add FD Form */}
          <div className="flex gap-2 pt-1">
            <input
              type="text"
              placeholder="LHS (e.g. A, B)"
              value={newLhs}
              onChange={(e) => setNewLhs(e.target.value)}
              className="w-1/3 px-2 py-1 rounded bg-[#071112] border border-[rgba(220,255,245,0.15)] text-[#F1F5F0]"
            />
            <span className="text-[#8E9F9B] self-center">&rarr;</span>
            <input
              type="text"
              placeholder="RHS (e.g. C, D)"
              value={newRhs}
              onChange={(e) => setNewRhs(e.target.value)}
              className="flex-1 px-2 py-1 rounded bg-[#071112] border border-[rgba(220,255,245,0.15)] text-[#F1F5F0]"
            />
            <button
              onClick={handleAddFd}
              className="px-3 py-1 rounded bg-[#8DFFCB] text-[#071112] font-bold hover:bg-[#A6FFD8]"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* ANALYSIS RESULTS */}
      {analysis && (
        <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.15)] p-5 space-y-6">
          {/* Status Badges */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[rgba(220,255,245,0.1)]">
            <div className="space-y-1">
              <span className="text-[#8E9F9B]">Calculated Candidate Keys:</span>
              <div className="text-base font-bold text-[#8DFFCB]">
                {analysis.candidateKeys.map((k) => `(${k.join(', ')})`).join(', ')}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  analysis.is1NF ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' : 'bg-rose-950 text-rose-300 border-rose-500'
                }`}
              >
                1NF: {analysis.is1NF ? '✓ PASS' : '✗ FAIL'}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  analysis.is2NF ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' : 'bg-rose-950 text-rose-300 border-rose-500'
                }`}
              >
                2NF: {analysis.is2NF ? '✓ PASS' : '✗ FAIL'}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  analysis.is3NF ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' : 'bg-rose-950 text-rose-300 border-rose-500'
                }`}
              >
                3NF: {analysis.is3NF ? '✓ PASS' : '✗ FAIL'}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  analysis.isBCNF ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' : 'bg-amber-950 text-amber-300 border-amber-500'
                }`}
              >
                BCNF: {analysis.isBCNF ? '✓ PASS' : '✗ NOT IN BCNF'}
              </span>
            </div>
          </div>

          {/* Prime & Non-Prime Analysis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-[#071112] border border-[rgba(220,255,245,0.06)] space-y-1">
              <span className="text-[#8E9F9B] block text-[11px]">Prime Attributes (part of candidate key):</span>
              <span className="text-[#8DFFCB] font-bold">
                {`{ ${analysis.primeAttributes.join(', ') || 'none'} }`}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-[#071112] border border-[rgba(220,255,245,0.06)] space-y-1">
              <span className="text-[#8E9F9B] block text-[11px]">Non-Prime Attributes:</span>
              <span className="text-[#F1F5F0] font-bold">
                {`{ ${analysis.nonPrimeAttributes.join(', ') || 'none'} }`}
              </span>
            </div>
          </div>

          {/* Violations Diagnostics */}
          {(!analysis.is2NF || !analysis.is3NF || !analysis.isBCNF) && (
            <div className="space-y-3">
              <span className="text-rose-400 font-bold block flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Identified Normal Form Violations:</span>
              </span>

              {analysis.violations2NF.length > 0 && (
                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-200 space-y-1">
                  <div className="font-bold text-[11px]">2NF Partial Dependency Violations:</div>
                  {analysis.violations2NF.map((v, i) => (
                    <div key={i} className="text-[11px] opacity-90">• {v}</div>
                  ))}
                </div>
              )}

              {analysis.violations3NF.length > 0 && (
                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-200 space-y-1">
                  <div className="font-bold text-[11px]">3NF Transitive Dependency Violations:</div>
                  {analysis.violations3NF.map((v, i) => (
                    <div key={i} className="text-[11px] opacity-90">• {v}</div>
                  ))}
                </div>
              )}

              {analysis.violationsBCNF.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-200 space-y-1">
                  <div className="font-bold text-[11px]">BCNF Superkey Determinant Violations:</div>
                  {analysis.violationsBCNF.map((v, i) => (
                    <div key={i} className="text-[11px] opacity-90">• {v}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3NF Lossless Decomposition Result */}
          <div className="p-4 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.12)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[#8DFFCB] font-bold text-sm flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>3NF Lossless-Join & Dependency-Preserving Decomposition:</span>
              </span>
              <span className="text-[10px] text-[#8E9F9B]">Bernstein Synthesis</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {analysis.decomposed3NF.map((rel, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-[#0D1919] border border-[rgba(220,255,245,0.15)] space-y-2"
                >
                  <div className="flex items-center justify-between pb-1 border-b border-[rgba(220,255,245,0.06)]">
                    <span className="font-bold text-[#F1F5F0]">{rel.name}</span>
                    <span className="text-[10px] text-[#8DFFCB]">PK: ({rel.key.join(', ')})</span>
                  </div>
                  <div className="text-[11px] text-[#8E9F9B]">
                    Attributes: <strong className="text-[#F1F5F0]">{rel.attributes.join(', ')}</strong>
                  </div>
                  <div className="text-[10px] text-cyan-300">
                    FDs: {rel.fds.join('; ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BCNF Decomposition Result */}
          <div className="p-4 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.12)] space-y-3">
            <span className="text-[#D9FF72] font-bold text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>BCNF Decomposition:</span>
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysis.decomposedBCNF.map((rel, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-[#0D1919] border border-[rgba(220,255,245,0.15)] space-y-1.5"
                >
                  <div className="flex items-center justify-between pb-1 border-b border-[rgba(220,255,245,0.06)]">
                    <span className="font-bold text-[#F1F5F0]">{rel.name}</span>
                    <span className="text-[10px] text-[#D9FF72]">Key: ({rel.key.join(', ')})</span>
                  </div>
                  <div className="text-[11px] text-[#8E9F9B]">
                    Attributes: <strong className="text-[#F1F5F0]">{rel.attributes.join(', ')}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
