import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Layers, 
  CreditCard, 
  Download, 
  CheckCircle2, 
  Calendar,
  ExternalLink
} from 'lucide-react';
import { 
  fetchMonthlyRevenue, 
  fetchPlanPerformance, 
  supabase 
} from '../lib/supabase';
import type { MonthlyRevenueView, PlanPerformanceView } from '../types/database';

export const AnalyticsPage: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenueView[]>([]);
  const [planPerformance, setPlanPerformance] = useState<PlanPerformanceView[]>([]);
  const [paymentHealth, setPaymentHealth] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchMonthlyRevenue(),
      fetchPlanPerformance(),
      supabase.from('v_payment_health').select('*'),
    ])
      .then(([rev, perf, health]) => {
        setMonthlyRevenue(rev);
        setPlanPerformance(perf);
        setPaymentHealth(health.data || []);
      })
      .catch((err) => console.error('Error fetching analytics data:', err))
      .finally(() => setLoading(false));
  }, []);

  const totalCollected = monthlyRevenue.reduce((acc, m) => acc + Number(m.total_revenue), 0);

  const handleExportCSV = () => {
    const headers = ['Month', 'Currency', 'Invoices Paid', 'Total Revenue', 'Avg Invoice Value', 'Paying Members'];
    const rows = monthlyRevenue.map((r) => [
      r.revenue_month,
      r.currency,
      r.total_invoices_paid,
      r.total_revenue,
      r.avg_invoice_value,
      r.paying_members_count,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nexus_monthly_revenue_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[rgba(220,255,245,0.1)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F1F5F0]">Analytics & Reports</h1>
          <p className="text-xs text-[#8E9F9B] mt-1 font-mono">
            Direct aggregate queries backed by PostgreSQL views v_monthly_revenue and v_plan_performance.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 rounded-lg bg-[#0D1919] border border-[rgba(220,255,245,0.15)] text-xs font-mono text-[#F1F5F0] hover:border-[#8DFFCB]/40 transition-colors flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5 text-[#8DFFCB]" />
          <span>Export Revenue CSV</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] p-4 space-y-1">
          <div className="text-[#8E9F9B]">TOTAL SETTLED REVENUE</div>
          <div className="text-2xl font-bold text-[#8DFFCB]">₹{totalCollected.toLocaleString()}</div>
          <div className="text-[10px] text-[#8E9F9B]">From all settled invoices</div>
        </div>

        <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] p-4 space-y-1">
          <div className="text-[#8E9F9B]">AVERAGE INVOICE SIZE</div>
          <div className="text-2xl font-bold text-[#F1F5F0]">
            ₹{monthlyRevenue[0]?.avg_invoice_value ? Math.round(Number(monthlyRevenue[0].avg_invoice_value)).toLocaleString() : '—'}
          </div>
          <div className="text-[10px] text-[#8E9F9B]">Current period baseline</div>
        </div>

        <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] p-4 space-y-1">
          <div className="text-[#8E9F9B]">GATEWAY SUCCESS RATE</div>
          <div className="text-2xl font-bold text-[#D9FF72]">
            {paymentHealth[0]?.success_rate_percent ? `${paymentHealth[0].success_rate_percent}%` : '80.0%'}
          </div>
          <div className="text-[10px] text-[#8E9F9B]">Simulated settlement reliability</div>
        </div>
      </div>

      {/* Monthly Revenue Table (v_monthly_revenue) */}
      <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(220,255,245,0.08)]">
          <div className="flex items-center gap-2 text-xs font-mono text-[#F1F5F0]">
            <TrendingUp className="w-4 h-4 text-[#8DFFCB]" />
            <span className="font-semibold">Revenue By Month (v_monthly_revenue)</span>
          </div>
          <button
            onClick={() => onNavigate('dbms')}
            className="text-xs font-mono text-[#8DFFCB] hover:underline flex items-center gap-1"
          >
            Inspect View in DBMS Studio <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead>
              <tr className="border-b border-[rgba(220,255,245,0.08)] text-[#8E9F9B]">
                <th className="py-2.5 px-3">Revenue Month</th>
                <th className="py-2.5 px-3">Settled Invoices</th>
                <th className="py-2.5 px-3">Paying Members</th>
                <th className="py-2.5 px-3">Average Invoice</th>
                <th className="py-2.5 px-3 text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(220,255,245,0.04)]">
              {monthlyRevenue.map((row) => (
                <tr key={row.revenue_month} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-3 text-[#F1F5F0] font-semibold">{row.revenue_month}</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">{row.total_invoices_paid}</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">{row.paying_members_count}</td>
                  <td className="py-3 px-3 text-[#F1F5F0]">
                    {row.currency} {Math.round(Number(row.avg_invoice_value)).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-[#8DFFCB]">
                    {row.currency} {Number(row.total_revenue).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Performance Table (v_plan_performance) */}
      <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(220,255,245,0.08)]">
          <div className="flex items-center gap-2 text-xs font-mono text-[#F1F5F0]">
            <Layers className="w-4 h-4 text-[#8DFFCB]" />
            <span className="font-semibold">Plan Conversion & Lifetime Revenue (v_plan_performance)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead>
              <tr className="border-b border-[rgba(220,255,245,0.08)] text-[#8E9F9B]">
                <th className="py-2.5 px-3">Plan Name</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Monthly Base</th>
                <th className="py-2.5 px-3">Active Subscribers</th>
                <th className="py-2.5 px-3">Cancelled</th>
                <th className="py-2.5 px-3 text-right">Lifetime Collected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(220,255,245,0.04)]">
              {planPerformance.map((p) => (
                <tr key={p.plan_id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-3 text-[#F1F5F0] font-semibold">{p.plan_name}</td>
                  <td className="py-3 px-3">
                    <span className="capitalize text-[11px] text-[#8E9F9B]">{p.plan_status}</span>
                  </td>
                  <td className="py-3 px-3 text-[#F1F5F0]">₹{p.price_monthly}</td>
                  <td className="py-3 px-3 text-[#8DFFCB] font-bold">{p.active_subscribers}</td>
                  <td className="py-3 px-3 text-[#8E9F9B]">{p.cancelled_subscribers}</td>
                  <td className="py-3 px-3 text-right font-bold text-[#F1F5F0]">
                    ₹{Number(p.lifetime_collected_revenue).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
