import { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { useToast } from '../../components/Toast';
import { subscriptionsApi } from '../../api';
import { RefreshCw } from 'lucide-react';

interface SubscriptionRow extends Record<string, unknown> {
  id: string;
  subscriptionNumber: string;
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

  useEffect(() => {
    loadSubscriptions();
  }, []);

  async function loadSubscriptions() {
    try {
      setLoading(true);
      const subs = await subscriptionsApi.getAll();
      const list: any[] = Array.isArray(subs) ? subs : [];

      const rows: SubscriptionRow[] = list.map((s) => {
        const planName = s.plan?.name || s.plan_name || s.planName || 'Standard Subscription';
        const startRaw = s.startDate || s.start_date;
        const nextRaw = s.nextBillingDate || s.next_billing_date;
        
        let recurring = 0;
        if (Array.isArray(s.lines) && s.lines.length > 0) {
          recurring = s.lines.reduce((sum: number, l: any) => {
            const price = Number(l.unitPrice ?? l.unit_price ?? 0);
            const qty = Number(l.quantity ?? 1);
            return sum + (price * qty);
          }, 0);
        } else if (s.plan?.price) {
          recurring = Number(s.plan.price);
        }

        return {
          id: s.id,
          subscriptionNumber: s.subscriptionNumber || s.subscription_number || `SUB-${s.id.slice(0, 8)}`,
          plan: planName,
          status: s.status || 'ACTIVE',
          startDate: startRaw ? new Date(startRaw).toLocaleDateString() : '—',
          nextBillingDate: nextRaw ? new Date(nextRaw).toLocaleDateString() : '—',
          totalRecurring: recurring,
        };
      });

      setSubscriptions(rows);
    } catch (err: any) {
      console.error('Failed to load subscriptions:', err);
      toast(err?.message || 'Failed to load subscriptions', 'error');
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    { key: 'subscriptionNumber', label: 'Subscription #' },
    { key: 'plan', label: 'Plan' },
    { key: 'status', label: 'Status', render: (row: SubscriptionRow) => <StatusBadge status={row.status} type="subscription" /> },
    { key: 'startDate', label: 'Start Date' },
    { key: 'nextBillingDate', label: 'Next Billing' },
    { key: 'totalRecurring', label: 'Recurring Amount', render: (row: SubscriptionRow) => `$${row.totalRecurring.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
  ];

  return (
    <div className="space-y-6">
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
