import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Search, 
  RefreshCw, 
  Key, 
  Link2, 
  Table as TableIcon, 
  Layers, 
  Copy, 
  Check, 
  ArrowUpRight, 
  FileCode, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { workspaceService } from '../../services/workspaceService';
import type { DatabaseWorkspace, IntrospectedTable } from '../../services/workspaceService';
import { InteractiveERCanvas } from './InteractiveERCanvas';
import type { ERTable, ERRelation } from './InteractiveERCanvas';

interface SchemaExplorerWorkbenchProps {
  activeWorkspace: DatabaseWorkspace;
  onOpenTableInSQLStudio: (tableName: string) => void;
}

export const SchemaExplorerWorkbench: React.FC<SchemaExplorerWorkbenchProps> = ({
  activeWorkspace,
  onOpenTableInSQLStudio,
}) => {
  const [tables, setTables] = useState<IntrospectedTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'explorer' | 'er_diagram' | 'ddl_import'>('explorer');
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // DDL Import Preview state
  const [ddlText, setDdlText] = useState<string>(
    `CREATE TABLE instructors (\n    id SERIAL PRIMARY KEY,\n    name VARCHAR(100) NOT NULL,\n    email VARCHAR(100) UNIQUE NOT NULL,\n    department VARCHAR(50)\n);\n\nCREATE TABLE courses (\n    code VARCHAR(10) PRIMARY KEY,\n    title VARCHAR(100) NOT NULL,\n    credits INT DEFAULT 3,\n    instructor_id INT REFERENCES instructors(id) ON DELETE CASCADE\n);\n`
  );
  const [parsedDDLTables, setParsedDDLTables] = useState<ERTable[]>([]);
  const [ddlDiagnostics, setDdlDiagnostics] = useState<string[]>([]);

  // Load schema from workspaceService
  const loadSchema = async () => {
    setLoading(true);
    try {
      const data = await workspaceService.introspectSchema(activeWorkspace.id);
      setTables(data);
      // Auto-expand first 3 tables
      const exp: Record<string, boolean> = {};
      data.slice(0, 3).forEach((t) => {
        exp[t.name] = true;
      });
      setExpandedTables(exp);
    } catch (err) {
      console.error('Failed to load schema', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchema();
  }, [activeWorkspace.id]);

  const toggleTableExpand = (tableName: string) => {
    setExpandedTables((prev) => ({ ...prev, [tableName]: !prev[tableName] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 1800);
  };

  const filteredTables = tables.filter((t) => {
    const q = searchQuery.toLowerCase();
    if (t.name.toLowerCase().includes(q)) return true;
    return t.columns.some((c) => c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q));
  });

  // Convert introspected tables into ER canvas nodes with dynamic coordinates
  const erCanvasTables: ERTable[] = tables.map((t, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const colors = ['#8DFFCB', '#38BDF8', '#D9FF72', '#F472B6', '#A78BFA', '#FBBF24'];
    return {
      id: t.name,
      name: t.name,
      x: 40 + col * 340,
      y: 40 + row * 280,
      color: colors[idx % colors.length],
      columns: t.columns.map((c) => ({
        name: c.name,
        type: c.type,
        isPK: c.isPK,
        isFK: c.isFK,
        refTable: c.refTable,
      })),
    };
  });

  // Calculate real FK relations from introspected schema
  const workspaceRelations: ERRelation[] = [];
  tables.forEach((t) => {
    t.columns.forEach((c) => {
      if (c.isFK && c.refTable) {
        workspaceRelations.push({
          fromTable: c.refTable,
          fromCol: c.refColumn || 'id',
          toTable: t.name,
          toCol: c.name,
          type: '1:N',
        });
      }
    });
  });

  // Export Mermaid ER format
  const exportMermaid = () => {
    let mermaid = 'erDiagram\n';
    tables.forEach((t) => {
      mermaid += `    ${t.name} {\n`;
      t.columns.forEach((c) => {
        const pk = c.isPK ? 'PK' : c.isFK ? 'FK' : '';
        mermaid += `        ${c.type} ${c.name} ${pk}\n`;
      });
      mermaid += `    }\n`;

      t.columns
        .filter((c) => c.isFK && c.refTable)
        .forEach((c) => {
          mermaid += `    ${c.refTable} ||--o{ ${t.name} : "references"\n`;
        });
    });

    const blob = new Blob([mermaid], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeWorkspace.name.replace(/\s+/g, '_')}_schema.mermaid`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export DBML format
  const exportDBML = () => {
    let dbml = `// DBML Export for ${activeWorkspace.name}\n\n`;
    tables.forEach((t) => {
      dbml += `Table ${t.name} {\n`;
      t.columns.forEach((c) => {
        const pk = c.isPK ? ' [pk]' : '';
        const notNull = !c.isNullable ? ' [not null]' : '';
        dbml += `  ${c.name} ${c.type}${pk}${notNull}\n`;
      });
      dbml += `}\n\n`;

      t.columns
        .filter((c) => c.isFK && c.refTable && c.refColumn)
        .forEach((c) => {
          dbml += `Ref: ${t.name}.${c.name} > ${c.refTable}.${c.refColumn}\n`;
        });
    });

    const blob = new Blob([dbml], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeWorkspace.name.replace(/\s+/g, '_')}_schema.dbml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Parse DDL Text into ER Tables for preview without executing
  const handleParseDDL = () => {
    const diag: string[] = [];
    const parsed: ERTable[] = [];

    const statements = ddlText
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    let idx = 0;
    for (const stmt of statements) {
      const createMatch = stmt.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)\s*\(([\s\S]+)\)/i);
      if (!createMatch) {
        if (stmt.toUpperCase().startsWith('CREATE TABLE')) {
          diag.push(`Malformed CREATE TABLE statement: "${stmt.substring(0, 40)}..."`);
        }
        continue;
      }

      const tableName = createMatch[1];
      const body = createMatch[2];
      const lines = body.split(',\n').map((l) => l.trim());

      const cols = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.toUpperCase().startsWith('CONSTRAINT') || trimmed.toUpperCase().startsWith('PRIMARY KEY')) {
          continue;
        }

        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2) {
          const colName = parts[0].replace(/"/g, '');
          const colType = parts[1];
          const isPK = /PRIMARY\s+KEY/i.test(trimmed);
          const isFK = /REFERENCES\s+([a-zA-Z0-9_]+)/i.test(trimmed);
          const refMatch = trimmed.match(/REFERENCES\s+([a-zA-Z0-9_]+)/i);

          cols.push({
            name: colName,
            type: colType,
            isPK,
            isFK,
            refTable: refMatch ? refMatch[1] : undefined,
          });
        }
      }

      parsed.push({
        id: tableName,
        name: tableName,
        x: 40 + (idx % 3) * 260,
        y: 40 + Math.floor(idx / 3) * 220,
        columns: cols,
      });
      idx++;
    }

    if (parsed.length === 0) {
      diag.push('No valid CREATE TABLE statements parsed. Please check syntax.');
    } else {
      diag.push(`Successfully parsed ${parsed.length} table definitions without database mutation.`);
    }

    setParsedDDLTables(parsed);
    setDdlDiagnostics(diag);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with Workspace Status and Mode Switcher */}
      <div className="p-5 rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#8DFFCB]/10 text-[#8DFFCB] border border-[#8DFFCB]/30 font-semibold">
              Introspected Schema
            </span>
            <span className="text-xs font-mono text-[#8E9F9B]">{activeWorkspace.engineLabel}</span>
          </div>
          <h2 className="text-xl font-bold text-[#F1F5F0]">
            Schema Explorer & Interactive ER Canvas
          </h2>
          <p className="text-xs text-[#8E9F9B]">
            Inspecting {tables.length} tables and views in workspace "{activeWorkspace.name}".
          </p>
        </div>

        {/* View Switcher & Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl bg-[#071112] p-1 border border-[rgba(220,255,245,0.1)]">
            <button
              onClick={() => setActiveView('explorer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                activeView === 'explorer'
                  ? 'bg-[#122424] text-[#8DFFCB] shadow-sm'
                  : 'text-[#8E9F9B] hover:text-[#F1F5F0]'
              }`}
            >
              Schema Tree
            </button>
            <button
              onClick={() => setActiveView('er_diagram')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                activeView === 'er_diagram'
                  ? 'bg-[#122424] text-[#8DFFCB] shadow-sm'
                  : 'text-[#8E9F9B] hover:text-[#F1F5F0]'
              }`}
            >
              Interactive ER Diagram
            </button>
            <button
              onClick={() => setActiveView('ddl_import')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                activeView === 'ddl_import'
                  ? 'bg-[#122424] text-[#8DFFCB] shadow-sm'
                  : 'text-[#8E9F9B] hover:text-[#F1F5F0]'
              }`}
            >
              Preview from DDL
            </button>
          </div>

          <button
            onClick={loadSchema}
            disabled={loading}
            className="p-2 rounded-xl bg-[#122222] border border-[rgba(220,255,245,0.15)] text-[#8E9F9B] hover:text-[#8DFFCB] transition-colors"
            title="Refresh Introspection"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#8DFFCB]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Explorer Mode: Tables & Columns Tree */}
      {activeView === 'explorer' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)]">
            <Search className="w-4 h-4 text-[#8E9F9B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter relations by table or column name..."
              className="bg-transparent flex-1 text-xs text-[#F1F5F0] placeholder-[#8E9F9B] focus:outline-none font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[11px] font-mono text-[#8E9F9B] hover:text-[#F1F5F0]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Table Cards */}
          {loading ? (
            <div className="text-center py-16 text-xs text-[#8E9F9B] font-mono">
              Introspecting workspace schema relations...
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="text-center py-16 rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.1)] text-xs text-[#8E9F9B] space-y-2">
              <TableIcon className="w-8 h-8 mx-auto opacity-30 text-[#8DFFCB]" />
              <div className="font-mono text-[#F1F5F0]">No relations found matching query.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTables.map((table) => {
                const isExpanded = expandedTables[table.name] ?? false;
                const pkCols = table.columns.filter((c) => c.isPK);
                const fkCols = table.columns.filter((c) => c.isFK);

                return (
                  <div
                    key={table.name}
                    className="rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] overflow-hidden shadow-lg transition-all"
                  >
                    {/* Header */}
                    <div
                      onClick={() => toggleTableExpand(table.name)}
                      className="p-4 bg-[#0A1414] border-b border-[rgba(220,255,245,0.08)] flex items-center justify-between cursor-pointer hover:bg-[#102020] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-[#8DFFCB]" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-[#8E9F9B]" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#F1F5F0] font-mono">
                              {table.name}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#8DFFCB]/10 text-[#8DFFCB] border border-[#8DFFCB]/20">
                              {table.type}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-[#8E9F9B] mt-0.5">
                            {table.columns.length} columns • {table.rowCount ?? 0} rows
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => copyToClipboard(table.name)}
                          title="Copy table name"
                          className="p-1.5 rounded-lg bg-[#122222] text-[#8E9F9B] hover:text-[#8DFFCB] transition-colors"
                        >
                          {copiedText === table.name ? (
                            <Check className="w-3.5 h-3.5 text-[#8DFFCB]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => onOpenTableInSQLStudio(table.name)}
                          title="Query table in SQL Studio"
                          className="px-2.5 py-1.5 rounded-lg bg-[#8DFFCB]/10 border border-[#8DFFCB]/30 text-[#8DFFCB] text-[11px] font-mono hover:bg-[#8DFFCB]/20 transition-colors flex items-center gap-1"
                        >
                          <span>Query</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Columns List */}
                    {isExpanded && (
                      <div className="p-4 space-y-2 bg-[#071112]">
                        <table className="w-full text-left font-mono text-xs">
                          <thead>
                            <tr className="border-b border-[rgba(220,255,245,0.08)] text-[10px] uppercase text-[#8E9F9B]">
                              <th className="pb-2">Column</th>
                              <th className="pb-2">Type</th>
                              <th className="pb-2">Attributes</th>
                              <th className="pb-2 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[rgba(220,255,245,0.04)]">
                            {table.columns.map((col) => (
                              <tr key={col.name} className="hover:bg-[#122222]/40 transition-colors">
                                <td className="py-2 flex items-center gap-1.5">
                                  {col.isPK && (
                                    <span title="Primary Key">
                                      <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    </span>
                                  )}
                                  {col.isFK && (
                                    <span title="Foreign Key">
                                      <Link2 className="w-3.5 h-3.5 text-[#8DFFCB] shrink-0" />
                                    </span>
                                  )}
                                  <span className={`font-semibold ${col.isPK ? 'text-amber-300' : 'text-[#F1F5F0]'}`}>
                                    {col.name}
                                  </span>
                                </td>
                                <td className="py-2 text-[#8E9F9B]">{col.type}</td>
                                <td className="py-2">
                                  <div className="flex flex-wrap items-center gap-1">
                                    {col.isPK && (
                                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/40">
                                        PK
                                      </span>
                                    )}
                                    {col.isFK && col.refTable && (
                                      <span className="text-[9px] px-1 py-0.2 rounded bg-[#8DFFCB]/20 text-[#8DFFCB] font-bold border border-[#8DFFCB]/40">
                                        FK → {col.refTable}.{col.refColumn}
                                      </span>
                                    )}
                                    {!col.isNullable && (
                                      <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-300">
                                        NOT NULL
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2 text-right">
                                  <button
                                    onClick={() => copyToClipboard(col.name)}
                                    className="p-1 rounded text-[#8E9F9B] hover:text-[#8DFFCB]"
                                    title="Copy column name"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ER Diagram Mode */}
      {activeView === 'er_diagram' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.1)]">
            <div className="text-xs font-mono text-[#8E9F9B] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#8DFFCB]" />
              <span>Drag entity tables anywhere to reorganize. Connector wires update live.</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportMermaid}
                className="px-3 py-1.5 rounded-lg bg-[#122222] border border-[rgba(220,255,245,0.1)] text-xs font-mono text-[#8E9F9B] hover:text-[#8DFFCB] transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Mermaid</span>
              </button>
              <button
                onClick={exportDBML}
                className="px-3 py-1.5 rounded-lg bg-[#122222] border border-[rgba(220,255,245,0.1)] text-xs font-mono text-[#8E9F9B] hover:text-[#8DFFCB] transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export DBML</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-[rgba(220,255,245,0.12)] overflow-hidden bg-[#071112]">
            <InteractiveERCanvas
              key={`${activeWorkspace.id}-${tables.length}`}
              initialTables={erCanvasTables}
              initialRelations={workspaceRelations}
              workspaceName={activeWorkspace.name}
              onOpenSQLStudio={() => onOpenTableInSQLStudio('')}
            />
          </div>
        </div>
      )}

      {/* DDL Import Preview Mode */}
      {activeView === 'ddl_import' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#F1F5F0]">Generate from DDL (Static Parser Preview)</h3>
              <p className="text-xs text-[#8E9F9B] mt-1">
                Paste raw <code className="text-[#8DFFCB]">CREATE TABLE</code> DDL statements below to parse
                entities, primary keys, and foreign key references without executing or modifying database state.
              </p>
            </div>

            <textarea
              rows={8}
              value={ddlText}
              onChange={(e) => setDdlText(e.target.value)}
              placeholder="CREATE TABLE example ( ... );"
              className="w-full p-4 bg-[#071112] text-[#F1F5F0] font-mono text-xs leading-relaxed rounded-xl border border-[rgba(220,255,245,0.15)] focus:outline-none focus:border-[#8DFFCB]"
              spellCheck={false}
            />

            <div className="flex items-center justify-between">
              <div className="text-[11px] font-mono text-[#8E9F9B]">
                Diagnostics strictly validate DDL before rendering.
              </div>
              <button
                onClick={handleParseDDL}
                className="px-5 py-2 rounded-lg bg-[#8DFFCB] text-[#071112] text-xs font-mono font-bold hover:bg-[#A6FFD8] transition-colors"
              >
                Parse & Render Diagram
              </button>
            </div>

            {ddlDiagnostics.length > 0 && (
              <div className="p-4 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.1)] space-y-1.5">
                <div className="text-xs font-mono font-bold text-[#8DFFCB]">Parser Diagnostics:</div>
                {ddlDiagnostics.map((d, i) => (
                  <div key={i} className="text-xs font-mono text-[#8E9F9B] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8DFFCB]" />
                    <span>{d}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Render Parsed Entities */}
          {parsedDDLTables.length > 0 && (
            <div className="p-6 rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] space-y-4">
              <div className="text-xs font-mono uppercase tracking-wider text-[#8DFFCB]">
                Parsed Relations ({parsedDDLTables.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {parsedDDLTables.map((t) => (
                  <div key={t.id} className="p-4 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.1)] space-y-2">
                    <div className="font-bold text-sm text-[#F1F5F0] font-mono flex items-center gap-2">
                      <TableIcon className="w-4 h-4 text-[#8DFFCB]" />
                      <span>{t.name}</span>
                    </div>
                    <div className="space-y-1 pt-1 border-t border-[rgba(220,255,245,0.06)]">
                      {t.columns.map((c) => (
                        <div key={c.name} className="flex items-center justify-between text-xs font-mono text-[#8E9F9B]">
                          <span className={c.isPK ? 'text-amber-400 font-semibold' : ''}>{c.name}</span>
                          <span className="text-[10px]">{c.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
