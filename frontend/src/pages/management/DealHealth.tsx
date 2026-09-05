import { useState, useEffect } from 'react';
import { quotationsApi, dealHealthApi } from '../../api';
import type { Quotation } from '../../types';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  TrendingDown, 
  Clock, 
  Percent, 
  RefreshCw,
  Bell
} from 'lucide-react';

interface DealHealthItem {
  id: string;
  quotationNumber: string;
  customerName: string;
  amount: number;
  status: string;
  healthScore: number;
  healthStatus: 'HEALTHY' | 'AT_RISK' | 'CRITICAL';
  reasons: string[];
  daysStalled: number;
}

export default function DealHealth() {
  const [dealItems, setDealItems] = useState<DealHealthItem[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [quotes, alertsList] = await Promise.all([
        quotationsApi.getAll(),
        dealHealthApi.getAlerts().catch(() => []),
      ]);

      const items: DealHealthItem[] = quotes.map((q: any) => {
        const qNum = q.quotationNumber || q.quotation_number || `QT-${q.id.slice(0, 6)}`;
        const custName = q.customer?.name || q.customer_name || 'Customer';
        const amount = Number(q.totalAmount || q.grand_total || 0);
        const margin = Number(q.marginPercentage || 0);
        const discountAmt = Number(q.discountAmount || q.discount_total || 0);
        const subtotal = Number(q.subtotal || amount);
        const discountPercent = subtotal > 0 ? (discountAmt / subtotal) * 100 : 0;

        const createdTime = new Date(q.createdAt || q.created_at || Date.now()).getTime();
        const daysStalled = Math.max(0, Math.floor((Date.now() - createdTime) / (1000 * 60 * 60 * 24)));

        // Real health calculation logic based on real quotation fields
        const reasons: string[] = [];
        let deduction = 0;

        if (discountPercent > 15) {
          deduction += 25;
          reasons.push(`High Discount (${discountPercent.toFixed(1)}%)`);
        }
        if (margin < 15 && margin > 0) {
          deduction += 30;
          reasons.push(`Low Gross Margin (${margin.toFixed(1)}%)`);
        }
        if (daysStalled > 7) {
          deduction += 20;
          reasons.push(`Stalled Deal (${daysStalled} days inactive)`);
        }
        if (q.status === 'PENDING_APPROVAL' || q.status === 'UNDER_REVIEW') {
          deduction += 15;
          reasons.push('Approval Delay (Pending Review)');
        }
        if (q.status === 'NEGOTIATION') {
          deduction += 10;
          reasons.push('Negotiation In Progress');
        }

        const healthScore = Math.max(15, 100 - deduction);
        let healthStatus: 'HEALTHY' | 'AT_RISK' | 'CRITICAL' = 'HEALTHY';
        if (healthScore < 50) healthStatus = 'CRITICAL';
        else if (healthScore < 80) healthStatus = 'AT_RISK';

        return {
          id: q.id,
          quotationNumber: qNum,
          customerName: custName,
          amount,
          status: q.status,
          healthScore,
          healthStatus,
          reasons,
          daysStalled,
        };
      });

      setDealItems(items);
      setAlerts(alertsList || []);
    } catch (err) {
      console.error('Failed to load deal health:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const healthyCount = dealItems.filter((d) => d.healthStatus === 'HEALTHY').length;
  const atRiskCount = dealItems.filter((d) => d.healthStatus === 'AT_RISK').length;
  const criticalCount = dealItems.filter((d) => d.healthStatus === 'CRITICAL').length;
  const avgHealthScore = dealItems.length > 0
    ? Math.round(dealItems.reduce((sum, d) => sum + d.healthScore, 0) / dealItems.length)
    : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Deal Health & Risk Monitoring</h1>
          <p className="text-sm text-slate-500 mt-1">
            Predictive deal velocity, anomaly detection, and governance slippage indicators
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-xs"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      {/* Summary Scorecards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Average Health</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{avgHealthScore}/100</p>
          <p className="mt-1 text-xs text-slate-400">Across active pipeline</p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Healthy Deals</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-2 text-3xl font-bold text-emerald-950">{healthyCount}</p>
          <p className="mt-1 text-xs text-emerald-700">Normal velocity & margins</p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">At Risk</span>
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <p className="mt-2 text-3xl font-bold text-amber-950">{atRiskCount}</p>
          <p className="mt-1 text-xs text-amber-700">Discount or review delay</p>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-800">Critical Attention</span>
            <ShieldAlert className="h-5 w-5 text-rose-600" />
          </div>
          <p className="mt-2 text-3xl font-bold text-rose-950">{criticalCount}</p>
          <p className="mt-1 text-xs text-rose-700">High discount / stalled deals</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Deal Health Breakdown</h2>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : dealItems.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No deals in pipeline</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Quotation #</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Health Score</th>
                  <th className="px-6 py-3.5">Risk Status</th>
                  <th className="px-6 py-3.5">Identified Risk Drivers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dealItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{item.quotationNumber}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{item.customerName}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">${item.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full ${
                              item.healthScore < 50
                                ? 'bg-rose-500'
                                : item.healthScore < 80
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${item.healthScore}%` }}
                          />
                        </div>
                        <span>{item.healthScore}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-black uppercase ${
                          item.healthStatus === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : item.healthStatus === 'AT_RISK'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {item.healthStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.reasons.length === 0 ? (
                        <span className="text-xs text-emerald-600 font-medium">Optimal Velocity</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {item.reasons.map((r, i) => (
                            <span key={i} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-700 font-medium">
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
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
