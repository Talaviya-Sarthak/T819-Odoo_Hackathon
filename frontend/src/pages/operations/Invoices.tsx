import React, { useState, useEffect } from 'react';
import { invoicesApi, ordersApi, paymentsApi } from '../../api';
import { useToast } from '../../components/Toast';
import { 
  FileDown, 
  FileText, 
  Download, 
  Eye, 
  Plus, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ExternalLink,
  DollarSign
} from 'lucide-react';

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

interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  customerId: string;
  salesOrderId?: string;
  subscriptionId?: string;
  subtotal: number | string;
  discountAmount: number | string;
  taxAmount: number | string;
  totalAmount: number | string;
  amountPaid: number | string;
  balanceDue: number | string;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  currency: string;
  dueDate?: string;
  paidAt?: string;
  createdAt: string;
  customer?: { id: string; name: string; email?: string; company?: string; address?: string };
  salesOrder?: { id: string; orderNumber: string };
  lines?: InvoiceLine[];
  payments?: Array<{ id: string; amount: number | string; method?: string; reference?: string; paidAt?: string; createdAt: string; status: string }>;
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

  // Invoice Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<InvoiceRecord | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Download & Export States
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

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

  async function handleViewDetails(inv: InvoiceRecord) {
    try {
      setDetailLoading(true);
      setDetailModalOpen(true);
      const fullInv = await invoicesApi.getById(inv.id);
      setViewInvoice(fullInv);
    } catch {
      setViewInvoice(inv);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleDownloadPdf(inv: InvoiceRecord) {
    try {
      setDownloadingPdfId(inv.id);
      await invoicesApi.downloadPdf(inv.id, inv.invoiceNumber);
      toast(`Invoice ${inv.invoiceNumber} PDF downloaded`, 'success');
    } catch (err: any) {
      toast(err?.message || 'Failed to download invoice PDF', 'error');
    } finally {
      setDownloadingPdfId(null);
    }
  }

  async function handleExportCsv() {
    try {
      setExportingCsv(true);
      await invoicesApi.exportCsv({ status: statusFilter || undefined });
      toast('Invoices CSV report downloaded', 'success');
    } catch (err: any) {
      toast(err?.message || 'Failed to export CSV report', 'error');
    } finally {
      setExportingCsv(false);
    }
  }

  async function handleExportPdf() {
    try {
      setExportingPdf(true);
      await invoicesApi.exportPdf({ status: statusFilter || undefined });
      toast('Invoices Executive PDF report downloaded', 'success');
    } catch (err: any) {
      toast(err?.message || 'Failed to export PDF report', 'error');
    } finally {
      setExportingPdf(false);
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
      if (viewInvoice && viewInvoice.id === selectedInvoice.id) {
        handleViewDetails(selectedInvoice);
      }
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
      i.invoiceNumber.toLowerCase().includes(q) ||
      i.customer?.name?.toLowerCase().includes(q) ||
      i.customer?.company?.toLowerCase().includes(q) ||
      i.salesOrder?.orderNumber?.toLowerCase().includes(q)
    );
  });

  const totalBilled = filteredInvoices.reduce((sum, i) => sum + Number(i.totalAmount || 0), 0);
  const totalCollected = filteredInvoices.reduce((sum, i) => sum + Number(i.amountPaid || 0), 0);
  const totalOutstanding = filteredInvoices.reduce((sum, i) => sum + Number(i.balanceDue || 0), 0);

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header with Title and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30">
              🧾
            </span>
            Authoritative Invoices & Receivables
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Audit-grade invoice generation from sales orders with real-time payment reconciliation and reporting.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Export CSV Report */}
          <button
            onClick={handleExportCsv}
            disabled={exportingCsv}
            className="px-3.5 py-2 rounded-xl font-medium text-xs text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Download authoritative CSV spreadsheet of invoices"
          >
            <FileDown className="h-4 w-4 text-emerald-400" />
            <span>{exportingCsv ? 'Exporting...' : 'Export CSV'}</span>
          </button>

          {/* Export PDF Report */}
          <button
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="px-3.5 py-2 rounded-xl font-medium text-xs text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Download executive PDF summary report of invoices"
          >
            <FileText className="h-4 w-4 text-cyan-400" />
            <span>{exportingPdf ? 'Generating...' : 'PDF Report'}</span>
          </button>

          {/* Generate Invoice */}
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Generate Invoice</span>
          </button>
        </div>
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
              Verified
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
          className="px-4 py-2 text-sm font-medium rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Invoices Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 shadow-2xl backdrop-blur-xl">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
            <p className="mt-3 text-sm text-slate-400">Loading invoices ledger...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="py-20 text-center">
            <span className="text-4xl">🧾</span>
            <p className="mt-3 text-base font-semibold text-slate-200">No invoices found</p>
            <p className="text-sm text-slate-500">Generate an invoice from confirmed sales orders above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Order #</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4 text-right">Paid</th>
                  <th className="px-6 py-4 text-right">Balance</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredInvoices.map((inv) => {
                  const balance = Number(inv.balanceDue || 0);
                  const isPaid = inv.status === 'PAID';
                  const isDownloading = downloadingPdfId === inv.id;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-white flex items-center gap-2">
                        <span>{inv.invoiceNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{inv.customer?.name || 'Customer'}</div>
                        <div className="text-xs text-slate-500">{inv.customer?.company || inv.customer?.email || '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-indigo-400">
                          {inv.salesOrder?.orderNumber || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-white">
                        ${Number(inv.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400">
                        ${Number(inv.amountPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                        <div className="inline-flex items-center gap-1.5">
                          {/* View Detail */}
                          <button
                            onClick={() => handleViewDetails(inv)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                            title="View Invoice Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Download PDF */}
                          <button
                            onClick={() => handleDownloadPdf(inv)}
                            disabled={isDownloading}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </button>

                          {/* Record Payment */}
                          {!isPaid && (
                            <button
                              onClick={() => openPaymentModal(inv)}
                              className="ml-1 px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-sm transition-all cursor-pointer"
                            >
                              Record Pay
                            </button>
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
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 p-6 sm:p-8 shadow-2xl text-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-800 text-cyan-400">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white font-mono">
                    {viewInvoice?.invoiceNumber || 'Invoice Details'}
                  </h3>
                  <span className="text-xs text-slate-400">
                    Created: {viewInvoice?.createdAt ? new Date(viewInvoice.createdAt).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => viewInvoice && handleDownloadPdf(viewInvoice)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download PDF</span>
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
                <p className="mt-3 text-xs text-slate-400">Loading invoice breakdown...</p>
              </div>
            ) : viewInvoice ? (
              <div className="mt-5 space-y-6">
                {/* Meta & Customer Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Billed To</span>
                    <p className="font-bold text-white text-sm mt-0.5">{viewInvoice.customer?.name || 'Customer'}</p>
                    {viewInvoice.customer?.company && <p className="text-slate-400">{viewInvoice.customer.company}</p>}
                    {viewInvoice.customer?.email && <p className="text-slate-400">{viewInvoice.customer.email}</p>}
                    {viewInvoice.customer?.address && <p className="text-slate-500 mt-1">{viewInvoice.customer.address}</p>}
                  </div>

                  <div className="space-y-1 sm:text-right">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Order & Status</span>
                    <p className="text-slate-300">
                      Sales Order: <span className="font-mono font-bold text-indigo-400">{viewInvoice.salesOrder?.orderNumber || '—'}</span>
                    </p>
                    <p className="text-slate-300">
                      Due Date: <span className="text-slate-200">{viewInvoice.dueDate ? new Date(viewInvoice.dueDate).toLocaleDateString() : 'Net 30'}</span>
                    </p>
                    <div className="pt-1 sm:flex sm:justify-end">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          viewInvoice.status === 'PAID'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : viewInvoice.status === 'PARTIAL'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                        }`}
                      >
                        Status: {viewInvoice.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Line Items</h4>
                  <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900/80 text-[11px] font-semibold text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-3">Product / Description</th>
                          <th className="p-3 text-right">Qty</th>
                          <th className="p-3 text-right">Unit Price</th>
                          <th className="p-3 text-right">Discount</th>
                          <th className="p-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {viewInvoice.lines && viewInvoice.lines.length > 0 ? (
                          viewInvoice.lines.map((l, idx) => (
                            <tr key={l.id || idx}>
                              <td className="p-3 font-medium text-white">
                                <div>{l.product?.name || l.description || 'Line Item'}</div>
                                {l.product?.sku && <span className="font-mono text-[10px] text-slate-500">[{l.product.sku}]</span>}
                              </td>
                              <td className="p-3 text-right font-mono">{l.quantity}</td>
                              <td className="p-3 text-right font-mono">${Number(l.unitPrice || 0).toFixed(2)}</td>
                              <td className="p-3 text-right font-mono text-emerald-400">
                                {Number(l.discountAmount || 0) > 0 ? `-$${Number(l.discountAmount).toFixed(2)}` : '—'}
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-white">
                                ${Number(l.lineTotal || 0).toFixed(2)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-3 text-center text-slate-500">Standard sales order fulfillment</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals Breakdown */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal:</span>
                      <span>${Number(viewInvoice.subtotal || 0).toFixed(2)}</span>
                    </div>
                    {Number(viewInvoice.discountAmount || 0) > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Discount:</span>
                        <span>-${Number(viewInvoice.discountAmount).toFixed(2)}</span>
                      </div>
                    )}
                    {Number(viewInvoice.taxAmount || 0) > 0 && (
                      <div className="flex justify-between text-slate-400">
                        <span>Tax:</span>
                        <span>+${Number(viewInvoice.taxAmount).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-white font-bold text-sm border-t border-slate-800 pt-2">
                      <span>Grand Total:</span>
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

                {/* Payments History */}
                {viewInvoice.payments && viewInvoice.payments.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Payment History</h4>
                    <div className="space-y-1.5">
                      {viewInvoice.payments.map((p) => (
                        <div key={p.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between text-xs items-center">
                          <span className="text-slate-300">
                            {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : new Date(p.createdAt).toLocaleDateString()} — {p.method} ({p.reference || 'Ref'})
                          </span>
                          <span className="font-mono font-bold text-emerald-400">+${Number(p.amount).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800 mt-6">
              {viewInvoice && Number(viewInvoice.balanceDue || 0) > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setDetailModalOpen(false);
                    openPaymentModal(viewInvoice);
                  }}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md transition-all cursor-pointer"
                >
                  Record Payment
                </button>
              )}
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 text-xs font-medium rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
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
                  className="px-4 py-2 text-sm font-medium rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordingPayment}
                  className="px-5 py-2 text-sm font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 cursor-pointer"
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
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
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
                  className="px-4 py-2 text-sm font-medium rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingInvoice || eligibleOrders.length === 0}
                  className="px-5 py-2 text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
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
