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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Subscriptions</h1>
        <p className="text-sm text-gray-500">View your active subscriptions</p>
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
