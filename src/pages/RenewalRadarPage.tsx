import React, { useState, useEffect } from 'react';
import { 
  CalendarClock, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Scan, 
  CheckCircle2, 
  RefreshCw, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { supabase, fetchExpiringSoon, runRenewalScanRpc } from '../lib/supabase';
import type { ExpiringSoonView } from '../types/database';
import { Badge } from '../components/common/Badge';

export const RenewalRadarPage: React.FC = () => {
  const [expiringList, setExpiringList] = useState<ExpiringSoonView[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchExpiringSoon();
      setExpiringList(data);
    } catch (err) {
      console.error('Error fetching expiring subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunRenewalScan = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await runRenewalScanRpc();
      setScanResult(res);
      loadData();
    } catch (err: any) {
      alert('Error running renewal scan: ' + err.message);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[rgba(220,255,245,0.1)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F1F5F0]">Renewal Radar</h1>
          <p className="text-xs text-[#8E9F9B] mt-1 font-mono">
            Upcoming renewals pipeline with scheduled notification scanner backed by PostgreSQL RPC.
          </p>
        </div>

        <button
          onClick={handleRunRenewalScan}
          disabled={scanning}
          className="px-4 py-2 rounded-lg bg-[#8DFFCB] text-[#071112] text-xs font-mono font-bold hover:bg-[#A6FFD8] transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(141,255,203,0.25)]"
        >
          <Scan className="w-4 h-4" />
          <span>{scanning ? 'Scanning Pipeline...' : 'Run Renewal Scan RPC'}</span>
        </button>
      </div>

      {scanResult && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>
              Renewal scan executed successfully. Created {scanResult.notifications_created || 0} idempotent reminder notifications.
            </span>
          </div>
          <span className="text-[10px] text-[#8E9F9B]">{new Date(scanResult.scanned_at).toLocaleTimeString()}</span>
        </div>
      )}

      {/* Grid of Horizon Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] p-4 space-y-2">
          <div className="flex items-center justify-between text-[#8E9F9B]">
            <span>NEXT 7 DAYS</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300">
            {expiringList.filter((e) => e.days_remaining <= 7 && e.days_remaining >= 0).length}
          </div>
          <p className="text-[10px] text-[#8E9F9B]">Urgent renewal reminders dispatched</p>
        </div>

        <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] p-4 space-y-2">
          <div className="flex items-center justify-between text-[#8E9F9B]">
            <span>8 TO 30 DAYS</span>
            <Clock className="w-4 h-4 text-cyan-300" />
          </div>
          <div className="text-2xl font-bold text-cyan-300">
            {expiringList.filter((e) => e.days_remaining > 7 && e.days_remaining <= 30).length}
          </div>
          <p className="text-[10px] text-[#8E9F9B]">Upcoming regular renewal window</p>
        </div>

        <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] p-4 space-y-2">
          <div className="flex items-center justify-between text-[#8E9F9B]">
            <span>TOTAL RADAR VOLUME</span>
            <CalendarClock className="w-4 h-4 text-[#8DFFCB]" />
          </div>
          <div className="text-2xl font-bold text-[#8DFFCB]">
            {expiringList.length}
          </div>
          <p className="text-[10px] text-[#8E9F9B]">Subscriptions requiring attention</p>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] overflow-hidden">
        <div className="p-4 border-b border-[rgba(220,255,245,0.08)] flex items-center justify-between font-mono text-xs">
          <span className="font-bold text-[#F1F5F0]">Monitored Renewal Pipeline (v_expiring_soon)</span>
          <span className="text-[#8E9F9B]">{expiringList.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead>
              <tr className="border-b border-[rgba(220,255,245,0.1)] text-[#8E9F9B] bg-[#071112]/50">
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Plan Name</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4">Renewal Cutoff</th>
                <th className="py-3 px-4 text-right">Days Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(220,255,245,0.05)]">
              {expiringList.map((item) => (
                <tr key={item.subscription_id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#F1F5F0]">{item.full_name}</div>
                    <div className="text-[11px] text-[#8E9F9B]">{item.email}</div>
                  </td>
                  <td className="py-3 px-4 text-[#F1F5F0]">{item.plan_name}</td>
                  <td className="py-3 px-4">
                    <Badge status={item.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-[#8E9F9B]">
                    {new Date(item.current_period_end).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-[#8DFFCB]">
                    {item.days_remaining} days
                  </td>
                </tr>
              ))}
              {expiringList.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#8E9F9B]">
                    All active subscriptions are beyond the 30-day renewal radar window.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
