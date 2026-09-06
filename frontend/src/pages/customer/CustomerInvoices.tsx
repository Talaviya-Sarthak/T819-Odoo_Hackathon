import { useState, useEffect } from 'react';
import { invoicesApi, paymentsApi } from '../../api';
import { useToast } from '../../components/Toast';
import { Download, Eye, FileText } from 'lucide-react';

interface InvoiceLine {
  id: string;
  description?: string;
  quantity: number;
  unitPrice: number | string;
  discountAmount: number | string;
  taxAmount: number | string;
  lineTotal: number | string;
  product?: { name: string; sku: string };
}

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  totalAmount: number | string;
  subtotal?: number | string;
  discountAmount?: number | string;
  taxAmount?: number | string;
  amountPaid: number | string;
  balanceDue: number | string;
  status: string;
  currency: string;
  dueDate?: string;
  paidAt?: string;
  createdAt: string;
  salesOrder?: { orderNumber: string };
  customer?: { name: string; company?: string; email?: string; address?: string };
  lines?: InvoiceLine[];
  payments?: Array<{ id: string; amount: number | string; method?: string; reference?: string; paidAt?: string; createdAt: string }>;
}

export default function CustomerInvoices() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Pay Modal State
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<InvoiceItem | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD');
  const [paying, setPaying] = useState(false);

  // Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<InvoiceItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Download PDF State
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    try {
      setLoading(true);
      const data = await invoicesApi.getAll();
      setInvoices(data);
    } catch {
      toast('Failed to load your invoices', 'error');
    } finally {
      setLoading(false);
    }
  }

  function openPayModal(inv: InvoiceItem) {
    setActiveInvoice(inv);
    setPaymentAmount(Number(inv.balanceDue));
    setPayModalOpen(true);
  }

  async function handleDownloadPdf(inv: InvoiceItem) {
    try {
      setDownloadingId(inv.id);
      await invoicesApi.downloadPdf(inv.id, inv.invoiceNumber);
      toast(`Invoice ${inv.invoiceNumber} PDF downloaded`, 'success');
    } catch (err: any) {
      toast(err?.message || 'Failed to download invoice PDF', 'error');
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleViewDetails(inv: InvoiceItem) {
    try {
      setDetailLoading(true);
      setDetailModalOpen(true);
      const full = await invoicesApi.getById(inv.id);
      setViewInvoice(full);
    } catch {
      setViewInvoice(inv);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handlePaySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeInvoice) return;

    try {
      setPaying(true);
      await paymentsApi.record({
        invoiceId: activeInvoice.id,
        amount: Number(paymentAmount),
        paymentMethod,
        reference: `CUST-PAY-${Date.now().toString().slice(-6)}`,
      });
      toast(`Payment of $${paymentAmount.toFixed(2)} submitted successfully!`, 'success');
      setPayModalOpen(false);
      await loadInvoices();
    } catch (err: any) {
      toast(err?.message || 'Payment submission failed', 'error');
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
          <span className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30">
            🧾
          </span>
          My Invoices & Receipts
        </h1>
        <p className="mt-1 text-sm text-slate-400">View billing statements, payment receipts, and settle outstanding balances.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 shadow-2xl backdrop-blur-xl">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
            <p className="mt-3 text-sm text-slate-400">Loading your invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-20 text-center">
            <span className="text-4xl">🧾</span>
            <p className="mt-3 text-base font-semibold text-slate-200">No invoices generated yet</p>
            <p className="text-sm text-slate-500">Invoices for confirmed orders will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Order Ref</th>
                  <th className="px-6 py-4">Date Issued</th>
                  <th className="px-6 py-4 text-right">Total Amount</th>
                  <th className="px-6 py-4 text-right">Paid</th>
                  <th className="px-6 py-4 text-right">Balance Due</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {invoices.map((inv) => {
                  const balance = Number(inv.balanceDue);
                  const isPaid = inv.status === 'PAID' || balance <= 0;
                  const isDownloading = downloadingId === inv.id;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-white text-base">{inv.invoiceNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-indigo-400">{inv.salesOrder?.orderNumber || '—'}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-white">
                        ${Number(inv.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400">
                        ${Number(inv.amountPaid).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-black text-cyan-400">
                        ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(inv)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                            title="View invoice details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleDownloadPdf(inv)}
                            disabled={isDownloading}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
                            title="Download PDF Invoice"
                          >
                            <Download className="h-4 w-4" />
                          </button>

                          {!isPaid ? (
                            <button
                              onClick={() => openPayModal(inv)}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                            >
                              Pay Now →
                            </button>
                          ) : (
                            <span className="text-emerald-400 text-xs font-semibold">✓ Paid</span>
                          )}
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

      {/* Invoice Detail Modal */}
      {detailModalOpen && viewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 p-6 sm:p-8 shadow-2xl text-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-800 text-cyan-400">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white font-mono">{viewInvoice.invoiceNumber}</h3>
                  <span className="text-xs text-slate-400">
                    Issued: {new Date(viewInvoice.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPdf(viewInvoice)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {detailLoading ? (
              <div className="py-16 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
                <p className="mt-3 text-xs text-slate-400">Loading invoice details...</p>
              </div>
            ) : (
              <div className="mt-5 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Bill To</span>
                    <p className="font-bold text-white text-sm mt-0.5">{viewInvoice.customer?.name || 'Customer'}</p>
                    {viewInvoice.customer?.company && <p className="text-slate-400">{viewInvoice.customer.company}</p>}
                    {viewInvoice.customer?.email && <p className="text-slate-400">{viewInvoice.customer.email}</p>}
                  </div>
                  <div className="space-y-1 sm:text-right">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Statement</span>
                    <p className="text-slate-300">
                      Order Ref: <span className="font-mono font-bold text-indigo-400">{viewInvoice.salesOrder?.orderNumber || '—'}</span>
                    </p>
                    <p className="text-slate-300">
                      Due Date: <span className="text-slate-200">{viewInvoice.dueDate ? new Date(viewInvoice.dueDate).toLocaleDateString() : 'Net 30'}</span>
                    </p>
                    <div className="pt-1 sm:flex sm:justify-end">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        Status: {viewInvoice.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Purchased Items</h4>
                  <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900/80 text-[11px] font-semibold text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-3">Item</th>
                          <th className="p-3 text-right">Qty</th>
                          <th className="p-3 text-right">Unit Price</th>
                          <th className="p-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {viewInvoice.lines && viewInvoice.lines.length > 0 ? (
                          viewInvoice.lines.map((l, idx) => (
                            <tr key={l.id || idx}>
                              <td className="p-3 font-medium text-white">
                                {l.product?.name || l.description || 'Product item'}
                              </td>
                              <td className="p-3 text-right font-mono">{l.quantity}</td>
                              <td className="p-3 text-right font-mono">${Number(l.unitPrice || 0).toFixed(2)}</td>
                              <td className="p-3 text-right font-mono font-bold text-white">${Number(l.lineTotal || 0).toFixed(2)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-3 text-center text-slate-500">Sales order line fulfillment</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-60 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-white font-bold text-sm border-t border-slate-800 pt-2">
                      <span>Total Amount:</span>
                      <span>${Number(viewInvoice.totalAmount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>Amount Paid:</span>
                      <span>${Number(viewInvoice.amountPaid || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-cyan-400 font-black text-sm p-2 rounded-lg bg-cyan-950/40 border border-cyan-800/40">
                      <span>Balance Due:</span>
                      <span>${Number(viewInvoice.balanceDue || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800 mt-6">
              {Number(viewInvoice.balanceDue || 0) > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setDetailModalOpen(false);
                    openPayModal(viewInvoice);
                  }}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md cursor-pointer"
                >
                  Pay Balance Due
                </button>
              )}
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 text-xs font-medium rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {payModalOpen && activeInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>💳</span> Settle Invoice Balance
              </h3>
              <button
                onClick={() => setPayModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="mt-4 space-y-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                <p className="text-slate-400">Invoice: <span className="font-bold text-white">{activeInvoice.invoiceNumber}</span></p>
                <div className="flex justify-between font-mono pt-1 text-sm">
                  <span className="text-slate-500">Balance Due:</span>
                  <span className="font-bold text-cyan-400">${Number(activeInvoice.balanceDue).toFixed(2)}</span>
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
                  max={Number(activeInvoice.balanceDue)}
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
                  <option value="CREDIT_CARD">Credit Card (Instant Confirmation)</option>
                  <option value="BANK_TRANSFER">Bank Wire / ACH</option>
                  <option value="CHECK">Check</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paying}
                  className="px-5 py-2 text-sm font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {paying ? 'Processing...' : 'Authorize Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
