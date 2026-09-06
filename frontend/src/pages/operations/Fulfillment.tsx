import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fulfillmentApi, ordersApi, warehousesApi } from '../../api';
import { useToast } from '../../components/Toast';

interface FulfillmentLine {
  id: string;
  salesOrderLineId: string;
  quantityToFulfill: number;
  quantityFulfilled: number;
  salesOrderLine?: {
    quantity: number;
    fulfilledQuantity?: number;
    product?: { name: string; sku: string };
  };
}

interface FulfillmentRecord {
  id: string;
  orderNumber?: string;
  fulfillmentNumber?: string;
  salesOrderId: string;
  warehouseId: string;
  status: 'PENDING' | 'ALLOCATED' | 'PARTIALLY_FULFILLED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  notes?: string;
  trackingNumber?: string;
  shippedAt?: string;
  fulfilledAt?: string;
  createdAt: string;
  warehouse?: { id: string; name: string; code: string };
  salesOrder?: {
    id: string;
    orderNumber: string;
    customer?: { name: string; company?: string };
    lines?: Array<{
      id: string;
      quantity: number;
      quantityFulfilled?: number;
      fulfilledQuantity?: number;
      product?: { name: string; sku: string; isService?: boolean };
    }>;
  };
  lines?: FulfillmentLine[];
  backorders?: Array<{ id: string; quantity: number; status: string }>;
}

export default function Fulfillment() {
  const [fulfillments, setFulfillments] = useState<FulfillmentRecord[]>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchParams] = useSearchParams();

  // Create Fulfillment Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [lineAllocations, setLineAllocations] = useState<{ [lineId: string]: number }>({});
  const [creating, setCreating] = useState(false);

  // Ship / Complete Modal State
  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [activeFulfillmentId, setActiveFulfillmentId] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shipping, setShipping] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  useEffect(() => {
    const orderIdParam = searchParams.get('orderId');
    if (orderIdParam) {
      const matched = pendingOrders.find((o) => o.id === orderIdParam);
      if (matched) {
        handleOpenCreateForOrder(matched);
      } else {
        ordersApi.getById(orderIdParam).then((ord) => {
          if (ord) handleOpenCreateForOrder(ord);
        }).catch(() => {});
      }
    }
  }, [searchParams, pendingOrders]);

  async function loadData() {
    try {
      setLoading(true);
      const [fList, whList, oList] = await Promise.all([
        fulfillmentApi.getAll({ status: statusFilter || undefined }),
        warehousesApi.getAll(),
        ordersApi.getAll(),
      ]);

      const fulfillmentRecords = Array.isArray(fList)
        ? fList
        : Array.isArray((fList as any)?.fulfillments)
        ? (fList as any).fulfillments
        : [];
      setFulfillments(fulfillmentRecords);
      setWarehouses(Array.isArray(whList) ? whList : []);

      const ordersList = Array.isArray(oList)
        ? oList
        : Array.isArray((oList as any)?.orders)
        ? (oList as any).orders
        : Array.isArray((oList as any)?.salesOrders)
        ? (oList as any).salesOrders
        : [];

      // Filter to all orders that have remaining physical items to dispatch
      const unfulfilled = ordersList.filter((o: any) => {
        if (o.status === 'FULFILLED' || o.status === 'CANCELLED') return false;
        const lines = o.lines || [];
        if (lines.length === 0) return true;
        return lines.some((l: any) => {
          const isService = l.product?.unit === 'service' || l.product?.unit === 'contract' || l.product?.name?.toLowerCase().includes('service');
          if (isService) return false;
          const fulfilled = l.quantityFulfilled ?? l.fulfilledQuantity ?? 0;
          return l.quantity > fulfilled;
        });
      });
      setPendingOrders(unfulfilled);

      if (whList.length > 0 && !selectedWarehouseId) {
        setSelectedWarehouseId(whList[0].id);
      }
    } catch {
      toast('Failed to load fulfillment operations data', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreateForOrder(order: any) {
    setSelectedOrderId(order.id);
    const initialAlloc: { [lineId: string]: number } = {};
    if (order.lines) {
      for (const line of order.lines) {
        const remaining = line.quantity - (line.quantityFulfilled ?? line.fulfilledQuantity ?? 0);
        initialAlloc[line.id] = remaining > 0 ? remaining : 0;
      }
    }
    setLineAllocations(initialAlloc);
    setCreateModalOpen(true);
  }

  async function handleCreateFulfillment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrderId || !selectedWarehouseId) return;

    const linesPayload = Object.entries(lineAllocations)
      .filter(([_, qty]) => qty > 0)
      .map(([salesOrderLineId, quantityToFulfill]) => ({
        salesOrderLineId,
        quantityToFulfill,
      }));

    if (linesPayload.length === 0) {
      toast('Please allocate at least 1 unit to fulfill', 'error');
      return;
    }

    try {
      setCreating(true);
      const res = await fulfillmentApi.create({
        salesOrderId: selectedOrderId,
        warehouseId: selectedWarehouseId,
        lines: linesPayload,
      });

      if (res.backordersCreated && res.backordersCreated.length > 0) {
        toast(`Fulfillment created with ${res.backordersCreated.length} backorder shortage record(s)`, 'info');
      } else {
        toast('Fulfillment order created and inventory reserved!', 'success');
      }

      setCreateModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast(err?.message || 'Failed to create fulfillment', 'error');
    } finally {
      setCreating(false);
    }
  }

  function openShipModal(fulfillmentId: string) {
    setActiveFulfillmentId(fulfillmentId);
    setTrackingNumber(`TRK-${Date.now().toString().slice(-8)}`);
    setShipModalOpen(true);
  }

  async function handleConfirmShip(e: React.FormEvent) {
    e.preventDefault();
    if (!activeFulfillmentId) return;

    try {
      setShipping(true);
      await fulfillmentApi.fulfill(activeFulfillmentId, { trackingNumber });
      toast('Shipment dispatched and stock released from reservations!', 'success');
      setShipModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast(err?.message || 'Failed to complete shipment', 'error');
    } finally {
      setShipping(false);
    }
  }

  const selectedOrderObj = pendingOrders.find((o) => o.id === selectedOrderId);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-lg shadow-cyan-500/30">
              🚚
            </span>
            Fulfillment & Multi-Warehouse Allocation
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Allocate hardware from Ahmedabad or Vadodara, trigger partial fulfillment, and dispatch shipments.
          </p>
        </div>

        <button
          onClick={() => {
            if (pendingOrders.length > 0) {
              handleOpenCreateForOrder(pendingOrders[0]);
            } else {
              toast('No orders currently pending fulfillment', 'info');
            }
          }}
          className="px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <span>➕</span> New Allocation
        </button>
      </div>

      {/* Pending Orders Ready to Fulfill */}
      {pendingOrders.length > 0 && (
        <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/70 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Orders Awaiting Dispatch ({pendingOrders.length})
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white text-sm">{order.orderNumber}</div>
                  <div className="text-slate-400">{order.customer?.name}</div>
                  <div className="font-mono text-indigo-400 mt-1">
                    {order.lines?.length || 0} line item(s)
                  </div>
                </div>
                <button
                  onClick={() => handleOpenCreateForOrder(order)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all"
                >
                  Allocate →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 text-sm rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            <option value="">All Fulfillment Statuses</option>
            <option value="PENDING">Pending (Reserved)</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered / Dispatched</option>
          </select>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2 text-sm font-medium rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center gap-2"
        >
          <span>↻</span> Refresh
        </button>
      </div>

      {/* Fulfillment Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 shadow-2xl backdrop-blur-xl">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
            <p className="mt-3 text-sm text-slate-400">Loading fulfillment orders...</p>
          </div>
        ) : fulfillments.length === 0 ? (
          <div className="py-20 text-center">
            <span className="text-4xl">🚚</span>
            <p className="mt-3 text-base font-semibold text-slate-200">No fulfillment records found</p>
            <p className="text-sm text-slate-500">Allocate an order from above to start shipping.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Fulfillment / Order</th>
                  <th className="px-6 py-4">Warehouse</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4">Tracking Number</th>
                  <th className="px-6 py-4">Shipped At</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {fulfillments.map((f) => {
                  const orderNum = f.orderNumber || f.fulfillmentNumber || `FO-${f.id.slice(0, 8)}`;
                  const isShipped = f.status === 'DELIVERED' || f.status === 'SHIPPED' || f.status === 'FULFILLED' || !!f.fulfilledAt || !!f.shippedAt;
                  const tracking = f.trackingNumber || (f.notes?.includes('tracking') ? f.notes.split('tracking')[1]?.trim() : (f.notes || ''));
                  const shipDate = f.fulfilledAt || f.shippedAt;
                  const allocatedQty = f.lines?.reduce((sum, l) => sum + (l.quantityToFulfill || (l as any).quantity || 0), 0) || 0;

                  return (
                    <tr key={f.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-white">
                          {orderNum}
                        </div>
                        <div className="text-xs text-indigo-400 font-mono">
                          {f.salesOrder?.orderNumber || 'SO-N/A'}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {allocatedQty} unit(s) allocated
                          {f.backorders && f.backorders.length > 0 && (
                            <span className="ml-1.5 text-amber-400 font-medium">({f.backorders.length} backordered)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          🏢 {f.warehouse?.name} ({f.warehouse?.code})
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{f.salesOrder?.customer?.name || 'Customer'}</div>
                        <div className="text-xs text-slate-400">{f.salesOrder?.customer?.company}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            isShipped
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : f.status === 'PROCESSING'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          }`}
                        >
                          {f.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {tracking ? (
                          <span className="font-mono text-xs font-bold text-cyan-400">{tracking}</span>
                        ) : (
                          <span className="text-xs text-slate-500">Not Dispatched</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {shipDate ? new Date(shipDate).toLocaleString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!isShipped && (
                          <button
                            onClick={() => openShipModal(f.id)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                          >
                            🚀 Ship Order
                          </button>
                        )}
                        {isShipped && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ✓ Dispatched
                          </span>
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

      {/* Create / Allocate Fulfillment Modal */}
      {createModalOpen && selectedOrderObj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-semibold uppercase text-cyan-400">Fulfillment Allocation</span>
                <h2 className="text-xl font-black text-white">
                  Order {selectedOrderObj.orderNumber}
                </h2>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFulfillment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Select Dispatch Warehouse
                </label>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Line items allocation inputs */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
                  Line Items Quantity to Fulfill
                </label>
                <div className="space-y-3">
                  {selectedOrderObj.lines?.map((line: any) => {
                    const remaining = line.quantity - (line.quantityFulfilled ?? line.fulfilledQuantity ?? 0);
                    const currentAlloc = lineAllocations[line.id] ?? remaining;

                    return (
                      <div
                        key={line.id}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4 text-xs"
                      >
                        <div className="flex-1">
                          <div className="font-bold text-white">{line.product?.name}</div>
                          <div className="text-[11px] text-indigo-400 font-mono">{line.product?.sku}</div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            Ordered: {line.quantity} | Remaining: {remaining}
                          </div>
                        </div>

                        <div className="w-32">
                          <label className="block text-[10px] text-slate-500 uppercase mb-1">Qty to Ship</label>
                          <input
                            type="number"
                            min={0}
                            max={remaining}
                            value={currentAlloc}
                            onChange={(e) =>
                              setLineAllocations({
                                ...lineAllocations,
                                [line.id]: Math.min(remaining, Math.max(0, parseInt(e.target.value) || 0)),
                              })
                            }
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold text-center focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                  disabled={creating}
                  className="px-5 py-2 text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {creating ? 'Allocating...' : 'Confirm Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ship / Tracking Modal */}
      {shipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🚀</span> Dispatch Shipment
              </h3>
              <button
                onClick={() => setShipModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmShip} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Courier Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. FEDEX-98234201"
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShipModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={shipping}
                  className="px-5 py-2 text-sm font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                >
                  {shipping ? 'Dispatching...' : 'Mark as Shipped'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
