import { useState, useEffect } from 'react';
import { invoicesApi, paymentsApi } from '../../api';
import { useToast } from '../../components/Toast';

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  totalAmount: number | string;
  amountPaid: number | string;
  balanceDue: number | string;
  status: string;
  currency: string;
  dueDate?: string;
  paidAt?: string;
  createdAt: string;
  salesOrder?: { orderNumber: string };
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
    <div className="space-y-8 animate-fadeIn">
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
                        {!isPaid ? (
                          <button
                            onClick={() => openPayModal(inv)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/30 transition-all"
                          >
                            Pay Now →
                          </button>
                        ) : (
                          <span className="text-emerald-400 text-xs font-semibold">✓ Paid</span>
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

      {/* Pay Modal */}
      {payModalOpen && activeInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>💳</span> Pay Invoice
              </h3>
              <button
                onClick={() => setPayModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="mt-4 space-y-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                <span>Invoice: <strong className="text-white">{activeInvoice.invoiceNumber}</strong></span>
                <span className="font-mono text-sm font-bold text-cyan-400">
                  Due: ${Number(activeInvoice.balanceDue).toFixed(2)}
                </span>
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
                  Select Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="CREDIT_CARD">Credit Card (Instant)</option>
                  <option value="BANK_TRANSFER">Bank Wire / ACH</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paying}
                  className="px-5 py-2 text-sm font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
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
