import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  Download, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Eye, 
  X,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import { supabase, fetchInvoices, simulatePaymentRpc } from '../lib/supabase';
import type { Invoice, InvoiceStatus, PaymentTransaction } from '../types/database';
import { Badge } from '../components/common/Badge';

export const BillingPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InvoiceStatus>('all');
  
  // Modal & Payment Simulation State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any | null>(null);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await fetchInvoices();
      setInvoices(data);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleSimulatePayment = async (success: boolean) => {
    if (!selectedInvoice) return;
    setSimulating(true);
    setSimResult(null);

    try {
      const res = await simulatePaymentRpc({
        invoiceId: selectedInvoice.id,
        simulateSuccess: success,
        methodLabel: success ? 'Demo NetBanking (Simulated)' : 'Demo Declined Card (Simulated)',
      });

      setSimResult({
        success,
        data: res,
      });

      loadInvoices();
    } catch (err: any) {
      setSimResult({
        success: false,
        error: err.message,
      });
    } finally {
      setSimulating(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Invoice Number', 'Member', 'Email', 'Subtotal', 'Discount', 'Total Amount', 'Currency', 'Status', 'Issued At', 'Paid At'];
    const rows = filteredInvoices.map((inv) => [
      inv.invoice_number,
      inv.profiles?.full_name || '',
      inv.profiles?.email || '',
      inv.subtotal,
      inv.discount_amount,
      inv.total_amount,
      inv.currency,
      inv.status,
      inv.issued_at,
      inv.paid_at || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nexus_invoices_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredInvoices = invoices.filter((i) => {
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    const num = i.invoice_number.toLowerCase();
    const name = i.profiles?.full_name?.toLowerCase() || '';
    const email = i.profiles?.email?.toLowerCase() || '';
    const matchesSearch = num.includes(search.toLowerCase()) || name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[rgba(220,255,245,0.1)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F1F5F0]">Billing & Invoices</h1>
          <p className="text-xs text-[#8E9F9B] mt-1 font-mono">
            Immutable invoice ledger with simulated demo payment settlement in plpgsql.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-lg bg-[#0D1919] border border-[rgba(220,255,245,0.15)] text-xs font-mono text-[#F1F5F0] hover:border-[#8DFFCB]/40 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-[#8DFFCB]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0D1919] p-4 rounded-xl border border-[rgba(220,255,245,0.12)]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#8E9F9B] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number or member..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#071112] border border-[rgba(220,255,245,0.15)] text-xs text-[#F1F5F0] placeholder-[#8E9F9B] focus:outline-none focus:border-[#8DFFCB]"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[#8E9F9B]">Status:</span>
          {(['all', 'paid', 'open', 'overdue'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md capitalize transition-colors ${
                statusFilter === st ? 'bg-[#8DFFCB] text-[#071112] font-bold' : 'bg-[#071112] text-[#8E9F9B] hover:text-[#F1F5F0]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead>
              <tr className="border-b border-[rgba(220,255,245,0.1)] text-[#8E9F9B] bg-[#071112]/50">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Issued At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(220,255,245,0.05)]">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-semibold text-[#8DFFCB]">{inv.invoice_number}</td>
                  <td className="py-3 px-4">
                    <div className="text-[#F1F5F0]">{inv.profiles?.full_name}</div>
                    <div className="text-[10px] text-[#8E9F9B]">{inv.profiles?.email}</div>
                  </td>
                  <td className="py-3 px-4 font-bold text-[#F1F5F0]">
                    {inv.currency} {Number(inv.total_amount).toLocaleString()}
                    {Number(inv.discount_amount) > 0 && (
                      <span className="text-[10px] text-[#8DFFCB] ml-1.5">
                        (-{inv.currency} {inv.discount_amount})
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Badge status={inv.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-[#8E9F9B]">
                    {new Date(inv.issued_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedInvoice(inv);
                        setSimResult(null);
                      }}
                      className="px-2.5 py-1 rounded bg-[#071112] hover:bg-[#8DFFCB]/20 text-[#8DFFCB] border border-[rgba(220,255,245,0.15)] transition-colors"
                    >
                      Inspect / Pay
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INVOICE & SIMULATED DEMO PAYMENT MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="rounded-2xl bg-[#0D1919] border border-[rgba(220,255,245,0.2)] max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(220,255,245,0.1)]">
              <div>
                <h2 className="text-base font-bold text-[#F1F5F0]">
                  Invoice {selectedInvoice.invoice_number}
                </h2>
                <p className="text-[11px] text-[#8E9F9B]">Member: {selectedInvoice.profiles?.full_name}</p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-[#8E9F9B] hover:text-[#F1F5F0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Calculations Breakdown */}
            <div className="p-4 rounded-xl bg-[#071112] border border-[rgba(220,255,245,0.1)] space-y-2">
              <div className="flex items-center justify-between text-[#8E9F9B]">
                <span>Subtotal:</span>
                <span className="text-[#F1F5F0]">{selectedInvoice.currency} {selectedInvoice.subtotal}</span>
              </div>
              <div className="flex items-center justify-between text-[#8E9F9B]">
                <span>Discount Applied:</span>
                <span className="text-[#8DFFCB]">-{selectedInvoice.currency} {selectedInvoice.discount_amount}</span>
              </div>
              <div className="flex items-center justify-between text-[#8E9F9B]">
                <span>Configured Tax:</span>
                <span className="text-[#F1F5F0]">{selectedInvoice.currency} {selectedInvoice.tax_amount}</span>
              </div>
              <div className="pt-2 border-t border-[rgba(220,255,245,0.1)] flex items-center justify-between font-bold text-sm text-[#F1F5F0]">
                <span>Total Due:</span>
                <span className="text-[#8DFFCB]">{selectedInvoice.currency} {selectedInvoice.total_amount}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[#8E9F9B]">Current Status:</span>
                <Badge status={selectedInvoice.status} size="sm" />
              </div>
            </div>

            {/* Simulated Payment Gateway Section */}
            <div className="p-4 rounded-xl bg-[#071112] border border-cyan-500/30 space-y-3">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <ShieldAlert className="w-4 h-4" />
                <span>DEMO PAYMENT GATEWAY (SIMULATED)</span>
              </div>
              <p className="text-[11px] text-[#8E9F9B]">
                Academic mode. <strong>No real money is charged.</strong> Outcomes are verified through transactional database state transitions.
              </p>

              {selectedInvoice.status !== 'paid' ? (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => handleSimulatePayment(true)}
                    disabled={simulating}
                    className="py-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 font-bold hover:bg-emerald-900/60 transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simulate Success</span>
                  </button>

                  <button
                    onClick={() => handleSimulatePayment(false)}
                    disabled={simulating}
                    className="py-2.5 rounded-lg bg-rose-950/60 border border-rose-500/50 text-rose-300 font-bold hover:bg-rose-900/60 transition-all flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Simulate Failure</span>
                  </button>
                </div>
              ) : (
                <div className="p-2.5 rounded bg-emerald-950/40 text-emerald-300 text-center font-bold">
                  ✓ This invoice has already been settled and paid.
                </div>
              )}
            </div>

            {/* Simulation Feedback */}
            {simResult && (
              <div
                className={`p-3 rounded-lg border text-[11px] ${
                  simResult.success
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                }`}
              >
                <div className="font-bold">
                  {simResult.success ? 'Payment Simulation Succeeded' : 'Payment Simulation Failed'}
                </div>
                <div className="text-[10px] opacity-80 mt-1">
                  {JSON.stringify(simResult.data || simResult.error)}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-lg bg-[#071112] text-[#8E9F9B] hover:text-[#F1F5F0]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
