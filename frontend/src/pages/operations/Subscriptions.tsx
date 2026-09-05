import { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { useToast } from '../../components/Toast';
import { getSubscription, getSubscriptionSchedule } from '../../services/billing.api';
import type { Subscription, BillingSchedule } from '../../types';

interface SubscriptionRow extends Record<string, unknown> {
  id: string;
  customer: string;
  plan: string;
  status: string;
  startDate: string;
  nextBillingDate: string;
  totalRecurring: number;
}

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [schedule, setSchedule] = useState<BillingSchedule[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSubscriptions();
  }, []);

  async function loadSubscriptions() {
    try {
      setLoading(true);
      // Fetch subscriptions via the dashboard or directly from API
      const res = await fetch('/api/subscriptions', {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      const data = await res.json();
      const subs: Subscription[] = data.subscriptions || [];

      const rows: SubscriptionRow[] = subs.map((s) => ({
        id: s.id,
        customer: s.customer_name || s.customer_id,
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

  async function viewSchedule(subscriptionId: string) {
    try {
      setScheduleLoading(true);
      setScheduleModalOpen(true);
      const res = await getSubscriptionSchedule(subscriptionId);
      setSchedule(res.schedule || []);
    } catch {
      toast('Failed to load billing schedule', 'error');
    } finally {
      setScheduleLoading(false);
    }
  }

  const columns = [
    { key: 'customer', label: 'Customer' },
    { key: 'plan', label: 'Plan' },
    { key: 'status', label: 'Status', render: (row: SubscriptionRow) => <StatusBadge status={row.status} type="subscription" /> },
    { key: 'startDate', label: 'Start Date' },
    { key: 'nextBillingDate', label: 'Next Billing' },
    { key: 'totalRecurring', label: 'Recurring Amount', render: (row: SubscriptionRow) => `$${row.totalRecurring.toLocaleString()}` },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: SubscriptionRow) => (
        <Button variant="secondary" onClick={(e) => { e.stopPropagation(); viewSchedule(row.id); }}>
          View Schedule
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
        <p className="text-sm text-gray-500">Active subscriptions and billing schedules</p>
      </div>

      <DataTable
        columns={columns}
        data={subscriptions}
        loading={loading}
        emptyMessage="No subscriptions found"
        onRowClick={(row) => viewSchedule((row as unknown as SubscriptionRow).id)}
      />

      <Modal isOpen={scheduleModalOpen} onClose={() => setScheduleModalOpen(false)} title="Billing Schedule" size="lg">
        {scheduleLoading ? (
          <p className="text-sm text-gray-500">Loading schedule...</p>
        ) : schedule.length === 0 ? (
          <p className="text-sm text-gray-500">No billing schedule found.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Invoice Date</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 text-gray-900">{new Date(s.invoice_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-gray-900">${s.amount.toLocaleString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} type="payment" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}
