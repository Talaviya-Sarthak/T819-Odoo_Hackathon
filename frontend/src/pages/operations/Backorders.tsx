import { useState, useEffect } from 'react';
import { backordersApi, warehousesApi } from '../../api';
import { useToast } from '../../components/Toast';
import PaginationControls from '../../components/PaginationControls';

interface BackorderItem {
  id: string;
  backorderNumber: string;
  salesOrderId: string;
  salesOrderLineId?: string;
  productId: string;
  quantity: number;
  fulfilledQuantity: number;
  status: 'PENDING' | 'OPEN' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
  product?: { id: string; name: string; sku: string };
  salesOrder?: { id: string; orderNumber: string; customer?: { name: string; company?: string } };
}

export default function Backorders() {
  const [backorders, setBackorders] = useState<BackorderItem[]>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
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

  // Fulfill Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBackorder, setSelectedBackorder] = useState<BackorderItem | null>(null);
  const [targetWarehouseId, setTargetWarehouseId] = useState('');
  const [fulfillQuantity, setFulfillQuantity] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [statusFilter, page, limit]);

  async function loadData() {
    try {
      setLoading(true);
      const [boRes, whRes] = await Promise.all([
        backordersApi.getAll({
          status: statusFilter || undefined,
          page,
          limit,
        }),
        warehousesApi.getAll(),
      ]);
      const items = Array.isArray(boRes) ? boRes : [];
      setBackorders(items);
      setWarehouses(whRes);
      if ((boRes as any)?.pagination) {
        setPagination((boRes as any).pagination);
      } else {
        const total = (boRes as any)?.total ?? items.length;
        setPagination({
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
          hasNextPage: page * limit < total,
          hasPreviousPage: page > 1,
        });
      }
      if (whRes.length > 0 && !targetWarehouseId) {
        setTargetWarehouseId(whRes[0].id);
      }
    } catch {
      toast('Failed to load backorders queue', 'error');
    } finally {
      setLoading(false);
    }
  }

  function openFulfillModal(bo: BackorderItem) {
    setSelectedBackorder(bo);
    const outstanding = bo.quantity - bo.fulfilledQuantity;
    setFulfillQuantity(outstanding);
    setModalOpen(true);
  }

  async function handleFulfillSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBackorder || !targetWarehouseId) return;

    const outstanding = selectedBackorder.quantity - selectedBackorder.fulfilledQuantity;
    if (fulfillQuantity <= 0 || fulfillQuantity > outstanding) {
      toast(`Fulfill quantity must be between 1 and ${outstanding}`, 'error');
      return;
    }

    try {
      setSubmitting(true);
      await backordersApi.fulfill(selectedBackorder.id, {
        warehouseId: targetWarehouseId,
        quantity: Number(fulfillQuantity),
      });
      toast(`Backorder ${selectedBackorder.backorderNumber} fulfilled successfully!`, 'success');
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast(err?.message || 'Failed to fulfill backorder', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // Summary Metrics
  const openCount = backorders.filter((b) => b.status !== 'FULFILLED' && b.status !== 'CANCELLED').length;
  const totalPendingUnits = backorders.reduce((sum, b) => {
    if (b.status === 'FULFILLED' || b.status === 'CANCELLED') return sum;
    return sum + (b.quantity - b.fulfilledQuantity);
  }, 0);
  const totalFulfilledUnits = backorders.reduce((sum, b) => sum + b.fulfilledQuantity, 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
          <span className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 text-white shadow-lg shadow-amber-500/30">
            ⏳
          </span>
          Backorders Queue
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage stock deficits, prioritize backordered units, and execute partial or complete backorder resolutions.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 backdrop-blur-xl shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Deficits</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-rose-400">{openCount}</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">Lines</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Unfulfilled line items pending stock</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 backdrop-blur-xl shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Units on Backorder</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-400">{totalPendingUnits}</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">Awaiting Stock</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Physical deficit to ship to customers</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 backdrop-blur-xl shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Resolved Units</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-400">{totalFulfilledUnits}</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Shipped</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Units successfully cleared and fulfilled</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 text-sm rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending (Unfulfilled)</option>
            <option value="PARTIALLY_FULFILLED">Partially Fulfilled</option>
            <option value="FULFILLED">Completed / Fulfilled</option>
          </select>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2 text-sm font-medium rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center gap-2"
        >
          <span>↻</span> Refresh
        </button>
      </div>

      {/* Backorders Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 shadow-2xl backdrop-blur-xl">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
            <p className="mt-3 text-sm text-slate-400">Loading backorders queue...</p>
          </div>
        ) : backorders.length === 0 ? (
          <div className="py-20 text-center">
            <span className="text-4xl">✨</span>
            <p className="mt-3 text-base font-semibold text-slate-200">No active backorders!</p>
            <p className="text-sm text-slate-500">All inventory demands are fully allocated.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Backorder #</th>
                  <th className="px-6 py-4">Order / Customer</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4 text-center">Required</th>
                  <th className="px-6 py-4 text-center">Fulfilled</th>
                  <th className="px-6 py-4 text-center">Deficit</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {backorders.map((bo) => {
                  const outstanding = bo.quantity - bo.fulfilledQuantity;
                  const isDone = bo.status === 'FULFILLED' || outstanding === 0;

                  return (
                    <tr key={bo.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-amber-400">{bo.backorderNumber}</span>
                        <div className="text-[11px] text-slate-500">{new Date(bo.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">
                          {bo.salesOrder?.orderNumber || 'SO-N/A'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {bo.salesOrder?.customer?.name || 'Customer'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-200">{bo.product?.name || 'Product'}</div>
                        <div className="text-xs font-mono text-indigo-400">{bo.product?.sku}</div>
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-white">
                        {bo.quantity}
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-emerald-400">
                        {bo.fulfilledQuantity}
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-extrabold text-rose-400">
                        {outstanding}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            isDone
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : bo.fulfilledQuantity > 0
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {bo.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!isDone && (
                          <button
                            onClick={() => openFulfillModal(bo)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-md shadow-amber-600/30 transition-all"
                          >
                            ⚡ Fulfill
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

      <PaginationControls
        page={pagination.page}
        limit={pagination.limit}
        total={pagination.total}
        totalPages={pagination.totalPages}
        onPageChange={(newPage) => setPage(newPage)}
        onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
      />

      {/* Fulfill Backorder Modal */}
      {modalOpen && selectedBackorder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>⚡</span> Fulfill Backorder
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFulfillSubmit} className="mt-4 space-y-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <p className="text-xs text-slate-400">Backorder Item</p>
                <p className="font-bold text-white">{selectedBackorder.product?.name}</p>
                <div className="flex justify-between text-xs text-slate-400 pt-2">
                  <span>Order: {selectedBackorder.salesOrder?.orderNumber}</span>
                  <span className="font-bold text-rose-400">
                    Deficit: {selectedBackorder.quantity - selectedBackorder.fulfilledQuantity} units
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Source Warehouse for Restock Fulfillment
                </label>
                <select
                  value={targetWarehouseId}
                  onChange={(e) => setTargetWarehouseId(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Quantity to Fulfill (Up to {selectedBackorder.quantity - selectedBackorder.fulfilledQuantity})
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedBackorder.quantity - selectedBackorder.fulfilledQuantity}
                  value={fulfillQuantity}
                  onChange={(e) => setFulfillQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-lg font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-bold rounded-xl text-white bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-600/30 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Fulfilling...' : 'Confirm Fulfillment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
