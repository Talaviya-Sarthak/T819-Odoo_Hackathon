import { useState, useEffect } from 'react';
import StatusBadge from '../../components/StatusBadge';
import { useToast } from '../../components/Toast';
import { getDealHealth } from '../../services/dashboard.api';
import type { DealHealth as DealHealthType } from '../../types';

interface DealHealthItem {
  quotation_number: string;
  health_score: number;
  health_status: string;
  days_stalled: number;
  discount_anomaly: boolean;
  delivery_risk: string;
  approval_delay: number;
}

export default function DealHealth() {
  const { toast } = useToast();
  const [stats, setStats] = useState<DealHealthType | null>(null);
  const [deals, setDeals] = useState<DealHealthItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getDealHealth();
        setStats(res.deal_health);
      } catch {
        toast('Failed to load deal health', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [toast]);

  const summaryCards = stats
    ? [
        { title: 'Total Deals', value: stats.total_deals, color: 'text-gray-900' },
        { title: 'Active Deals', value: stats.active_deals, color: 'text-blue-600' },
        { title: 'Won Deals', value: stats.won_deals, color: 'text-green-600' },
        { title: 'Lost Deals', value: stats.lost_deals, color: 'text-red-600' },
      ]
    : [];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Deal Health</h1>
        <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-8 text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Deal Health</h1>
        <p className="text-sm text-gray-500">Monitor deal health metrics and pipeline status</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.title} className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">{card.title}</p>
            <p className={`mt-1 text-3xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">${stats?.total_revenue?.toLocaleString() ?? '0'}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Avg Deal Size</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">${stats?.average_deal_size?.toLocaleString() ?? '0'}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Win Rate</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats?.win_rate ?? 0}%</p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Deal Health Details</h3>
        {deals.length === 0 ? (
          <p className="text-sm text-gray-500">No deal health data available.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Quotation #</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Health Score</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Days Stalled</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Discount Anomaly</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Delivery Risk</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Approval Delay</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((deal, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 text-gray-900">{deal.quotation_number}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                          <div className="h-full rounded-full bg-green-500" style={{ width: `${deal.health_score}%` }} />
                        </div>
                        <span className="text-xs text-gray-600">{deal.health_score}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={deal.health_status} type="quotation" /></td>
                    <td className="px-4 py-3 text-gray-900">{deal.days_stalled}</td>
                    <td className="px-4 py-3">
                      <span className={deal.discount_anomaly ? 'text-red-600 font-medium' : 'text-gray-500'}>
                        {deal.discount_anomaly ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={deal.delivery_risk} type="fulfillment" /></td>
                    <td className="px-4 py-3 text-gray-900">{deal.approval_delay}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
