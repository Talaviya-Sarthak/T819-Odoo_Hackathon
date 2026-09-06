import { useState, useEffect } from 'react';
import { inventoryApi, warehousesApi } from '../../api';
import { useToast } from '../../components/Toast';

interface StockItem {
  id: string;
  warehouseId: string;
  productId: string;
  quantity?: number;
  quantityOnHand?: number;
  reservedQty?: number;
  quantityReserved?: number;
  reorderLevel?: number;
  unitCost?: number;
  inventoryValue?: number;
  warehouse?: { id: string; name: string; code: string; location?: string };
  warehouseName?: string;
  warehouseCode?: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    basePrice?: number | string;
    costPrice?: number | string;
  };
  productName?: string;
  sku?: string;
}

function toSafeNumber(val: any, fallback: number = 0): number {
  if (val === null || val === undefined || val === '') return fallback;
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
}

export default function Inventory() {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Stock Adjustment Modal state
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState('Restock / Shipment Received');
  const [submitting, setSubmitting] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [warehouseFilter, lowStockFilter]);

  async function loadData() {
    try {
      setLoading(true);
      const [stocksRes, whRes] = await Promise.all([
        inventoryApi.getAll({
          warehouseId: warehouseFilter || undefined,
          lowStock: lowStockFilter || undefined,
        }),
        warehousesApi.getAll(),
      ]);
      setStocks(Array.isArray(stocksRes) ? stocksRes : []);
      setWarehouses(Array.isArray(whRes) ? whRes : []);
    } catch {
      toast('Failed to load inventory stock levels', 'error');
    } finally {
      setLoading(false);
    }
  }

  function openAdjustModal(item: StockItem) {
    setSelectedStock(item);
    setAdjustmentAmount(10);
    setAdjustmentReason('Restock / Shipment Received');
    setAdjustModalOpen(true);
  }

  async function handleAdjustStock(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStock) return;
    if (adjustmentAmount === 0) {
      toast('Adjustment amount cannot be zero', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await inventoryApi.adjust(selectedStock.id, {
        adjustment: Number(adjustmentAmount),
        reason: adjustmentReason,
      });
      toast(`Successfully adjusted stock by ${adjustmentAmount > 0 ? '+' : ''}${adjustmentAmount}`, 'success');
      setAdjustModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast(err?.message || 'Failed to adjust stock', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const filteredStocks = stocks.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const pName = (s.product?.name || s.productName || '').toLowerCase();
    const pSku = (s.product?.sku || s.sku || '').toLowerCase();
    const wName = (s.warehouse?.name || s.warehouseName || '').toLowerCase();
    return pName.includes(q) || pSku.includes(q) || wName.includes(q);
  });

  // Calculate high-level stats
  const totalOnHand = filteredStocks.reduce((sum, s) => {
    const qty = toSafeNumber(s.quantity ?? s.quantityOnHand);
    return sum + qty;
  }, 0);
  const totalReserved = filteredStocks.reduce((sum, s) => {
    const res = toSafeNumber(s.reservedQty ?? s.quantityReserved);
    return sum + res;
  }, 0);
  const totalAvailable = Math.max(0, totalOnHand - totalReserved);
  const totalValuation = filteredStocks.reduce((sum, s) => {
    const qty = toSafeNumber(s.quantity ?? s.quantityOnHand);
    const cost = toSafeNumber(s.product?.costPrice ?? s.unitCost ?? s.product?.basePrice);
    return sum + qty * cost;
  }, 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
              📦
            </span>
            Multi-Warehouse Inventory
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Real-time stock reservation, available balances, reorder points, and instant replenishment.
          </p>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 backdrop-blur-xl shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total On-Hand</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{totalOnHand.toLocaleString()}</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Units</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Physical stock across warehouses</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 backdrop-blur-xl shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Reserved for Orders</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-400">{totalReserved.toLocaleString()}</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">Locked</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Allocated to pending fulfillments</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 backdrop-blur-xl shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Net Available to Sell</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-400">{totalAvailable.toLocaleString()}</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Free</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">On-Hand minus Reserved stock</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 backdrop-blur-xl shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Inventory Valuation</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-cyan-400">${totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Cost</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Asset value at cost basis</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-lg">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search product or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 px-4 py-2 text-sm rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="px-4 py-2 text-sm rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.code})
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors">
            <input
              type="checkbox"
              checked={lowStockFilter}
              onChange={(e) => setLowStockFilter(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
            />
            <span>Low Stock Alert Only</span>
          </label>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2 text-sm font-medium rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center gap-2"
        >
          <span>↻</span> Refresh
        </button>
      </div>

      {/* Stock Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 shadow-2xl backdrop-blur-xl">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
            <p className="mt-3 text-sm text-slate-400">Loading live stock levels...</p>
          </div>
        ) : filteredStocks.length === 0 ? (
          <div className="py-20 text-center">
            <span className="text-4xl">📦</span>
            <p className="mt-3 text-base font-semibold text-slate-200">No stock records found</p>
            <p className="text-sm text-slate-500">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Product / SKU</th>
                  <th className="px-6 py-4">Warehouse</th>
                  <th className="px-6 py-4 text-center">On-Hand</th>
                  <th className="px-6 py-4 text-center">Reserved</th>
                  <th className="px-6 py-4 text-center">Available</th>
                  <th className="px-6 py-4 text-center">Reorder Point</th>
                  <th className="px-6 py-4 text-right">Valuation</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredStocks.map((item) => {
                  const qty = toSafeNumber(item.quantity ?? item.quantityOnHand);
                  const reserved = toSafeNumber(item.reservedQty ?? item.quantityReserved);
                  const available = Math.max(0, qty - reserved);
                  const reorder = toSafeNumber(item.reorderLevel);
                  const isLow = qty <= reorder;
                  const unitCost = toSafeNumber(item.product?.costPrice ?? item.unitCost ?? item.product?.basePrice);
                  const itemValuation = toSafeNumber(item.inventoryValue ?? (qty * unitCost));
                  const productName = item.product?.name || item.productName || 'Unnamed Product';
                  const productSku = item.product?.sku || item.sku || 'SKU-N/A';
                  const warehouseName = item.warehouse?.name || item.warehouseName || 'Warehouse';
                  const warehouseCode = item.warehouse?.code || item.warehouseCode || 'WH';

                  return (
                    <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{productName}</div>
                        <div className="text-xs font-mono text-indigo-400">{productSku}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          🏢 {warehouseName} ({warehouseCode})
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-mono text-base font-bold text-white">{qty}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-mono text-base font-bold text-amber-400">{reserved}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`font-mono text-base font-extrabold ${
                            available === 0 ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {available}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-mono text-xs text-slate-400">{reorder}</span>
                          {isLow && (
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                              Low Stock
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-mono font-bold text-slate-200">${itemValuation.toFixed(2)}</div>
                        <div className="text-[11px] text-slate-500">${unitCost.toFixed(2)} / unit</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openAdjustModal(item)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        >
                          ± Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjust Stock Modal */}
      {adjustModalOpen && selectedStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🔄</span> Adjust Stock Level
              </h3>
              <button
                onClick={() => setAdjustModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="mt-4 space-y-4">
              <div>
                <p className="text-xs text-slate-400">Product</p>
                <p className="font-semibold text-white">{selectedStock.product?.name || selectedStock.productName}</p>
                <p className="text-xs text-indigo-400 font-mono">{selectedStock.product?.sku || selectedStock.sku}</p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Warehouse</p>
                <p className="text-sm font-medium text-slate-200">
                  {selectedStock.warehouse?.name || selectedStock.warehouseName} ({selectedStock.warehouse?.code || selectedStock.warehouseCode})
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <p className="text-xs text-slate-500">Current On-Hand</p>
                  <p className="text-lg font-bold text-white">
                    {toSafeNumber(selectedStock.quantity ?? selectedStock.quantityOnHand)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Projected On-Hand</p>
                  <p
                    className={`text-lg font-bold ${
                      toSafeNumber(selectedStock.quantity ?? selectedStock.quantityOnHand) + Number(adjustmentAmount) <
                      toSafeNumber(selectedStock.reservedQty ?? selectedStock.quantityReserved)
                        ? 'text-rose-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {toSafeNumber(selectedStock.quantity ?? selectedStock.quantityOnHand) + Number(adjustmentAmount)}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Adjustment Delta (Positive to Restock, Negative to Deduct)
                </label>
                <input
                  type="number"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-lg font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Reason for Adjustment
                </label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Restock / Shipment Received">Restock / Shipment Received</option>
                  <option value="Physical Stock Audit Correction">Physical Stock Audit Correction</option>
                  <option value="Damaged / Write-off">Damaged / Write-off</option>
                  <option value="Return to Vendor">Return to Vendor</option>
                  <option value="Internal Demo Use">Internal Demo Use</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Applying...' : 'Apply Stock Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
