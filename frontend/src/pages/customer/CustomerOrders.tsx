import { useState, useEffect } from 'react';
import { ordersApi } from '../../api';
import { useToast } from '../../components/Toast';

interface OrderLine {
  id: string;
  quantity: number;
  unitPrice: number | string;
  lineTotal: number | string;
  product?: { name: string; sku: string };
}

interface SalesOrder {
  id: string;
  orderNumber: string;
  currency: string;
  totalAmount: number | string;
  status: string;
  createdAt: string;
  lines?: OrderLine[];
}

export default function CustomerOrders() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      const res = await ordersApi.getAll();
      setOrders(res);
    } catch {
      toast('Failed to load your orders', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
          <span className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/30">
            📦
          </span>
          My Confirmed Orders
        </h1>
        <p className="mt-1 text-sm text-slate-400">Track and review your purchased orders and delivery progress.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 shadow-2xl backdrop-blur-xl">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
            <p className="mt-3 text-sm text-slate-400">Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center">
            <span className="text-4xl">📋</span>
            <p className="mt-3 text-base font-semibold text-slate-200">No confirmed orders yet</p>
            <p className="text-sm text-slate-500">Confirm an approved quotation in your portal to place an order.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Order #</th>
                  <th className="px-6 py-4">Date Placed</th>
                  <th className="px-6 py-4 text-center">Items</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Total Amount</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-white text-base">{o.orderNumber}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-medium text-slate-300">
                      {o.lines?.length || 0} item(s)
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          o.status === 'FULFILLED'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : o.status === 'PARTIALLY_FULFILLED'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-extrabold text-white text-base">
                      ${Number(o.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium text-indigo-300 bg-indigo-500/10 hover:bg-indigo-600 hover:text-white border border-indigo-500/20 transition-all"
                      >
                        View Items
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-semibold uppercase text-indigo-400">Order Summary</span>
                <h2 className="text-2xl font-black text-white">{selectedOrder.orderNumber}</h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-white text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-right">Unit Price</th>
                    <th className="px-4 py-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {selectedOrder.lines?.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{l.product?.name || 'Item'}</div>
                        <div className="font-mono text-[10px] text-indigo-400">{l.product?.sku}</div>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-white">{l.quantity}</td>
                      <td className="px-4 py-3 text-right font-mono">${Number(l.unitPrice).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                        ${Number(l.lineTotal).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-sm">
              <span className="text-slate-400">Total Order Amount:</span>
              <span className="font-mono font-black text-white text-lg">
                ${Number(selectedOrder.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-slate-800 hover:bg-slate-700 transition-all"
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
