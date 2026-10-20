import React, { useState } from 'react';
import { 
  Database, 
  Plus, 
  Trash2, 
  Edit3, 
  RotateCcw, 
  X, 
  Check, 
  AlertTriangle, 
  Layers, 
  HardDrive, 
  Cloud, 
  ExternalLink,
  Copy
} from 'lucide-react';
import { workspaceService } from '../../services/workspaceService';
import type { DatabaseWorkspace } from '../../services/workspaceService';

interface WorkspaceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeWorkspaceId: string;
  onSelectWorkspace: (id: string) => void;
  onWorkspaceCreated?: (ws: DatabaseWorkspace) => void;
}

export const WorkspaceSelectorModal: React.FC<WorkspaceSelectorModalProps> = ({
  isOpen,
  onClose,
  activeWorkspaceId,
  onSelectWorkspace,
  onWorkspaceCreated,
}) => {
  const [workspaces, setWorkspaces] = useState<DatabaseWorkspace[]>(workspaceService.listWorkspaces());
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');

  // Create form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState<'blank' | 'subscription' | 'university' | 'ecommerce'>('blank');
  const [withSampleData, setWithSampleData] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit / Delete state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmationName, setDeleteConfirmationName] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const refreshList = () => {
    setWorkspaces(workspaceService.listWorkspaces());
  };

  const handleSelect = (id: string) => {
    onSelectWorkspace(id);
    onClose();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.length < 2 || name.length > 50) {
      setCreateError('Workspace name must be between 2 and 50 characters.');
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      const newWs = await workspaceService.createWorkspace({
        name: name.trim(),
        description: description.trim() || undefined,
        template,
        withSampleData,
      });

      refreshList();
      onSelectWorkspace(newWs.id);
      if (onWorkspaceCreated) onWorkspaceCreated(newWs);
      setActionSuccess(`Workspace "${newWs.name}" successfully created!`);
      setName('');
      setDescription('');
      setTimeout(() => {
        setActionSuccess(null);
        onClose();
      }, 1000);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create workspace.');
    } finally {
      setCreating(false);
    }
  };

  const handleResetDemo = async () => {
    try {
      await workspaceService.resetDemoWorkspace();
      refreshList();
      setActionSuccess('Demo Database sandbox has been reset to pristine seed state.');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setCreateError(err.message);
    }
  };

  const handleStartRename = (ws: DatabaseWorkspace) => {
    setRenamingId(ws.id);
    setNewName(ws.name);
  };

  const handleSaveRename = (id: string) => {
    if (!newName.trim()) return;
    workspaceService.renameWorkspace(id, newName.trim());
    setRenamingId(null);
    refreshList();
  };

  const handleDelete = (ws: DatabaseWorkspace) => {
    if (deleteConfirmationName !== ws.name) {
      alert(`Please type "${ws.name}" exactly to confirm deletion.`);
      return;
    }
    workspaceService.deleteWorkspace(ws.id);
    setDeletingId(null);
    setDeleteConfirmationName('');
    refreshList();
    if (activeWorkspaceId === ws.id) {
      onSelectWorkspace('demo-workspace');
    }
  };

  const handleFork = async (ws: DatabaseWorkspace) => {
    try {
      const cloned = await workspaceService.forkWorkspace(ws.id, `${ws.name} (Copy)`);
      refreshList();
      onSelectWorkspace(cloned.id);
      setActionSuccess(`Cloned into "${cloned.name}"`);
      setTimeout(() => setActionSuccess(null), 2500);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0D1919] border border-[rgba(220,255,245,0.2)] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[rgba(220,255,245,0.1)] flex items-center justify-between bg-[#071112]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8DFFCB]/10 border border-[#8DFFCB]/30 flex items-center justify-center text-[#8DFFCB]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#F1F5F0]">Database Workspaces</h2>
              <p className="text-xs text-[#8E9F9B] font-mono">
                Select an isolated PostgreSQL sandbox or inspect live schemas safely.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#8E9F9B] hover:text-[#F1F5F0] hover:bg-[#122222] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-[rgba(220,255,245,0.1)] bg-[#0A1414] px-6">
          <button
            onClick={() => setActiveTab('list')}
            className={`py-3 px-4 text-xs font-mono font-medium border-b-2 transition-colors ${
              activeTab === 'list'
                ? 'border-[#8DFFCB] text-[#8DFFCB]'
                : 'border-transparent text-[#8E9F9B] hover:text-[#F1F5F0]'
            }`}
          >
            All Workspaces ({workspaces.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`py-3 px-4 text-xs font-mono font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'border-[#8DFFCB] text-[#8DFFCB]'
                : 'border-transparent text-[#8E9F9B] hover:text-[#F1F5F0]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Create Workspace
          </button>
        </div>

        {/* Feedback Alert */}
        {actionSuccess && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-[#8DFFCB]/10 border border-[#8DFFCB]/30 text-xs font-mono text-[#8DFFCB] flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'list' ? (
            <div className="space-y-4">
              {workspaces.map((ws) => {
                const isActive = ws.id === activeWorkspaceId;
                const isRenaming = renamingId === ws.id;
                const isDeleting = deletingId === ws.id;

                return (
                  <div
                    key={ws.id}
                    className={`rounded-xl border transition-all p-5 ${
                      isActive
                        ? 'bg-[#122424] border-[#8DFFCB] shadow-[0_0_15px_rgba(141,255,203,0.15)]'
                        : 'bg-[#0A1414] border-[rgba(220,255,245,0.1)] hover:border-[#8DFFCB]/40'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2.5">
                          {isRenaming ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="px-2 py-1 rounded bg-[#071112] border border-[#8DFFCB] text-sm text-[#F1F5F0] font-mono focus:outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveRename(ws.id)}
                                className="p-1.5 rounded bg-[#8DFFCB] text-[#071112] hover:bg-[#A6FFD8]"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setRenamingId(null)}
                                className="p-1.5 rounded bg-[#122222] text-[#8E9F9B]"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <h3 className="font-bold text-[#F1F5F0] text-base">{ws.name}</h3>
                              {isActive && (
                                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#8DFFCB]/20 text-[#8DFFCB] border border-[#8DFFCB]/40 font-semibold">
                                  Active
                                </span>
                              )}
                              {ws.isDemo && (
                                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                  Teaching Demo
                                </span>
                              )}
                              {ws.isReadOnly && (
                                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Read-Only
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        {ws.description && (
                          <p className="text-xs text-[#8E9F9B]">{ws.description}</p>
                        )}

                        {/* Metadata row */}
                        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#8E9F9B] pt-1">
                          <div className="flex items-center gap-1.5">
                            {ws.engine === 'supabase_production' ? (
                              <Cloud className="w-3.5 h-3.5 text-blue-400" />
                            ) : (
                              <HardDrive className="w-3.5 h-3.5 text-[#8DFFCB]" />
                            )}
                            <span className="text-[#F1F5F0]">{ws.engineLabel}</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-[#8E9F9B]" />
                            <span>{ws.tableCount} tables</span>
                          </div>
                          <span>•</span>
                          <span>Last used: {new Date(ws.lastUsedAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {!isActive && (
                          <button
                            onClick={() => handleSelect(ws.id)}
                            className="px-4 py-2 rounded-lg bg-[#8DFFCB] text-[#071112] text-xs font-mono font-semibold hover:bg-[#A6FFD8] transition-colors"
                          >
                            Switch Workspace
                          </button>
                        )}

                        {ws.isDemo && (
                          <button
                            onClick={handleResetDemo}
                            title="Reset demo sandbox to original state"
                            className="px-3 py-2 rounded-lg bg-[#122222] border border-[rgba(220,255,245,0.2)] text-xs font-mono text-[#8E9F9B] hover:text-[#8DFFCB] hover:border-[#8DFFCB]/40 transition-colors flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset</span>
                          </button>
                        )}

                        {!ws.isDemo && ws.engine !== 'supabase_production' && (
                          <>
                            <button
                              onClick={() => handleFork(ws)}
                              title="Fork / Duplicate Workspace"
                              className="p-2 rounded-lg bg-[#122222] border border-[rgba(220,255,245,0.1)] text-[#8E9F9B] hover:text-[#F1F5F0] transition-colors"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleStartRename(ws)}
                              title="Rename Workspace"
                              className="p-2 rounded-lg bg-[#122222] border border-[rgba(220,255,245,0.1)] text-[#8E9F9B] hover:text-[#F1F5F0] transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingId(ws.id)}
                              title="Delete Workspace"
                              className="p-2 rounded-lg bg-[#122222] border border-[rgba(220,255,245,0.1)] text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Inline Delete Confirmation */}
                    {isDeleting && (
                      <div className="mt-4 p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-200 space-y-3">
                        <div className="flex items-center gap-2 font-bold text-red-300">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                          <span>Confirm Permanent Deletion</span>
                        </div>
                        <p>
                          This will permanently delete all schemas, tables, and data in{' '}
                          <strong className="text-white">"{ws.name}"</strong>. This action cannot be undone.
                        </p>
                        <div className="space-y-1">
                          <label className="text-[11px] font-mono text-red-300">
                            Type <span className="underline font-bold text-white">{ws.name}</span> to confirm:
                          </label>
                          <input
                            type="text"
                            value={deleteConfirmationName}
                            onChange={(e) => setDeleteConfirmationName(e.target.value)}
                            placeholder={ws.name}
                            className="w-full px-3 py-1.5 rounded bg-[#071112] border border-red-500/50 text-[#F1F5F0] font-mono text-xs focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleDelete(ws)}
                            disabled={deleteConfirmationName !== ws.name}
                            className="px-3 py-1.5 rounded bg-red-600 text-white font-mono text-xs font-semibold hover:bg-red-500 disabled:opacity-40 transition-colors"
                          >
                            Permanently Delete
                          </button>
                          <button
                            onClick={() => {
                              setDeletingId(null);
                              setDeleteConfirmationName('');
                            }}
                            className="px-3 py-1.5 rounded bg-[#122222] text-[#8E9F9B] font-mono text-xs hover:text-[#F1F5F0]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-6 max-w-xl mx-auto py-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#8DFFCB]">
                  Workspace Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., University Course Database"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#071112] border border-[rgba(220,255,245,0.2)] text-sm text-[#F1F5F0] placeholder-[#8E9F9B] focus:outline-none focus:border-[#8DFFCB]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#8E9F9B]">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Purpose of this database workspace..."
                  className="w-full px-4 py-2 rounded-lg bg-[#071112] border border-[rgba(220,255,245,0.2)] text-xs text-[#F1F5F0] placeholder-[#8E9F9B] focus:outline-none focus:border-[#8DFFCB]"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#8DFFCB]">
                  Starting Point Schema
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'blank', title: 'Blank Schema', desc: 'Empty canvas for your own tables' },
                    { id: 'subscription', title: 'Subscription Model', desc: 'Nexus Memberships & Invoices' },
                    { id: 'university', title: 'University Course', desc: 'Students, Courses, Enrolments' },
                    { id: 'ecommerce', title: 'E-Commerce Store', desc: 'Customers, Orders, Items' },
                  ].map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setTemplate(tpl.id as any)}
                      className={`text-left p-3.5 rounded-xl border transition-all ${
                        template === tpl.id
                          ? 'bg-[#122424] border-[#8DFFCB] text-[#8DFFCB]'
                          : 'bg-[#071112] border-[rgba(220,255,245,0.1)] text-[#8E9F9B] hover:border-[#8DFFCB]/30'
                      }`}
                    >
                      <div className="font-semibold text-xs text-[#F1F5F0]">{tpl.title}</div>
                      <div className="text-[11px] text-[#8E9F9B] mt-0.5">{tpl.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.1)]">
                <div>
                  <div className="text-xs font-semibold text-[#F1F5F0]">Seed Sample Tuples</div>
                  <div className="text-[11px] text-[#8E9F9B]">
                    Populate template tables with realistic rows for instant querying.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={withSampleData}
                  onChange={(e) => setWithSampleData(e.target.checked)}
                  className="w-4 h-4 rounded text-[#8DFFCB] focus:ring-0 bg-[#0D1919] border-[rgba(220,255,245,0.3)]"
                />
              </div>

              <div className="p-4 rounded-xl bg-[#071112]/60 border border-[rgba(220,255,245,0.08)] text-xs text-[#8E9F9B] space-y-1">
                <div className="font-mono text-[#8DFFCB] flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Execution Architecture: Browser-local PostgreSQL (PGlite WASM)</span>
                </div>
                <p className="text-[11px]">
                  All tables, constraints, and data execute inside an isolated PostgreSQL WebAssembly engine
                  persisted in browser storage (IndexedDB). Your sandbox is completely isolated from live Supabase data.
                </p>
              </div>

              {createError && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-xs font-mono text-red-300">
                  {createError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2.5 rounded-lg bg-[#122222] text-[#8E9F9B] text-xs font-mono hover:text-[#F1F5F0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 rounded-lg bg-[#8DFFCB] text-[#071112] text-xs font-mono font-semibold hover:bg-[#A6FFD8] disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {creating ? 'Creating Sandbox...' : 'Create & Open Sandbox'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
