import { useState, useEffect } from 'react';
import { warehousesApi, inventoryApi } from '../../api';
import { useToast } from '../../components/Toast';

interface StockItem {
  id: string;
  quantity: number;
  reservedQty: number;
  reorderLevel: number;
  product?: { name: string; sku: string; costPrice?: number | string };
}

interface WarehouseWithStocks {
  id: string;
  name: string;
  code: string;
  location?: string;
  address?: string;
  active: boolean;
  stocks: StockItem[];
}

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState<WarehouseWithStocks[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Warehouse Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const whList = await warehousesApi.getAll();
      const withStocks: WarehouseWithStocks[] = await Promise.all(
        whList.map(async (w: any) => {
          try {
            const stocks = await inventoryApi.getByWarehouse(w.id);
            return { ...w, stocks: stocks || [] };
          } catch {
            return { ...w, stocks: [] };
          }
        })
      );
      setWarehouses(withStocks);
    } catch {
      toast('Failed to load warehouses', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateWarehouse(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !code) return;

    try {
      setSubmitting(true);
      await warehousesApi.create({ name, code, location });
      toast('Warehouse created successfully', 'success');
      setModalOpen(false);
      setName('');
      setCode('');
      setLocation('');
      await loadData();
    } catch (err: any) {
      toast(err?.message || 'Failed to create warehouse', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-slate-700 text-white shadow-lg shadow-indigo-500/30">
              🏭
            </span>
            Warehouse Infrastructure & Locations
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Multi-facility management, physical distribution hubs, and dedicated site inventory counts.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <span>➕</span> Add Warehouse
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="mt-3 text-sm text-slate-400">Loading warehouses & stock levels...</p>
        </div>
      ) : warehouses.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-slate-800 bg-slate-950/80">
          <span className="text-4xl">🏭</span>
          <p className="mt-3 text-base font-semibold text-slate-200">No warehouses configured</p>
        </div>
      ) : (
        <div className="space-y-6">
          {warehouses.map((wh) => {
            const totalUnits = wh.stocks.reduce((sum, s) => sum + s.quantity, 0);
            const totalReserved = wh.stocks.reduce((sum, s) => sum + s.reservedQty, 0);
            const totalAvailable = Math.max(0, totalUnits - totalReserved);
            const totalValuation = wh.stocks.reduce((sum, s) => sum + s.quantity * Number(s.product?.costPrice || 0), 0);

            return (
              <div
                key={wh.id}
                className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/90 shadow-2xl backdrop-blur-xl"
              >
                {/* Warehouse Header Bar */}
                <div className="p-6 border-b border-slate-800/80 bg-gradient-to-r from-slate-900/90 to-slate-950 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🏢</span>
                      <h2 className="text-xl font-black text-white">{wh.name}</h2>
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {wh.code}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Location: {wh.location || 'Gujarat, India'} · ID: <span className="font-mono text-slate-500">{wh.id}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
                    <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400">On-Hand: </span>
                      <span className="font-bold text-white font-mono">{totalUnits}</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400">Reserved: </span>
                      <span className="font-bold text-amber-400 font-mono">{totalReserved}</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400">Available: </span>
                      <span className="font-bold text-emerald-400 font-mono">{totalAvailable}</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400">Valuation: </span>
                      <span className="font-bold text-cyan-400 font-mono">${totalValuation.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Stock Table */}
                <div className="overflow-x-auto">
                  {wh.stocks.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      No stock currently allocated to this warehouse.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900/60 text-slate-400 uppercase font-semibold border-b border-slate-800/80">
                        <tr>
                          <th className="px-6 py-3">Product Name</th>
                          <th className="px-6 py-3">SKU</th>
                          <th className="px-6 py-3 text-center">On-Hand</th>
                          <th className="px-6 py-3 text-center">Reserved</th>
                          <th className="px-6 py-3 text-center">Available</th>
                          <th className="px-6 py-3 text-right">Unit Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {wh.stocks.map((stock) => {
                          const avail = Math.max(0, stock.quantity - stock.reservedQty);
                          return (
                            <tr key={stock.id} className="hover:bg-slate-900/40">
                              <td className="px-6 py-3 font-semibold text-white">
                                {stock.product?.name || 'Item'}
                              </td>
                              <td className="px-6 py-3 font-mono text-indigo-400">
                                {stock.product?.sku}
                              </td>
                              <td className="px-6 py-3 text-center font-mono font-bold text-white">
                                {stock.quantity}
                              </td>
                              <td className="px-6 py-3 text-center font-mono font-bold text-amber-400">
                                {stock.reservedQty}
                              </td>
                              <td className="px-6 py-3 text-center font-mono font-extrabold text-emerald-400">
                                {avail}
                              </td>
                              <td className="px-6 py-3 text-right font-mono text-slate-400">
                                ${Number(stock.product?.costPrice || 0).toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Warehouse Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🏭</span> Add New Warehouse
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWarehouse} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Warehouse Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Surat Fulfillment Hub"
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Warehouse Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. WH-STV-01"
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Location / City
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Surat, Gujarat"
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                  className="px-5 py-2 text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Warehouse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
