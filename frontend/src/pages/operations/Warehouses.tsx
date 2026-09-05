import { useState, useEffect } from 'react';
import { useToast } from '../../components/Toast';
import { apiGet } from '../../services/api';
import type { Warehouse, WarehouseStock } from '../../types';

interface WarehouseWithStock extends Warehouse {
  stock: WarehouseStock[];
  expanded: boolean;
}

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState<WarehouseWithStock[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadWarehouses();
  }, []);

  async function loadWarehouses() {
    try {
      setLoading(true);
      const res = await apiGet<{ warehouses: Warehouse[] }>('/api/warehouses');
      const withStock: WarehouseWithStock[] = await Promise.all(
        res.warehouses.map(async (w) => {
          try {
            const stockRes = await apiGet<{ stocks: WarehouseStock[] }>(`/api/warehouses/${w.id}/stock`);
            return { ...w, stock: stockRes.stocks || [], expanded: false };
          } catch {
            return { ...w, stock: [], expanded: false };
          }
        })
      );
      setWarehouses(withStock);
    } catch {
      toast('Failed to load warehouses', 'error');
    } finally {
      setLoading(false);
    }
  }

  function toggleExpand(index: number) {
    setWarehouses((prev) =>
      prev.map((w, i) => (i === index ? { ...w, expanded: !w.expanded } : w))
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
          <p className="text-sm text-gray-500">Loading warehouse data...</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
        <p className="text-sm text-gray-500">View warehouse inventory and stock levels</p>
      </div>

      {warehouses.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          No warehouses found.
        </div>
      ) : (
        <div className="space-y-4">
          {warehouses.map((warehouse, index) => (
            <div key={warehouse.id} className="rounded-lg border border-gray-200 bg-white">
              <button
                onClick={() => toggleExpand(index)}
                className="flex w-full items-center justify-between p-6 text-left"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{warehouse.name}</p>
                  <p className="text-xs text-gray-500">
                    {warehouse.city || 'No city'} · {warehouse.stock.length} products
                  </p>
                </div>
                <svg
                  className={`h-5 w-5 text-gray-400 transition-transform ${warehouse.expanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {warehouse.expanded && (
                <div className="border-t border-gray-200 px-6 pb-6">
                  {warehouse.stock.length === 0 ? (
                    <p className="py-4 text-sm text-gray-500">No stock data available.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="px-4 py-3 text-left font-medium text-gray-900">Product</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-900">Available</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-900">Reserved</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-900">Reorder Level</th>
                        </tr>
                      </thead>
                      <tbody>
                        {warehouse.stock.map((s) => (
                          <tr key={s.id} className="border-b border-gray-100 last:border-0">
                            <td className="px-4 py-3 text-gray-900">{s.product_name || s.product_id}</td>
                            <td className="px-4 py-3 text-gray-900">{s.available_quantity}</td>
                            <td className="px-4 py-3 text-gray-900">{s.reserved_quantity}</td>
                            <td className="px-4 py-3 text-gray-900">{s.quantity - s.reserved_quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
