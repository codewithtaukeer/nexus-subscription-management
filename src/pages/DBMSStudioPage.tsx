import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Layers, 
  Code, 
  ShieldCheck, 
  Calculator, 
  GitBranch, 
  Plus, 
  RotateCcw, 
  Sparkles, 
  ChevronDown, 
  Check, 
  HardDrive, 
  Cloud, 
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { workspaceService } from '../services/workspaceService';
import type { DatabaseWorkspace } from '../services/workspaceService';
import { WorkspaceSelectorModal } from '../components/dbms/WorkspaceSelectorModal';
import { SchemaExplorerWorkbench } from '../components/dbms/SchemaExplorerWorkbench';
import { SQLStudioWorkbench } from '../components/dbms/SQLStudioWorkbench';
import { TransactionACIDLabWorkbench } from '../components/dbms/TransactionACIDLabWorkbench';
import { RelationalAlgebraWorkbench } from '../components/dbms/RelationalAlgebraWorkbench';
import { NormalizationCalculator } from '../components/dbms/NormalizationCalculator';
import { useAuth } from '../context/AuthContext';
import { DemoCheckoutModal } from '../components/common/DemoCheckoutModal';
import { Lock, CreditCard, ArrowRight } from 'lucide-react';

export const DBMSStudioPage: React.FC = () => {
  const { role, isPremium } = useAuth();
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('demo-workspace');
  const [activeWorkspace, setActiveWorkspace] = useState<DatabaseWorkspace>(workspaceService.getActiveWorkspace());
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'schema_er' | 'sql_studio' | 'transaction_acid' | 'relational_algebra' | 'normalization'>('schema_er');
  const [schemaRefreshTrigger, setSchemaRefreshTrigger] = useState(0);

  // Sync workspace on change
  useEffect(() => {
    const ws = workspaceService.getActiveWorkspace();
    setActiveWorkspace(ws);
    setActiveWorkspaceId(ws.id);
  }, [activeWorkspaceId]);

  const handleSelectWorkspace = (id: string) => {
    workspaceService.setActiveWorkspace(id);
    setActiveWorkspaceId(id);
    setActiveWorkspace(workspaceService.getActiveWorkspace());
    setSchemaRefreshTrigger((prev) => prev + 1);
  };

  const [targetSQL, setTargetSQL] = useState<string | undefined>(undefined);

  const handleOpenTableInSQL = (tableName: string) => {
    if (tableName && tableName.trim()) {
      setTargetSQL(`SELECT * FROM ${tableName} LIMIT 25;`);
    }
    setActiveTab('sql_studio');
  };

  if (role !== 'admin' && !isPremium) {
    return (
      <div className="py-8 px-4 max-w-4xl mx-auto space-y-8 animate-fadeIn">
        <div className="p-8 sm:p-12 rounded-3xl bg-[#0D1919] border border-[#8DFFCB]/30 text-center space-y-6 shadow-[0_0_60px_rgba(141,255,203,0.1)] relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#8DFFCB]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="w-20 h-20 rounded-2xl bg-[#8DFFCB]/10 border border-[#8DFFCB]/30 mx-auto flex items-center justify-center text-[#8DFFCB] shadow-lg">
            <Lock className="w-10 h-10 animate-pulse" />
          </div>

          <div className="space-y-3">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#8DFFCB] px-3.5 py-1 rounded-full bg-[#8DFFCB]/10 border border-[#8DFFCB]/25 font-bold">
              Nexus Pro Entitlement
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F1F5F0] tracking-tight">
              DBMS Studio Access Restricted
            </h1>
            <p className="text-xs sm:text-sm text-[#8E9F9B] font-mono max-w-xl mx-auto leading-relaxed">
              Direct access to the Live SQL Console, Interactive ER Schema Canvas, Normalization Calculator, Relational Algebra Engine, and ACID Transaction Simulator is exclusive to Nexus Pro members.
            </p>
          </div>

          {/* Feature Teasers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-2xl mx-auto text-left pt-2">
            <div className="p-4 rounded-xl bg-[#071112] border border-white/[0.06] space-y-1">
              <div className="text-xs font-mono font-bold text-[#8DFFCB] flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span>Live SQL Console</span>
              </div>
              <p className="text-[11px] text-[#8E9F9B] font-mono">
                Direct read/write query terminal against normalized PostgreSQL tables.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#071112] border border-white/[0.06] space-y-1">
              <div className="text-xs font-mono font-bold text-[#8DFFCB] flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>Interactive ER Diagram</span>
              </div>
              <p className="text-[11px] text-[#8E9F9B] font-mono">
                Live foreign key topology, cardinality visualizer, and table inspector.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#071112] border border-white/[0.06] space-y-1">
              <div className="text-xs font-mono font-bold text-[#8DFFCB] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>ACID Transaction Lab</span>
              </div>
              <p className="text-[11px] text-[#8E9F9B] font-mono">
                Simulate two-phase commits, rollbacks, and concurrent isolation levels.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#071112] border border-white/[0.06] space-y-1">
              <div className="text-xs font-mono font-bold text-[#8DFFCB] flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                <span>1NF → BCNF Normalizer</span>
              </div>
              <p className="text-[11px] text-[#8E9F9B] font-mono">
                Automated closure calculation and lossless join decomposition tester.
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-4">
            <button
              onClick={() => setCheckoutModalOpen(true)}
              className="py-3.5 px-8 rounded-xl bg-[#8DFFCB] hover:bg-[#A6FFD8] text-[#071112] font-mono font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2.5 transition-all shadow-[0_0_30px_rgba(141,255,203,0.35)] hover:scale-105"
            >
              <CreditCard className="w-4 h-4" />
              <span>Unlock DBMS Studio with Demo Card</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="text-[11px] font-mono text-[#8E9F9B] mt-2">
              Instant activation • No physical credit card required
            </div>
          </div>
        </div>

        <DemoCheckoutModal
          isOpen={checkoutModalOpen}
          onClose={() => setCheckoutModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* PERSISTENT TOP WORKSPACE CONTROLLER STRIP */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0D1919] via-[#071112] to-[#0D1919] border border-[rgba(220,255,245,0.15)] p-5 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Active Workspace Info */}
          <div className="flex items-center gap-4">
            <img
              src="/nexus-logo.png"
              alt="NEXUS"
              className="w-10 h-10 shrink-0 object-contain bg-transparent rounded-none shadow-none"
            />

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase text-[#8E9F9B] tracking-wider">
                  Active Database Context:
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#8DFFCB]/10 text-[#8DFFCB] border border-[#8DFFCB]/20 flex items-center gap-1 font-semibold">
                  {activeWorkspace.engine === 'supabase_production' ? (
                    <Cloud className="w-3 h-3 text-blue-400" />
                  ) : (
                    <HardDrive className="w-3 h-3 text-[#8DFFCB]" />
                  )}
                  <span>{activeWorkspace.engineLabel}</span>
                </span>
                {activeWorkspace.isReadOnly && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                    Read-Only
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 mt-1">
                <h1 className="text-xl sm:text-2xl font-bold text-[#F1F5F0] tracking-tight flex items-center gap-2">
                  <span>{activeWorkspace.name}</span>
                </h1>
                {activeWorkspace.isDemo && (
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Teaching Sandbox
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Workspace Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setWorkspaceModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#122424] border border-[#8DFFCB]/30 text-xs font-mono text-[#8DFFCB] hover:bg-[#8DFFCB] hover:text-[#071112] transition-all flex items-center gap-2 font-semibold shadow-sm"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Switch / Manage Workspaces</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {activeWorkspace.isDemo && (
              <button
                onClick={async () => {
                  await workspaceService.resetDemoWorkspace();
                  setSchemaRefreshTrigger((p) => p + 1);
                }}
                title="Reset demo sandbox to original state"
                className="px-3 py-2 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.15)] text-xs font-mono text-[#8E9F9B] hover:text-[#8DFFCB] transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* WORKBENCH NAVIGATION TABS */}
      <div className="flex border-b border-[rgba(220,255,245,0.12)] overflow-x-auto gap-2 pb-1">
        {[
          {
            id: 'schema_er',
            label: '1. Schema & ER Diagram',
            icon: Layers,
            badge: `${activeWorkspace.tableCount} Tables`,
          },
          {
            id: 'sql_studio',
            label: '2. SQL Studio',
            icon: Code,
            badge: 'Live Console',
          },
          {
            id: 'transaction_acid',
            label: '3. Transaction & ACID Lab',
            icon: ShieldCheck,
            badge: 'Anomalies & SSI',
          },
          {
            id: 'relational_algebra',
            label: '4. SQL → Relational Algebra',
            icon: GitBranch,
            badge: 'σ, π, γ Trees',
          },
          {
            id: 'normalization',
            label: '5. 3NF / BCNF Calculator',
            icon: Calculator,
            badge: 'Synthesis & Closures',
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-mono font-medium rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
                isActive
                  ? 'bg-[#0D1919] border-[#8DFFCB] text-[#8DFFCB] shadow-md'
                  : 'border-transparent text-[#8E9F9B] hover:text-[#F1F5F0] hover:bg-[#0D1919]/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span
                className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono ${
                  isActive
                    ? 'bg-[#8DFFCB]/20 text-[#8DFFCB]'
                    : 'bg-[#122222] text-[#8E9F9B]'
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ACTIVE TOOL VIEWPORT */}
      <div>
        {activeTab === 'schema_er' && (
          <SchemaExplorerWorkbench
            key={`${activeWorkspace.id}-${schemaRefreshTrigger}`}
            activeWorkspace={activeWorkspace}
            onOpenTableInSQLStudio={handleOpenTableInSQL}
          />
        )}

        {activeTab === 'sql_studio' && (
          <SQLStudioWorkbench
            key={`${activeWorkspace.id}-${targetSQL || 'default'}`}
            activeWorkspace={activeWorkspace}
            initialSQL={targetSQL}
            onTableCreatedOrModified={() => setSchemaRefreshTrigger((p) => p + 1)}
          />
        )}

        {activeTab === 'transaction_acid' && (
          <TransactionACIDLabWorkbench
            key={activeWorkspace.id}
            activeWorkspace={activeWorkspace}
          />
        )}

        {activeTab === 'relational_algebra' && (
          <RelationalAlgebraWorkbench
            key={activeWorkspace.id}
            activeWorkspace={activeWorkspace}
          />
        )}

        {activeTab === 'normalization' && (
          <div className="space-y-4">
            <NormalizationCalculator />
          </div>
        )}
      </div>

      {/* WORKSPACE SELECTOR & MANAGER MODAL */}
      <WorkspaceSelectorModal
        isOpen={workspaceModalOpen}
        onClose={() => setWorkspaceModalOpen(false)}
        activeWorkspaceId={activeWorkspaceId}
        onSelectWorkspace={handleSelectWorkspace}
        onWorkspaceCreated={() => setSchemaRefreshTrigger((p) => p + 1)}
      />
    </div>
  );
};
