import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Sparkles, 
  AlertTriangle, 
  ArrowRight, 
  Copy, 
  Check, 
  GitBranch, 
  Info, 
  Layers, 
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { translateSQLToRA } from '../../lib/relationalAlgebra';
import type { RATranslationResult, RAOperatorNode } from '../../lib/relationalAlgebra';
import type { DatabaseWorkspace } from '../../services/workspaceService';

interface RelationalAlgebraWorkbenchProps {
  activeWorkspace: DatabaseWorkspace;
}

export const RelationalAlgebraWorkbench: React.FC<RelationalAlgebraWorkbenchProps> = ({
  activeWorkspace,
}) => {
  const sampleQueries = [
    {
      id: 'A',
      title: 'Query A: Selection & Projection (σ, π)',
      desc: 'Filters active subscriptions and projects subscriber and tier identifiers.',
      sql: `SELECT member_id, plan_id FROM subscriptions WHERE status = 'active';`,
    },
    {
      id: 'B',
      title: 'Query B: Natural/Equi-Join (⋈)',
      desc: 'Performs relational join between members and subscriptions relations.',
      sql: `SELECT m.full_name, s.status FROM members m JOIN subscriptions s ON m.id = s.member_id;`,
    },
    {
      id: 'C',
      title: 'Query C: Extended Aggregation (γ)',
      desc: 'Computes member counts grouped by membership tier.',
      sql: `SELECT plan_id, COUNT(*) FROM subscriptions GROUP BY plan_id;`,
    },
    {
      id: 'D',
      title: 'Query D: Window Analytical Function (Unsupported Diagnostic)',
      desc: 'Demonstrates honest mathematical boundary handling for non-algebraic window functions.',
      sql: `SELECT member_id, ROW_NUMBER() OVER (PARTITION BY plan_id ORDER BY current_period_end) as rank FROM subscriptions;`,
    },
  ];

  const [inputSQL, setInputSQL] = useState<string>(sampleQueries[0].sql);
  const [result, setResult] = useState<RATranslationResult>(translateSQLToRA(sampleQueries[0].sql));
  const [copiedClassical, setCopiedClassical] = useState(false);
  const [copiedExtended, setCopiedExtended] = useState(false);

  useEffect(() => {
    setResult(translateSQLToRA(inputSQL));
  }, [inputSQL]);

  const copyToClipboard = (text: string, type: 'classical' | 'extended') => {
    navigator.clipboard.writeText(text);
    if (type === 'classical') {
      setCopiedClassical(true);
      setTimeout(() => setCopiedClassical(false), 2000);
    } else {
      setCopiedExtended(true);
      setTimeout(() => setCopiedExtended(false), 2000);
    }
  };

  // Render Operator Tree recursively
  const renderOperatorTree = (node: RAOperatorNode, depth = 0) => {
    const isRoot = depth === 0;
    const isRelation = node.operator === 'RELATION';
    const isError = node.operator === 'UNSUPPORTED' || node.operator === 'ERROR';

    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* Node Box */}
        <div
          className={`px-4 py-2.5 rounded-xl border flex flex-col items-center text-center transition-all shadow-md min-w-[180px] max-w-[280px] ${
            isError
              ? 'bg-red-950/60 border-red-500/60 text-red-200'
              : isRelation
              ? 'bg-[#122424] border-[#8DFFCB]/60 text-[#8DFFCB]'
              : 'bg-[#0D1919] border-[rgba(220,255,245,0.2)] text-[#F1F5F0]'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold font-mono text-[#8DFFCB]">{node.symbol}</span>
            <span className="text-xs uppercase font-mono font-bold tracking-wider">{node.operator}</span>
          </div>
          {node.parameters && (
            <div className="text-[11px] font-mono text-[#8E9F9B] break-words max-w-[250px] bg-[#071112] px-2 py-0.5 rounded border border-[rgba(220,255,245,0.08)]">
              {node.parameters}
            </div>
          )}
          <div className="text-[10px] text-[#8E9F9B] mt-1">{node.description}</div>
        </div>

        {/* Tree Edges and Children */}
        {node.children && node.children.length > 0 && (
          <div className="flex flex-col items-center w-full">
            {/* Vertical connector down */}
            <div className="w-0.5 h-6 bg-[#8DFFCB]/40 my-1" />

            {/* Horizontal branch bar if multiple children */}
            {node.children.length > 1 && (
              <div
                className="h-0.5 bg-[#8DFFCB]/40 mb-3"
                style={{ width: `${Math.min(100, node.children.length * 45)}%` }}
              />
            )}

            {/* Children container */}
            <div className="flex flex-wrap items-start justify-center gap-6">
              {node.children.map((child) => renderOperatorTree(child, depth + 1))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Educational Banner */}
      <div className="p-6 rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-[#8DFFCB]/10 text-[#8DFFCB] border border-[#8DFFCB]/30 font-semibold">
                Relational Algebra Engine
              </span>
              <span className="text-xs font-mono text-[#8E9F9B]">Codd 1970 • Query Optimization</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#F1F5F0]">
              SQL → Relational Algebra Translator & Operator Tree
            </h2>
            <p className="text-xs text-[#8E9F9B] max-w-2xl">
              Deconstruct declarative SQL statements into formal mathematical operators: Selection ($\sigma$),
              Projection ($\pi$), Join ($\bowtie$), Cartesian Product ($\times$), and Grouping ($\gamma$).
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.1)] text-xs font-mono text-[#8E9F9B] shrink-0">
            <Layers className="w-4 h-4 text-[#8DFFCB]" />
            <span>Workspace: <strong className="text-[#F1F5F0]">{activeWorkspace.name}</strong></span>
          </div>
        </div>
      </div>

      {/* Preset Queries Bar */}
      <div className="space-y-2">
        <div className="text-xs font-mono uppercase tracking-wider text-[#8E9F9B]">
          Canonical Test Queries
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {sampleQueries.map((q) => {
            const isSelected = inputSQL.trim() === q.sql.trim();
            const isUnsupported = q.id === 'D';

            return (
              <button
                key={q.id}
                onClick={() => setInputSQL(q.sql)}
                className={`text-left p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-[#122424] border-[#8DFFCB] shadow-[0_0_15px_rgba(141,255,203,0.12)]'
                    : isUnsupported
                    ? 'bg-[#181111] border-red-500/30 hover:border-red-500/60'
                    : 'bg-[#0D1919] border-[rgba(220,255,245,0.1)] hover:border-[#8DFFCB]/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-xs font-bold ${
                      isUnsupported ? 'text-red-400' : 'text-[#8DFFCB]'
                    }`}
                  >
                    {q.title.split(':')[0]}
                  </span>
                  {isUnsupported && (
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-red-950 border border-red-500/40 text-red-300">
                      Diagnostic
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold text-[#F1F5F0] mt-1 line-clamp-1">
                  {q.title.split(':')[1]}
                </div>
                <p className="text-[11px] text-[#8E9F9B] mt-1 line-clamp-2 leading-relaxed">
                  {q.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* SQL Input Area */}
      <div className="rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] overflow-hidden shadow-xl">
        <div className="px-5 py-3 border-b border-[rgba(220,255,245,0.1)] bg-[#071112] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#8DFFCB]" />
            <span className="font-mono text-xs font-semibold text-[#F1F5F0]">SQL Input Query</span>
          </div>
          <span className="text-[11px] font-mono text-[#8E9F9B]">Live parsing AST & Derivation</span>
        </div>

        <textarea
          rows={4}
          value={inputSQL}
          onChange={(e) => setInputSQL(e.target.value)}
          placeholder="Enter a SQL SELECT statement to compute its relational algebra equivalent..."
          className="w-full p-4 bg-[#081213] text-[#F1F5F0] font-mono text-xs sm:text-sm leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-[#8DFFCB]/40"
          spellCheck={false}
        />
      </div>

      {/* Output Results: Classical RA & Extended RA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Classical RA */}
        <div className="rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] p-5 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-[#8DFFCB]">σ, π, ⋈</span>
              <h3 className="font-bold text-sm text-[#F1F5F0]">Classical Relational Algebra</h3>
            </div>
            <button
              onClick={() => copyToClipboard(result.classicalRA, 'classical')}
              className="px-2.5 py-1 rounded bg-[#122222] border border-[rgba(220,255,245,0.1)] text-[11px] font-mono text-[#8E9F9B] hover:text-[#8DFFCB] transition-colors flex items-center gap-1"
            >
              {copiedClassical ? <Check className="w-3 h-3 text-[#8DFFCB]" /> : <Copy className="w-3 h-3" />}
              <span>{copiedClassical ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <p className="text-[11px] text-[#8E9F9B]">
            Strict Codd (1970) relational algebra using only mathematical set operators.
          </p>

          <div className="p-4 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.1)] font-mono text-sm sm:text-base text-[#8DFFCB] overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {result.classicalRA}
          </div>
        </div>

        {/* Extended RA */}
        <div className="rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] p-5 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-cyan-400">γ, ⟕</span>
              <h3 className="font-bold text-sm text-[#F1F5F0]">Extended Relational Algebra</h3>
            </div>
            <button
              onClick={() => copyToClipboard(result.extendedRA, 'extended')}
              className="px-2.5 py-1 rounded bg-[#122222] border border-[rgba(220,255,245,0.1)] text-[11px] font-mono text-[#8E9F9B] hover:text-[#8DFFCB] transition-colors flex items-center gap-1"
            >
              {copiedExtended ? <Check className="w-3 h-3 text-[#8DFFCB]" /> : <Copy className="w-3 h-3" />}
              <span>{copiedExtended ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <p className="text-[11px] text-[#8E9F9B]">
            Includes grouping ($\gamma$), aggregation operators, and bag semantics.
          </p>

          <div className="p-4 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.1)] font-mono text-sm sm:text-base text-cyan-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {result.extendedRA}
          </div>
        </div>
      </div>

      {/* Diagnostics / Unsupported Warning Callout */}
      {!result.isSupported && (
        <div className="p-6 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-200 space-y-3 shadow-xl">
          <div className="flex items-center gap-2.5 text-red-300 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span>Honest Formal Diagnostic: Construct Outside Classical Relational Algebra</span>
          </div>
          <p className="text-xs leading-relaxed text-red-200">
            {result.unsupportedReason}
          </p>
          {result.closestPartialRA && (
            <div className="mt-2 p-3 rounded-xl bg-[#071112] border border-red-500/30 text-xs font-mono text-[#8E9F9B]">
              <span className="text-red-300 font-bold block mb-1">Closest Partial Approximation:</span>
              <code className="text-[#8DFFCB]">{result.closestPartialRA}</code>
            </div>
          )}
        </div>
      )}

      {/* Step-by-Step Algebraic Derivation */}
      <div className="rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#8DFFCB]" />
          <h3 className="font-bold text-sm text-[#F1F5F0]">Step-by-Step Algebraic Derivation</h3>
        </div>

        <div className="space-y-2.5">
          {result.derivationSteps.map((step, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.08)] text-xs font-mono text-[#8E9F9B]"
            >
              <span className="w-5 h-5 rounded bg-[#8DFFCB]/10 text-[#8DFFCB] flex items-center justify-center font-bold shrink-0 text-[10px]">
                {idx + 1}
              </span>
              <span className="leading-relaxed text-[#F1F5F0]">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Operator Tree Visualization */}
      <div className="rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[#8DFFCB]" />
            <h3 className="font-bold text-sm text-[#F1F5F0]">Relational Operator Execution Tree</h3>
          </div>
          <span className="text-[11px] font-mono text-[#8E9F9B]">Bottom-up relation evaluation</span>
        </div>

        <p className="text-xs text-[#8E9F9B]">
          Relational query plans evaluate leaf base relations first, applying selection and join predicates
          before projecting target attributes at the root.
        </p>

        <div className="p-8 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.1)] flex justify-center overflow-x-auto min-h-[220px]">
          {renderOperatorTree(result.operatorTree)}
        </div>
      </div>
    </div>
  );
};
