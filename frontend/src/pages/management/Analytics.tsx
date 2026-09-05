import { useState, useEffect } from 'react';
import { quotationsApi, analyticsApi } from '../../api';
import type { Quotation } from '../../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import { RefreshCw, TrendingUp, DollarSign, Activity, CheckCircle2 } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];
const HEALTH_COLORS = {
  HEALTHY: '#10b981',
  AT_RISK: '#f59e0b',
  CRITICAL: '#ef4444',
};

export default function Analytics() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [salesReport, setSalesReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [quotes, report] = await Promise.all([
        quotationsApi.getAll(),
        analyticsApi.getSalesReport().catch(() => null),
      ]);
      setQuotations(quotes || []);
      setSalesReport(report);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. Pipeline by Status
  const statusCounts: Record<string, { count: number; value: number }> = {};
  for (const q of quotations) {
    const s = q.status;
    if (!statusCounts[s]) statusCounts[s] = { count: 0, value: 0 };
    statusCounts[s].count++;
    statusCounts[s].value += Number((q as any).totalAmount || (q as any).grand_total || 0);
  }
  const pipelineByStatusData = Object.entries(statusCounts).map(([status, d]) => ({
    status: status.replace('_', ' '),
    deals: d.count,
    amount: Math.round(d.value),
  }));

  // 2. Sales / Deals by Month
  const monthlyGroups: Record<string, { month: string; revenue: number; cost: number; margin: number }> = {};
  for (const q of quotations) {
    const d = new Date((q as any).createdAt || (q as any).created_at || Date.now());
    const mKey = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
    if (!monthlyGroups[mKey]) {
      monthlyGroups[mKey] = { month: mKey, revenue: 0, cost: 0, margin: 0 };
    }
    const rev = Number((q as any).totalAmount || (q as any).grand_total || 0);
    const cost = Number((q as any).totalCost || 0);
    monthlyGroups[mKey].revenue += rev;
    monthlyGroups[mKey].cost += cost;
    monthlyGroups[mKey].margin += (rev - cost);
  }
  const monthlySalesData = Object.values(monthlyGroups);

  // 3. Average Discount by Status
  const discountData = Object.entries(statusCounts).map(([status, d]) => {
    const matching = quotations.filter((q) => q.status === status);
    const totalSub = matching.reduce((sum, q) => sum + Number((q as any).subtotal || 0), 0);
    const totalDisc = matching.reduce((sum, q) => sum + Number((q as any).discountAmount || 0), 0);
    const avgDisc = totalSub > 0 ? (totalDisc / totalSub) * 100 : 0;
    return {
      status: status.replace('_', ' '),
      avgDiscount: parseFloat(avgDisc.toFixed(1)),
    };
  });

  // 4. Average Margin by Status
  const marginData = Object.entries(statusCounts).map(([status]) => {
    const matching = quotations.filter((q) => q.status === status);
    const valid = matching.filter((q) => (q as any).marginPercentage !== undefined);
    const avgM = valid.length > 0
      ? valid.reduce((sum, q) => sum + Number((q as any).marginPercentage || 0), 0) / valid.length
      : 0;
    return {
      status: status.replace('_', ' '),
      avgMargin: parseFloat(avgM.toFixed(1)),
    };
  });

  // 5. Approval Funnel Data
  const totalCreated = quotations.length;
  const inReview = quotations.filter((q) => q.status === 'PENDING_APPROVAL' || (q.status as any) === 'UNDER_REVIEW' || q.status === 'APPROVED' || q.status === 'CUSTOMER_CONFIRMED').length;
  const approved = quotations.filter((q) => q.status === 'APPROVED' || q.status === 'CUSTOMER_CONFIRMED').length;
  const confirmed = quotations.filter((q) => q.status === 'CUSTOMER_CONFIRMED' || q.status === 'ORDER_CONFIRMED').length;

  const funnelData = [
    { stage: 'Draft Created', count: totalCreated },
    { stage: 'Submitted Review', count: inReview },
    { stage: 'Manager Approved', count: approved },
    { stage: 'Customer Confirmed', count: confirmed },
  ];

  // 6. Deal Health Distribution
  let healthy = 0;
  let atRisk = 0;
  let critical = 0;
  for (const q of quotations) {
    const discountAmt = Number((q as any).discountAmount || 0);
    const subtotal = Number((q as any).subtotal || (q as any).totalAmount || 1);
    const discountPct = (discountAmt / subtotal) * 100;
    const marginPct = Number((q as any).marginPercentage || 25);

    if (discountPct > 15 || marginPct < 10) critical++;
    else if (discountPct > 10 || marginPct < 20) atRisk++;
    else healthy++;
  }

  const dealHealthData = [
    { name: 'Healthy', value: healthy, color: HEALTH_COLORS.HEALTHY },
    { name: 'At Risk', value: atRisk, color: HEALTH_COLORS.AT_RISK },
    { name: 'Critical', value: critical, color: HEALTH_COLORS.CRITICAL },
  ].filter((d) => d.value > 0);

  const totalRevSum = quotations.reduce((sum, q) => sum + Number((q as any).totalAmount || (q as any).grand_total || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sales Intelligence & Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">
            Authoritative sales metrics, conversion funnels, and discount governance analytics
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-xs"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Analytics
        </button>
      </div>

      {/* KPI Top Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pipeline Revenue</span>
            <DollarSign className="h-5 w-5 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            ${totalRevSum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-xs text-slate-400">Total active deal volume</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Quotations</span>
            <Activity className="h-5 w-5 text-purple-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{quotations.length}</p>
          <p className="mt-1 text-xs text-slate-400">Across all lifecycle states</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Confirmed Orders</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{confirmed}</p>
          <p className="mt-1 text-xs text-slate-400">Customer accepted deals</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Funnel Conversion</span>
            <TrendingUp className="h-5 w-5 text-cyan-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {totalCreated > 0 ? `${((confirmed / totalCreated) * 100).toFixed(0)}%` : '0%'}
          </p>
          <p className="mt-1 text-xs text-slate-400">Draft to confirmed ratio</p>
        </div>
      </div>

      {/* 6 Recharts Visualizations Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 1. Pipeline by Status */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-1">1. Pipeline Volume by Status ($)</h3>
          <p className="text-xs text-slate-500 mb-4">Total quotation dollar value in each lifecycle stage</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineByStatusData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="status" angle={-25} textAnchor="end" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                <Tooltip formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Pipeline Value']} />
                <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Sales by Month */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-1">2. Sales & Margin Trend</h3>
          <p className="text-xs text-slate-500 mb-4">Revenue and gross profit trajectory</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySalesData.length > 0 ? monthlySalesData : [{ month: 'Current', revenue: totalRevSum, cost: totalRevSum * 0.75, margin: totalRevSum * 0.25 }]} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                <Tooltip formatter={(val: any) => [`$${Number(val).toFixed(2)}`]} />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="#e0e7ff" name="Revenue" />
                <Area type="monotone" dataKey="margin" stroke="#10b981" fill="#d1fae5" name="Gross Margin" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Average Discount */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-1">3. Average Discount Rate (%)</h3>
          <p className="text-xs text-slate-500 mb-4">Discount rate across deal stages</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={discountData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="status" angle={-25} textAnchor="end" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(val: any) => [`${val}%`, 'Avg Discount']} />
                <Bar dataKey="avgDiscount" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Average Margin */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-1">4. Average Profit Margin (%)</h3>
          <p className="text-xs text-slate-500 mb-4">Gross profitability health across quotation stages</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={marginData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="status" angle={-25} textAnchor="end" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(val: any) => [`${val}%`, 'Avg Margin']} />
                <Line type="monotone" dataKey="avgMargin" stroke="#059669" strokeWidth={2.5} dot={{ r: 4 }} name="Avg Margin %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Approval Funnel */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-1">5. Quotation Approval Funnel</h3>
          <p className="text-xs text-slate-500 mb-4">Deal drop-off through each governance stage</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis type="category" dataKey="stage" tick={{ fontSize: 11, fill: '#334155' }} />
                <Tooltip formatter={(val: any) => [val, 'Quotation Count']} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6. Deal Health Distribution */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-1">6. Deal Health Distribution</h3>
          <p className="text-xs text-slate-500 mb-4">Pipeline distribution by predictive health classification</p>
          <div className="h-64 w-full flex items-center justify-center">
            {dealHealthData.length === 0 ? (
              <p className="text-sm text-slate-400">No active deals to analyze</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dealHealthData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }: any) => `${name} ${(Number(percent || 0) * 100).toFixed(0)}%`}
                  >
                    {dealHealthData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [val, 'Deals']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
