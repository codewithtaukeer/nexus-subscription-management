import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  RotateCcw, 
  Copy, 
  Check, 
  Download, 
  Bookmark, 
  History, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  Code, 
  Layers, 
  CheckCircle2, 
  FileText, 
  Trash2, 
  ChevronRight,
  Database
} from 'lucide-react';
import { workspaceService } from '../../services/workspaceService';
import type { DatabaseWorkspace, QueryExecutionResult } from '../../services/workspaceService';

interface SQLStudioWorkbenchProps {
  activeWorkspace: DatabaseWorkspace;
  onTableCreatedOrModified?: () => void;
  initialSQL?: string;
}

interface SavedQuery {
  id: string;
  name: string;
  sql: string;
  workspaceId: string;
}

interface HistoryItem {
  id: string;
  sql: string;
  timestamp: string;
  durationMs: number;
  success: boolean;
  affectedRows: number;
}

export const SQLStudioWorkbench: React.FC<SQLStudioWorkbenchProps> = ({
  activeWorkspace,
  onTableCreatedOrModified,
  initialSQL,
}) => {
  const [sql, setSql] = useState<string>(
    initialSQL ||
    `-- SQL Studio • Connected to: ${activeWorkspace.name}\nSELECT \n    m.full_name,\n    m.email,\n    mp.name AS plan_name,\n    s.status AS subscription_status,\n    s.billing_cycle,\n    s.price_at_signup,\n    s.current_period_end\nFROM subscriptions s\nJOIN members m ON s.member_id = m.id\nJOIN membership_plans mp ON s.plan_id = mp.id\nORDER BY s.current_period_end ASC;\n`
  );

  useEffect(() => {
    if (initialSQL) {
      setSql(initialSQL);
    }
  }, [initialSQL]);

  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<QueryExecutionResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [queryName, setQueryName] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeSidePanel, setActiveSidePanel] = useState<'starters' | 'history' | 'saved'>('starters');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load saved queries and history from localStorage
  useEffect(() => {
    try {
      const storedSaved = localStorage.getItem(`nexus_saved_queries_${activeWorkspace.id}`);
      if (storedSaved) setSavedQueries(JSON.parse(storedSaved));

      const storedHistory = localStorage.getItem(`nexus_history_${activeWorkspace.id}`);
      if (storedHistory) setHistory(JSON.parse(storedHistory));
    } catch {
      // ignore storage error
    }
  }, [activeWorkspace.id]);

  const saveHistory = (newItem: HistoryItem) => {
    const updated = [newItem, ...history.slice(0, 49)];
    setHistory(updated);
    try {
      localStorage.setItem(`nexus_history_${activeWorkspace.id}`, JSON.stringify(updated));
    } catch {}
  };

  const handleExecute = async () => {
    // Check if user selected text in textarea
    let sqlToRun = sql;
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      if (start !== end) {
        const selected = sql.substring(start, end).trim();
        if (selected.length > 0) sqlToRun = selected;
      }
    }

    if (!sqlToRun.trim()) return;

    setExecuting(true);
    try {
      const res = await workspaceService.executeSQL(activeWorkspace.id, sqlToRun);
      setResult(res);

      saveHistory({
        id: Math.random().toString(36).substring(2, 9),
        sql: sqlToRun,
        timestamp: new Date().toLocaleTimeString(),
        durationMs: res.durationMs,
        success: !res.error,
        affectedRows: res.affectedRows,
      });

      if (!res.error && (
        res.command === 'CREATE' || 
        res.command === 'DROP' || 
        res.command === 'ALTER' || 
        res.command.startsWith('BATCH') || 
        /CREATE|DROP|ALTER/i.test(sqlToRun)
      )) {
        if (onTableCreatedOrModified) onTableCreatedOrModified();
      }
    } catch (err: any) {
      setResult({
        rows: [],
        fields: [],
        affectedRows: 0,
        durationMs: 0,
        command: 'ERROR',
        error: err.message,
      });
    } finally {
      setExecuting(false);
    }
  };

  // Keyboard shortcut Ctrl+Enter / Cmd+Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
  };

  const handleSaveQuery = () => {
    if (!queryName.trim()) return;
    const newSaved: SavedQuery = {
      id: Math.random().toString(36).substring(2, 9),
      name: queryName.trim(),
      sql: sql.trim(),
      workspaceId: activeWorkspace.id,
    };
    const updated = [newSaved, ...savedQueries];
    setSavedQueries(updated);
    try {
      localStorage.setItem(`nexus_saved_queries_${activeWorkspace.id}`, JSON.stringify(updated));
    } catch {}
    setSaveModalOpen(false);
    setQueryName('');
  };

  const handleDeleteSaved = (id: string) => {
    const updated = savedQueries.filter((q) => q.id !== id);
    setSavedQueries(updated);
    try {
      localStorage.setItem(`nexus_saved_queries_${activeWorkspace.id}`, JSON.stringify(updated));
    } catch {}
  };

  const handleExportCSV = () => {
    if (!result || !result.rows || result.rows.length === 0) return;
    const fields = result.fields;
    const csvRows = [
      fields.join(','),
      ...result.rows.map((r) =>
        fields
          .map((f) => {
            const val = r[f];
            if (val === null || val === undefined) return '';
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_query_result_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    if (!result || !result.rows) return;
    const blob = new Blob([JSON.stringify(result.rows, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_query_result_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatSQL = () => {
    // Basic SQL formatter
    const formatted = sql
      .replace(/\s+/g, ' ')
      .replace(/\s*(SELECT|FROM|WHERE|JOIN|LEFT JOIN|RIGHT JOIN|ORDER BY|GROUP BY|HAVING|LIMIT|INSERT INTO|VALUES|UPDATE|SET|DELETE FROM)\s*/gi, '\n$1 ')
      .trim();
    setSql(formatted);
  };

  const starterQueries = [
    {
      title: '1. Multi-Table JOIN (Subscriptions + Members + Plans)',
      desc: 'Retrieves all subscriptions with customer profiles and membership tier names.',
      sql: `SELECT \n    m.full_name,\n    m.email,\n    mp.name AS plan_name,\n    s.status AS subscription_status,\n    s.billing_cycle,\n    s.price_at_signup,\n    s.current_period_end\nFROM subscriptions s\nJOIN members m ON s.member_id = m.id\nJOIN membership_plans mp ON s.plan_id = mp.id\nORDER BY s.current_period_end ASC;`,
    },
    {
      title: '2. Nested Subquery (Invoices Above Average Total)',
      desc: 'Scalar subquery computing AVG total amount across paid invoices.',
      sql: `SELECT \n    m.full_name,\n    i.invoice_number,\n    i.total_amount\nFROM invoices i\nJOIN members m ON i.member_id = m.id\nWHERE i.status = 'paid'\n  AND i.total_amount > (\n      SELECT AVG(total_amount) FROM invoices WHERE status = 'paid'\n  );`,
    },
    {
      title: '3. Correlated Subquery (Members with No Active Subscriptions)',
      desc: 'Demonstrates correlated NOT EXISTS test against subscriptions relation.',
      sql: `SELECT \n    m.id,\n    m.full_name,\n    m.email,\n    m.role\nFROM members m\nWHERE NOT EXISTS (\n    SELECT 1 \n    FROM subscriptions s\n    WHERE s.member_id = m.id \n      AND s.status IN ('active', 'trialing')\n);`,
    },
    {
      title: '4. Aggregation with GROUP BY & HAVING (High-Volume Plans)',
      desc: 'Aggregates total subscribers and recurring revenue per plan, filtering > 0 members.',
      sql: `SELECT \n    mp.name AS plan_name,\n    COUNT(s.id) AS active_subscribers,\n    SUM(s.price_at_signup) AS estimated_mrr\nFROM membership_plans mp\nLEFT JOIN subscriptions s ON mp.id = s.plan_id AND s.status = 'active'\nGROUP BY mp.id, mp.name\nHAVING COUNT(s.id) >= 1\nORDER BY estimated_mrr DESC;`,
    },
    {
      title: '5. DDL: Create New Relation with PK, FK, & Constraints',
      desc: 'Defines an academic coupon/audit table with check constraints and foreign keys.',
      sql: `CREATE TABLE IF NOT EXISTS audit_logs (\n    id SERIAL PRIMARY KEY,\n    member_id INT REFERENCES members(id) ON DELETE SET NULL,\n    action VARCHAR(50) NOT NULL,\n    resource_type VARCHAR(50) NOT NULL,\n    details TEXT,\n    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nINSERT INTO audit_logs (member_id, action, resource_type, details) \nVALUES (1, 'WORKSPACE_DDL', 'STUDIO', 'Evaluated DDL constraints');\n\nSELECT * FROM audit_logs;`,
    },
    {
      title: '6. DML: Safe Atomic Update with Returning Result',
      desc: 'Updates customer role safely with instant tuple returning.',
      sql: `UPDATE members \nSET role = 'operator'\nWHERE email = 'sarah@cloudscale.io'\nRETURNING id, full_name, role;`,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Main Studio Area */}
      <div className="lg:col-span-8 space-y-4">
        {/* Editor Card */}
        <div className="rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] overflow-hidden shadow-xl">
          {/* Editor Header Bar */}
          <div className="px-5 py-3 border-b border-[rgba(220,255,245,0.1)] bg-[#071112] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-[#8DFFCB]" />
              <span className="font-mono text-xs font-semibold text-[#F1F5F0]">SQL Editor</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#8DFFCB]/10 text-[#8DFFCB] border border-[#8DFFCB]/20">
                {activeWorkspace.engineLabel}
              </span>
              {activeWorkspace.isReadOnly && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Read-Only (SELECT Only)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={formatSQL}
                className="px-2.5 py-1 rounded-md bg-[#122222] border border-[rgba(220,255,245,0.1)] text-[11px] font-mono text-[#8E9F9B] hover:text-[#F1F5F0] transition-colors"
                title="Format SQL query"
              >
                Format
              </button>
              <button
                onClick={() => setSql('')}
                className="px-2.5 py-1 rounded-md bg-[#122222] border border-[rgba(220,255,245,0.1)] text-[11px] font-mono text-[#8E9F9B] hover:text-red-400 transition-colors"
                title="Clear buffer"
              >
                Clear
              </button>
              <button
                onClick={() => setSaveModalOpen(true)}
                className="px-2.5 py-1 rounded-md bg-[#122222] border border-[rgba(220,255,245,0.1)] text-[11px] font-mono text-[#8E9F9B] hover:text-[#8DFFCB] transition-colors flex items-center gap-1"
                title="Save query"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
              <button
                onClick={handleExecute}
                disabled={executing}
                className="px-4 py-1.5 rounded-lg bg-[#8DFFCB] text-[#071112] text-xs font-mono font-bold hover:bg-[#A6FFD8] hover:shadow-[0_0_20px_rgba(141,255,203,0.3)] transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{executing ? 'Executing...' : 'Run (Ctrl+Enter)'}</span>
              </button>
            </div>
          </div>

          {/* Textarea */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={11}
              placeholder="Write multiline PostgreSQL statement or SELECT query here..."
              className="w-full p-4 bg-[#081213] text-[#F1F5F0] font-mono text-xs sm:text-sm leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-[#8DFFCB]/40 selection:bg-[#8DFFCB]/30"
              spellCheck={false}
            />
          </div>

          <div className="px-4 py-2 border-t border-[rgba(220,255,245,0.06)] bg-[#071112] text-[11px] font-mono text-[#8E9F9B] flex items-center justify-between">
            <div>
              Tip: Highlight a statement to run only that part, or press <kbd className="px-1 py-0.5 rounded bg-[#122222] text-[#8DFFCB]">Ctrl</kbd> + <kbd className="px-1 py-0.5 rounded bg-[#122222] text-[#8DFFCB]">Enter</kbd>.
            </div>
            <div>{sql.split('\n').length} lines • {sql.length} chars</div>
          </div>
        </div>

        {/* Query Results Card */}
        <div className="rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] overflow-hidden shadow-xl">
          {/* Results Bar */}
          <div className="px-5 py-3 border-b border-[rgba(220,255,245,0.1)] bg-[#071112] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-semibold text-[#F1F5F0]">Result Set</span>
              {result && !result.error && (
                <div className="flex items-center gap-2 text-xs font-mono text-[#8DFFCB]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {result.command} • {result.affectedRows} row{result.affectedRows === 1 ? '' : 's'} affected
                  </span>
                  <span className="text-[#8E9F9B]">({result.durationMs}ms)</span>
                </div>
              )}
              {result?.error && (
                <div className="flex items-center gap-1.5 text-xs font-mono text-red-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Execution Failed ({result.durationMs}ms)</span>
                </div>
              )}
            </div>

            {result && result.rows && result.rows.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="px-2.5 py-1 rounded bg-[#122222] border border-[rgba(220,255,245,0.1)] text-[11px] font-mono text-[#8E9F9B] hover:text-[#8DFFCB] transition-colors flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={handleExportJSON}
                  className="px-2.5 py-1 rounded bg-[#122222] border border-[rgba(220,255,245,0.1)] text-[11px] font-mono text-[#8E9F9B] hover:text-[#8DFFCB] transition-colors flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>JSON</span>
                </button>
              </div>
            )}
          </div>

          {/* Results Viewport */}
          <div className="p-4 overflow-x-auto min-h-[160px] max-h-[380px] bg-[#0A1414]">
            {result?.error ? (
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-xs font-mono text-red-300 space-y-2">
                <div className="font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span>PostgreSQL Engine Diagnostic:</span>
                </div>
                <div className="whitespace-pre-wrap leading-relaxed">{result.error}</div>
              </div>
            ) : result && result.rows && result.rows.length > 0 ? (
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[rgba(220,255,245,0.15)] bg-[#071112]">
                    <th className="p-2.5 text-[#8E9F9B] font-semibold w-12 text-center">#</th>
                    {result.fields.map((f) => (
                      <th key={f} className="p-2.5 text-[#8DFFCB] font-semibold uppercase tracking-wider">
                        {f}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(220,255,245,0.06)]">
                  {result.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#122222]/50 transition-colors">
                      <td className="p-2.5 text-[#8E9F9B] text-center">{idx + 1}</td>
                      {result.fields.map((f) => {
                        const cell = row[f];
                        const isNull = cell === null || cell === undefined;
                        const isBoolean = typeof cell === 'boolean';
                        return (
                          <td key={f} className="p-2.5 text-[#F1F5F0]">
                            {isNull ? (
                              <span className="text-[#8E9F9B] italic opacity-60">NULL</span>
                            ) : isBoolean ? (
                              <span className={cell ? 'text-[#8DFFCB]' : 'text-amber-400'}>
                                {cell ? 'TRUE' : 'FALSE'}
                              </span>
                            ) : typeof cell === 'object' ? (
                              JSON.stringify(cell)
                            ) : (
                              String(cell)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : result && !result.error ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#8DFFCB]" />
                <div className="font-mono text-xs text-[#F1F5F0]">
                  Statement executed successfully with no returned rows.
                </div>
                <div className="text-[11px] text-[#8E9F9B]">
                  Command: {result.command} • Affected Rows: {result.affectedRows}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-2 text-[#8E9F9B]">
                <Database className="w-8 h-8 opacity-40 text-[#8DFFCB]" />
                <div className="font-mono text-xs">No query executed yet.</div>
                <div className="text-[11px]">
                  Write a SQL query or choose one from the starter queries on the right.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Side Panel: Starters, History, Saved */}
      <div className="lg:col-span-4 rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] overflow-hidden shadow-xl">
        {/* Tab switcher */}
        <div className="grid grid-cols-3 border-b border-[rgba(220,255,245,0.1)] bg-[#071112]">
          <button
            onClick={() => setActiveSidePanel('starters')}
            className={`py-3 text-[11px] font-mono font-medium transition-colors border-b-2 ${
              activeSidePanel === 'starters'
                ? 'border-[#8DFFCB] text-[#8DFFCB] bg-[#0A1414]'
                : 'border-transparent text-[#8E9F9B] hover:text-[#F1F5F0]'
            }`}
          >
            Starters ({starterQueries.length})
          </button>
          <button
            onClick={() => setActiveSidePanel('saved')}
            className={`py-3 text-[11px] font-mono font-medium transition-colors border-b-2 ${
              activeSidePanel === 'saved'
                ? 'border-[#8DFFCB] text-[#8DFFCB] bg-[#0A1414]'
                : 'border-transparent text-[#8E9F9B] hover:text-[#F1F5F0]'
            }`}
          >
            Saved ({savedQueries.length})
          </button>
          <button
            onClick={() => setActiveSidePanel('history')}
            className={`py-3 text-[11px] font-mono font-medium transition-colors border-b-2 ${
              activeSidePanel === 'history'
                ? 'border-[#8DFFCB] text-[#8DFFCB] bg-[#0A1414]'
                : 'border-transparent text-[#8E9F9B] hover:text-[#F1F5F0]'
            }`}
          >
            History ({history.length})
          </button>
        </div>

        {/* Panel Content */}
        <div className="p-4 max-h-[580px] overflow-y-auto space-y-3">
          {activeSidePanel === 'starters' && (
            <>
              <div className="text-[11px] text-[#8E9F9B] leading-relaxed mb-2 font-mono">
                Click any canonical query to load it into the editor:
              </div>
              {starterQueries.map((q, idx) => (
                <div
                  key={idx}
                  onClick={() => setSql(q.sql)}
                  className="p-3.5 rounded-xl bg-[#0A1414] border border-[rgba(220,255,245,0.08)] hover:border-[#8DFFCB]/50 hover:bg-[#122222] transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-[#F1F5F0] group-hover:text-[#8DFFCB] transition-colors">
                      {q.title}
                    </h4>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8E9F9B] group-hover:text-[#8DFFCB] transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="text-[11px] text-[#8E9F9B] mt-1 leading-snug">{q.desc}</p>
                </div>
              ))}
            </>
          )}

          {activeSidePanel === 'saved' && (
            <>
              {savedQueries.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#8E9F9B] space-y-1">
                  <div>No queries saved yet.</div>
                  <div className="text-[10px]">Use the "Save" button in the editor toolbar.</div>
                </div>
              ) : (
                savedQueries.map((sq) => (
                  <div
                    key={sq.id}
                    className="p-3.5 rounded-xl bg-[#0A1414] border border-[rgba(220,255,245,0.08)] flex items-start justify-between gap-2"
                  >
                    <div
                      className="cursor-pointer flex-1"
                      onClick={() => setSql(sq.sql)}
                    >
                      <h4 className="text-xs font-semibold text-[#F1F5F0] hover:text-[#8DFFCB] transition-colors">
                        {sq.name}
                      </h4>
                      <pre className="text-[10px] font-mono text-[#8E9F9B] truncate mt-1">
                        {sq.sql.split('\n')[0]}
                      </pre>
                    </div>
                    <button
                      onClick={() => handleDeleteSaved(sq.id)}
                      className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      title="Delete saved query"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </>
          )}

          {activeSidePanel === 'history' && (
            <>
              {history.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#8E9F9B]">No recent query executions.</div>
              ) : (
                history.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => setSql(h.sql)}
                    className="p-3 rounded-xl bg-[#0A1414] border border-[rgba(220,255,245,0.08)] hover:border-[#8DFFCB]/40 cursor-pointer transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className={h.success ? 'text-[#8DFFCB]' : 'text-red-400'}>
                        {h.success ? `SUCCESS (${h.durationMs}ms)` : 'ERROR'}
                      </span>
                      <span className="text-[#8E9F9B]">{h.timestamp}</span>
                    </div>
                    <pre className="text-[11px] font-mono text-[#F1F5F0] truncate">{h.sql.split('\n')[0]}</pre>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>

      {/* Save Query Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0D1919] border border-[rgba(220,255,245,0.2)] rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-[#F1F5F0]">Save Query</h3>
            <p className="text-xs text-[#8E9F9B]">
              Assign a recognizable name to this SQL snippet for workspace "{activeWorkspace.name}".
            </p>
            <input
              type="text"
              value={queryName}
              onChange={(e) => setQueryName(e.target.value)}
              placeholder="e.g. Monthly Revenue Breakdown"
              className="w-full px-4 py-2.5 rounded-lg bg-[#071112] border border-[rgba(220,255,245,0.2)] text-sm text-[#F1F5F0] focus:outline-none focus:border-[#8DFFCB]"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#122222] text-[#8E9F9B] text-xs font-mono"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuery}
                disabled={!queryName.trim()}
                className="px-5 py-2 rounded-lg bg-[#8DFFCB] text-[#071112] text-xs font-mono font-semibold hover:bg-[#A6FFD8] disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
