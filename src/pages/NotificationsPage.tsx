import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, RefreshCw, Calendar, CreditCard, Shield } from 'lucide-react';
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../lib/supabase';
import type { NotificationItem } from '../types/database';
import { useAuth } from '../context/AuthContext';

export const NotificationsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      loadNotifications();
    } catch (err: any) {
      alert('Error updating notification: ' + err.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      loadNotifications();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[rgba(220,255,245,0.1)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F1F5F0]">Notifications Feed</h1>
          <p className="text-xs text-[#8E9F9B] mt-1 font-mono">
            In-app lifecycle notices, payment failure alerts, and renewal reminders.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="px-3.5 py-2 rounded-lg bg-[#0D1919] border border-[rgba(220,255,245,0.15)] text-xs font-mono text-[#8DFFCB] hover:border-[#8DFFCB]/40 transition-colors flex items-center gap-1.5"
        >
          <CheckCheck className="w-4 h-4" />
          <span>Mark All as Read</span>
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.map((n) => {
          const isRead = !!n.read_at;
          const isRenewal = n.kind === 'renewal_reminder';
          const isPayment = n.kind.includes('pay');

          return (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 font-mono text-xs ${
                isRead
                  ? 'bg-[#0D1919]/50 border-[rgba(220,255,245,0.06)] text-[#8E9F9B]'
                  : 'bg-[#0D1919] border-[#8DFFCB]/40 text-[#F1F5F0] shadow-[0_0_15px_rgba(141,255,203,0.08)]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    isRenewal
                      ? 'bg-amber-950/60 text-amber-300'
                      : isPayment
                      ? 'bg-rose-950/60 text-rose-300'
                      : 'bg-[#8DFFCB]/10 text-[#8DFFCB]'
                  }`}
                >
                  {isRenewal ? (
                    <Calendar className="w-4 h-4" />
                  ) : isPayment ? (
                    <CreditCard className="w-4 h-4" />
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#F1F5F0]">{n.title}</span>
                    {!isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#8DFFCB] animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-[#8E9F9B] leading-relaxed">{n.body}</p>
                  <div className="text-[10px] text-[#8E9F9B] pt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              {!isRead && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="px-2.5 py-1 rounded bg-[#071112] text-[#8DFFCB] hover:bg-[#8DFFCB]/20 border border-[rgba(220,255,245,0.1)] text-[11px] shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          );
        })}

        {notifications.length === 0 && !loading && (
          <div className="py-12 text-center text-xs font-mono text-[#8E9F9B]">
            No notifications in your feed.
          </div>
        )}
      </div>
    </div>
  );
};
