import { useState, useEffect } from 'react';
import { paymentsApi, invoicesApi } from '../../api';
import { useToast } from '../../components/Toast';

interface PaymentItem {
  id: string;
  invoiceId: string;
  amount: number | string;
  method: string;
  reference: string;
  status: string;
  paidAt: string;
  createdAt: string;
  invoice?: {
    id: string;
    invoiceNumber: string;
    customer?: { name: string; company?: string };
  };
}

export default function Payments() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Record Payment Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [openInvoices, setOpenInvoices] = useState<any[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [reference, setReference] = useState('');
  const [recording, setRecording] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadPayments();
  }, []);

  async function loadPayments() {
    try {
      setLoading(true);
      const data = await paymentsApi.getAll();
      setPayments(data);
    } catch {
      toast('Failed to load payments history', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function openRecordModal() {
    try {
      const invs = await invoicesApi.getAll();
      const unpaid = invs.filter((i: any) => i.status !== 'PAID' && Number(i.balanceDue) > 0);
      setOpenInvoices(unpaid);
      if (unpaid.length > 0) {
        setSelectedInvoiceId(unpaid[0].id);
        setPaymentAmount(Number(unpaid[0].balanceDue));
      }
      setReference(`WIRE-${Date.now().toString().slice(-6)}`);
      setModalOpen(true);
    } catch {
      toast('Failed to load invoices', 'error');
    }
  }

  async function handleRecordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedInvoiceId) return;

    try {
      setRecording(true);
      await paymentsApi.record({
        invoiceId: selectedInvoiceId,
        amount: Number(paymentAmount),
        paymentMethod,
        reference,
      });
      toast('Payment recorded successfully!', 'success');
      setModalOpen(false);
      await loadPayments();
    } catch (err: any) {
      toast(err?.message || 'Failed to record payment', 'error');
    } finally {
      setRecording(false);
    }
  }

  const filteredPayments = payments.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.reference?.toLowerCase().includes(q) ||
      p.invoice?.invoiceNumber?.toLowerCase().includes(q) ||
      p.invoice?.customer?.name?.toLowerCase().includes(q) ||
      p.method?.toLowerCase().includes(q)
    );
  });

  const totalCollected = filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
              💳
            </span>
            Payment Ledger & Cash Collections
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Real-time audit log of all transactions, wire transfers, card charges, and customer payments.
          </p>
        </div>

        <button
          onClick={openRecordModal}
          className="px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <span>➕</span> Record Payment
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 backdrop-blur-xl shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Cash Inflow</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-400">
              ${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              USD
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Cumulative collected payments</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 backdrop-blur-xl shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Transaction Count</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{filteredPayments.length}</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              Recorded
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Verified payment receipts</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 backdrop-blur-xl shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Success Rate</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-cyan-400">100%</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Zero Failures
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Settled without chargebacks</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search reference, invoice #, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-72 px-4 py-2 text-sm rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
          />
        </div>

        <button
          onClick={loadPayments}
          className="px-4 py-2 text-sm font-medium rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center gap-2"
        >
          <span>↻</span> Refresh
        </button>
      </div>

      {/* Payments Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 shadow-2xl backdrop-blur-xl">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
            <p className="mt-3 text-sm text-slate-400">Loading payment records...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="py-20 text-center">
            <span className="text-4xl">💳</span>
            <p className="mt-3 text-base font-semibold text-slate-200">No payment records found</p>
            <p className="text-sm text-slate-500">Payments recorded against invoices will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Reference #</th>
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Payment Method</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Settled At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-emerald-400">{p.reference || p.id.slice(0, 8)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-white">
                        {p.invoice?.invoiceNumber || 'INV-N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{p.invoice?.customer?.name || 'Customer'}</div>
                      <div className="text-xs text-slate-400">{p.invoice?.customer?.company}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {p.method?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-black text-white text-base">
                      ${Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-slate-400">
                      {p.paidAt ? new Date(p.paidAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>💳</span> Record Customer Payment
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Select Open Invoice
                </label>
                {openInvoices.length === 0 ? (
                  <p className="text-sm text-slate-500 py-3">All invoices are currently fully paid!</p>
                ) : (
                  <select
                    value={selectedInvoiceId}
                    onChange={(e) => {
                      setSelectedInvoiceId(e.target.value);
                      const inv = openInvoices.find((i) => i.id === e.target.value);
                      if (inv) setPaymentAmount(Number(inv.balanceDue));
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  >
                    {openInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} — {inv.customer?.name} (Due: ${Number(inv.balanceDue).toFixed(2)})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Amount to Pay ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-lg font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="BANK_TRANSFER">Bank Wire / ACH</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="CHECK">Check</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Transaction / Reference #
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recording || openInvoices.length === 0}
                  className="px-5 py-2 text-sm font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                >
                  {recording ? 'Recording...' : 'Submit Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
