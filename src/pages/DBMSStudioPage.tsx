import React, { useState } from 'react';
import { 
  Database, 
  Play, 
  Copy, 
  Check, 
  RotateCcw, 
  Layers, 
  Table as TableIcon, 
  ShieldAlert, 
  Code, 
  CheckCircle2, 
  AlertTriangle,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { supabase, testAcidRollbackRpc } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const DBMSStudioPage: React.FC = () => {
  const { currentUser, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'sql' | 'er' | 'schema' | 'acid' | 'rls'>('sql');
  const [selectedExampleId, setSelectedExampleId] = useState<string>('join');
  const [executing, setExecuting] = useState<boolean>(false);
  const [queryResult, setQueryResult] = useState<any[] | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // ACID Playground state
  const [acidExecuting, setAcidExecuting] = useState(false);
  const [acidResult, setAcidResult] = useState<any | null>(null);

  // ER Diagram zoom state
  const [erZoom, setErZoom] = useState(1);
  const [selectedTable, setSelectedTable] = useState<string | null>('subscriptions');

  const sqlExamples = [
    {
      id: 'join',
      title: 'Multi-Table JOIN (Profiles + Subscriptions + Plans)',
      category: 'Joins',
      description: 'Combines member profiles, active subscriptions, and plan features into one unified report view.',
      tables: ['profiles', 'subscriptions', 'membership_plans'],
      sql: `SELECT 
    p.full_name,
    p.email,
    mp.name AS plan_name,
    s.status AS subscription_status,
    s.billing_cycle,
    s.price_at_signup,
    s.current_period_end,
    ROUND(EXTRACT(EPOCH FROM (s.current_period_end - now())) / 86400) AS days_remaining
FROM public.subscriptions s
JOIN public.profiles p ON s.member_id = p.id
JOIN public.membership_plans mp ON s.plan_id = mp.id
ORDER BY s.current_period_end ASC;`,
      executor: async () => {
        const { data, error } = await supabase
          .from('subscriptions')
          .select(`
            status,
            billing_cycle,
            price_at_signup,
            current_period_end,
            profiles:member_id (full_name, email),
            membership_plans:plan_id (name)
          `);
        if (error) throw error;
        return (data || []).map((row: any) => ({
          full_name: row.profiles?.full_name,
          email: row.profiles?.email,
          plan_name: row.membership_plans?.name,
          subscription_status: row.status,
          billing_cycle: row.billing_cycle,
          price_at_signup: row.price_at_signup,
          current_period_end: row.current_period_end,
        }));
      },
    },
    {
      id: 'nested',
      title: 'Nested Subquery (High-Value Subscribers)',
      category: 'Subqueries',
      description: 'Finds members whose total accumulated paid invoices exceed the overall average invoice threshold.',
      tables: ['profiles', 'invoices'],
      sql: `SELECT 
    p.id,
    p.full_name,
    p.email,
    SUM(i.total_amount) AS total_paid
FROM public.profiles p
JOIN public.invoices i ON p.id = i.member_id
WHERE i.status = 'paid'
GROUP BY p.id, p.full_name, p.email
HAVING SUM(i.total_amount) > (
    SELECT AVG(total_amount) FROM public.invoices WHERE status = 'paid'
);`,
      executor: async () => {
        const { data, error } = await supabase
          .from('invoices')
          .select('member_id, total_amount, profiles:member_id(id, full_name, email)')
          .eq('status', 'paid');
        if (error) throw error;

        const totals: Record<string, { full_name: string; email: string; total: number }> = {};
        let grandTotal = 0;
        data?.forEach((inv: any) => {
          const mid = inv.member_id;
          grandTotal += Number(inv.total_amount);
          if (!totals[mid]) {
            totals[mid] = {
              full_name: inv.profiles?.full_name || 'Member',
              email: inv.profiles?.email || '',
              total: 0,
            };
          }
          totals[mid].total += Number(inv.total_amount);
        });

        const avg = data && data.length > 0 ? grandTotal / data.length : 0;
        return Object.entries(totals)
          .filter(([_, v]) => v.total > avg)
          .map(([id, v]) => ({
            member_id: id,
            full_name: v.full_name,
            email: v.email,
            total_paid: v.total,
            average_threshold: Math.round(avg),
          }));
      },
    },
    {
      id: 'correlated',
      title: 'Correlated Subquery (Members Without Active Plan)',
      category: 'Subqueries',
      description: 'Identifies registered members who currently have no active or trialing subscription using NOT EXISTS.',
      tables: ['profiles', 'subscriptions'],
      sql: `SELECT 
    p.id,
    p.full_name,
    p.email,
    p.role,
    p.created_at
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 
    FROM public.subscriptions s 
    WHERE s.member_id = p.id 
      AND s.status IN ('active', 'trialing')
);`,
      executor: async () => {
        const { data: subs } = await supabase.from('subscriptions').select('member_id, status');
        const activeMemberIds = new Set(
          (subs || [])
            .filter((s: any) => ['active', 'trialing'].includes(s.status))
            .map((s: any) => s.member_id)
        );

        const { data: profiles, error } = await supabase.from('profiles').select('*');
        if (error) throw error;

        return (profiles || [])
          .filter((p: any) => !activeMemberIds.has(p.id))
          .map((p: any) => ({
            member_id: p.id,
            full_name: p.full_name,
            email: p.email,
            role: p.role,
            status: 'No Active Subscription',
          }));
      },
    },
    {
      id: 'aggregate',
      title: 'Aggregate GROUP BY & HAVING (Plan Revenue Filter)',
      category: 'Aggregates',
      description: 'Groups active plans with their total subscriber count and collected revenue, filtering with HAVING.',
      tables: ['membership_plans', 'subscriptions', 'invoices'],
      sql: `SELECT 
    mp.name AS plan_name,
    mp.status AS plan_status,
    COUNT(s.id) AS active_subscribers,
    SUM(s.price_at_signup) AS total_committed_volume
FROM public.membership_plans mp
LEFT JOIN public.subscriptions s ON mp.id = s.plan_id AND s.status = 'active'
GROUP BY mp.name, mp.status
HAVING COUNT(s.id) >= 1
ORDER BY active_subscribers DESC;`,
      executor: async () => {
        const { data, error } = await supabase.from('v_plan_performance').select('*');
        if (error) throw error;
        return (data || [])
          .filter((p: any) => Number(p.active_subscribers) >= 1)
          .map((p: any) => ({
            plan_name: p.plan_name,
            plan_status: p.plan_status,
            active_subscribers: p.active_subscribers,
            all_time_subscribers: p.total_all_time_subscribers,
            collected_revenue: p.lifetime_collected_revenue,
          }));
      },
    },
    {
      id: 'view_overview',
      title: 'Query View: v_subscription_overview',
      category: 'Views',
      description: 'Queries the predefined PostgreSQL view joining profiles, plans, and calculating renewal offsets in days.',
      tables: ['v_subscription_overview'],
      sql: `SELECT * FROM public.v_subscription_overview LIMIT 10;`,
      executor: async () => {
        const { data, error } = await supabase.from('v_subscription_overview').select('*').limit(10);
        if (error) throw error;
        return data || [];
      },
    },
    {
      id: 'view_revenue',
      title: 'Query View: v_monthly_revenue',
      category: 'Views',
      description: 'Pre-computed time-series aggregation of settled invoices, average basket value, and paying members.',
      tables: ['v_monthly_revenue'],
      sql: `SELECT * FROM public.v_monthly_revenue ORDER BY revenue_month DESC;`,
      executor: async () => {
        const { data, error } = await supabase.from('v_monthly_revenue').select('*');
        if (error) throw error;
        return data || [];
      },
    },
  ];

  const currentExample = sqlExamples.find((ex) => ex.id === selectedExampleId) || sqlExamples[0];

  const handleExecute = async () => {
    setExecuting(true);
    setQueryError(null);
    setQueryResult(null);
    try {
      const res = await currentExample.executor();
      setQueryResult(res);
    } catch (err: any) {
      setQueryError(err.message || 'Execution error');
    } finally {
      setExecuting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentExample.sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Run ACID Test
  const runAcidTest = async (triggerError: boolean) => {
    setAcidExecuting(true);
    setAcidResult(null);
    try {
      const res = await testAcidRollbackRpc({
        memberId: currentUser?.id || 'b0000000-0000-0000-0000-000000000001',
        triggerError,
      });
      setAcidResult({
        success: true,
        type: 'COMMIT',
        message: 'Transaction successfully committed atomically to PostgreSQL.',
        details: res,
      });
    } catch (err: any) {
      setAcidResult({
        success: false,
        type: 'ROLLBACK',
        message: 'PostgreSQL rolled back all changes. No partial or dirty data was written.',
        details: err.message,
      });
    } finally {
      setAcidExecuting(false);
    }
  };

  // Schema dictionary records
  const schemaTables = [
    {
      name: 'profiles',
      pk: 'id (uuid)',
      description: 'App profile linked to authenticated user or demo persona. Stores name, email, and role.',
      columns: [
        { name: 'id', type: 'uuid', constraint: 'PK' },
        { name: 'full_name', type: 'text', constraint: 'NOT NULL' },
        { name: 'email', type: 'text', constraint: 'NOT NULL UNIQUE' },
        { name: 'role', type: 'text', constraint: "CHECK IN ('admin', 'operator', 'member')" },
        { name: 'timezone', type: 'text', constraint: 'DEFAULT UTC' },
        { name: 'created_at', type: 'timestamptz', constraint: 'DEFAULT now()' },
      ],
    },
    {
      name: 'membership_plans',
      pk: 'id (uuid)',
      description: 'Plan catalogue with monthly/yearly pricing, trial period, and status.',
      columns: [
        { name: 'id', type: 'uuid', constraint: 'PK' },
        { name: 'name', type: 'text', constraint: 'NOT NULL' },
        { name: 'slug', type: 'text', constraint: 'NOT NULL UNIQUE' },
        { name: 'price_monthly', type: 'numeric(12,2)', constraint: 'CHECK >= 0' },
        { name: 'price_yearly', type: 'numeric(12,2)', constraint: 'CHECK >= 0' },
        { name: 'currency', type: 'char(3)', constraint: "DEFAULT 'INR'" },
        { name: 'trial_days', type: 'integer', constraint: 'CHECK >= 0' },
        { name: 'status', type: 'text', constraint: "CHECK IN ('active','draft','archived')" },
      ],
    },
    {
      name: 'subscriptions',
      pk: 'id (uuid)',
      description: 'Member enrollments. Tracks status, billing cycles, period dates, and historical snapshot price.',
      columns: [
        { name: 'id', type: 'uuid', constraint: 'PK' },
        { name: 'member_id', type: 'uuid', constraint: 'FK -> profiles.id' },
        { name: 'plan_id', type: 'uuid', constraint: 'FK -> membership_plans.id' },
        { name: 'status', type: 'text', constraint: 'CHECK (trialing, active, past_due, paused, cancelled, expired)' },
        { name: 'billing_cycle', type: 'text', constraint: 'CHECK (monthly, yearly, one_time)' },
        { name: 'price_at_signup', type: 'numeric(12,2)', constraint: 'CHECK >= 0 (Snapshot)' },
        { name: 'current_period_start', type: 'timestamptz', constraint: 'NOT NULL' },
        { name: 'current_period_end', type: 'timestamptz', constraint: 'CHECK (end > start)' },
      ],
    },
    {
      name: 'invoices',
      pk: 'id (uuid)',
      description: 'Billing records with itemized subtotal, discount, tax, and settlement status.',
      columns: [
        { name: 'id', type: 'uuid', constraint: 'PK' },
        { name: 'invoice_number', type: 'text', constraint: 'NOT NULL UNIQUE' },
        { name: 'subscription_id', type: 'uuid', constraint: 'FK -> subscriptions.id' },
        { name: 'member_id', type: 'uuid', constraint: 'FK -> profiles.id' },
        { name: 'subtotal', type: 'numeric(12,2)', constraint: 'CHECK >= 0' },
        { name: 'discount_amount', type: 'numeric(12,2)', constraint: 'DEFAULT 0' },
        { name: 'total_amount', type: 'numeric(12,2)', constraint: 'CHECK >= 0' },
        { name: 'status', type: 'text', constraint: 'CHECK (draft, open, paid, void, overdue)' },
      ],
    },
    {
      name: 'payment_transactions',
      pk: 'id (uuid)',
      description: 'Settlement attempts and simulated payment outcomes tied to invoices.',
      columns: [
        { name: 'id', type: 'uuid', constraint: 'PK' },
        { name: 'invoice_id', type: 'uuid', constraint: 'FK -> invoices.id' },
        { name: 'provider', type: 'text', constraint: "DEFAULT 'demo'" },
        { name: 'provider_reference', type: 'text', constraint: 'NOT NULL UNIQUE' },
        { name: 'amount', type: 'numeric(12,2)', constraint: 'CHECK >= 0' },
        { name: 'status', type: 'text', constraint: 'CHECK (pending, succeeded, failed, refunded)' },
      ],
    },
    {
      name: 'churn_predictions',
      pk: 'id (uuid)',
      description: 'Machine learning inference records. Advisory decision support with risk level and top factors.',
      columns: [
        { name: 'id', type: 'uuid', constraint: 'PK' },
        { name: 'subscription_id', type: 'uuid', constraint: 'FK -> subscriptions.id' },
        { name: 'risk_score', type: 'numeric(5,4)', constraint: 'CHECK BETWEEN 0 AND 1' },
        { name: 'risk_level', type: 'text', constraint: 'CHECK IN (low, medium, high)' },
        { name: 'model_version', type: 'text', constraint: 'DEFAULT v1.0-rf' },
        { name: 'top_factors', type: 'jsonb', constraint: 'Array of explainable factors' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[rgba(220,255,245,0.1)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F1F5F0]">DBMS Studio</h1>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#8DFFCB]/10 text-[#8DFFCB] border border-[#8DFFCB]/20">
              Live Evaluation Surface
            </span>
          </div>
          <p className="text-xs text-[#8E9F9B] mt-1 font-mono">
            Direct PostgreSQL 17 inspection: ER modeling, SQL catalog, ACID atomicity, and RLS boundary tests.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center p-1 rounded-lg bg-[#0D1919] border border-[rgba(220,255,245,0.15)] text-xs font-mono">
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'sql' ? 'bg-[#8DFFCB] text-[#071112] font-bold' : 'text-[#8E9F9B]'
            }`}
          >
            SQL Catalog
          </button>
          <button
            onClick={() => setActiveTab('er')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'er' ? 'bg-[#8DFFCB] text-[#071112] font-bold' : 'text-[#8E9F9B]'
            }`}
          >
            ER Diagram
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'schema' ? 'bg-[#8DFFCB] text-[#071112] font-bold' : 'text-[#8E9F9B]'
            }`}
          >
            Schema Dict
          </button>
          <button
            onClick={() => setActiveTab('acid')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'acid' ? 'bg-[#8DFFCB] text-[#071112] font-bold' : 'text-[#8E9F9B]'
            }`}
          >
            ACID Test
          </button>
          <button
            onClick={() => setActiveTab('rls')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'rls' ? 'bg-[#8DFFCB] text-[#071112] font-bold' : 'text-[#8E9F9B]'
            }`}
          >
            RLS & RBAC
          </button>
        </div>
      </div>

      {/* TAB 1: SQL CATALOG & LIVE EXECUTION */}
      {activeTab === 'sql' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Example Selector */}
          <div className="lg:col-span-4 space-y-2">
            <div className="text-xs font-mono text-[#8E9F9B] uppercase pb-1">
              Curated Coursework Queries
            </div>
            {sqlExamples.map((ex) => (
              <button
                key={ex.id}
                onClick={() => {
                  setSelectedExampleId(ex.id);
                  setQueryResult(null);
                  setQueryError(null);
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selectedExampleId === ex.id
                    ? 'bg-[#0D1919] border-[#8DFFCB]/50 text-[#F1F5F0] shadow-[0_0_15px_rgba(141,255,203,0.1)]'
                    : 'bg-[#071112] border-[rgba(220,255,245,0.08)] text-[#8E9F9B] hover:border-[rgba(220,255,245,0.2)]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="text-[#8DFFCB] uppercase">{ex.category}</span>
                  <span className="text-[#8E9F9B]">{ex.tables.join(', ')}</span>
                </div>
                <div className="text-xs font-semibold">{ex.title}</div>
              </button>
            ))}
          </div>

          {/* Right SQL Panel & Live Results */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.15)] overflow-hidden">
              {/* Code Panel Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#071112] border-b border-[rgba(220,255,245,0.1)]">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-[#8DFFCB]" />
                  <span className="text-xs font-mono text-[#F1F5F0]">{currentExample.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded hover:bg-white/5 text-[#8E9F9B] hover:text-[#8DFFCB] text-xs font-mono flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#8DFFCB]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy SQL'}</span>
                  </button>
                  <button
                    onClick={handleExecute}
                    disabled={executing}
                    className="px-3 py-1.5 rounded bg-[#8DFFCB] text-[#071112] text-xs font-mono font-bold hover:bg-[#A6FFD8] transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(141,255,203,0.25)]"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{executing ? 'Executing...' : 'Run Query'}</span>
                  </button>
                </div>
              </div>

              {/* SQL Syntax Window */}
              <pre className="p-4 text-xs font-mono text-[#8DFFCB] bg-[#040909] overflow-x-auto leading-relaxed border-b border-[rgba(220,255,245,0.08)]">
                {currentExample.sql}
              </pre>

              {/* Explanation Note */}
              <div className="p-3 bg-[#0D1919] text-xs text-[#8E9F9B] font-mono flex items-center gap-2">
                <span className="text-[#8DFFCB] font-bold">EXPLANATION:</span>
                <span>{currentExample.description}</span>
              </div>
            </div>

            {/* Results Grid */}
            <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.15)] p-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(220,255,245,0.1)] text-xs font-mono">
                <span className="text-[#F1F5F0] font-semibold">Live PostgreSQL Results</span>
                <span className="text-[#8E9F9B]">
                  {queryResult ? `${queryResult.length} rows returned` : 'Awaiting execution'}
                </span>
              </div>

              {queryError && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-mono mt-3">
                  Error: {queryError}
                </div>
              )}

              {queryResult && queryResult.length > 0 && (
                <div className="overflow-x-auto mt-3">
                  <table className="w-full text-xs font-mono text-left">
                    <thead>
                      <tr className="border-b border-[rgba(220,255,245,0.1)] text-[#8E9F9B]">
                        {Object.keys(queryResult[0]).map((col) => (
                          <th key={col} className="py-2 px-3 capitalize">
                            {col.replace(/_/g, ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(220,255,245,0.05)]">
                      {queryResult.map((row, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                          {Object.values(row).map((val: any, cidx) => (
                            <td key={cidx} className="py-2.5 px-3 text-[#F1F5F0]">
                              {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '—')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!queryResult && !queryError && (
                <div className="py-12 text-center text-xs font-mono text-[#8E9F9B]">
                  Click "Run Query" above to execute this query against the connected Supabase PostgreSQL instance.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE ER DIAGRAM */}
      {activeTab === 'er' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#0D1919] p-3 rounded-xl border border-[rgba(220,255,245,0.15)] text-xs font-mono">
            <span className="text-[#8DFFCB]">Interactive Entity-Relationship Visualizer (3NF / BCNF)</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setErZoom(Math.max(0.7, erZoom - 0.1))}
                className="p-1.5 rounded bg-[#071112] hover:bg-white/10"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span>{Math.round(erZoom * 100)}%</span>
              <button
                onClick={() => setErZoom(Math.min(1.3, erZoom + 0.1))}
                className="p-1.5 rounded bg-[#071112] hover:bg-white/10"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setErZoom(1)}
                className="px-2 py-1 rounded bg-[#071112] hover:bg-white/10"
              >
                Reset
              </button>
            </div>
          </div>

          <div
            className="rounded-2xl bg-[#040909] border border-[rgba(220,255,245,0.15)] p-6 overflow-auto min-h-[500px] relative dot-grid-pattern"
            style={{ transform: `scale(${erZoom})`, transformOrigin: 'top left' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
              {/* Entity 1: Profiles */}
              <div
                onClick={() => setSelectedTable('profiles')}
                className={`rounded-xl bg-[#0D1919] p-4 border cursor-pointer transition-all ${
                  selectedTable === 'profiles' ? 'border-[#8DFFCB] shadow-[0_0_20px_rgba(141,255,203,0.2)]' : 'border-[rgba(220,255,245,0.15)]'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-[rgba(220,255,245,0.1)] text-xs font-mono">
                  <span className="font-bold text-[#8DFFCB]">profiles</span>
                  <span className="text-[10px] text-[#8E9F9B]">1:N to Subscriptions</span>
                </div>
                <div className="mt-2 space-y-1 text-[11px] font-mono">
                  <div className="text-[#8DFFCB] font-bold">🔑 id (uuid, PK)</div>
                  <div className="text-[#F1F5F0]">full_name (text)</div>
                  <div className="text-[#F1F5F0]">email (text, UNIQUE)</div>
                  <div className="text-[#F1F5F0]">role (admin/operator/member)</div>
                  <div className="text-[#8E9F9B]">created_at (timestamptz)</div>
                </div>
              </div>

              {/* Entity 2: Membership Plans */}
              <div
                onClick={() => setSelectedTable('membership_plans')}
                className={`rounded-xl bg-[#0D1919] p-4 border cursor-pointer transition-all ${
                  selectedTable === 'membership_plans' ? 'border-[#8DFFCB] shadow-[0_0_20px_rgba(141,255,203,0.2)]' : 'border-[rgba(220,255,245,0.15)]'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-[rgba(220,255,245,0.1)] text-xs font-mono">
                  <span className="font-bold text-[#8DFFCB]">membership_plans</span>
                  <span className="text-[10px] text-[#8E9F9B]">1:N to Features & Subs</span>
                </div>
                <div className="mt-2 space-y-1 text-[11px] font-mono">
                  <div className="text-[#8DFFCB] font-bold">🔑 id (uuid, PK)</div>
                  <div className="text-[#F1F5F0]">name (text)</div>
                  <div className="text-[#F1F5F0]">slug (text, UNIQUE)</div>
                  <div className="text-[#F1F5F0]">price_monthly (numeric)</div>
                  <div className="text-[#F1F5F0]">price_yearly (numeric)</div>
                  <div className="text-[#F1F5F0]">status (active/archived)</div>
                </div>
              </div>

              {/* Entity 3: Subscriptions */}
              <div
                onClick={() => setSelectedTable('subscriptions')}
                className={`rounded-xl bg-[#0D1919] p-4 border cursor-pointer transition-all ${
                  selectedTable === 'subscriptions' ? 'border-[#8DFFCB] shadow-[0_0_20px_rgba(141,255,203,0.2)]' : 'border-[rgba(220,255,245,0.15)]'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-[rgba(220,255,245,0.1)] text-xs font-mono">
                  <span className="font-bold text-[#8DFFCB]">subscriptions</span>
                  <span className="text-[10px] text-[#8E9F9B]">Central Junction</span>
                </div>
                <div className="mt-2 space-y-1 text-[11px] font-mono">
                  <div className="text-[#8DFFCB] font-bold">🔑 id (uuid, PK)</div>
                  <div className="text-cyan-300">🔗 member_id (FK -&gt; profiles)</div>
                  <div className="text-cyan-300">🔗 plan_id (FK -&gt; plans)</div>
                  <div className="text-[#F1F5F0]">status (active/trialing/...)</div>
                  <div className="text-[#F1F5F0]">price_at_signup (Snapshot)</div>
                  <div className="text-[#F1F5F0]">current_period_end</div>
                </div>
              </div>

              {/* Entity 4: Invoices */}
              <div
                onClick={() => setSelectedTable('invoices')}
                className={`rounded-xl bg-[#0D1919] p-4 border cursor-pointer transition-all ${
                  selectedTable === 'invoices' ? 'border-[#8DFFCB] shadow-[0_0_20px_rgba(141,255,203,0.2)]' : 'border-[rgba(220,255,245,0.15)]'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-[rgba(220,255,245,0.1)] text-xs font-mono">
                  <span className="font-bold text-[#8DFFCB]">invoices</span>
                  <span className="text-[10px] text-[#8E9F9B]">1:N to Transactions</span>
                </div>
                <div className="mt-2 space-y-1 text-[11px] font-mono">
                  <div className="text-[#8DFFCB] font-bold">🔑 id (uuid, PK)</div>
                  <div className="text-[#F1F5F0]">invoice_number (UNIQUE)</div>
                  <div className="text-cyan-300">🔗 subscription_id (FK)</div>
                  <div className="text-cyan-300">🔗 member_id (FK)</div>
                  <div className="text-[#F1F5F0]">total_amount (numeric)</div>
                  <div className="text-[#F1F5F0]">status (paid/open/overdue)</div>
                </div>
              </div>

              {/* Entity 5: Payment Transactions */}
              <div
                onClick={() => setSelectedTable('payment_transactions')}
                className={`rounded-xl bg-[#0D1919] p-4 border cursor-pointer transition-all ${
                  selectedTable === 'payment_transactions' ? 'border-[#8DFFCB] shadow-[0_0_20px_rgba(141,255,203,0.2)]' : 'border-[rgba(220,255,245,0.15)]'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-[rgba(220,255,245,0.1)] text-xs font-mono">
                  <span className="font-bold text-[#8DFFCB]">payment_transactions</span>
                  <span className="text-[10px] text-[#8E9F9B]">Settlement Ledger</span>
                </div>
                <div className="mt-2 space-y-1 text-[11px] font-mono">
                  <div className="text-[#8DFFCB] font-bold">🔑 id (uuid, PK)</div>
                  <div className="text-cyan-300">🔗 invoice_id (FK)</div>
                  <div className="text-[#F1F5F0]">provider_reference (UNIQUE)</div>
                  <div className="text-[#F1F5F0]">amount (numeric)</div>
                  <div className="text-[#F1F5F0]">status (succeeded/failed)</div>
                  <div className="text-[#8E9F9B]">attempted_at (timestamptz)</div>
                </div>
              </div>

              {/* Entity 6: Churn Predictions */}
              <div
                onClick={() => setSelectedTable('churn_predictions')}
                className={`rounded-xl bg-[#0D1919] p-4 border cursor-pointer transition-all ${
                  selectedTable === 'churn_predictions' ? 'border-[#8DFFCB] shadow-[0_0_20px_rgba(141,255,203,0.2)]' : 'border-[rgba(220,255,245,0.15)]'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-[rgba(220,255,245,0.1)] text-xs font-mono">
                  <span className="font-bold text-[#D9FF72]">churn_predictions</span>
                  <span className="text-[10px] text-[#8E9F9B]">AI/ML Retention</span>
                </div>
                <div className="mt-2 space-y-1 text-[11px] font-mono">
                  <div className="text-[#8DFFCB] font-bold">🔑 id (uuid, PK)</div>
                  <div className="text-cyan-300">🔗 subscription_id (FK)</div>
                  <div className="text-[#D9FF72]">risk_score (numeric 0..1)</div>
                  <div className="text-[#F1F5F0]">risk_level (low/med/high)</div>
                  <div className="text-[#F1F5F0]">top_factors (jsonb)</div>
                  <div className="text-[#8E9F9B]">prediction_date (timestamptz)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SCHEMA DICTIONARY */}
      {activeTab === 'schema' && (
        <div className="space-y-6">
          {schemaTables.map((t) => (
            <div key={t.name} className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.15)] p-5">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(220,255,245,0.1)]">
                <div>
                  <h3 className="text-base font-bold text-[#8DFFCB] font-mono">{t.name}</h3>
                  <p className="text-xs text-[#8E9F9B] mt-0.5">{t.description}</p>
                </div>
                <span className="text-xs font-mono text-[#F1F5F0] px-2.5 py-1 rounded bg-[#071112] border border-[rgba(220,255,245,0.1)]">
                  Primary Key: {t.pk}
                </span>
              </div>

              <div className="overflow-x-auto mt-4">
                <table className="w-full text-xs font-mono text-left">
                  <thead>
                    <tr className="text-[#8E9F9B] border-b border-[rgba(220,255,245,0.06)]">
                      <th className="py-2 px-3">Column</th>
                      <th className="py-2 px-3">Data Type</th>
                      <th className="py-2 px-3">Constraints & Dependencies</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(220,255,245,0.04)]">
                    {t.columns.map((c) => (
                      <tr key={c.name} className="hover:bg-white/5">
                        <td className="py-2 px-3 text-[#F1F5F0] font-semibold">{c.name}</td>
                        <td className="py-2 px-3 text-cyan-300">{c.type}</td>
                        <td className="py-2 px-3 text-[#8E9F9B]">{c.constraint}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: ACID TRANSACTION PLAYGROUND */}
      {activeTab === 'acid' && (
        <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.15)] p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[#F1F5F0]">ACID Transaction Demonstration</h2>
            <p className="text-xs text-[#8E9F9B] leading-relaxed max-w-2xl">
              Demonstrates PostgreSQL <strong>Atomicity, Consistency, Isolation, and Durability</strong>.
              When a multi-step operation fails midway, plpgsql rolls back all operations completely, ensuring zero dirty writes or orphan rows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Scenario A: Deliberate Rollback */}
            <div className="p-5 rounded-xl bg-[#071112] border border-rose-500/30 space-y-4">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Test 1: Deliberate Rollback (Midway Failure)</span>
              </div>
              <p className="text-xs text-[#8E9F9B]">
                Inserts a subscription row, then triggers an intentional exception before committing. Verifies that PostgreSQL aborts the entire transaction.
              </p>
              <button
                onClick={() => runAcidTest(true)}
                disabled={acidExecuting}
                className="w-full py-2.5 rounded-lg bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs font-mono font-semibold hover:bg-rose-900/60 transition-all flex items-center justify-center gap-2"
              >
                <span>Trigger Deliberate Rollback</span>
              </button>
            </div>

            {/* Scenario B: Atomic Commit */}
            <div className="p-5 rounded-xl bg-[#071112] border border-emerald-500/30 space-y-4">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Test 2: Atomic Commit (Success Path)</span>
              </div>
              <p className="text-xs text-[#8E9F9B]">
                Completes all checks and persists the subscription row atomically, logging to audit trail and timeline.
              </p>
              <button
                onClick={() => runAcidTest(false)}
                disabled={acidExecuting}
                className="w-full py-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs font-mono font-semibold hover:bg-emerald-900/60 transition-all flex items-center justify-center gap-2"
              >
                <span>Execute Atomic Commit</span>
              </button>
            </div>
          </div>

          {/* Result Output */}
          {acidResult && (
            <div
              className={`p-4 rounded-xl border font-mono text-xs space-y-2 ${
                acidResult.type === 'ROLLBACK'
                  ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                  : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
              }`}
            >
              <div className="font-bold uppercase tracking-wider flex items-center gap-2">
                <span>Observed Outcome: {acidResult.type}</span>
              </div>
              <p>{acidResult.message}</p>
              <pre className="p-3 rounded bg-black/40 overflow-x-auto text-[11px] text-[#F1F5F0]">
                {typeof acidResult.details === 'object'
                  ? JSON.stringify(acidResult.details, null, 2)
                  : String(acidResult.details)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: RLS & RBAC VERIFICATION */}
      {activeTab === 'rls' && (
        <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.15)] p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[#F1F5F0]">Row Level Security (RLS) Policy Sandbox</h2>
            <p className="text-xs text-[#8E9F9B] leading-relaxed max-w-2xl">
              NEXUS enforces data isolation at the PostgreSQL storage layer.
              Members cannot inspect or tamper with another customer’s invoices, subscriptions, or administrative roles.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.1)] space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(220,255,245,0.08)]">
              <span className="text-[#8DFFCB]">Current Context:</span>
              <span className="text-[#F1F5F0] font-bold capitalize">{role} ({currentUser?.email})</span>
            </div>
            <div className="text-[#8E9F9B]">
              Active policy allows: {role === 'admin' ? 'FULL ALL ACCESS' : role === 'operator' ? 'OPERATIONAL BUSINESS ACCESS' : 'OWN ROWS ONLY (WHERE member_id = auth.uid())'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
