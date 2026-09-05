import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Select from '../../components/Select';
import { useToast } from '../../components/Toast';
<<<<<<< Updated upstream
import { getQuotations } from '../../services/quotations.api';
import type { Quotation, QuotationStatus } from '../../types';
=======
import { TableSkeleton } from '../../components/ui/skeleton';
>>>>>>> Stashed changes

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'ORDER_CONFIRMED', label: 'Order Confirmed' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'ACCEPTED', label: 'Accepted' },
];

const ORDER_STATUSES: QuotationStatus[] = ['ORDER_CONFIRMED', 'APPROVED', 'ACCEPTED'];

export default function Orders() {
  const [orders, setOrders] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      const all: Quotation[] = [];
      for (const status of ORDER_STATUSES) {
        const res = await getQuotations({ status, limit: 100 });
        all.push(...res.quotations);
      }
      setOrders(all);
    } catch {
      toast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  }

  const filtered = statusFilter
    ? orders.filter((o) => o.status === statusFilter)
    : orders;

  const columns = [
    { key: 'quotation_number', label: 'Quotation #', render: (row: Quotation) => row.id.slice(0, 8).toUpperCase() },
    { key: 'customer_name', label: 'Customer', render: (row: Quotation) => row.customer_name || row.customer_id },
    { key: 'status', label: 'Status', render: (row: Quotation) => <StatusBadge status={row.status} type="quotation" /> },
    { key: 'grand_total', label: 'Total', render: (row: Quotation) => `${row.currency} ${row.grand_total.toLocaleString()}` },
    { key: 'created_at', label: 'Created', render: (row: Quotation) => new Date(row.created_at).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500">Manage confirmed orders and track fulfillment</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-64">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={STATUS_OPTIONS}
          />
        </div>
      </div>

<<<<<<< Updated upstream
      <DataTable
        columns={columns}
        data={filtered as unknown as Record<string, unknown>[]}
        loading={loading}
        emptyMessage="No confirmed orders found"
        onRowClick={(row) => navigate(`/operations/fulfillment?quotation=${(row as unknown as Quotation).id}`)}
      />
=======
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
>>>>>>> Stashed changes
    </div>
  );
}
