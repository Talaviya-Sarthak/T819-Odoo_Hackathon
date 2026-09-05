import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'quotation' | 'approval' | 'fulfillment' | 'payment' | 'subscription';
  className?: string;
}

const statusColorMap: Record<string, string> = {
  // Quotation
  draft: 'bg-muted text-muted-foreground border-border/50',
  sent: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  accepted: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  expired: 'bg-amber-500/15 text-amber-400 border-amber-500/30',

  // Approval
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  rejected_approval: 'bg-rose-500/15 text-rose-400 border-rose-500/30',

  // Fulfillment
  processing: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  shipped: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  delivered: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-rose-500/15 text-rose-400 border-rose-500/30',

  // Payment
  unpaid: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  paid: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  partial: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  refunded: 'bg-purple-500/15 text-purple-400 border-purple-500/30',

  // Subscription
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  inactive: 'bg-muted text-muted-foreground border-border/50',
  trial: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  past_due: 'bg-rose-500/15 text-rose-400 border-rose-500/30'
};

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const normalized = status.toLowerCase().replace(/\s+/g, '_');
  const colorClass = statusColorMap[normalized] || 'bg-muted text-muted-foreground border-border/50';

  const displayLabel = status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide ${colorClass} ${className}`}
    >
      {displayLabel}
    </span>
  );
}
