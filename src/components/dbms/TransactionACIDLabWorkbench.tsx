import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Play, 
  RotateCcw, 
  Lock, 
  GitBranch, 
  GitCommit, 
  Layers, 
  ArrowRight, 
  Clock, 
  Sparkles, 
  AlertCircle,
  FileCode,
  Check,
  Zap,
  HelpCircle
} from 'lucide-react';
import type { DatabaseWorkspace } from '../../services/workspaceService';
import { ACIDSimulator } from './ACIDSimulator';

interface TransactionACIDLabWorkbenchProps {
  activeWorkspace: DatabaseWorkspace;
}

// Anomaly Scenarios
interface AnomalyScenario {
  id: string;
  name: string;
  code: string;
  description: string;
  isolationRequired: string;
  steps: Array<{
    tx: 'T1' | 'T2';
    op: string;
    description: string;
    locksAcquired?: string;
    readCommittedResult: string;
    serializableResult: string;
  }>;
}

const ANOMALY_SCENARIOS: AnomalyScenario[] = [
  {
    id: 'lost_update',
    name: 'Lost Update (Blind / Concurrent Overwrite)',
    code: 'G_lost',
    description: 'Two concurrent transactions read the same member balance, decrement it locally, and write back. Under Read Committed without SELECT FOR UPDATE, one update silently overwrites the other.',
    isolationRequired: 'Repeatable Read or SELECT FOR UPDATE',
    steps: [
      {
        tx: 'T1',
        op: 'SELECT balance FROM accounts WHERE id = 1; -- (Reads ₹1000)',
        description: 'T1 reads account balance ₹1000 into local memory.',
        locksAcquired: 'Shared Read Lock (Released immediately in Read Committed)',
        readCommittedResult: 'Memory = ₹1000',
        serializableResult: 'Snapshot = ₹1000',
      },
      {
        tx: 'T2',
        op: 'SELECT balance FROM accounts WHERE id = 1; -- (Reads ₹1000)',
        description: 'T2 reads same account balance ₹1000 concurrently.',
        locksAcquired: 'Shared Read Lock',
        readCommittedResult: 'Memory = ₹1000',
        serializableResult: 'Snapshot = ₹1000',
      },
      {
        tx: 'T1',
        op: 'UPDATE accounts SET balance = 1000 - 200 WHERE id = 1; COMMIT;',
        description: 'T1 deducts ₹200 and commits balance ₹800.',
        locksAcquired: 'Exclusive Write Lock (Committed)',
        readCommittedResult: 'Committed DB balance = ₹800',
        serializableResult: 'Committed DB balance = ₹800',
      },
      {
        tx: 'T2',
        op: 'UPDATE accounts SET balance = 1000 - 300 WHERE id = 1; COMMIT;',
        description: 'T2 deducts ₹300 based on its stale ₹1000 read and commits balance ₹700.',
        locksAcquired: 'Exclusive Write Lock',
        readCommittedResult: 'ANOMALY OCCURRED: Balance is now ₹700 instead of ₹500! T1\'s ₹200 deduction was completely LOST.',
        serializableResult: 'SERIALIZATION FAILURE (Error 40001): T2 is aborted and rolled back. Zero data lost!',
      },
    ],
  },
  {
    id: 'dirty_read',
    name: 'Dirty Read (Uncommitted Dependency)',
    code: 'G_1',
    description: 'T2 reads an intermediate modified value written by T1 before T1 aborts/rolls back.',
    isolationRequired: 'Read Committed (Standard in PostgreSQL)',
    steps: [
      {
        tx: 'T1',
        op: 'UPDATE subscriptions SET status = \'active\' WHERE id = 42;',
        description: 'T1 writes uncommitted change to disk buffer.',
        locksAcquired: 'Row Exclusive Lock',
        readCommittedResult: 'Uncommitted in T1 private buffer',
        serializableResult: 'Uncommitted in T1 private buffer',
      },
      {
        tx: 'T2',
        op: 'SELECT status FROM subscriptions WHERE id = 42;',
        description: 'T2 queries the subscription status.',
        locksAcquired: 'None (MVCC Snapshot)',
        readCommittedResult: 'PostgreSQL MVCC reads older committed status \'trialing\'. (Dirty read PREVENTED)',
        serializableResult: 'Reads consistent snapshot status \'trialing\'.',
      },
      {
        tx: 'T1',
        op: 'ROLLBACK;',
        description: 'T1 encounters error and rolls back.',
        locksAcquired: 'Locks Released',
        readCommittedResult: 'No dirty data leaked.',
        serializableResult: 'Integrity 100% clean.',
      },
    ],
  },
  {
    id: 'non_repeatable_read',
    name: 'Non-Repeatable / Fuzzy Read',
    code: 'G_fuzzy',
    description: 'T1 reads a row, T2 updates and commits that row, and T1 re-reads the row obtaining a different value in the same transaction.',
    isolationRequired: 'Repeatable Read',
    steps: [
      {
        tx: 'T1',
        op: 'SELECT price_at_signup FROM subscriptions WHERE id = 10; -- (₹999)',
        description: 'T1 reads price = ₹999.',
        readCommittedResult: '₹999',
        serializableResult: '₹999',
      },
      {
        tx: 'T2',
        op: 'UPDATE subscriptions SET price_at_signup = 1499 WHERE id = 10; COMMIT;',
        description: 'T2 modifies price to ₹1499 and commits.',
        readCommittedResult: 'Committed to DB',
        serializableResult: 'Committed to DB',
      },
      {
        tx: 'T1',
        op: 'SELECT price_at_signup FROM subscriptions WHERE id = 10;',
        description: 'T1 re-reads the same row.',
        readCommittedResult: 'ANOMALY: Value changed to ₹1499 within T1\'s transaction boundary!',
        serializableResult: 'PRESERVED: T1 continues to read ₹999 from transaction start snapshot.',
      },
    ],
  },
  {
    id: 'phantom_read',
    name: 'Phantom Read (Predicate Injection)',
    code: 'A_3',
    description: 'T1 searches for rows matching a predicate (e.g. status = \'active\'). T2 inserts a new row satisfying the predicate and commits. T1 re-executes and sees a phantom row.',
    isolationRequired: 'Repeatable Read (in PostgreSQL MVCC) or Serializable',
    steps: [
      {
        tx: 'T1',
        op: 'SELECT COUNT(*) FROM members WHERE role = \'operator\'; -- (Count: 3)',
        description: 'T1 evaluates predicate range.',
        readCommittedResult: '3 operators',
        serializableResult: '3 operators',
      },
      {
        tx: 'T2',
        op: 'INSERT INTO members (full_name, role) VALUES (\'David\', \'operator\'); COMMIT;',
        description: 'T2 inserts a 4th operator and commits.',
        readCommittedResult: 'Committed to DB',
        serializableResult: 'Committed to DB',
      },
      {
        tx: 'T1',
        op: 'SELECT COUNT(*) FROM members WHERE role = \'operator\';',
        description: 'T1 re-evaluates predicate range.',
        readCommittedResult: 'ANOMALY: Count is now 4! Phantom row David materialized.',
        serializableResult: 'PRESERVED: Count remains 3 using SSI / MVCC snapshot.',
      },
    ],
  },
  {
    id: 'write_skew',
    name: 'Write Skew (Cross-Row Constraint Violation)',
    code: 'A_5B',
    description: 'Each transaction reads two rows (A and B where A + B >= 0), updates one row based on the read, but concurrent execution leaves the global invariant violated.',
    isolationRequired: 'Serializable (SSI - Serializable Snapshot Isolation)',
    steps: [
      {
        tx: 'T1',
        op: 'SELECT bal_a, bal_b FROM reserves; -- (bal_a=100, bal_b=100, Total=200)',
        description: 'T1 checks invariant: total reserves must remain >= 0.',
        readCommittedResult: 'Valid: Total 200',
        serializableResult: 'Valid: Total 200',
      },
      {
        tx: 'T2',
        op: 'SELECT bal_a, bal_b FROM reserves; -- (bal_a=100, bal_b=100, Total=200)',
        description: 'T2 checks same invariant concurrently.',
        readCommittedResult: 'Valid: Total 200',
        serializableResult: 'Valid: Total 200',
      },
      {
        tx: 'T1',
        op: 'UPDATE reserves SET bal_a = bal_a - 150; COMMIT;',
        description: 'T1 withdraws 150 from A (remaining total: 50).',
        readCommittedResult: 'Committed',
        serializableResult: 'Committed',
      },
      {
        tx: 'T2',
        op: 'UPDATE reserves SET bal_b = bal_b - 150; COMMIT;',
        description: 'T2 withdraws 150 from B concurrently.',
        readCommittedResult: 'ANOMALY: Global invariant violated! bal_a=-50, bal_b=-50 (Total=-100 < 0)!',
        serializableResult: 'SI READ/WRITE CONFLICT DETECTED: T2 aborted with serialization_failure.',
      },
    ],
  },
];

export const TransactionACIDLabWorkbench: React.FC<TransactionACIDLabWorkbenchProps> = ({
  activeWorkspace,
}) => {
  const [activeTab, setActiveTab] = useState<'stepper' | 'serializability' | 'deadlock' | 'reviewer' | 'simulator'>('stepper');

  // Stepper state
  const [selectedScenario, setSelectedScenario] = useState<AnomalyScenario>(ANOMALY_SCENARIOS[0]);
  const [stepperIndex, setStepperIndex] = useState<number>(0);
  const [selectedIsolation, setSelectedIsolation] = useState<'read_committed' | 'serializable'>('read_committed');

  // Precedence Graph Serializability state
  const [scheduleInput, setScheduleInput] = useState<string>('r1(A), w1(A), r2(A), w2(A)');
  const [precedenceResult, setPrecedenceResult] = useState<{
    nodes: string[];
    edges: Array<{ from: string; to: string; reason: string }>;
    isSerializable: boolean;
    cycle?: string[];
    serialOrders?: string[];
  }>({
    nodes: ['T1', 'T2'],
    edges: [{ from: 'T1', to: 'T2', reason: 'w1(A) -> r2(A)' }],
    isSerializable: true,
    serialOrders: ['T1 -> T2'],
  });

  // Reviewer state
  const [reviewSQL, setReviewSQL] = useState<string>(
    `BEGIN;\nSELECT balance FROM accounts WHERE member_id = 42;\n-- Application logic: if balance >= 500 then ...\nUPDATE accounts SET balance = balance - 500 WHERE member_id = 42;\nINSERT INTO audit_logs (member_id, amount) VALUES (42, -500);\nCOMMIT;`
  );

  // Compute Conflict Serializability from Schedule String
  const computeConflictSerializability = () => {
    // Parser for operations: r1(A), w2(B), etc.
    const ops = scheduleInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const parsedOps: Array<{ tx: string; type: 'r' | 'w'; dataItem: string }> = [];
    const txSet = new Set<string>();

    for (const op of ops) {
      const match = op.match(/([rw])(\d+)\(([a-zA-Z0-9_]+)\)/i);
      if (match) {
        const type = match[1].toLowerCase() as 'r' | 'w';
        const tx = `T${match[2]}`;
        const dataItem = match[3].toUpperCase();
        parsedOps.push({ tx, type, dataItem });
        txSet.add(tx);
      }
    }

    const nodes = Array.from(txSet).sort();
    const edges: Array<{ from: string; to: string; reason: string }> = [];
    const edgeKeySet = new Set<string>();

    // Find all conflict pairs (op_i before op_j on same dataItem with at least one write, and tx_i != tx_j)
    for (let i = 0; i < parsedOps.length; i++) {
      for (let j = i + 1; j < parsedOps.length; j++) {
        const op1 = parsedOps[i];
        const op2 = parsedOps[j];

        if (op1.tx !== op2.tx && op1.dataItem === op2.dataItem) {
          if (op1.type === 'w' || op2.type === 'w') {
            const key = `${op1.tx}->${op2.tx}:${op1.dataItem}`;
            if (!edgeKeySet.has(key)) {
              edgeKeySet.add(key);
              edges.push({
                from: op1.tx,
                to: op2.tx,
                reason: `${op1.type}${op1.tx.replace('T', '')}(${op1.dataItem}) conflicts with ${op2.type}${op2.tx.replace('T', '')}(${op2.dataItem})`,
              });
            }
          }
        }
      }
    }

    // Cycle detection using DFS
    const adj: Record<string, string[]> = {};
    nodes.forEach((n) => (adj[n] = []));
    edges.forEach((e) => adj[e.from].push(e.to));

    let hasCycle = false;
    let cyclePath: string[] = [];
    const visited: Record<string, number> = {}; // 0 = unvisited, 1 = visiting, 2 = visited

    const dfs = (curr: string, path: string[]): boolean => {
      visited[curr] = 1;
      path.push(curr);

      for (const next of adj[curr] || []) {
        if (visited[next] === 1) {
          // cycle found
          const cycleStart = path.indexOf(next);
          cyclePath = path.slice(cycleStart).concat([next]);
          return true;
        }
        if (!visited[next] && dfs(next, path)) {
          return true;
        }
      }

      visited[curr] = 2;
      path.pop();
      return false;
    };

    for (const node of nodes) {
      if (!visited[node]) {
        if (dfs(node, [])) {
          hasCycle = true;
          break;
        }
      }
    }

    // Topological sort for equivalent serial orders if acyclic
    let serialOrders: string[] | undefined;
    if (!hasCycle && nodes.length > 0) {
      // Basic topological sort
      const inDegree: Record<string, number> = {};
      nodes.forEach((n) => (inDegree[n] = 0));
      edges.forEach((e) => inDegree[e.to]++);

      const queue = nodes.filter((n) => inDegree[n] === 0);
      const order: string[] = [];

      while (queue.length > 0) {
        const u = queue.shift()!;
        order.push(u);
        for (const v of adj[u] || []) {
          inDegree[v]--;
          if (inDegree[v] === 0) queue.push(v);
        }
      }

      if (order.length === nodes.length) {
        serialOrders = [order.join(' → ')];
      }
    }

    setPrecedenceResult({
      nodes,
      edges,
      isSerializable: !hasCycle,
      cycle: hasCycle ? cyclePath : undefined,
      serialOrders,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#8DFFCB]/10 text-[#8DFFCB] border border-[#8DFFCB]/30 font-semibold">
                Concurrency & Isolation Engine
              </span>
              <span className="text-xs font-mono text-[#8E9F9B]">ANSI SQL-92 • MVCC & SSI</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#F1F5F0]">
              Transaction & ACID Engineering Lab
            </h2>
            <p className="text-xs text-[#8E9F9B] max-w-2xl mt-1">
              Interactive experimental lab to test interleaving anomalies, conflict serializability graphs,
              deadlock cycles, and static transaction vulnerability analysis.
            </p>
          </div>

          <div className="flex rounded-xl bg-[#071112] p-1 border border-[rgba(220,255,245,0.1)] shrink-0">
            {[
              { id: 'stepper', label: 'Schedule Stepper' },
              { id: 'serializability', label: 'Precedence Graph' },
              { id: 'deadlock', label: 'Deadlocks' },
              { id: 'reviewer', label: 'Review SQL' },
              { id: 'simulator', label: 'ACID Simulator' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#122424] text-[#8DFFCB] shadow-sm'
                    : 'text-[#8E9F9B] hover:text-[#F1F5F0]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 1. TWO-TRANSACTION INTERLEAVED STEPPER */}
      {activeTab === 'stepper' && (
        <div className="space-y-6">
          {/* Scenario Selector & Isolation Toggle */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-8 flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-[#8E9F9B] mr-2">Anomaly Scenario:</span>
              {ANOMALY_SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedScenario(s);
                    setStepperIndex(0);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all border ${
                    selectedScenario.id === s.id
                      ? 'bg-[#122424] border-[#8DFFCB] text-[#8DFFCB] font-bold shadow-[0_0_12px_rgba(141,255,203,0.15)]'
                      : 'bg-[#0D1919] border-[rgba(220,255,245,0.1)] text-[#8E9F9B] hover:text-[#F1F5F0]'
                  }`}
                >
                  {s.name.split(' (')[0]}
                </button>
              ))}
            </div>

            <div className="md:col-span-4 flex items-center justify-end gap-2">
              <span className="text-xs font-mono text-[#8E9F9B]">Isolation:</span>
              <div className="flex rounded-xl bg-[#071112] p-1 border border-[rgba(220,255,245,0.1)]">
                <button
                  onClick={() => setSelectedIsolation('read_committed')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono ${
                    selectedIsolation === 'read_committed'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-[#8E9F9B]'
                  }`}
                >
                  Read Committed
                </button>
                <button
                  onClick={() => setSelectedIsolation('serializable')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono ${
                    selectedIsolation === 'serializable'
                      ? 'bg-[#8DFFCB]/20 text-[#8DFFCB] border border-[#8DFFCB]/30'
                      : 'text-[#8E9F9B]'
                  }`}
                >
                  Serializable (SSI)
                </button>
              </div>
            </div>
          </div>

          {/* Scenario Info Card */}
          <div className="p-4 rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.1)] flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#8DFFCB] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-mono font-bold text-[#F1F5F0]">
                {selectedScenario.name} • Standard Notation: {selectedScenario.code}
              </div>
              <p className="text-xs text-[#8E9F9B] mt-0.5">{selectedScenario.description}</p>
              <div className="text-[11px] font-mono text-[#8DFFCB] mt-1">
                Remedy / Required Level: <strong>{selectedScenario.isolationRequired}</strong>
              </div>
            </div>
          </div>

          {/* Side-by-Side Consoles: T1 and T2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* T1 Console */}
            <div className="rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] p-5 space-y-3 shadow-lg">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(220,255,245,0.08)]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#8DFFCB]/10 text-[#8DFFCB] font-mono font-bold text-xs flex items-center justify-center">
                    T1
                  </div>
                  <h3 className="font-bold text-sm text-[#F1F5F0]">Transaction 1 (Debit/Transfer)</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#071112] text-[#8E9F9B]">
                  PID: 88412
                </span>
              </div>

              <div className="space-y-2">
                {selectedScenario.steps.map((step, idx) => {
                  const isCurrent = stepperIndex === idx;
                  const isPast = stepperIndex > idx;
                  if (step.tx !== 'T1') return null;

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs font-mono transition-all ${
                        isCurrent
                          ? 'bg-[#122424] border-[#8DFFCB] shadow-[0_0_15px_rgba(141,255,203,0.15)] text-[#F1F5F0]'
                          : isPast
                          ? 'bg-[#071112] border-[rgba(220,255,245,0.06)] text-[#8E9F9B] opacity-80'
                          : 'bg-[#071112]/40 border-transparent text-[#8E9F9B]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-[#8DFFCB] font-bold">Step {idx + 1}</span>
                        {isCurrent && <span className="text-amber-400 animate-pulse">ACTIVE STEP</span>}
                        {isPast && <span className="text-emerald-400">EXECUTED</span>}
                      </div>
                      <code className="text-[#F1F5F0] block font-semibold">{step.op}</code>
                      <div className="text-[11px] text-[#8E9F9B] mt-1">{step.description}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* T2 Console */}
            <div className="rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] p-5 space-y-3 shadow-lg">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(220,255,245,0.08)]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-cyan-500/10 text-cyan-300 font-mono font-bold text-xs flex items-center justify-center">
                    T2
                  </div>
                  <h3 className="font-bold text-sm text-[#F1F5F0]">Transaction 2 (Concurrent Client)</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#071112] text-[#8E9F9B]">
                  PID: 88419
                </span>
              </div>

              <div className="space-y-2">
                {selectedScenario.steps.map((step, idx) => {
                  const isCurrent = stepperIndex === idx;
                  const isPast = stepperIndex > idx;
                  if (step.tx !== 'T2') return null;

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs font-mono transition-all ${
                        isCurrent
                          ? 'bg-[#122424] border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.15)] text-[#F1F5F0]'
                          : isPast
                          ? 'bg-[#071112] border-[rgba(220,255,245,0.06)] text-[#8E9F9B] opacity-80'
                          : 'bg-[#071112]/40 border-transparent text-[#8E9F9B]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-cyan-300 font-bold">Step {idx + 1}</span>
                        {isCurrent && <span className="text-amber-400 animate-pulse">ACTIVE STEP</span>}
                        {isPast && <span className="text-emerald-400">EXECUTED</span>}
                      </div>
                      <code className="text-[#F1F5F0] block font-semibold">{step.op}</code>
                      <div className="text-[11px] text-[#8E9F9B] mt-1">{step.description}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Stepper Controls & Current Step Analysis */}
          <div className="p-5 rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStepperIndex((prev) => Math.max(0, prev - 1))}
                  disabled={stepperIndex === 0}
                  className="px-3 py-1.5 rounded-lg bg-[#122222] text-xs font-mono text-[#8E9F9B] hover:text-[#F1F5F0] disabled:opacity-40"
                >
                  Previous Step
                </button>
                <button
                  onClick={() =>
                    setStepperIndex((prev) => Math.min(selectedScenario.steps.length - 1, prev + 1))
                  }
                  disabled={stepperIndex === selectedScenario.steps.length - 1}
                  className="px-4 py-1.5 rounded-lg bg-[#8DFFCB] text-[#071112] text-xs font-mono font-bold hover:bg-[#A6FFD8] disabled:opacity-40"
                >
                  Step Next Operation →
                </button>
                <button
                  onClick={() => setStepperIndex(0)}
                  className="p-1.5 rounded-lg bg-[#122222] text-[#8E9F9B] hover:text-[#8DFFCB]"
                  title="Reset Stepper"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs font-mono text-[#8E9F9B]">
                Step {stepperIndex + 1} of {selectedScenario.steps.length}
              </div>
            </div>

            {/* Live Isolation Evaluation */}
            <div className="p-4 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.1)] space-y-2">
              <div className="text-xs font-mono font-bold text-[#8DFFCB] flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>
                  Result under active isolation level: ({selectedIsolation === 'read_committed' ? 'Read Committed' : 'Serializable SSI'})
                </span>
              </div>
              <div className="text-xs font-mono text-[#F1F5F0] whitespace-pre-wrap leading-relaxed">
                {selectedIsolation === 'read_committed'
                  ? selectedScenario.steps[stepperIndex].readCommittedResult
                  : selectedScenario.steps[stepperIndex].serializableResult}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. CONFLICT SERIALIZABILITY & PRECEDENCE GRAPH */}
      {activeTab === 'serializability' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] space-y-4 shadow-xl">
            <div>
              <h3 className="text-base font-bold text-[#F1F5F0]">Conflict Serializability & Precedence Graph</h3>
              <p className="text-xs text-[#8E9F9B] mt-1">
                Enter an interleaved schedule string in standard notation (e.g. <code className="text-[#8DFFCB]">r1(A), w1(A), r2(A), w2(A)</code>).
                The engine evaluates pairwise conflicts ($r_i(X) \to w_j(X)$, $w_i(X) \to r_j(X)$, $w_i(X) \to w_j(X)$ for $i \ne j$),
                draws the directed precedence graph, and runs cycle detection.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={scheduleInput}
                onChange={(e) => setScheduleInput(e.target.value)}
                placeholder="r1(A), w1(A), r2(A), w2(A)"
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.2)] text-xs sm:text-sm font-mono text-[#F1F5F0] focus:outline-none focus:border-[#8DFFCB]"
              />
              <button
                onClick={computeConflictSerializability}
                className="px-6 py-2.5 rounded-xl bg-[#8DFFCB] text-[#071112] text-xs font-mono font-bold hover:bg-[#A6FFD8] transition-colors"
              >
                Compute Graph
              </button>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-mono text-[#8E9F9B]">Presets:</span>
              {[
                { label: 'Serializable: r1(A), w1(A), r2(A), w2(A)', val: 'r1(A), w1(A), r2(A), w2(A)' },
                { label: 'Cyclic (Non-Serializable): r1(A), w2(A), w1(A), r2(A)', val: 'r1(A), w2(A), w1(A), r2(A)' },
                { label: '3-Tx Cycle: r1(A), w2(A), r2(B), w3(B), r3(C), w1(C)', val: 'r1(A), w2(A), r2(B), w3(B), r3(C), w1(C)' },
              ].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setScheduleInput(p.val);
                    setTimeout(computeConflictSerializability, 50);
                  }}
                  className="px-2.5 py-1 rounded bg-[#071112] border border-[rgba(220,255,245,0.1)] text-[10px] font-mono text-[#8E9F9B] hover:text-[#8DFFCB]"
                >
                  {p.label.split(':')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Graph & Result Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visual Precedence Graph */}
            <div className="p-6 rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] space-y-4">
              <div className="text-xs font-mono uppercase tracking-wider text-[#8DFFCB]">
                Directed Precedence Graph (Serialized Dependency)
              </div>

              <div className="p-8 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.1)] flex flex-wrap items-center justify-center gap-8 min-h-[160px]">
                {precedenceResult.nodes.map((node) => {
                  const isInCycle = precedenceResult.cycle?.includes(node);
                  return (
                    <div
                      key={node}
                      className={`w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center font-mono font-bold text-base shadow-lg ${
                        isInCycle
                          ? 'bg-red-950/60 border-red-500 text-red-200 animate-pulse'
                          : 'bg-[#122424] border-[#8DFFCB] text-[#8DFFCB]'
                      }`}
                    >
                      <span>{node}</span>
                      <span className="text-[9px] opacity-70">Tx</span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-mono font-bold text-[#F1F5F0]">Conflicting Edges:</div>
                {precedenceResult.edges.length === 0 ? (
                  <div className="text-xs text-[#8E9F9B] italic">No conflicting operations discovered.</div>
                ) : (
                  precedenceResult.edges.map((e, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-[#071112] text-xs font-mono text-[#8E9F9B] flex items-center justify-between"
                    >
                      <span className="text-[#8DFFCB] font-bold">
                        {e.from} → {e.to}
                      </span>
                      <span className="text-[11px]">{e.reason}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Serializability Verdict */}
            <div className="p-6 rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="text-xs font-mono uppercase tracking-wider text-[#8DFFCB]">
                  Mathematical Serializability Verdict
                </div>

                {precedenceResult.isSerializable ? (
                  <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>CONFLICT SERIALIZABLE (Acyclic Graph)</span>
                    </div>
                    <p className="text-xs leading-relaxed text-emerald-200">
                      The precedence graph contains no directed cycles. Therefore, this schedule is guaranteed to produce
                      identical database state to a strictly serial execution order.
                    </p>
                    {precedenceResult.serialOrders && (
                      <div className="pt-2 text-xs font-mono">
                        <span className="text-[#8E9F9B] block">Equivalent Serial Execution:</span>
                        <span className="text-white font-bold text-sm">
                          {precedenceResult.serialOrders[0]}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-red-300">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <span>NOT SERIALIZABLE (Cycle Detected)</span>
                    </div>
                    <p className="text-xs leading-relaxed text-red-200">
                      A directed cycle exists in the precedence graph. This schedule cannot be serialized and violates
                      conflict serializability, allowing concurrent anomalies without strict concurrency control.
                    </p>
                    {precedenceResult.cycle && (
                      <div className="pt-2 text-xs font-mono">
                        <span className="text-red-300 block">Cycle Path:</span>
                        <span className="text-white font-bold">{precedenceResult.cycle.join(' → ')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.08)] text-xs text-[#8E9F9B] space-y-1">
                <div className="font-bold text-[#F1F5F0]">Codd & Bernstein Serializability Theorem:</div>
                <p className="text-[11px] leading-relaxed">
                  A schedule S is conflict serializable if and only if its serialization precedence graph P(S) is an acyclic directed graph (DAG).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. DEADLOCKS & WAIT-FOR GRAPH */}
      {activeTab === 'deadlock' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] space-y-3">
            <h3 className="text-base font-bold text-[#F1F5F0]">Deadlocks & Wait-For Graph (WFG)</h3>
            <p className="text-xs text-[#8E9F9B]">
              A deadlock occurs when two or more transactions are in a simultaneous circular wait state, each holding
              exclusive locks that the other requires to proceed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] space-y-4">
              <div className="text-xs font-mono uppercase tracking-wider text-[#8DFFCB]">
                Wait-For Graph Cycle
              </div>

              <div className="p-8 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.1)] flex items-center justify-around min-h-[180px]">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-950/60 border border-amber-500/60 flex flex-col items-center justify-center font-mono font-bold text-amber-300">
                    <span>T1</span>
                    <span className="text-[9px]">Holds: A</span>
                  </div>
                </div>

                <div className="flex flex-col items-center text-xs font-mono text-red-400 space-y-2">
                  <div className="flex items-center gap-1">
                    <span>Waits for B</span>
                    <ArrowRight className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="rotate-180">
                      <ArrowRight className="w-4 h-4 text-red-400" />
                    </span>
                    <span>Waits for A</span>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-950/60 border border-amber-500/60 flex flex-col items-center justify-center font-mono font-bold text-amber-300">
                    <span>T2</span>
                    <span className="text-[9px]">Holds: B</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/30 text-xs font-mono text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>Circular Wait Detected: T1 holds A and waits for B held by T2. Deadlock!</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] space-y-4">
              <div className="text-xs font-mono uppercase tracking-wider text-[#8DFFCB]">
                PostgreSQL Deadlock Detection & Resolution
              </div>

              <div className="space-y-3 text-xs text-[#8E9F9B]">
                <div className="p-3 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.08)] space-y-1">
                  <div className="font-bold text-[#F1F5F0]">1. deadlock_timeout (Default: 1000ms)</div>
                  <p>When a transaction waits for a lock longer than 1s, the engine wakes up the deadlock detector.</p>
                </div>
                <div className="p-3 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.08)] space-y-1">
                  <div className="font-bold text-[#F1F5F0]">2. Wait-For Graph Cycle Search</div>
                  <p>PostgreSQL runs Tarjan's or Kosaraju's algorithm over pg_locks to detect circular edges.</p>
                </div>
                <div className="p-3 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.08)] space-y-1">
                  <div className="font-bold text-[#F1F5F0]">3. Victim Selection & Abort</div>
                  <p>The younger transaction is chosen as the victim, returning SQLSTATE 40P01 (deadlock_detected) to allow the surviving transaction to complete.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. STATIC TRANSACTION REVIEWER */}
      {activeTab === 'reviewer' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#F1F5F0]">"Review This Transaction" Static Hazard Analyzer</h3>
              <p className="text-xs text-[#8E9F9B] mt-1">
                Paste SQL transaction code to analyze concurrency hazards, missing row locks, or vulnerability to read skew.
              </p>
            </div>

            <textarea
              rows={6}
              value={reviewSQL}
              onChange={(e) => setReviewSQL(e.target.value)}
              className="w-full p-4 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.15)] font-mono text-xs text-[#F1F5F0] leading-relaxed focus:outline-none focus:border-[#8DFFCB]"
              spellCheck={false}
            />

            {/* Diagnostic findings */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-mono uppercase tracking-wider text-[#8DFFCB]">
                Detected Concurrency Hazards & Recommended Remediations
              </div>

              {!reviewSQL.includes('FOR UPDATE') && (
                <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-1.5">
                  <div className="font-bold flex items-center gap-2 text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Hazard: Lost Update Risk on Unlocked SELECT</span>
                  </div>
                  <p>
                    Line 2 reads <code>balance</code> without an exclusive lock before modifying it in Line 4.
                    Concurrent transactions executing simultaneously will read the same stale balance and overwrite each other.
                  </p>
                  <div className="font-mono text-[11px] text-[#8DFFCB] pt-1">
                    Fix: Change to <code>SELECT balance FROM accounts WHERE member_id = 42 FOR UPDATE;</code>
                  </div>
                </div>
              )}

              {!reviewSQL.includes('LOOP') && !reviewSQL.includes('retry') && (
                <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 text-xs space-y-1.5">
                  <div className="font-bold flex items-center gap-2 text-cyan-300">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Best Practice: Missing Client-Side Retry Loop</span>
                  </div>
                  <p>
                    Transactions running under Repeatable Read or Serializable can be aborted with <code>40001 (serialization_failure)</code>.
                    Always wrap transaction execution in an exponential backoff retry loop.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. MONEY TRANSFER ATOMICITY & RECOVERY SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="rounded-2xl border border-[rgba(220,255,245,0.12)] overflow-hidden bg-[#071112]">
          <ACIDSimulator />
        </div>
      )}
    </div>
  );
};
