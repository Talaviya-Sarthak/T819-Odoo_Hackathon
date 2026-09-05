import { useState, useEffect } from 'react';
import { invoicesApi, ordersApi, paymentsApi } from '../../api';
import { useToast } from '../../components/Toast';

interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number | string;
  discountAmount: number | string;
  taxAmount: number | string;
  lineTotal: number | string;
  product?: { name: string; sku: string };
}

interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  customerId: string;
  salesOrderId?: string;
  subtotal: number | string;
  discountAmount: number | string;
  taxAmount: number | string;
  totalAmount: number | string;
  amountPaid: number | string;
  balanceDue: number | string;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED';
  currency: string;
  dueDate?: string;
  paidAt?: string;
  createdAt: string;
  customer?: { id: string; name: string; email: string; company?: string };
  salesOrder?: { id: string; orderNumber: string };
  lines?: InvoiceLine[];
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Payment Recording Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [paymentReference, setPaymentReference] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);

  // New Invoice Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [eligibleOrders, setEligibleOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadInvoices();
  }, [statusFilter]);

  async function loadInvoices() {
    try {
      setLoading(true);
      const data = await invoicesApi.getAll({ status: statusFilter || undefined });
      setInvoices(data);
    } catch {
      toast('Failed to load invoices list', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function openCreateModal() {
    try {
      const orders = await ordersApi.getAll({ status: 'ORDER_CONFIRMED' });
      setEligibleOrders(orders);
      if (orders.length > 0) {
        setSelectedOrderId(orders[0].id);
      }
      setCreateModalOpen(true);
    } catch {
      toast('Failed to load sales orders for invoicing', 'error');
    }
  }

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrderId) return;

    try {
      setCreatingInvoice(true);
      const inv = await invoicesApi.createFromOrder(selectedOrderId);
      toast(`Invoice ${inv.invoiceNumber} created successfully!`, 'success');
      setCreateModalOpen(false);
      await loadInvoices();
    } catch (err: any) {
      toast(err?.message || 'Failed to create invoice', 'error');
    } finally {
      setCreatingInvoice(false);
    }
  }

  function openPaymentModal(inv: InvoiceRecord) {
    setSelectedInvoice(inv);
    const balance = Number(inv.balanceDue);
    setPaymentAmount(balance);
    setPaymentReference(`WIRE-${Date.now().toString().slice(-6)}`);
    setPaymentMethod('BANK_TRANSFER');
    setPaymentModalOpen(true);
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedInvoice) return;

    const balance = Number(selectedInvoice.balanceDue);
    if (paymentAmount <= 0) {
      toast('Payment amount must be greater than zero', 'error');
      return;
    }
    if (paymentAmount > balance + 0.001) {
      toast(`Payment cannot exceed the outstanding balance ($${balance.toFixed(2)})`, 'error');
      return;
    }

    try {
      setRecordingPayment(true);
      await paymentsApi.record({
        invoiceId: selectedInvoice.id,
        amount: Number(paymentAmount),
        paymentMethod,
        reference: paymentReference,
      });
      toast(`Payment of $${paymentAmount.toFixed(2)} recorded successfully!`, 'success');
      setPaymentModalOpen(false);
      await loadInvoices();
    } catch (err: any) {
      toast(err?.message || 'Failed to record payment', 'error');
    } finally {
      setRecordingPayment(false);
    }
  }

  const filteredInvoices = invoices.filter((i) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      i.invoiceNumber?.toLowerCase().includes(q) ||
      i.customer?.name?.toLowerCase().includes(q) ||
      i.salesOrder?.orderNumber?.toLowerCase().includes(q)
    );
  });

  // Calculate summary metrics
  const totalBilled = filteredInvoices.reduce((sum, i) => sum + Number(i.totalAmount), 0);
  const totalCollected = filteredInvoices.reduce((sum, i) => sum + Number(i.amountPaid), 0);
  const totalOutstanding = filteredInvoices.reduce((sum, i) => sum + Number(i.balanceDue), 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30">
              🧾
            </span>
            Authoritative Invoices & Receivables
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Audit-grade invoice generation from sales orders and recurring schedules with real-time balance tracking.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <span>➕</span> Generate Invoice
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 backdrop-blur-xl shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Billed</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">
              ${totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {filteredInvoices.length} Invoices
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Gross receivables issued</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 backdrop-blur-xl shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Collected</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-400">
              ${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Settled
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Payments recorded against invoices</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 backdrop-blur-xl shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Outstanding Due</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-cyan-400">
              ${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Receivable
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Uncollected customer balance</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-lg">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search invoice #, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 px-4 py-2 text-sm rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 text-sm rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
          >
            <option value="">All Invoices</option>
            <option value="PENDING">Pending (Unpaid)</option>
            <option value="PARTIAL">Partially Paid</option>
            <option value="PAID">Fully Paid</option>
          </select>
        </div>

        <button
          onClick={loadInvoices}
          className="px-4 py-2 text-sm font-medium rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center gap-2"
        >
          <span>↻</span> Refresh
        </button>
      </div>

      {/* Invoices Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 shadow-2xl backdrop-blur-xl">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
            <p className="mt-3 text-sm text-slate-400">Loading invoice records...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="py-20 text-center">
            <span className="text-4xl">🧾</span>
            <p className="mt-3 text-base font-semibold text-slate-200">No invoices found</p>
            <p className="text-sm text-slate-500">Generate an invoice from confirmed sales orders.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Order Ref</th>
                  <th className="px-6 py-4 text-right">Total Amount</th>
                  <th className="px-6 py-4 text-right">Amount Paid</th>
                  <th className="px-6 py-4 text-right">Balance Due</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredInvoices.map((inv) => {
                  const balance = Number(inv.balanceDue);
                  const isPaid = inv.status === 'PAID' || balance <= 0;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-white">{inv.invoiceNumber}</span>
                        <div className="text-[11px] text-slate-500">{new Date(inv.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{inv.customer?.name || 'Customer'}</div>
                        <div className="text-xs text-slate-400">{inv.customer?.company || inv.customer?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-indigo-400">
                          {inv.salesOrder?.orderNumber || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-white">
                        ${Number(inv.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400">
                        ${Number(inv.amountPaid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-black text-cyan-400">
                        ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            isPaid
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : inv.status === 'PARTIAL'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!isPaid && (
                          <button
                            onClick={() => openPaymentModal(inv)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/30 transition-all"
                          >
                            💳 Record Pay
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {paymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>💳</span> Record Payment
              </h3>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                <p className="text-slate-400">Invoice: <span className="font-bold text-white">{selectedInvoice.invoiceNumber}</span></p>
                <p className="text-slate-400">Customer: <span className="font-bold text-white">{selectedInvoice.customer?.name}</span></p>
                <div className="flex justify-between font-mono pt-1 text-sm">
                  <span className="text-slate-500">Balance Due:</span>
                  <span className="font-bold text-cyan-400">${Number(selectedInvoice.balanceDue).toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Payment Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={Number(selectedInvoice.balanceDue)}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-lg font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Overpayments strictly blocked. Partial payments will update balance due.
                </p>
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
                  Payment Reference / Transaction ID
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. WIRE-849204"
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordingPayment}
                  className="px-5 py-2 text-sm font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                >
                  {recordingPayment ? 'Recording...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Invoice from Order Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>➕</span> Generate Invoice
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Select Sales Order
                </label>
                {eligibleOrders.length === 0 ? (
                  <p className="text-sm text-slate-500 py-3">No confirmed orders available to invoice.</p>
                ) : (
                  <select
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  >
                    {eligibleOrders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.orderNumber} — {o.customer?.name} (${Number(o.totalAmount).toLocaleString()})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingInvoice || eligibleOrders.length === 0}
                  className="px-5 py-2 text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {creatingInvoice ? 'Generating...' : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
