import { useState, useEffect } from 'react';
import { subscriptionsApi, invoicesApi } from '../../api';
import { useToast } from '../../components/Toast';
import PaginationControls from '../../components/PaginationControls';

interface BillingScheduleItem {
  id: string;
  subscriptionId: string;
  periodNumber?: number;
  periodStart?: string;
  periodEnd?: string;
  dueDate: string;
  amount: number | string;
  status: 'SCHEDULED' | 'PENDING' | 'INVOICED' | 'PAID' | 'FAILED' | 'SKIPPED';
  invoiceId?: string;
  paidAt?: string;
  invoice?: { id: string; invoiceNumber: string; status: string; balanceDue: number | string };
}

interface SubscriptionLine {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number | string;
  lineTotal: number | string;
  product?: { name: string; sku: string };
}

interface SubscriptionRecord {
  id: string;
  subscriptionNumber: string;
  customerId: string;
  planId?: string;
  salesOrderId?: string;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED';
  billingInterval?: string;
  startDate: string;
  nextBillingDate?: string;
  createdAt: string;
  customer?: { name: string; email: string; company?: string };
  plan?: { name: string; interval: string; price: number | string };
  lines?: SubscriptionLine[];
  billingSchedules?: BillingScheduleItem[];
  salesOrder?: { orderNumber: string };
}

export default function OperationsSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [selectedSub, setSelectedSub] = useState<SubscriptionRecord | null>(null);
  const [schedules, setSchedules] = useState<BillingScheduleItem[]>([]);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [invoicingScheduleId, setInvoicingScheduleId] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    loadSubscriptions();
  }, [page, limit]);

  async function loadSubscriptions() {
    try {
      setLoading(true);
      const data = await subscriptionsApi.getAll({ page, limit });
      const items = Array.isArray(data) ? data : [];
      setSubscriptions(items);
      if ((data as any)?.pagination) {
        setPagination((data as any).pagination);
      } else {
        const total = (data as any)?.total ?? items.length;
        setPagination({
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
          hasNextPage: page * limit < total,
          hasPreviousPage: page > 1,
        });
      }
    } catch {
      toast('Failed to load subscriptions', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function openScheduleModal(sub: SubscriptionRecord) {
    setSelectedSub(sub);
    setScheduleModalOpen(true);
    try {
      setScheduleLoading(true);
      const schedList = await subscriptionsApi.getBillingSchedule(sub.id);
      setSchedules(schedList);
    } catch {
      toast('Failed to load billing schedule', 'error');
    } finally {
      setScheduleLoading(false);
    }
  }

  async function handleGenerateScheduledInvoice(scheduleId: string) {
    try {
      setInvoicingScheduleId(scheduleId);
      const inv = await invoicesApi.createFromSchedule(scheduleId);
      toast(`Invoice ${inv.invoiceNumber} generated for scheduled billing period!`, 'success');
      if (selectedSub) {
        const schedList = await subscriptionsApi.getBillingSchedule(selectedSub.id);
        setSchedules(schedList);
      }
      await loadSubscriptions();
    } catch (err: any) {
      toast(err?.message || 'Failed to generate invoice from schedule', 'error');
    } finally {
      setInvoicingScheduleId(null);
    }
  }

  async function handleToggleStatus(sub: SubscriptionRecord) {
    try {
      if (sub.status === 'ACTIVE') {
        await subscriptionsApi.pause(sub.id);
        toast(`Subscription ${sub.subscriptionNumber} paused`, 'info');
      } else if (sub.status === 'PAUSED') {
        await subscriptionsApi.resume(sub.id);
        toast(`Subscription ${sub.subscriptionNumber} resumed`, 'success');
      }
      await loadSubscriptions();
    } catch (err: any) {
      toast(err?.message || 'Failed to update subscription', 'error');
    }
  }

  // Calculate MRR
  const mrr = subscriptions.reduce((sum, s) => {
    if (s.status !== 'ACTIVE') return sum;
    const lineTotal = s.lines?.reduce((lSum, l) => lSum + Number(l.lineTotal || 0), 0) || 0;
    return sum + lineTotal;
  }, 0);

  const activeCount = subscriptions.filter((s) => s.status === 'ACTIVE').length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/30">
              🔄
            </span>
            Recurring Subscriptions & Billing Schedules
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Multi-period recurring revenue contracts, automated 12-month billing schedules, and schedule-to-invoice triggers.
          </p>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 backdrop-blur-xl shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Monthly Recurring Revenue (MRR)</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-purple-400">
              ${mrr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Contracted
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Live recurring line totals</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 backdrop-blur-xl shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Contracts</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{activeCount}</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              of {subscriptions.length} Total
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Running client subscriptions</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 backdrop-blur-xl shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Billing Intervals</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-indigo-400">Monthly</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              12 Periods
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Auto-generated schedule calendar</p>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 shadow-2xl backdrop-blur-xl">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
            <p className="mt-3 text-sm text-slate-400">Loading recurring subscriptions...</p>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="py-20 text-center">
            <span className="text-4xl">🔄</span>
            <p className="mt-3 text-base font-semibold text-slate-200">No active subscriptions found</p>
            <p className="text-sm text-slate-500">
              Orders containing recurring SaaS products (e.g. ERP Cloud, Support) automatically generate subscriptions.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Subscription #</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Plan / Interval</th>
                  <th className="px-6 py-4 text-right">Recurring Rate</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4">Next Billing Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {subscriptions.map((sub) => {
                  const subTotal = sub.lines?.reduce((sum, l) => sum + Number(l.lineTotal), 0) || 0;

                  return (
                    <tr key={sub.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-white text-base">
                          {sub.subscriptionNumber || `SUB-${sub.id.slice(0, 8)}`}
                        </span>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Order: {sub.salesOrder?.orderNumber || 'SO-N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{sub.customer?.name || 'Customer'}</div>
                        <div className="text-xs text-slate-400">{sub.customer?.company || sub.customer?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          {sub.plan?.name || 'Enterprise Subscription'} ({sub.plan?.interval || 'MONTHLY'})
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-black text-purple-400 text-base">
                        ${subTotal.toFixed(2)}/mo
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            sub.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : sub.status === 'PAUSED'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-300">
                        {sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openScheduleModal(sub)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-all"
                          >
                            📅 Schedule
                          </button>
                          <button
                            onClick={() => handleToggleStatus(sub)}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all"
                          >
                            {sub.status === 'ACTIVE' ? 'Pause' : 'Resume'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PaginationControls
        page={pagination.page}
        limit={pagination.limit}
        total={pagination.total}
        totalPages={pagination.totalPages}
        onPageChange={(newPage) => setPage(newPage)}
        onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
      />

      {/* Billing Schedule Timeline Modal */}
      {scheduleModalOpen && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-semibold uppercase text-purple-400">12-Period Billing Schedule</span>
                <h2 className="text-xl font-black text-white">
                  Subscription {selectedSub.subscriptionNumber}
                </h2>
              </div>
              <button
                onClick={() => setScheduleModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <p className="text-slate-500">Customer</p>
                <p className="font-bold text-white">{selectedSub.customer?.name}</p>
              </div>
              <div>
                <p className="text-slate-500">Billing Cycle</p>
                <p className="font-bold text-purple-400">Monthly Invoicing (12 Periods)</p>
              </div>
              <div>
                <p className="text-slate-500">Total Contract</p>
                <p className="font-mono font-bold text-emerald-400 text-sm">
                  ${(schedules.reduce((sum, s) => sum + Number(s.amount), 0)).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Schedule Periods Table */}
            <div className="mt-5 overflow-hidden rounded-xl border border-slate-800">
              {scheduleLoading ? (
                <div className="py-12 text-center text-sm text-slate-400">Loading schedule timeline...</div>
              ) : schedules.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500">No periods generated yet.</div>
              ) : (
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-center">#</th>
                      <th className="px-4 py-3">Scheduled Due Date</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3">Invoice</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {schedules.map((period, idx) => {
                      const hasInvoice = !!period.invoiceId || !!period.invoice;

                      return (
                        <tr key={period.id} className="hover:bg-slate-800/40">
                          <td className="px-4 py-3 text-center font-bold text-slate-500">
                            {period.periodNumber || idx + 1}
                          </td>
                          <td className="px-4 py-3 font-mono text-white">
                            {new Date(period.dueDate).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-purple-400">
                            ${Number(period.amount).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                period.status === 'PAID'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : period.status === 'INVOICED'
                                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              {period.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {hasInvoice ? (
                              <span className="font-mono text-xs text-cyan-400 font-bold">
                                {period.invoice?.invoiceNumber || `INV-${period.invoiceId?.slice(0, 6)}`}
                              </span>
                            ) : (
                              <span className="text-slate-500">Unbilled</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {!hasInvoice ? (
                              <button
                                disabled={invoicingScheduleId === period.id}
                                onClick={() => handleGenerateScheduledInvoice(period.id)}
                                className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all disabled:opacity-50"
                              >
                                {invoicingScheduleId === period.id ? '...' : '🧾 Invoice'}
                              </button>
                            ) : (
                              <span className="text-emerald-400 text-xs font-semibold">✓ Generated</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setScheduleModalOpen(false)}
                className="px-5 py-2 text-xs font-medium rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
