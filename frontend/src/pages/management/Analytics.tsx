import { useState, useEffect } from 'react';
import { useToast } from '../../components/Toast';
import { getSalesReport } from '../../services/reports.api';
import type { SalesReport } from '../../types';

interface StatCard {
  title: string;
  value: string;
  change: string;
}

export default function Analytics() {
  const { toast } = useToast();
  const [stats, setStats] = useState<StatCard[]>([]);
  const [chartData, setChartData] = useState<SalesReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getSalesReport({ group_by: 'month' });
        setChartData(res.report);
        setStats([
          { title: 'Total Revenue', value: `$${res.summary.total_sales.toLocaleString()}`, change: 'All time' },
          { title: 'Total Orders', value: String(res.summary.total_orders), change: 'All time' },
          { title: 'Avg Order Value', value: `$${res.summary.average_order_value.toLocaleString()}`, change: 'All time' },
          { title: 'Periods Tracked', value: String(res.report.length), change: 'months' },
        ]);
      } catch {
        toast('Failed to load analytics', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [toast]);

  const maxSales = Math.max(...chartData.map((d) => d.total_sales), 1);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-8 text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500">Business intelligence and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.title} className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">{s.title}</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{s.value}</p>
            <p className="mt-1 text-xs text-gray-500">{s.change}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Revenue Trend</h3>
        <div className="flex items-end gap-2" style={{ height: 200 }}>
          {chartData.map((d, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs text-gray-500">${(d.total_sales / 1000).toFixed(0)}k</span>
              <div
                className="w-full rounded-t bg-gray-900 transition-all"
                style={{ height: `${(d.total_sales / maxSales) * 160}px`, minHeight: 4 }}
              />
              <span className="text-xs text-gray-500">{d.period}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Recent Activity</h3>
        <div className="space-y-3">
          {chartData.slice(-5).reverse().map((d, i) => (
            <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900">{d.period}</p>
                <p className="text-xs text-gray-500">{d.total_orders} orders</p>
              </div>
              <p className="text-sm font-semibold text-gray-900">${d.total_sales.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
