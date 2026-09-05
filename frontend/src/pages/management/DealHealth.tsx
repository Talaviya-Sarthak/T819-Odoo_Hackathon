<<<<<<< Updated upstream
import { useState, useEffect } from 'react';
import StatusBadge from '../../components/StatusBadge';
import { useToast } from '../../components/Toast';
import { getDealHealth } from '../../services/dashboard.api';
import type { DealHealth as DealHealthType } from '../../types';
=======
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { quotationsApi, dealHealthApi } from '../../api';
import { useToast } from '../../components/Toast';
import type { Quotation } from '../../types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/skeleton';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  RefreshCw,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Info
} from 'lucide-react';
>>>>>>> Stashed changes

const rowVariants: any = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.03,
      duration: 0.2,
      ease: "easeOut",
    },
  }),
};

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
<<<<<<< Updated upstream
  const [stats, setStats] = useState<DealHealthType | null>(null);
  const [deals, setDeals] = useState<DealHealthItem[]>([]);
  const [loading, setLoading] = useState(true);

=======
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

        const reasons: string[] = [];
        let deduction = 0;

        if (discountPercent > 15) {
          deduction += 35;
          reasons.push(`High discount (${discountPercent.toFixed(1)}%)`);
        } else if (discountPercent > 10) {
          deduction += 20;
          reasons.push(`Moderate discount (${discountPercent.toFixed(1)}%)`);
        }

        if (margin < 10) {
          deduction += 40;
          reasons.push(`Critical margin (${margin.toFixed(1)}%)`);
        } else if (margin < 20) {
          deduction += 20;
          reasons.push(`Low margin (${margin.toFixed(1)}%)`);
        }

        if (daysStalled > 7) {
          deduction += 20;
          reasons.push(`Stalled ${daysStalled} days`);
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
          reasons: reasons.length > 0 ? reasons : ['Optimal margin and discount profile'],
          daysStalled,
        };
      });

      setDealItems(items);
      setAlerts(Array.isArray(alertsList) ? alertsList : []);
    } catch (err: any) {
      toast.fail(err.message || 'Failed to refresh deal health');
    } finally {
      setLoading(false);
    }
  };

>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Deal Health</h1>
        <p className="text-sm text-gray-500">Monitor deal health metrics and pipeline status</p>
=======
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Deal Health & Predictive Risk</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary border border-primary/20">
              <Sparkles className="w-3 h-3" /> AI Velocity
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Predictive deal velocity, margin degradation tracking, and governance slippage warnings
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 border-border/60 bg-card text-foreground hover:bg-white/5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
>>>>>>> Stashed changes
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
<<<<<<< Updated upstream
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
=======
        <div className="rounded-xl border border-border/50 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Portfolio Health</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{avgHealthScore}/100</p>
          <p className="mt-1 text-xs text-muted-foreground">Average across active deals</p>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Healthy Deals</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-400">{healthyCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Normal margins and pacing</p>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">At-Risk Deals</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-400">{atRiskCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Discount or approval delays</p>
        </div>

        <div className="rounded-xl border border-rose-500/20 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-400">Critical Attention</span>
            <ShieldAlert className="h-4 w-4 text-rose-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-400">{criticalCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Immediate escalation required</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-border/50 bg-card shadow-xs overflow-hidden">
        <div className="border-b border-border/50 px-6 py-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Pipeline Health & Driver Breakdown</h2>
          <span className="text-xs text-muted-foreground">Calculated with authoritative pricing engine</span>
        </div>

        {loading ? (
          <div className="p-4">
            <TableSkeleton rows={5} cols={7} />
          </div>
        ) : dealItems.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Activity className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-semibold text-foreground">No active deals to analyze</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border/50 bg-muted/30">
                  <TableHead className="px-6 py-3.5 text-xs uppercase font-semibold text-muted-foreground">Quotation #</TableHead>
                  <TableHead className="px-6 py-3.5 text-xs uppercase font-semibold text-muted-foreground">Customer</TableHead>
                  <TableHead className="px-6 py-3.5 text-xs uppercase font-semibold text-muted-foreground">Amount</TableHead>
                  <TableHead className="px-6 py-3.5 text-xs uppercase font-semibold text-muted-foreground">Status</TableHead>
                  <TableHead className="px-6 py-3.5 text-xs uppercase font-semibold text-muted-foreground">Health Score</TableHead>
                  <TableHead className="px-6 py-3.5 text-xs uppercase font-semibold text-muted-foreground">Risk Status</TableHead>
                  <TableHead className="px-6 py-3.5 text-xs uppercase font-semibold text-muted-foreground">Identified Risk Drivers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dealItems.map((item, idx) => (
                  <motion.tr
                    key={item.id}
                    custom={idx}
                    initial="hidden"
                    animate="visible"
                    variants={rowVariants}
                    className="border-b border-border/40 hover:bg-white/[0.02] transition-colors"
                  >
                    <TableCell className="px-6 py-4 font-mono font-bold text-foreground text-xs">{item.quotationNumber}</TableCell>
                    <TableCell className="px-6 py-4 font-medium text-foreground text-xs">{item.customerName}</TableCell>
                    <TableCell className="px-6 py-4 font-semibold text-foreground text-xs">${item.amount.toFixed(2)}</TableCell>
                    <TableCell className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-muted border border-border/50 px-2 py-0.5 text-[11px] font-medium text-foreground">
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-muted/60 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.healthScore < 50
                                ? 'bg-rose-500'
                                : item.healthScore < 80
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${item.healthScore}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs font-bold text-foreground">{item.healthScore}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                          item.healthStatus === 'CRITICAL'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                            : item.healthStatus === 'AT_RISK'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                        }`}
                      >
                        {item.healthStatus.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {item.reasons.map((r, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center rounded-md bg-muted/40 border border-border/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                  </motion.tr>
>>>>>>> Stashed changes
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
