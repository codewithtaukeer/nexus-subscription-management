import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Key, 
  Link2, 
  Code2, 
  Check, 
  Maximize2, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut,
  Sparkles,
  Database,
  Play
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export interface ERColumn {
  name: string;
  type: string;
  isPK?: boolean;
  isFK?: boolean;
  refTable?: string;
}

export interface ERTable {
  id: string;
  name: string;
  x: number;
  y: number;
  color?: string;
  columns: ERColumn[];
}

export interface ERRelation {
  fromTable: string;
  fromCol: string;
  toTable: string;
  toCol: string;
  type: '1:1' | '1:N' | 'N:M';
}

interface InteractiveERCanvasProps {
  onDeployDDL?: (sql: string) => void;
}

const DEFAULT_NEXUS_TABLES: ERTable[] = [
  {
    id: 'profiles',
    name: 'profiles',
    x: 40,
    y: 50,
    color: '#8DFFCB',
    columns: [
      { name: 'id', type: 'uuid', isPK: true },
      { name: 'full_name', type: 'text' },
      { name: 'email', type: 'text' },
      { name: 'role', type: 'text' },
      { name: 'timezone', type: 'text' },
      { name: 'created_at', type: 'timestamptz' },
    ],
  },
  {
    id: 'membership_plans',
    name: 'membership_plans',
    x: 40,
    y: 350,
    color: '#8DFFCB',
    columns: [
      { name: 'id', type: 'uuid', isPK: true },
      { name: 'name', type: 'text' },
      { name: 'slug', type: 'text' },
      { name: 'price_monthly', type: 'numeric(12,2)' },
      { name: 'price_yearly', type: 'numeric(12,2)' },
      { name: 'currency', type: 'char(3)' },
      { name: 'trial_days', type: 'integer' },
      { name: 'status', type: 'text' },
    ],
  },
  {
    id: 'plan_features',
    name: 'plan_features',
    x: 40,
    y: 700,
    color: '#38BDF8',
    columns: [
      { name: 'id', type: 'uuid', isPK: true },
      { name: 'plan_id', type: 'uuid', isFK: true, refTable: 'membership_plans' },
      { name: 'feature_key', type: 'text' },
      { name: 'label', type: 'text' },
      { name: 'limit_value', type: 'numeric' },
      { name: 'unit', type: 'text' },
    ],
  },
  {
    id: 'subscriptions',
    name: 'subscriptions',
    x: 440,
    y: 180,
    color: '#8DFFCB',
    columns: [
      { name: 'id', type: 'uuid', isPK: true },
      { name: 'member_id', type: 'uuid', isFK: true, refTable: 'profiles' },
      { name: 'plan_id', type: 'uuid', isFK: true, refTable: 'membership_plans' },
      { name: 'status', type: 'text' },
      { name: 'billing_cycle', type: 'text' },
      { name: 'price_at_signup', type: 'numeric(12,2)' },
      { name: 'current_period_start', type: 'timestamptz' },
      { name: 'current_period_end', type: 'timestamptz' },
    ],
  },
  {
    id: 'subscription_events',
    name: 'subscription_events',
    x: 840,
    y: 40,
    color: '#A78BFA',
    columns: [
      { name: 'id', type: 'uuid', isPK: true },
      { name: 'subscription_id', type: 'uuid', isFK: true, refTable: 'subscriptions' },
      { name: 'event_type', type: 'text' },
      { name: 'previous_status', type: 'text' },
      { name: 'new_status', type: 'text' },
      { name: 'created_at', type: 'timestamptz' },
    ],
  },
  {
    id: 'invoices',
    name: 'invoices',
    x: 840,
    y: 300,
    color: '#8DFFCB',
    columns: [
      { name: 'id', type: 'uuid', isPK: true },
      { name: 'invoice_number', type: 'text' },
      { name: 'subscription_id', type: 'uuid', isFK: true, refTable: 'subscriptions' },
      { name: 'member_id', type: 'uuid', isFK: true, refTable: 'profiles' },
      { name: 'subtotal', type: 'numeric' },
      { name: 'total_amount', type: 'numeric' },
      { name: 'status', type: 'text' },
      { name: 'issued_at', type: 'timestamptz' },
    ],
  },
  {
    id: 'payment_transactions',
    name: 'payment_transactions',
    x: 1220,
    y: 320,
    color: '#F472B6',
    columns: [
      { name: 'id', type: 'uuid', isPK: true },
      { name: 'invoice_id', type: 'uuid', isFK: true, refTable: 'invoices' },
      { name: 'provider_reference', type: 'text' },
      { name: 'amount', type: 'numeric' },
      { name: 'status', type: 'text' },
      { name: 'attempted_at', type: 'timestamptz' },
    ],
  },
  {
    id: 'churn_predictions',
    name: 'churn_predictions',
    x: 840,
    y: 620,
    color: '#D9FF72',
    columns: [
      { name: 'id', type: 'uuid', isPK: true },
      { name: 'subscription_id', type: 'uuid', isFK: true, refTable: 'subscriptions' },
      { name: 'risk_score', type: 'numeric(5,4)' },
      { name: 'risk_level', type: 'text' },
      { name: 'model_version', type: 'text' },
      { name: 'prediction_date', type: 'timestamptz' },
    ],
  },
];

const DEFAULT_RELATIONS: ERRelation[] = [
  { fromTable: 'profiles', fromCol: 'id', toTable: 'subscriptions', toCol: 'member_id', type: '1:N' },
  { fromTable: 'membership_plans', fromCol: 'id', toTable: 'subscriptions', toCol: 'plan_id', type: '1:N' },
  { fromTable: 'membership_plans', fromCol: 'id', toTable: 'plan_features', toCol: 'plan_id', type: '1:N' },
  { fromTable: 'subscriptions', fromCol: 'id', toTable: 'subscription_events', toCol: 'subscription_id', type: '1:N' },
  { fromTable: 'subscriptions', fromCol: 'id', toTable: 'invoices', toCol: 'subscription_id', type: '1:N' },
  { fromTable: 'profiles', fromCol: 'id', toTable: 'invoices', toCol: 'member_id', type: '1:N' },
  { fromTable: 'invoices', fromCol: 'id', toTable: 'payment_transactions', toCol: 'invoice_id', type: '1:N' },
  { fromTable: 'subscriptions', fromCol: 'id', toTable: 'churn_predictions', toCol: 'subscription_id', type: '1:N' },
];

export const InteractiveERCanvas: React.FC<InteractiveERCanvasProps> = ({ onDeployDDL }) => {
  const [tables, setTables] = useState<ERTable[]>(DEFAULT_NEXUS_TABLES);
  const [relations, setRelations] = useState<ERRelation[]>(DEFAULT_RELATIONS);
  const [selectedTableId, setSelectedTableId] = useState<string | null>('subscriptions');
  const [zoom, setZoom] = useState(0.9);
  const [draggedTable, setDraggedTable] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Custom Builder State
  const [builderOpen, setBuilderOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState('text');
  const [newColIsPK, setNewColIsPK] = useState(false);
  const [newColIsFK, setNewColIsFK] = useState(false);
  const [newColRefTable, setNewColRefTable] = useState('');
  const [generatedDDL, setGeneratedDDL] = useState('');
  const [deployStatus, setDeployStatus] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Mouse drag handlers for table nodes
  const handleMouseDown = (tableId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;

    setSelectedTableId(tableId);
    setDraggedTable(tableId);
    setDragOffset({
      x: e.clientX / zoom - table.x,
      y: e.clientY / zoom - table.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedTable) return;
    const newX = Math.max(10, Math.round(e.clientX / zoom - dragOffset.x));
    const newY = Math.max(10, Math.round(e.clientY / zoom - dragOffset.y));

    setTables((prev) =>
      prev.map((t) => (t.id === draggedTable ? { ...t, x: newX, y: newY } : t))
    );
  };

  const handleMouseUp = () => {
    setDraggedTable(null);
  };

  // Calculate coordinates for SVG relationship lines
  const getTableCenter = (tableId: string) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return { x: 0, y: 0, left: 0, right: 230, top: 0, bottom: 200, width: 230, height: 200 };
    const width = 230;
    const height = 40 + table.columns.length * 24;
    return {
      x: table.x + width / 2,
      y: table.y + height / 2,
      left: table.x,
      right: table.x + width,
      top: table.y,
      bottom: table.y + height,
      width,
      height,
    };
  };

  // Add entity from custom builder
  const handleAddNewEntity = () => {
    if (!newTableName) return;
    const newId = newTableName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const newTable: ERTable = {
      id: newId,
      name: newTableName,
      x: 350 + Math.random() * 100,
      y: 100 + Math.random() * 100,
      color: '#D9FF72',
      columns: [
        { name: 'id', type: 'uuid', isPK: true },
        { name: 'created_at', type: 'timestamptz' },
      ],
    };

    setTables([...tables, newTable]);
    setSelectedTableId(newId);
    setNewTableName('');
  };

  // Add column to selected table
  const handleAddColumn = () => {
    if (!selectedTableId || !newColName) return;
    const updated = tables.map((t) => {
      if (t.id === selectedTableId) {
        return {
          ...t,
          columns: [
            ...t.columns,
            {
              name: newColName,
              type: newColType,
              isPK: newColIsPK,
              isFK: newColIsFK,
              refTable: newColIsFK ? newColRefTable : undefined,
            },
          ],
        };
      }
      return t;
    });

    if (newColIsFK && newColRefTable) {
      setRelations([
        ...relations,
        {
          fromTable: newColRefTable,
          fromCol: 'id',
          toTable: selectedTableId,
          toCol: newColName,
          type: '1:N',
        },
      ]);
    }

    setTables(updated);
    setNewColName('');
    setNewColIsPK(false);
    setNewColIsFK(false);
    setNewColRefTable('');
  };

  // Generate full DDL for all tables or newly added tables
  const generateSQL = () => {
    let ddl = `-- NEXUS Auto-Generated Relational DDL\n-- Generated from Interactive ER Diagram Studio\n\n`;

    tables.forEach((table) => {
      ddl += `CREATE TABLE IF NOT EXISTS public.${table.name} (\n`;
      const colDefs = table.columns.map((c) => {
        let def = `    ${c.name} ${c.type}`;
        if (c.isPK) def += ` PRIMARY KEY`;
        if (c.isFK && c.refTable) def += ` REFERENCES public.${c.refTable}(id)`;
        return def;
      });
      ddl += colDefs.join(',\n');
      ddl += `\n);\n\n`;
    });

    setGeneratedDDL(ddl);
  };

  const handleDeployToDatabase = async () => {
    if (!generatedDDL) generateSQL();
    setDeployStatus('Deploying schema to PostgreSQL...');
    try {
      if (onDeployDDL) {
        onDeployDDL(generatedDDL);
      }
      setDeployStatus('DDL ready for execution in Custom SQL Console!');
      setTimeout(() => setDeployStatus(null), 4000);
    } catch (err: any) {
      setDeployStatus('Error: ' + err.message);
    }
  };

  const selectedTable = tables.find((t) => t.id === selectedTableId);

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0D1919] p-3 rounded-xl border border-[rgba(220,255,245,0.15)] text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-[#8DFFCB] font-bold flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" />
            Interactive ER Canvas (Draggable Tables & Live Relationship Wires)
          </span>
          <span className="text-[10px] text-[#8E9F9B]">({tables.length} entities, {relations.length} relations)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            className="p-1.5 rounded bg-[#071112] hover:bg-white/10"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(Math.min(1.4, zoom + 0.1))}
            className="p-1.5 rounded bg-[#071112] hover:bg-white/10"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setZoom(0.9);
              setTables(DEFAULT_NEXUS_TABLES);
            }}
            className="px-2 py-1 rounded bg-[#071112] hover:bg-white/10 text-[11px]"
          >
            Reset Layout
          </button>
          <button
            onClick={() => {
              setBuilderOpen(!builderOpen);
              generateSQL();
            }}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
              builderOpen ? 'bg-[#8DFFCB] text-[#071112]' : 'bg-[#071112] text-[#8DFFCB] border border-[#8DFFCB]/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{builderOpen ? 'Close Builder' : 'Design Custom ER'}</span>
          </button>
        </div>
      </div>

      {/* CUSTOM ER DESIGNER DRAWER */}
      {builderOpen && (
        <div className="p-4 rounded-xl bg-[#0D1919] border border-[#8DFFCB]/40 space-y-4 font-mono text-xs animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-[rgba(220,255,245,0.1)]">
            <span className="font-bold text-[#F1F5F0]">ER Builder: Create Entity & Columns</span>
            <div className="flex items-center gap-2">
              <button
                onClick={generateSQL}
                className="px-3 py-1 rounded bg-[#071112] hover:bg-white/10 text-[#8DFFCB] flex items-center gap-1"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Generate DDL</span>
              </button>
              <button
                onClick={handleDeployToDatabase}
                className="px-3 py-1 rounded bg-[#8DFFCB] text-[#071112] font-bold hover:bg-[#A6FFD8] flex items-center gap-1"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Deploy Schema</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Create Entity */}
            <div className="p-3 rounded-lg bg-[#071112] border border-[rgba(220,255,245,0.08)] space-y-2">
              <label className="text-[#8E9F9B] block">Add New Entity (Table)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. audit_records, coupons..."
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded bg-[#0D1919] border border-[rgba(220,255,245,0.15)] text-[#F1F5F0]"
                />
                <button
                  onClick={handleAddNewEntity}
                  className="px-3 py-1.5 rounded bg-[#8DFFCB] text-[#071112] font-bold"
                >
                  Add Table
                </button>
              </div>
            </div>

            {/* Add Column to Selected Entity */}
            <div className="p-3 rounded-lg bg-[#071112] border border-[rgba(220,255,245,0.08)] space-y-2">
              <label className="text-[#8E9F9B] block">
                Add Column to: <strong className="text-[#8DFFCB]">{selectedTableId}</strong>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Column name"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="px-2 py-1 rounded bg-[#0D1919] border border-[rgba(220,255,245,0.15)] text-[#F1F5F0]"
                />
                <select
                  value={newColType}
                  onChange={(e) => setNewColType(e.target.value)}
                  className="px-2 py-1 rounded bg-[#0D1919] border border-[rgba(220,255,245,0.15)] text-[#F1F5F0]"
                >
                  <option value="uuid">uuid</option>
                  <option value="text">text</option>
                  <option value="numeric(12,2)">numeric</option>
                  <option value="integer">integer</option>
                  <option value="boolean">boolean</option>
                  <option value="timestamptz">timestamptz</option>
                  <option value="jsonb">jsonb</option>
                </select>
                <label className="flex items-center gap-1.5 text-[11px] text-[#8E9F9B]">
                  <input
                    type="checkbox"
                    checked={newColIsPK}
                    onChange={(e) => setNewColIsPK(e.target.checked)}
                  />
                  <span>PK</span>
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-[#8E9F9B]">
                  <input
                    type="checkbox"
                    checked={newColIsFK}
                    onChange={(e) => setNewColIsFK(e.target.checked)}
                  />
                  <span>FK</span>
                </label>
              </div>

              {newColIsFK && (
                <div className="pt-2 flex items-center gap-2">
                  <span className="text-[#8E9F9B]">References table:</span>
                  <select
                    value={newColRefTable}
                    onChange={(e) => setNewColRefTable(e.target.value)}
                    className="px-2 py-1 rounded bg-[#0D1919] border border-[rgba(220,255,245,0.15)] text-[#F1F5F0]"
                  >
                    <option value="">Select table...</option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={handleAddColumn}
                className="mt-2 px-3 py-1 rounded bg-[#8DFFCB] text-[#071112] font-bold"
              >
                Add Column
              </button>
            </div>
          </div>

          {generatedDDL && (
            <div className="space-y-1">
              <label className="text-[#8E9F9B]">Live Generated PostgreSQL DDL:</label>
              <pre className="p-3 rounded bg-[#040909] text-[11px] text-[#8DFFCB] overflow-x-auto max-h-40 border border-[rgba(220,255,245,0.1)]">
                {generatedDDL}
              </pre>
            </div>
          )}

          {deployStatus && (
            <div className="p-2.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs">
              {deployStatus}
            </div>
          )}
        </div>
      )}

      {/* DRAGGABLE CANVAS CONTAINER */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="relative w-full h-[650px] rounded-2xl bg-[#040909] border border-[rgba(220,255,245,0.15)] overflow-hidden dot-grid-pattern cursor-grab active:cursor-grabbing select-none"
      >
        {/* SVG Relationship Wires */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ width: '2500px', height: '2000px', transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#8DFFCB" />
            </marker>
          </defs>

          {relations.map((rel, idx) => {
            const from = getTableCenter(rel.fromTable);
            const to = getTableCenter(rel.toTable);

            // Calculate bezier control points for smooth curve
            const startX = from.right;
            const startY = from.y;
            const endX = to.left;
            const endY = to.y;

            const isHighlighted =
              selectedTableId === rel.fromTable || selectedTableId === rel.toTable;

            const dx = Math.abs(endX - startX) * 0.5;
            const pathData = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;

            return (
              <g key={idx}>
                <path
                  d={pathData}
                  fill="none"
                  stroke={isHighlighted ? '#8DFFCB' : 'rgba(141, 255, 203, 0.28)'}
                  strokeWidth={isHighlighted ? 2.5 : 1.5}
                  strokeDasharray={rel.type === '1:1' ? '4 2' : 'none'}
                  markerEnd="url(#arrow)"
                />
                <circle cx={startX} cy={startY} r={3} fill="#8DFFCB" />
                <rect
                  x={(startX + endX) / 2 - 14}
                  y={(startY + endY) / 2 - 8}
                  width={28}
                  height={16}
                  rx={3}
                  fill="#0D1919"
                  stroke={isHighlighted ? '#8DFFCB' : 'rgba(220,255,245,0.2)'}
                />
                <text
                  x={(startX + endX) / 2}
                  y={(startY + endY) / 2 + 4}
                  fill="#8DFFCB"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {rel.type}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Draggable Table Cards */}
        <div
          className="absolute inset-0"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        >
          {tables.map((table) => {
            const isSelected = selectedTableId === table.id;

            return (
              <div
                key={table.id}
                onMouseDown={(e) => handleMouseDown(table.id, e)}
                style={{
                  transform: `translate3d(${table.x}px, ${table.y}px, 0)`,
                  width: '230px',
                }}
                className={`absolute rounded-xl bg-[#0D1919] border transition-shadow cursor-move ${
                  isSelected
                    ? 'border-[#8DFFCB] shadow-[0_0_25px_rgba(141,255,203,0.3)] z-20'
                    : 'border-[rgba(220,255,245,0.18)] hover:border-[#8DFFCB]/40 z-10'
                }`}
              >
                {/* Table Header */}
                <div
                  className="px-3 py-2 rounded-t-xl flex items-center justify-between border-b border-[rgba(220,255,245,0.1)]"
                  style={{ backgroundColor: isSelected ? 'rgba(141,255,203,0.15)' : 'rgba(7,17,18,0.7)' }}
                >
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#F1F5F0]">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: table.color || '#8DFFCB' }} />
                    <span>{table.name}</span>
                  </div>
                  <span className="text-[9px] font-mono text-[#8E9F9B]">{table.columns.length} cols</span>
                </div>

                {/* Columns List */}
                <div className="p-2 space-y-1 font-mono text-[11px]">
                  {table.columns.map((col, cidx) => (
                    <div
                      key={cidx}
                      className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-white/5"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        {col.isPK && (
                          <span className="text-[9px] px-1 rounded bg-[#8DFFCB]/20 text-[#8DFFCB] font-bold">
                            PK
                          </span>
                        )}
                        {col.isFK && (
                          <span className="text-[9px] px-1 rounded bg-cyan-950 text-cyan-300 font-bold">
                            FK
                          </span>
                        )}
                        <span className={col.isPK ? 'text-[#8DFFCB] font-semibold' : 'text-[#F1F5F0]'}>
                          {col.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#8E9F9B] ml-2 shrink-0">{col.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
