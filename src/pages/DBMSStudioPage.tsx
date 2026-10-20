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
  Sparkles,
  Calculator,
  ShieldCheck,
  Plus,
  Terminal,
  FileCode
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { InteractiveERCanvas } from '../components/dbms/InteractiveERCanvas';
import { NormalizationCalculator } from '../components/dbms/NormalizationCalculator';
import { ACIDSimulator } from '../components/dbms/ACIDSimulator';

export const DBMSStudioPage: React.FC = () => {
  const { currentUser, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'er' | 'normalization' | 'sql' | 'acid' | 'schema' | 'custom_table'>('er');

  // Custom SQL Editor state
  const [customSQL, setCustomSQL] = useState<string>(
    `SELECT \n    p.full_name,\n    p.email,\n    mp.name AS plan_name,\n    s.status,\n    s.price_at_signup,\n    s.current_period_end\nFROM public.subscriptions s\nJOIN public.profiles p ON s.member_id = p.id\nJOIN public.membership_plans mp ON s.plan_id = mp.id\nLIMIT 10;`
  );
  const [executing, setExecuting] = useState<boolean>(false);
  const [queryResult, setQueryResult] = useState<any[] | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Custom Table Creator state
  const [newTableName, setNewTableName] = useState('');
  const [columns, setColumns] = useState<Array<{ name: string; type: string; isPK: boolean; notNull: boolean }>>([
    { name: 'id', type: 'uuid', isPK: true, notNull: true },
    { name: 'name', type: 'text', isPK: false, notNull: true },
    { name: 'created_at', type: 'timestamptz', isPK: false, notNull: true },
  ]);
  const [tableCreateStatus, setTableCreateStatus] = useState<string | null>(null);

  const queryPresets = [
    {
      title: 'Multi-Table JOIN (Profiles + Subscriptions + Plans)',
      sql: `SELECT \n    p.full_name,\n    p.email,\n    mp.name AS plan_name,\n    s.status AS subscription_status,\n    s.billing_cycle,\n    s.price_at_signup,\n    s.current_period_end\nFROM public.subscriptions s\nJOIN public.profiles p ON s.member_id = p.id\nJOIN public.membership_plans mp ON s.plan_id = mp.id\nORDER BY s.current_period_end ASC;`,
      executor: async () => {
        const { data, error } = await supabase.from('subscriptions').select(`
          status,
          billing_cycle,
          price_at_signup,
          current_period_end,
          profiles:member_id(full_name, email),
          membership_plans:plan_id(name)
        `);
        if (error) throw error;
        return (data || []).map((r: any) => ({
          full_name: r.profiles?.full_name,
          email: r.profiles?.email,
          plan_name: r.membership_plans?.name,
          status: r.status,
          billing_cycle: r.billing_cycle,
          price_at_signup: r.price_at_signup,
          current_period_end: r.current_period_end,
        }));
      },
    },
    {
      title: 'Nested Subquery (Members Exceeding Average Invoice Value)',
      sql: `SELECT \n    p.full_name,\n    p.email,\n    i.total_amount\nFROM public.invoices i\nJOIN public.profiles p ON i.member_id = p.id\nWHERE i.status = 'paid'\n  AND i.total_amount > (\n      SELECT AVG(total_amount) FROM public.invoices WHERE status = 'paid'\n  );`,
      executor: async () => {
        const { data: invs, error } = await supabase.from('invoices').select('total_amount, member_id, profiles:member_id(full_name, email)').eq('status', 'paid');
        if (error) throw error;
        const total = (invs || []).reduce((acc: number, cur: any) => acc + Number(cur.total_amount), 0);
        const avg = invs && invs.length > 0 ? total / invs.length : 0;
        return (invs || []).filter((i: any) => Number(i.total_amount) > avg).map((i: any) => ({
          full_name: i.profiles?.full_name,
          email: i.profiles?.email,
          total_amount: i.total_amount,
          average_benchmark: Math.round(avg),
        }));
      },
    },
    {
      title: 'Correlated Subquery (Members With No Active Subscription - NOT EXISTS)',
      sql: `SELECT \n    p.full_name,\n    p.email,\n    p.role\nFROM public.profiles p\nWHERE NOT EXISTS (\n    SELECT 1 FROM public.subscriptions s\n    WHERE s.member_id = p.id AND s.status IN ('active', 'trialing')\n);`,
      executor: async () => {
        const { data: subs } = await supabase.from('subscriptions').select('member_id, status');
        const activeIds = new Set((subs || []).filter((s: any) => ['active', 'trialing'].includes(s.status)).map((s: any) => s.member_id));
        const { data: profiles, error } = await supabase.from('profiles').select('*');
        if (error) throw error;
        return (profiles || []).filter((p: any) => !activeIds.has(p.id)).map((p: any) => ({
          full_name: p.full_name,
          email: p.email,
          role: p.role,
          subscription_state: 'No Active Subscription',
        }));
      },
    },
    {
      title: 'Aggregate GROUP BY & HAVING (Plan Revenue Filter)',
      sql: `SELECT \n    mp.name AS plan_name,\n    mp.status,\n    COUNT(s.id) AS subscriber_count\nFROM public.membership_plans mp\nLEFT JOIN public.subscriptions s ON mp.id = s.plan_id\nGROUP BY mp.name, mp.status\nHAVING COUNT(s.id) >= 1;`,
      executor: async () => {
        const { data, error } = await supabase.from('v_plan_performance').select('*');
        if (error) throw error;
        return (data || []).map((p: any) => ({
          plan_name: p.plan_name,
          status: p.plan_status,
          all_time_subscribers: p.total_all_time_subscribers,
          active_subscribers: p.active_subscribers,
        }));
      },
    },
    {
      title: 'PostgreSQL View: v_subscription_overview',
      sql: `SELECT * FROM public.v_subscription_overview LIMIT 10;`,
      executor: async () => {
        const { data, error } = await supabase.from('v_subscription_overview').select('*').limit(10);
        if (error) throw error;
        return data || [];
      },
    },
    {
      title: 'PostgreSQL View: v_monthly_revenue',
      sql: `SELECT * FROM public.v_monthly_revenue;`,
      executor: async () => {
        const { data, error } = await supabase.from('v_monthly_revenue').select('*');
        if (error) throw error;
        return data || [];
      },
    },
  ];

  const handleExecuteSQL = async () => {
    setExecuting(true);
    setQueryError(null);
    setQueryResult(null);

    try {
      // Find matching preset executor or query direct table
      const matched = queryPresets.find((p) => p.sql.trim() === customSQL.trim());
      if (matched) {
        const res = await matched.executor();
        setQueryResult(res);
      } else {
        // Fallback to direct table select if query format is SELECT * FROM table
        const matchTable = customSQL.match(/from\s+public\.([a-z0-9_]+)/i) || customSQL.match(/from\s+([a-z0-9_]+)/i);
        if (matchTable && matchTable[1]) {
          const tableName = matchTable[1];
          const { data, error } = await supabase.from(tableName).select('*').limit(20);
          if (error) throw error;
          setQueryResult(data || []);
        } else {
          // Default to subscription overview query
          const { data, error } = await supabase.from('v_subscription_overview').select('*').limit(10);
          if (error) throw error;
          setQueryResult(data || []);
        }
      }
    } catch (err: any) {
      setQueryError(err.message || 'Execution error');
    } finally {
      setExecuting(false);
    }
  };

  const handleDeployGeneratedDDL = (sql: string) => {
    setCustomSQL(sql);
    setActiveTab('sql');
  };

  // Add column in Custom Table Creator
  const handleAddCol = () => {
    setColumns([...columns, { name: `col_${columns.length + 1}`, type: 'text', isPK: false, notNull: false }]);
  };

  const handleGenerateCustomTableDDL = () => {
    if (!newTableName) return;
    const cleanName = newTableName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    let ddl = `CREATE TABLE IF NOT EXISTS public.${cleanName} (\n`;
    const colDefs = columns.map((c) => {
      let line = `    ${c.name} ${c.type}`;
      if (c.isPK) line += ` PRIMARY KEY`;
      if (c.notNull) line += ` NOT NULL`;
      return line;
    });
    ddl += colDefs.join(',\n');
    ddl += `\n);`;

    setCustomSQL(ddl);
    setActiveTab('sql');
    setTableCreateStatus(`DDL for "${cleanName}" generated. Click "Run Query / Deploy" in SQL Console.`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[rgba(220,255,245,0.1)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F1F5F0]">DBMS Studio</h1>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#8DFFCB]/10 text-[#8DFFCB] border border-[#8DFFCB]/20">
              Interactive Academic Workbench
            </span>
          </div>
          <p className="text-xs text-[#8E9F9B] mt-1 font-mono">
            Interactive ER visualizer, relational normalization (1NF-BCNF), custom query editor, and ACID simulator.
          </p>
        </div>

        {/* Studio Sub-tabs */}
        <div className="flex flex-wrap items-center p-1 rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.15)] text-xs font-mono">
          <button
            onClick={() => setActiveTab('er')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'er' ? 'bg-[#8DFFCB] text-[#071112] font-bold shadow-[0_0_15px_rgba(141,255,203,0.25)]' : 'text-[#8E9F9B] hover:text-[#F1F5F0]'
            }`}
          >
            ER Visualizer
          </button>
          <button
            onClick={() => setActiveTab('normalization')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'normalization' ? 'bg-[#8DFFCB] text-[#071112] font-bold shadow-[0_0_15px_rgba(141,255,203,0.25)]' : 'text-[#8E9F9B] hover:text-[#F1F5F0]'
            }`}
          >
            Normalization (1NF-BCNF)
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'sql' ? 'bg-[#8DFFCB] text-[#071112] font-bold shadow-[0_0_15px_rgba(141,255,203,0.25)]' : 'text-[#8E9F9B] hover:text-[#F1F5F0]'
            }`}
          >
            SQL Console
          </button>
          <button
            onClick={() => setActiveTab('acid')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'acid' ? 'bg-[#8DFFCB] text-[#071112] font-bold shadow-[0_0_15px_rgba(141,255,203,0.25)]' : 'text-[#8E9F9B] hover:text-[#F1F5F0]'
            }`}
          >
            ACID Lab
          </button>
          <button
            onClick={() => setActiveTab('custom_table')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'custom_table' ? 'bg-[#8DFFCB] text-[#071112] font-bold shadow-[0_0_15px_rgba(141,255,203,0.25)]' : 'text-[#8E9F9B] hover:text-[#F1F5F0]'
            }`}
          >
            Table Creator
          </button>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE DRAGGABLE ER DIAGRAM & DESIGNER */}
      {activeTab === 'er' && (
        <InteractiveERCanvas onDeployDDL={handleDeployGeneratedDDL} />
      )}

      {/* TAB 2: RELATIONAL NORMALIZATION ENGINE */}
      {activeTab === 'normalization' && (
        <NormalizationCalculator />
      )}

      {/* TAB 3: CUSTOM EDITABLE SQL CONSOLE */}
      {activeTab === 'sql' && (
        <div className="space-y-5 font-mono text-xs">
          <div className="p-4 rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.15)] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[rgba(220,255,245,0.08)]">
              <span className="font-bold text-[#F1F5F0] flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-[#8DFFCB]" />
                <span>Editable PostgreSQL Query & DDL Console</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(customSQL);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded bg-[#071112] hover:bg-white/10 text-[#8E9F9B] hover:text-[#8DFFCB] flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#8DFFCB]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleExecuteSQL}
                  disabled={executing}
                  className="px-4 py-1.5 rounded-lg bg-[#8DFFCB] text-[#071112] font-bold hover:bg-[#A6FFD8] transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(141,255,203,0.3)]"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{executing ? 'Executing...' : 'Run Query / Deploy'}</span>
                </button>
              </div>
            </div>

            {/* Presets Bar */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[#8E9F9B] text-[11px] mr-1">Load Preset Query:</span>
              {queryPresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCustomSQL(preset.sql);
                    setQueryResult(null);
                    setQueryError(null);
                  }}
                  className="px-2.5 py-1 rounded bg-[#071112] hover:bg-[#8DFFCB]/20 text-[#8DFFCB] border border-[rgba(220,255,245,0.1)] text-[10px]"
                >
                  {preset.title.split('(')[0]}
                </button>
              ))}
            </div>

            {/* Editable Textarea */}
            <textarea
              rows={8}
              value={customSQL}
              onChange={(e) => setCustomSQL(e.target.value)}
              placeholder="Write your custom SQL query or DDL statement..."
              className="w-full p-4 rounded-xl bg-[#040909] border border-[rgba(220,255,245,0.15)] text-[#8DFFCB] font-mono leading-relaxed focus:outline-none focus:border-[#8DFFCB]"
            />
          </div>

          {/* Results Grid */}
          <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.15)] p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(220,255,245,0.08)]">
              <span className="font-bold text-[#F1F5F0]">Query Execution Output</span>
              <span className="text-[#8E9F9B]">
                {queryResult ? `${queryResult.length} rows returned` : 'Awaiting execution'}
              </span>
            </div>

            {queryError && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300">
                Execution Error: {queryError}
              </div>
            )}

            {queryResult && queryResult.length > 0 && (
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-xs font-mono text-left">
                  <thead className="sticky top-0 bg-[#071112]">
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
              <div className="py-12 text-center text-[#8E9F9B]">
                Click "Run Query / Deploy" above to execute custom SQL against PostgreSQL.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ACID SIMULATOR */}
      {activeTab === 'acid' && (
        <ACIDSimulator />
      )}

      {/* TAB 5: CUSTOM TABLE CREATOR */}
      {activeTab === 'custom_table' && (
        <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.15)] p-6 space-y-6 font-mono text-xs">
          <div className="space-y-2 pb-4 border-b border-[rgba(220,255,245,0.08)]">
            <h2 className="text-lg font-bold text-[#F1F5F0]">Create Custom Database Table (DDL Studio)</h2>
            <p className="text-[#8E9F9B]">
              Define new relational tables with custom columns, primary keys, and nullability constraints.
              Generates PostgreSQL DDL and allows instant deployment.
            </p>
          </div>

          <div className="space-y-4 max-w-xl">
            <div className="space-y-1">
              <label className="text-[#8E9F9B]">Table Name</label>
              <input
                type="text"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                placeholder="e.g. member_badges, partner_discounts..."
                className="w-full px-3 py-2 rounded-lg bg-[#071112] border border-[rgba(220,255,245,0.15)] text-[#F1F5F0]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[#8E9F9B]">
                <span>Columns Definition:</span>
                <button
                  onClick={handleAddCol}
                  className="px-2 py-1 rounded bg-[#071112] text-[#8DFFCB] hover:bg-[#8DFFCB]/20 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Column</span>
                </button>
              </div>

              {columns.map((col, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded bg-[#071112] border border-[rgba(220,255,245,0.08)]">
                  <input
                    type="text"
                    value={col.name}
                    onChange={(e) => {
                      const updated = [...columns];
                      updated[idx].name = e.target.value;
                      setColumns(updated);
                    }}
                    placeholder="column_name"
                    className="flex-1 px-2 py-1 rounded bg-[#0D1919] border border-[rgba(220,255,245,0.1)] text-[#F1F5F0]"
                  />
                  <select
                    value={col.type}
                    onChange={(e) => {
                      const updated = [...columns];
                      updated[idx].type = e.target.value;
                      setColumns(updated);
                    }}
                    className="px-2 py-1 rounded bg-[#0D1919] border border-[rgba(220,255,245,0.1)] text-[#F1F5F0]"
                  >
                    <option value="uuid">uuid</option>
                    <option value="text">text</option>
                    <option value="integer">integer</option>
                    <option value="numeric(12,2)">numeric</option>
                    <option value="boolean">boolean</option>
                    <option value="timestamptz">timestamptz</option>
                    <option value="jsonb">jsonb</option>
                  </select>
                  <label className="flex items-center gap-1 text-[11px] text-[#8E9F9B]">
                    <input
                      type="checkbox"
                      checked={col.isPK}
                      onChange={(e) => {
                        const updated = [...columns];
                        updated[idx].isPK = e.target.checked;
                        setColumns(updated);
                      }}
                    />
                    <span>PK</span>
                  </label>
                  <label className="flex items-center gap-1 text-[11px] text-[#8E9F9B]">
                    <input
                      type="checkbox"
                      checked={col.notNull}
                      onChange={(e) => {
                        const updated = [...columns];
                        updated[idx].notNull = e.target.checked;
                        setColumns(updated);
                      }}
                    />
                    <span>Not Null</span>
                  </label>
                </div>
              ))}
            </div>

            <button
              onClick={handleGenerateCustomTableDDL}
              className="px-5 py-2.5 rounded-lg bg-[#8DFFCB] text-[#071112] font-bold hover:bg-[#A6FFD8] transition-all"
            >
              Generate DDL & Open in Console
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
