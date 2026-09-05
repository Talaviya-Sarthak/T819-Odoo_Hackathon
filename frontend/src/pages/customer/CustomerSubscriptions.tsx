import { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import type { Subscription } from '../../types';

interface SubscriptionRow extends Record<string, unknown> {
  id: string;
  plan: string;
  status: string;
  startDate: string;
  nextBillingDate: string;
  totalRecurring: number;
}

export default function CustomerSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadSubscriptions();
  }, []);

  async function loadSubscriptions() {
    try {
      setLoading(true);
      const res = await fetch('/api/subscriptions', {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      const data = await res.json();
      const subs: Subscription[] = data.subscriptions || [];

      const customerSubs = subs.filter((s) => s.customer_id === user?.customer_id);
      const rows: SubscriptionRow[] = customerSubs.map((s) => ({
        id: s.id,
        plan: s.plan_name || s.plan_id,
        status: s.status,
        startDate: new Date(s.start_date).toLocaleDateString(),
        nextBillingDate: s.next_billing_date ? new Date(s.next_billing_date).toLocaleDateString() : '—',
        totalRecurring: s.lines?.reduce((sum, l) => sum + l.unit_price * l.quantity, 0) || 0,
      }));
      setSubscriptions(rows);
    } catch {
      toast('Failed to load subscriptions', 'error');
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    { key: 'plan', label: 'Plan' },
    { key: 'status', label: 'Status', render: (row: SubscriptionRow) => <StatusBadge status={row.status} type="subscription" /> },
    { key: 'startDate', label: 'Start Date' },
    { key: 'nextBillingDate', label: 'Next Billing' },
    { key: 'totalRecurring', label: 'Recurring Amount', render: (row: SubscriptionRow) => `$${row.totalRecurring.toLocaleString()}` },
  ];

  return (
    <div className="space-y-6">
<<<<<<< Updated upstream
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Subscriptions</h1>
        <p className="text-sm text-gray-500">View your active subscriptions</p>
=======
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Subscriptions</h1>
          <p className="text-sm text-muted-foreground">View your active subscriptions and recurring services</p>
        </div>
        <button
          onClick={loadSubscriptions}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-foreground bg-card border border-border/50 rounded-lg hover:bg-white/5 transition-colors shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
>>>>>>> Stashed changes
      </div>

      <DataTable
        columns={columns}
        data={subscriptions}
        loading={loading}
        emptyMessage="No subscriptions found"
      />
    </div>
  );
}
