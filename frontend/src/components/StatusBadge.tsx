interface StatusBadgeProps {
  status: string;
  type: 'quotation' | 'approval' | 'fulfillment' | 'payment' | 'subscription';
  className?: string;
}

const statusColorMap: Record<string, string> = {
  // Quotation
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-50 text-blue-700',
  accepted: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  expired: 'bg-yellow-50 text-yellow-700',

  // Approval
  pending: 'bg-yellow-50 text-yellow-700',
  approved: 'bg-green-50 text-green-700',
  rejected_approval: 'bg-red-50 text-red-700',

  // Fulfillment
  processing: 'bg-blue-50 text-blue-700',
  shipped: 'bg-indigo-50 text-indigo-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',

  // Payment
  unpaid: 'bg-red-50 text-red-700',
  paid: 'bg-green-50 text-green-700',
  partial: 'bg-yellow-50 text-yellow-700',
  refunded: 'bg-purple-50 text-purple-700',

  // Subscription
  active: 'bg-green-50 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
  trial: 'bg-blue-50 text-blue-700',
  past_due: 'bg-red-50 text-red-700'
};

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const normalized = status.toLowerCase().replace(/\s+/g, '_');
  const colorClass = statusColorMap[normalized] || 'bg-gray-100 text-gray-700';

  const displayLabel = status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass} ${className}`}
    >
      {displayLabel}
    </span>
  );
}
