import { useState, useEffect } from 'react';
<<<<<<< Updated upstream
import { useToast } from '../../components/Toast';
import { getSalesReport } from '../../services/reports.api';
import type { SalesReport } from '../../types';
=======
import { quotationsApi, analyticsApi } from '../../api';
import type { Quotation } from '../../types';
import { useToast } from '../../components/Toast';
import { Skeleton } from '../../components/ui/skeleton';
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
>>>>>>> Stashed changes

interface StatCard {
  title: string;
  value: string;
  change: string;
}

const darkTooltipStyle = {
  backgroundColor: '#18181b',
  borderColor: '#27272a',
  borderRadius: '0.75rem',
  color: '#f4f4f5',
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
  fontSize: '12px',
};

export default function Analytics() {
  const { toast } = useToast();
<<<<<<< Updated upstream
  const [stats, setStats] = useState<StatCard[]>([]);
  const [chartData, setChartData] = useState<SalesReport[]>([]);
  const [loading, setLoading] = useState(true);

=======
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
      toast.success('Analytics dataset refreshed.');
    } catch (err: any) {
      console.error('Failed to load analytics data:', err);
      toast.fail(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
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
=======
    const rev = Number((q as any).totalAmount || (q as any).grand_total || 0);
    const cost = Number((q as any).totalCost || 0);
    monthlyGroups[mKey].revenue += rev;
    monthlyGroups[mKey].cost += cost;
    monthlyGroups[mKey].margin += rev - cost;
  }
  const monthlySalesData = Object.values(monthlyGroups);

  // 3. Average Discount by Status
  const statusDiscountSums: Record<string, { count: number; discountSum: number }> = {};
  for (const q of quotations) {
    const s = q.status;
    if (!statusDiscountSums[s]) statusDiscountSums[s] = { count: 0, discountSum: 0 };
    const discAmt = Number((q as any).discountAmount || 0);
    const subtotal = Number((q as any).subtotal || (q as any).totalAmount || 1);
    const pct = subtotal > 0 ? (discAmt / subtotal) * 100 : 0;
    statusDiscountSums[s].count++;
    statusDiscountSums[s].discountSum += pct;
  }
  const discountData = Object.entries(statusDiscountSums).map(([status, d]) => ({
    status: status.replace('_', ' '),
    avgDiscount: +(d.discountSum / (d.count || 1)).toFixed(1),
  }));

  // 4. Average Profit Margin by Status
  const statusMarginSums: Record<string, { count: number; marginSum: number }> = {};
  for (const q of quotations) {
    const s = q.status;
    if (!statusMarginSums[s]) statusMarginSums[s] = { count: 0, marginSum: 0 };
    const margin = Number((q as any).marginPercentage ?? 20);
    statusMarginSums[s].count++;
    statusMarginSums[s].marginSum += margin;
  }
  const marginData = Object.entries(statusMarginSums).map(([status, d]) => ({
    status: status.replace('_', ' '),
    avgMargin: +(d.marginSum / (d.count || 1)).toFixed(1),
  }));

  // 5. Funnel Analysis
  const total = quotations.length;
  const underReview = quotations.filter((q) => q.status === 'UNDER_REVIEW' || q.status === 'PENDING_APPROVAL').length;
  const approved = quotations.filter((q) => q.status === 'APPROVED' || q.status === 'CUSTOMER_CONFIRMED' || q.status === 'ORDER_CONFIRMED').length;
  const confirmed = quotations.filter((q) => q.status === 'CUSTOMER_CONFIRMED' || q.status === 'ORDER_CONFIRMED').length;

  const funnelData = [
    { stage: 'Draft Created', count: total },
    { stage: 'Submitted', count: underReview + approved },
    { stage: 'Approved', count: approved },
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

  const totalRevSum = quotations.reduce(
    (sum, q) => sum + Number((q as any).totalAmount || (q as any).grand_total || 0),
    0
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Sales Intelligence & Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Authoritative sales metrics, conversion funnels, and discount governance analytics
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3.5 py-2 text-sm font-medium text-foreground hover:bg-white/5 disabled:opacity-50 transition-colors shadow-xs"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Analytics
        </button>
>>>>>>> Stashed changes
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
<<<<<<< Updated upstream
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
=======
        <div className="rounded-xl border border-border/50 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pipeline Revenue</span>
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-32 rounded-md" />
          ) : (
            <p className="mt-2 text-2xl font-bold text-foreground">
              ${totalRevSum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">Total active deal volume</p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Quotations</span>
            <Activity className="h-5 w-5 text-purple-400" />
          </div>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-20 rounded-md" />
          ) : (
            <p className="mt-2 text-2xl font-bold text-foreground">{quotations.length}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">Across all lifecycle states</p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirmed Orders</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-20 rounded-md" />
          ) : (
            <p className="mt-2 text-2xl font-bold text-foreground">{confirmed}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">Customer accepted deals</p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Funnel Conversion</span>
            <TrendingUp className="h-5 w-5 text-blue-400" />
          </div>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-24 rounded-md" />
          ) : (
            <p className="mt-2 text-2xl font-bold text-foreground">
              {total > 0 ? ((confirmed / total) * 100).toFixed(1) : '0'}%
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">Draft to confirmed ratio</p>
        </div>
      </div>

      {/* 6 Recharts Visualizations Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 1. Pipeline by Status */}
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
          <h3 className="text-base font-bold text-foreground mb-1">1. Pipeline Volume by Status ($)</h3>
          <p className="text-xs text-muted-foreground mb-4">Total quotation dollar value in each lifecycle stage</p>
          <div className="h-64 w-full">
            {loading ? (
              <Skeleton className="h-full w-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineByStatusData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="status" angle={-25} textAnchor="end" tick={{ fontSize: 11, fill: '#a1a1aa' }} interval={0} />
                  <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <Tooltip contentStyle={darkTooltipStyle} formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Pipeline Value']} />
                  <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 2. Sales by Month */}
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
          <h3 className="text-base font-bold text-foreground mb-1">2. Sales & Margin Trend</h3>
          <p className="text-xs text-muted-foreground mb-4">Revenue and gross profit trajectory</p>
          <div className="h-64 w-full">
            {loading ? (
              <Skeleton className="h-full w-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlySalesData.length > 0 ? monthlySalesData : [{ month: 'Current', revenue: totalRevSum, cost: totalRevSum * 0.75, margin: totalRevSum * 0.25 }]} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <Tooltip contentStyle={darkTooltipStyle} formatter={(val: any) => [`$${Number(val).toFixed(2)}`]} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="rgba(99, 102, 241, 0.2)" name="Revenue" />
                  <Area type="monotone" dataKey="margin" stroke="#10b981" fill="rgba(16, 185, 129, 0.2)" name="Gross Margin" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 3. Average Discount */}
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
          <h3 className="text-base font-bold text-foreground mb-1">3. Average Discount Rate (%)</h3>
          <p className="text-xs text-muted-foreground mb-4">Discount rate across deal stages</p>
          <div className="h-64 w-full">
            {loading ? (
              <Skeleton className="h-full w-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={discountData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="status" angle={-25} textAnchor="end" tick={{ fontSize: 11, fill: '#a1a1aa' }} interval={0} />
                  <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={darkTooltipStyle} formatter={(val: any) => [`${val}%`, 'Avg Discount']} />
                  <Bar dataKey="avgDiscount" fill="#ec4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 4. Average Margin */}
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
          <h3 className="text-base font-bold text-foreground mb-1">4. Average Profit Margin (%)</h3>
          <p className="text-xs text-muted-foreground mb-4">Gross profitability health across quotation stages</p>
          <div className="h-64 w-full">
            {loading ? (
              <Skeleton className="h-full w-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={marginData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="status" angle={-25} textAnchor="end" tick={{ fontSize: 11, fill: '#a1a1aa' }} interval={0} />
                  <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={darkTooltipStyle} formatter={(val: any) => [`${val}%`, 'Avg Margin']} />
                  <Line type="monotone" dataKey="avgMargin" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} name="Avg Margin %" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 5. Approval Funnel */}
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
          <h3 className="text-base font-bold text-foreground mb-1">5. Quotation Approval Funnel</h3>
          <p className="text-xs text-muted-foreground mb-4">Deal drop-off through each governance stage</p>
          <div className="h-64 w-full">
            {loading ? (
              <Skeleton className="h-full w-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                  <YAxis type="category" dataKey="stage" tick={{ fontSize: 11, fill: '#d4d4d8' }} />
                  <Tooltip contentStyle={darkTooltipStyle} formatter={(val: any) => [val, 'Quotation Count']} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 6. Deal Health Distribution */}
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
          <h3 className="text-base font-bold text-foreground mb-1">6. Deal Health Distribution</h3>
          <p className="text-xs text-muted-foreground mb-4">Pipeline distribution by predictive health classification</p>
          <div className="h-64 w-full flex items-center justify-center">
            {loading ? (
              <Skeleton className="h-full w-full rounded-lg" />
            ) : dealHealthData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active deals to analyze</p>
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
                  <Tooltip contentStyle={darkTooltipStyle} formatter={(val: any) => [val, 'Deals']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
>>>>>>> Stashed changes
        </div>
      </div>
    </div>
  );
}
