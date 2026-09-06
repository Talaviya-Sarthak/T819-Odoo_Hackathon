import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersApi, quotationsApi, invoicesApi } from '../../api';
import { useToast } from '../../components/Toast';
import { TableSkeleton } from '../../components/ui/skeleton';
import PaginationControls from '../../components/PaginationControls';

interface OrderLine {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number | string;
  lineSubtotal: number | string;
  discountAmount: number | string;
  taxRate?: number | string;
  lineTotal: number | string;
  product?: { name: string; sku: string; billingType?: string };
}

interface SalesOrder {
  id: string;
  orderNumber: string;
  quotationId: string;
  customerId: string;
  subtotal: number | string;
  discountAmount: number | string;
  taxAmount: number | string;
  totalAmount: number | string;
  currency: string;
  status: string;
  createdAt: string;
  customer?: { id: string; name: string; email: string; company?: string };
  quotation?: { quotationNumber: string };
  lines?: OrderLine[];
  invoices?: Array<{ id: string; invoiceNumber: string; status: string; totalAmount: number | string }>;
}

export default function OperationsOrders() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [confirmedQuotes, setConfirmedQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
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

  // Order Details Modal state
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [convertingQuoteId, setConvertingQuoteId] = useState<string | null>(null);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    loadOrders();
  }, [statusFilter, page, limit, debouncedSearch]);

  useEffect(() => {
    loadConfirmedQuotes();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      const data = await ordersApi.getAll({
        status: statusFilter || undefined,
        search: debouncedSearch || undefined,
        page,
        limit,
      });
      const list = Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.orders)
        ? (data as any).orders
        : Array.isArray((data as any)?.salesOrders)
        ? (data as any).salesOrders
        : [];
      setOrders(list);
      if ((data as any)?.pagination) {
        setPagination((data as any).pagination);
      } else {
        const total = (data as any)?.total ?? list.length;
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
      toast('Failed to load sales orders', 'error');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadConfirmedQuotes() {
    try {
      // Quotes ready for conversion
      const quotes = await quotationsApi.getAll({ status: 'CUSTOMER_CONFIRMED' });
      const list = Array.isArray(quotes)
        ? quotes
        : Array.isArray((quotes as any)?.quotations)
        ? (quotes as any).quotations
        : Array.isArray((quotes as any)?.data)
        ? (quotes as any).data
        : [];
      const unconverted = list.filter((q: any) => !q.salesOrder && !q.salesOrderId);
      setConfirmedQuotes(unconverted);
    } catch {
      setConfirmedQuotes([]);
    }
  }

  async function handleConvertQuote(quoteId: string) {
    try {
      setConvertingQuoteId(quoteId);
      const order = await ordersApi.createFromQuotation(quoteId);
      const orderNum = order?.orderNumber || order?.order_number || (order as any)?.order?.orderNumber || 'SO';
      toast(`Sales Order ${orderNum} successfully generated!`, 'success');
      setConfirmedQuotes((prev) => prev.filter((q) => q.id !== quoteId));
      setCreateModalOpen(false);
      await loadOrders();
      await loadConfirmedQuotes();
    } catch (err: any) {
      toast(err?.message || 'Failed to generate order from quotation', 'error');
    } finally {
      setConvertingQuoteId(null);
    }
  }

  async function handleCreateInvoice(orderId: string) {
    try {
      setGeneratingInvoice(true);
      const inv = await invoicesApi.createFromOrder(orderId);
      const invNum = inv?.invoiceNumber || inv?.invoice_number || (inv as any)?.invoice?.invoiceNumber || 'INV';
      toast(`Invoice ${invNum} generated successfully!`, 'success');
      // Refresh selected order
      const updated = await ordersApi.getById(orderId);
      setSelectedOrder(updated?.order || updated);
      await loadOrders();
    } catch (err: any) {
      toast(err?.message || 'Failed to create invoice', 'error');
    } finally {
      setGeneratingInvoice(false);
    }
  }

  async function openOrderDetails(order: SalesOrder) {
    setSelectedOrder(order);
    setDetailsModalOpen(true);
    try {
      const full = await ordersApi.getById(order.id);
      if (full) {
        setSelectedOrder(full?.order || full);
      }
    } catch {
      // keep initial order
    }
  }

  const filteredOrders = (Array.isArray(orders) ? orders : []).filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o?.orderNumber?.toLowerCase().includes(q) ||
      o?.customer?.name?.toLowerCase().includes(q) ||
      o?.customer?.company?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/30">
              📋
            </span>
            Sales Orders Management
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Authoritative sales orders with line pricing preservation, fulfillment dispatch, and direct invoice generation.
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] self-start sm:self-auto cursor-pointer"
        >
          <span>⚡</span> Create Sales Order
        </button>
      </div>

      {/* Confirmed Quotations Ready for Conversion Banner */}
      {confirmedQuotes.length > 0 && (
        <div className="rounded-2xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/60 to-slate-900 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-300">
                Customer-Confirmed Quotations Ready for Order Creation ({confirmedQuotes.length})
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {confirmedQuotes.map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-white text-sm">{q.quotationNumber || q.quotation_number || q.id?.slice(0, 8)}</div>
                  <div className="text-slate-300 font-medium">{q.customer?.name || q.customer_name || 'Customer'}</div>
                  <div className="font-mono font-bold text-emerald-400 mt-1">
                    ${Number(q.grandTotal || q.grand_total || q.totalAmount || q.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <button
                  disabled={convertingQuoteId === q.id}
                  onClick={() => handleConvertQuote(q.id)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50 whitespace-nowrap"
                >
                  {convertingQuoteId === q.id ? 'Creating...' : '⚡ Create Order'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-lg">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search order # or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 px-4 py-2 text-sm rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 text-sm rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          >
            <option value="">All Statuses</option>
            <option value="ORDER_CONFIRMED">Order Confirmed</option>
            <option value="PARTIALLY_FULFILLED">Partially Fulfilled</option>
            <option value="FULFILLED">Fulfilled</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <button
          onClick={() => {
            loadOrders();
            loadConfirmedQuotes();
          }}
          className="px-4 py-2 text-sm font-medium rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center gap-2"
        >
          <span>↻</span> Refresh
        </button>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 shadow-2xl backdrop-blur-xl">
        {loading ? (
          <div className="p-4">
            <TableSkeleton rows={5} cols={6} />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center">
            <span className="text-4xl">📋</span>
            <p className="mt-3 text-base font-semibold text-slate-200">No sales orders found</p>
            <p className="text-sm text-slate-500">Confirm a quotation to create an order.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Order #</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Quote Ref</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Total Amount</th>
                  <th className="px-6 py-4 text-center">Invoiced</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredOrders.map((order) => {
                  const hasInvoice = order.invoices && order.invoices.length > 0;

                  return (
                    <tr
                      key={order.id}
                      onClick={() => openOrderDetails(order)}
                      className="cursor-pointer hover:bg-slate-900/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-white text-base">{order.orderNumber}</span>
                        <div className="text-[11px] text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{order.customer?.name || 'Customer'}</div>
                        <div className="text-xs text-slate-400">{order.customer?.company || order.customer?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-indigo-400">
                          {order.quotation?.quotationNumber || order.quotationId?.slice(0, 8)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            order.status === 'FULFILLED'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : order.status === 'PARTIALLY_FULFILLED'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : order.status === 'CANCELLED'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono font-extrabold text-white text-base">
                          ${Number(order.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <div className="text-[11px] text-slate-500">{order.currency || 'USD'}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {hasInvoice ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ✓ {order.invoices?.[0]?.invoiceNumber}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">Not Invoiced</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openOrderDetails(order)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => navigate(`/operations/fulfillment?orderId=${order.id}`)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-all"
                          >
                            Fulfill
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

      {/* Order Details Modal */}
      {detailsModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-semibold uppercase text-indigo-400">Sales Order Details</span>
                <h2 className="text-2xl font-black text-white">{selectedOrder.orderNumber}</h2>
              </div>
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <div>
                <p className="text-slate-500">Customer</p>
                <p className="font-bold text-white text-sm">{selectedOrder.customer?.name}</p>
                <p className="text-slate-400">{selectedOrder.customer?.email}</p>
              </div>
              <div>
                <p className="text-slate-500">Fulfillment Status</p>
                <p className="font-bold text-emerald-400 text-sm">{selectedOrder.status}</p>
                <p className="text-slate-400">Created {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-slate-500">Total Valuation</p>
                <p className="font-bold text-white text-base font-mono">
                  ${Number(selectedOrder.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="mt-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
                Order Line Items & Pricing Breakdown
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 font-semibold uppercase border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-4 py-3 text-right">Unit Price</th>
                      <th className="px-4 py-3 text-right">Discount</th>
                      <th className="px-4 py-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {selectedOrder.lines?.map((line) => (
                      <tr key={line.id} className="hover:bg-slate-800/40">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">{line.product?.name || 'Line item'}</div>
                          <div className="font-mono text-[10px] text-indigo-400">{line.product?.sku}</div>
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-white">
                          {line.quantity}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          ${Number(line.unitPrice).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-amber-400">
                          -${Number(line.discountAmount || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                          ${Number(line.lineTotal).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2">
                {selectedOrder.invoices && selectedOrder.invoices.length > 0 ? (
                  <span className="text-xs text-emerald-400 font-medium">
                    ✓ Invoice Generated: {selectedOrder.invoices[0]?.invoiceNumber}
                  </span>
                ) : (
                  <button
                    disabled={generatingInvoice}
                    onClick={() => handleCreateInvoice(selectedOrder.id)}
                    className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
                  >
                    {generatingInvoice ? 'Generating...' : '🧾 Generate Invoice'}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDetailsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setDetailsModalOpen(false);
                    navigate(`/operations/fulfillment?orderId=${selectedOrder.id}`);
                  }}
                  className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all"
                >
                  🚚 Allocate & Fulfill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Sales Order Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-semibold uppercase text-indigo-400">Direct Order Generation</span>
                <h2 className="text-xl font-black text-white">Create Sales Order from Quotation</h2>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              {confirmedQuotes.length === 0 ? (
                <div className="py-12 text-center">
                  <span className="text-4xl">📄</span>
                  <p className="mt-3 text-base font-semibold text-white">No Pending Confirmed Quotations</p>
                  <p className="mt-1 text-sm text-slate-400 max-w-md mx-auto">
                    All currently confirmed quotations have already been converted into active sales orders. To create a new order, confirm a quotation in the Quotations portal.
                  </p>
                  <div className="mt-5 flex justify-center gap-3">
                    <button
                      onClick={() => navigate('/sales/quotations')}
                      className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all"
                    >
                      View Quotations Portal
                    </button>
                    <button
                      onClick={() => setCreateModalOpen(false)}
                      className="px-4 py-2 text-xs font-medium rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 mb-2">
                    Select any customer-confirmed quotation below to immediately generate an official Sales Order:
                  </p>
                  <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                    {confirmedQuotes.map((q) => (
                      <div
                        key={q.id}
                        className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 transition-all flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white text-sm">
                              {q.quotationNumber || q.quotation_number || q.id?.slice(0, 8)}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              CUSTOMER CONFIRMED
                            </span>
                          </div>
                          <div className="text-xs text-slate-300 font-medium mt-1">
                            {q.customer?.name || q.customer_name || 'Customer'}
                            {q.customer?.company ? ` • ${q.customer.company}` : ''}
                          </div>
                          <div className="font-mono font-extrabold text-emerald-400 mt-1 text-sm">
                            ${Number(q.grandTotal || q.grand_total || q.totalAmount || q.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                        </div>

                        <button
                          disabled={convertingQuoteId === q.id}
                          onClick={() => handleConvertQuote(q.id)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50 whitespace-nowrap cursor-pointer"
                        >
                          {convertingQuoteId === q.id ? 'Creating...' : '⚡ Generate Order'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
