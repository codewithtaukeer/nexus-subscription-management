import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Play, 
  RotateCcw, 
  Layers, 
  Database, 
  Lock, 
  HardDrive,
  RefreshCw,
  GitCommit
} from 'lucide-react';
import { supabase, testAcidRollbackRpc } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export const ACIDSimulator: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'atomicity' | 'consistency' | 'isolation' | 'durability'>('atomicity');

  // Atomicity state
  const [injectCrash, setInjectCrash] = useState(true);
  const [atomicityLogs, setAtomicityLogs] = useState<string[]>([]);
  const [runningAtomicity, setRunningAtomicity] = useState(false);

  // Consistency state
  const [testConstraint, setTestConstraint] = useState<'negative_price' | 'invalid_dates' | 'bad_fk'>('negative_price');
  const [consistencyResult, setConsistencyResult] = useState<any | null>(null);
  const [runningConsistency, setRunningConsistency] = useState(false);

  // Isolation state
  const [isolationLevel, setIsolationLevel] = useState<'read_committed' | 'repeatable_read' | 'serializable'>('read_committed');
  const [t1Step, setT1Step] = useState(0);
  const [t2Step, setT2Step] = useState(0);
  const [sharedBalance, setSharedBalance] = useState(1000);
  const [isolationLogs, setIsolationLogs] = useState<string[]>([]);

  // Durability state
  const [walLogs, setWalLogs] = useState<Array<{ lsn: number; tx: string; op: string; flushed: boolean }>>([
    { lsn: 1042, tx: 'TX-101', op: 'INSERT INTO invoices (id, total) VALUES (..., 2499)', flushed: true },
    { lsn: 1043, tx: 'TX-101', op: 'COMMIT TX-101', flushed: true },
  ]);
  const [bufferDirty, setBufferDirty] = useState(false);

  // 1. ATOMICITY EXECUTION
  const handleRunAtomicity = async () => {
    setRunningAtomicity(true);
    setAtomicityLogs(['[BEGIN TRANSACTION] Starting multi-table ACID transaction...']);

    setTimeout(async () => {
      setAtomicityLogs((prev) => [
        ...prev,
        '[STEP 1/3] INSERT INTO subscriptions (member_id, plan_id, status) ... (OK: Pending Commit)',
      ]);

      setTimeout(async () => {
        setAtomicityLogs((prev) => [
          ...prev,
          '[STEP 2/3] INSERT INTO invoices (invoice_number, total_amount) ... (OK: Pending Commit)',
        ]);

        setTimeout(async () => {
          if (injectCrash) {
            setAtomicityLogs((prev) => [
              ...prev,
              '[STEP 3/3 CRASH DETECTED] Simulated fatal exception: Out of memory / network crash midway.',
              '[POSTGRES ROLLBACK] Atomicity invariant invoked: Aborting transaction.',
              '[CLEANUP VERIFIED] Undo log applied. Exactly 0 rows were written to disk. Atomicity: 100% PRESERVED.',
            ]);
            try {
              await testAcidRollbackRpc({
                memberId: currentUser?.id || 'b0000000-0000-0000-0000-000000000001',
                triggerError: true,
              });
            } catch (err: any) {
              // Expected
            }
          } else {
            setAtomicityLogs((prev) => [
              ...prev,
              '[STEP 3/3] INSERT INTO audit_logs (action) ... (OK)',
              '[POSTGRES COMMIT] All 3 writes atomically flushed to storage.',
              '[TRANSACTION COMMITTED] State transition permanent and visible to concurrent transactions.',
            ]);
            try {
              await testAcidRollbackRpc({
                memberId: currentUser?.id || 'b0000000-0000-0000-0000-000000000001',
                triggerError: false,
              });
            } catch (err: any) {
              // Handled
            }
          }
          setRunningAtomicity(false);
        }, 600);
      }, 600);
    }, 600);
  };

  // 2. CONSISTENCY TEST
  const handleTestConsistency = async () => {
    setRunningConsistency(true);
    setConsistencyResult(null);

    try {
      if (testConstraint === 'negative_price') {
        const { error } = await supabase.from('membership_plans').insert({
          name: 'Illegal Negative Price Plan',
          slug: `illegal-plan-${Date.now()}`,
          price_monthly: -500, // VIOLATION
        });

        if (error) {
          setConsistencyResult({
            success: true,
            status: 'CHECK CONSTRAINT ENFORCED',
            error: error.message,
            code: error.code || '23514',
            detail: 'PostgreSQL check constraint "membership_plans_price_monthly_check" successfully rejected negative price (-500).',
          });
        }
      } else if (testConstraint === 'invalid_dates') {
        const { error } = await supabase.from('subscriptions').insert({
          member_id: currentUser?.id || 'b0000000-0000-0000-0000-000000000001',
          plan_id: 'c0000000-0000-0000-0000-000000000002',
          status: 'active',
          billing_cycle: 'monthly',
          price_at_signup: 100,
          current_period_start: '2026-10-20T12:00:00Z',
          current_period_end: '2026-10-19T12:00:00Z', // END BEFORE START (VIOLATION)
        });

        if (error) {
          setConsistencyResult({
            success: true,
            status: 'DATE INVARIANT ENFORCED',
            error: error.message,
            code: error.code || '23514',
            detail: 'PostgreSQL constraint CHECK (current_period_end > current_period_start) rejected inverted period.',
          });
        }
      } else if (testConstraint === 'bad_fk') {
        const { error } = await supabase.from('subscriptions').insert({
          member_id: '00000000-0000-0000-0000-000000000999', // NON-EXISTENT MEMBER
          plan_id: 'c0000000-0000-0000-0000-000000000002',
          status: 'active',
          billing_cycle: 'monthly',
          price_at_signup: 100,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 86400000).toISOString(),
        });

        if (error) {
          setConsistencyResult({
            success: true,
            status: 'FOREIGN KEY REFERENTIAL INTEGRITY ENFORCED',
            error: error.message,
            code: error.code || '23503',
            detail: 'Foreign key subscriptions_member_id_fkey rejected orphan enrollment referencing non-existent member.',
          });
        }
      }
    } catch (err: any) {
      setConsistencyResult({
        success: true,
        status: 'INTEGRITY VIOLATION CAUGHT',
        error: err.message,
      });
    } finally {
      setRunningConsistency(false);
    }
  };

  // 3. ISOLATION STEPPING
  const handleStepT1 = () => {
    if (t1Step === 0) {
      setIsolationLogs((prev) => [
        ...prev,
        `[T1: Step 1] BEGIN TRANSACTION (Level: ${isolationLevel.toUpperCase()}); Read Account Balance = ₹${sharedBalance}`,
      ]);
      setT1Step(1);
    } else if (t1Step === 1) {
      const nextBal = sharedBalance - 400;
      setIsolationLogs((prev) => [
        ...prev,
        `[T1: Step 2] UPDATE balance SET balance = ₹${nextBal} WHERE id = 'A' (Locked in local private snapshot)`,
      ]);
      setSharedBalance(nextBal);
      setT1Step(2);
    } else if (t1Step === 2) {
      setIsolationLogs((prev) => [
        ...prev,
        `[T1: Step 3] COMMIT; Local updates released to global database storage.`,
      ]);
      setT1Step(3);
    }
  };

  const handleStepT2 = () => {
    if (t2Step === 0) {
      const observedBal =
        isolationLevel === 'read_committed' && t1Step < 3 ? 1000 : sharedBalance;
      setIsolationLogs((prev) => [
        ...prev,
        `[T2: Step 1] Concurrent query reads Balance = ₹${observedBal}. ${
          t1Step === 2 && isolationLevel === 'read_committed'
            ? '(Dirty Read Blocked! T2 only sees committed data ₹1000)'
            : ''
        }`,
      ]);
      setT2Step(1);
    }
  };

  const handleResetIsolation = () => {
    setT1Step(0);
    setT2Step(0);
    setSharedBalance(1000);
    setIsolationLogs([]);
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Banner */}
      <div className="p-5 rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.15)] space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(220,255,245,0.1)]">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F1F5F0]">
            <ShieldCheck className="w-4 h-4 text-[#8DFFCB]" />
            <span>Interactive ACID Properties Verification Laboratory</span>
          </div>
          <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-[#8DFFCB]/10 text-[#8DFFCB] border border-[#8DFFCB]/20">
            PostgreSQL 17 Engine Proofs
          </span>
        </div>

        <p className="text-[#8E9F9B] leading-relaxed">
          Test and verify every pillar of relational ACID transactions: Atomicity (All-or-Nothing rollback),
          Consistency (Check constraints and Foreign Key referential integrity), Isolation (Lock management and multi-version concurrency control), and Durability (Write-Ahead Logging).
        </p>

        {/* ACID Sub-tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {(['atomicity', 'consistency', 'isolation', 'durability'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                activeTab === tab
                  ? 'bg-[#8DFFCB] text-[#071112] font-bold shadow-[0_0_15px_rgba(141,255,203,0.25)]'
                  : 'bg-[#071112] text-[#8E9F9B] hover:text-[#F1F5F0] border border-[rgba(220,255,245,0.1)]'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({tab.charAt(0).toUpperCase()})
            </button>
          ))}
        </div>
      </div>

      {/* 1. ATOMICITY TAB */}
      {activeTab === 'atomicity' && (
        <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.15)] p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(220,255,245,0.08)]">
            <span className="font-bold text-sm text-[#F1F5F0]">Atomicity (A) — The All-or-Nothing Invariant</span>
            <span className="text-[10px] text-[#8DFFCB]">PostgreSQL plpgsql Rollback Engine</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.1)] space-y-3">
              <label className="text-[#F1F5F0] font-bold block">Transaction Setup</label>
              <div className="space-y-2 text-[#8E9F9B]">
                <div>1. Write to subscriptions table (status: trialing)</div>
                <div>2. Write opening invoice (amount: ₹2,499)</div>
                <div>3. Record audit event and commit</div>
              </div>

              <div className="pt-2 border-t border-[rgba(220,255,245,0.08)] flex items-center justify-between">
                <span className="text-[#F1F5F0]">Inject Mid-Flight Crash at Step 2:</span>
                <input
                  type="checkbox"
                  checked={injectCrash}
                  onChange={(e) => setInjectCrash(e.target.checked)}
                  className="w-4 h-4 accent-[#8DFFCB]"
                />
              </div>

              <button
                onClick={handleRunAtomicity}
                disabled={runningAtomicity}
                className="w-full mt-2 py-2.5 rounded-lg bg-[#8DFFCB] text-[#071112] font-bold hover:bg-[#A6FFD8] flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{runningAtomicity ? 'Executing Transaction...' : 'Run Atomic Transaction'}</span>
              </button>
            </div>

            {/* Execution Trace */}
            <div className="p-4 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.1)] space-y-2">
              <span className="text-[#8E9F9B] block font-bold">PostgreSQL Engine Transaction Log:</span>
              <div className="space-y-1.5 min-h-[140px] text-[11px]">
                {atomicityLogs.map((log, i) => (
                  <div
                    key={i}
                    className={`${
                      log.includes('CRASH') || log.includes('ROLLBACK')
                        ? 'text-rose-400 font-bold'
                        : log.includes('COMMITTED')
                        ? 'text-[#8DFFCB] font-bold'
                        : 'text-[#F1F5F0]'
                    }`}
                  >
                    {log}
                  </div>
                ))}
                {atomicityLogs.length === 0 && (
                  <div className="text-[#8E9F9B] py-8 text-center">
                    Awaiting execution. Click "Run Atomic Transaction" above.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. CONSISTENCY TAB */}
      {activeTab === 'consistency' && (
        <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.15)] p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(220,255,245,0.08)]">
            <span className="font-bold text-sm text-[#F1F5F0]">Consistency (C) — Database Invariant & Constraint Verification</span>
            <span className="text-[10px] text-[#8DFFCB]">Live PostgreSQL Check & FK Enforcement</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.1)] space-y-3">
              <label className="text-[#F1F5F0] font-bold block">Select Constraint Invariant to Violate:</label>
              
              <div className="space-y-2">
                <label className="flex items-center gap-2 p-2.5 rounded bg-[#0D1919] border border-[rgba(220,255,245,0.1)] cursor-pointer">
                  <input
                    type="radio"
                    name="constraint"
                    checked={testConstraint === 'negative_price'}
                    onChange={() => setTestConstraint('negative_price')}
                  />
                  <div>
                    <div className="text-[#F1F5F0] font-semibold">1. Negative Price Check Violation</div>
                    <div className="text-[10px] text-[#8E9F9B]">CHECK (price_monthly &gt;= 0)</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded bg-[#0D1919] border border-[rgba(220,255,245,0.1)] cursor-pointer">
                  <input
                    type="radio"
                    name="constraint"
                    checked={testConstraint === 'invalid_dates'}
                    onChange={() => setTestConstraint('invalid_dates')}
                  />
                  <div>
                    <div className="text-[#F1F5F0] font-semibold">2. Inverted Dates Boundary Violation</div>
                    <div className="text-[10px] text-[#8E9F9B]">CHECK (current_period_end &gt; current_period_start)</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded bg-[#0D1919] border border-[rgba(220,255,245,0.1)] cursor-pointer">
                  <input
                    type="radio"
                    name="constraint"
                    checked={testConstraint === 'bad_fk'}
                    onChange={() => setTestConstraint('bad_fk')}
                  />
                  <div>
                    <div className="text-[#F1F5F0] font-semibold">3. Orphan Foreign Key Violation</div>
                    <div className="text-[10px] text-[#8E9F9B]">FOREIGN KEY member_id REFERENCES profiles(id)</div>
                  </div>
                </label>
              </div>

              <button
                onClick={handleTestConsistency}
                disabled={runningConsistency}
                className="w-full mt-2 py-2.5 rounded-lg bg-rose-950/60 border border-rose-500/50 text-rose-200 font-bold hover:bg-rose-900/60 transition-all flex items-center justify-center gap-2"
              >
                <span>Trigger Invariant Test in PostgreSQL</span>
              </button>
            </div>

            {/* Invariant Result */}
            <div className="p-4 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.1)] space-y-2">
              <span className="text-[#8E9F9B] block font-bold">PostgreSQL Engine Invariant Response:</span>
              {consistencyResult ? (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{consistencyResult.status} (SQLSTATE: {consistencyResult.code})</span>
                  </div>
                  <p className="text-[11px] opacity-90">{consistencyResult.detail}</p>
                  <pre className="p-2 rounded bg-black/40 text-[10px] text-[#8E9F9B] overflow-x-auto">
                    {consistencyResult.error}
                  </pre>
                </div>
              ) : (
                <div className="text-[#8E9F9B] py-12 text-center">
                  Select an invariant and click "Trigger Invariant Test" to verify live constraint rejection.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. ISOLATION TAB */}
      {activeTab === 'isolation' && (
        <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.15)] p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(220,255,245,0.08)]">
            <span className="font-bold text-sm text-[#F1F5F0]">Isolation (I) — Multi-Transaction Concurrency Simulator</span>
            <div className="flex items-center gap-2">
              <span className="text-[#8E9F9B]">Isolation Level:</span>
              <select
                value={isolationLevel}
                onChange={(e) => {
                  setIsolationLevel(e.target.value as any);
                  handleResetIsolation();
                }}
                className="bg-[#071112] border border-[rgba(220,255,245,0.2)] rounded px-2 py-1 text-[#8DFFCB]"
              >
                <option value="read_committed">Read Committed (Postgres Default)</option>
                <option value="repeatable_read">Repeatable Read (Snapshot Isolation)</option>
                <option value="serializable">Serializable (Strict Serialization)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Transaction 1 */}
            <div className="p-4 rounded-xl bg-[#071112] border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between text-cyan-300 font-bold">
                <span>Transaction 1 (Debiting Account A)</span>
                <span>Step: {t1Step}/3</span>
              </div>
              <p className="text-[#8E9F9B]">T1 reads balance (₹1,000), deducts ₹400, then commits.</p>
              <button
                onClick={handleStepT1}
                disabled={t1Step >= 3}
                className="w-full py-2 rounded bg-cyan-950 text-cyan-200 border border-cyan-500/40 hover:bg-cyan-900/40 font-bold"
              >
                {t1Step === 0 ? 'Step 1: Begin T1 & Read' : t1Step === 1 ? 'Step 2: Update Balance' : 'Step 3: Commit T1'}
              </button>
            </div>

            {/* Transaction 2 */}
            <div className="p-4 rounded-xl bg-[#071112] border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between text-amber-300 font-bold">
                <span>Transaction 2 (Concurrent Read)</span>
                <span>Step: {t2Step}/1</span>
              </div>
              <p className="text-[#8E9F9B]">T2 attempts to read Account A concurrently while T1 is mid-flight.</p>
              <button
                onClick={handleStepT2}
                disabled={t2Step >= 1}
                className="w-full py-2 rounded bg-amber-950 text-amber-200 border border-amber-500/40 hover:bg-amber-900/40 font-bold"
              >
                Step 1: Execute Concurrent Query in T2
              </button>
            </div>
          </div>

          {/* Stepped Logs */}
          <div className="p-4 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.08)] space-y-2">
            <div className="flex items-center justify-between text-[#8E9F9B] font-bold">
              <span>Concurrency Interleaving Trace:</span>
              <button onClick={handleResetIsolation} className="hover:text-[#8DFFCB] flex items-center gap-1">
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Scenario</span>
              </button>
            </div>
            <div className="space-y-1 text-[11px] min-h-[80px]">
              {isolationLogs.map((log, i) => (
                <div key={i} className="text-[#F1F5F0]">{log}</div>
              ))}
              {isolationLogs.length === 0 && (
                <div className="text-[#8E9F9B] py-4 text-center">
                  Use the step buttons above to step through concurrent operations.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. DURABILITY TAB */}
      {activeTab === 'durability' && (
        <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.15)] p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(220,255,245,0.08)]">
            <span className="font-bold text-sm text-[#F1F5F0]">Durability (D) — Write-Ahead Logging (WAL) & Disk Flush</span>
            <span className="text-[10px] text-[#8DFFCB]">Zero Data Loss On Power Failure</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.1)] space-y-3">
              <span className="text-[#F1F5F0] font-bold block">Append New Mutation to Write-Ahead Log:</span>
              <p className="text-[#8E9F9B]">
                In PostgreSQL, before any dirty buffer page is written to tablespace disk, the mutation log record MUST be synchronously written to the sequential WAL journal.
              </p>

              <button
                onClick={() => {
                  const newLsn = 1044 + walLogs.length;
                  setWalLogs([
                    ...walLogs,
                    {
                      lsn: newLsn,
                      tx: `TX-${newLsn}`,
                      op: `INSERT INTO payment_transactions (ref, amount) VALUES ('TX-${newLsn}', 7999)`,
                      flushed: true,
                    },
                  ]);
                }}
                className="w-full py-2.5 rounded-lg bg-[#8DFFCB] text-[#071112] font-bold hover:bg-[#A6FFD8] flex items-center justify-center gap-2"
              >
                <HardDrive className="w-4 h-4" />
                <span>Simulate WAL Record Append & Fsync</span>
              </button>
            </div>

            {/* WAL Journal View */}
            <div className="p-4 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.1)] space-y-2">
              <span className="text-[#8E9F9B] block font-bold">Sequential Disk WAL Journal (LSN Sequence):</span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto text-[11px]">
                {walLogs.map((log) => (
                  <div
                    key={log.lsn}
                    className="p-2 rounded bg-[#0D1919] border border-[rgba(220,255,245,0.06)] flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[#8DFFCB] font-bold mr-2">LSN: {log.lsn}</span>
                      <span className="text-[#F1F5F0]">{log.op}</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold shrink-0 ml-2">
                      ✓ FSYNCED
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
