import React from 'react';
import type { SubscriptionStatus, InvoiceStatus, PaymentStatus, UserRole } from '../../types/database';

interface BadgeProps {
  status: SubscriptionStatus | InvoiceStatus | PaymentStatus | UserRole | string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status, size = 'md' }) => {
  const norm = status?.toLowerCase() || '';

  let colors = 'bg-teal-950/40 text-teal-300 border-teal-500/30';

  if (['active', 'paid', 'succeeded'].includes(norm)) {
    colors = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40';
  } else if (['trialing', 'pending'].includes(norm)) {
    colors = 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40';
  } else if (['past_due', 'overdue', 'failed'].includes(norm)) {
    colors = 'bg-rose-950/60 text-rose-300 border-rose-500/40 animate-pulse';
  } else if (['paused', 'draft'].includes(norm)) {
    colors = 'bg-amber-950/60 text-amber-300 border-amber-500/40';
  } else if (['cancelled', 'expired', 'void'].includes(norm)) {
    colors = 'bg-zinc-900 text-zinc-400 border-zinc-700/50';
  } else if (norm === 'admin') {
    colors = 'bg-purple-950/60 text-purple-300 border-purple-500/40';
  } else if (norm === 'operator') {
    colors = 'bg-blue-950/60 text-blue-300 border-blue-500/40';
  }

  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono uppercase tracking-wider rounded-full border ${px} ${colors}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {status.replace(/_/g, ' ')}
    </span>
  );
};
