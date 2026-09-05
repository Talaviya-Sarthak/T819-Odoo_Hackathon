import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { operationsApi } from '../../api';

interface OperationsKPIs {
  totalOrders: number;
  ordersAwaitingFulfillment: number;
  partiallyFulfilledOrders: number;
  fulfilledOrders: number;
  openBackorders: number;
  openBackordersQuantity: number;
  lowStockProducts: number;
  totalInventoryValue: number;
  totalQuantityOnHand: number;
  totalQuantityReserved: number;
  availableStockQuantity: number;
  outstandingInvoices: number;
  outstandingBalance: number;
  paidInvoices: number;
  totalCollectedRevenue: number;
  activeSubscriptions: number;
  monthlyRecurringRevenue: number;
}

export default function OperationsDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<OperationsKPIs | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      const res = await operationsApi.getDashboard();
      if (res.kpis) {
        setKpis(res.kpis);
        setAnalytics(res.analytics);
      } else {
        // Fallback to direct KPI call
        const kpiData = await operationsApi.getKPIs();
        setKpis(kpiData);
      }
    } catch (err) {
      console.error('Failed to load operations dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400 mb-3">
              <span>●</span> Live Operational Telemetry
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Operations & Fulfillment Command Center
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-2xl">
              Real-time inventory reservations, multi-warehouse fulfillment, automated backorder resolution, and authoritative billing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/operations/orders')}
              className="px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              <span>📋</span> Process Orders
            </button>
            <button
              onClick={() => navigate('/operations/fulfillment')}
              className="px-4 py-2.5 rounded-xl font-bold text-sm text-slate-200 bg-slate-800 hover:bg-slate-700 transition-all flex items-center gap-2 border border-slate-700"
            >
              <span>🚚</span> Dispatch Shipment
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Orders Awaiting Fulfillment */}
          <div
            onClick={() => navigate('/operations/orders')}
            className="group cursor-pointer rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 shadow-xl hover:border-indigo-500/50 transition-all duration-300 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Orders to Fulfill</span>
              <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
                📋
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-white">{kpis?.ordersAwaitingFulfillment ?? 0}</span>
              <span className="text-xs text-slate-500 ml-2">of {kpis?.totalOrders ?? 0} total</span>
            </div>
            <p className="mt-2 text-xs font-medium text-amber-400">
              {kpis?.partiallyFulfilledOrders ?? 0} partially fulfilled
            </p>
          </div>

          {/* Open Backorders */}
          <div
            onClick={() => navigate('/operations/backorders')}
            className="group cursor-pointer rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 shadow-xl hover:border-rose-500/50 transition-all duration-300 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Open Backorders</span>
              <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
                ⏳
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-rose-400">{kpis?.openBackorders ?? 0}</span>
              <span className="text-xs text-rose-300/70 ml-2">({kpis?.openBackordersQuantity ?? 0} units deficit)</span>
            </div>
            <p className="mt-2 text-xs font-medium text-slate-400">
              {kpis?.lowStockProducts ?? 0} SKUs at or below reorder level
            </p>
          </div>

          {/* Total Available Inventory */}
          <div
            onClick={() => navigate('/operations/inventory')}
            className="group cursor-pointer rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 shadow-xl hover:border-emerald-500/50 transition-all duration-300 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Available Stock</span>
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                📦
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-emerald-400">{kpis?.availableStockQuantity ?? 0}</span>
              <span className="text-xs text-slate-500 ml-2">of {kpis?.totalQuantityOnHand ?? 0} on-hand</span>
            </div>
            <p className="mt-2 text-xs font-medium text-indigo-400">
              Valuation: ${kpis?.totalInventoryValue?.toLocaleString() ?? 0}
            </p>
          </div>

          {/* Outstanding Invoices & Receivables */}
          <div
            onClick={() => navigate('/operations/invoices')}
            className="group cursor-pointer rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 shadow-xl hover:border-cyan-500/50 transition-all duration-300 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Receivables Due</span>
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
                🧾
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-cyan-400">
                ${kpis?.outstandingBalance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
              </span>
            </div>
            <p className="mt-2 text-xs font-medium text-slate-400">
              {kpis?.outstandingInvoices ?? 0} pending invoices
            </p>
          </div>

          {/* Revenue Collected */}
          <div
            onClick={() => navigate('/operations/payments')}
            className="group cursor-pointer rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 shadow-xl hover:border-emerald-500/50 transition-all duration-300 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Collected</span>
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                💳
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-emerald-400">
                ${kpis?.totalCollectedRevenue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
              </span>
            </div>
            <p className="mt-2 text-xs font-medium text-slate-400">
              {kpis?.paidInvoices ?? 0} invoices fully settled
            </p>
          </div>

          {/* Monthly Recurring Revenue */}
          <div
            onClick={() => navigate('/operations/subscriptions')}
            className="group cursor-pointer rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 shadow-xl hover:border-purple-500/50 transition-all duration-300 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Monthly Recurring</span>
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                🔄
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-purple-400">
                ${kpis?.monthlyRecurringRevenue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
              </span>
            </div>
            <p className="mt-2 text-xs font-medium text-slate-400">
              {kpis?.activeSubscriptions ?? 0} active subscriptions
            </p>
          </div>

          {/* Reserved Stock Ratio */}
          <div
            onClick={() => navigate('/operations/inventory')}
            className="group cursor-pointer rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 shadow-xl hover:border-indigo-500/50 transition-all duration-300 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Stock Reserved</span>
              <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
                🔒
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-white">{kpis?.totalQuantityReserved ?? 0}</span>
              <span className="text-xs text-slate-500 ml-2">units allocated</span>
            </div>
            <p className="mt-2 text-xs font-medium text-indigo-400">
              Guaranteed for confirmed orders
            </p>
          </div>

          {/* Fulfilled Orders Total */}
          <div
            onClick={() => navigate('/operations/orders')}
            className="group cursor-pointer rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 shadow-xl hover:border-emerald-500/50 transition-all duration-300 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Fulfilled Orders</span>
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                ✅
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-emerald-400">{kpis?.fulfilledOrders ?? 0}</span>
              <span className="text-xs text-slate-500 ml-2">completed</span>
            </div>
            <p className="mt-2 text-xs font-medium text-emerald-400">
              100% order completion rate
            </p>
          </div>
        </div>
      )}

      {/* Operational Breakdown & Backorders Watch */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order & Fulfillment Status Breakdown */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-xl backdrop-blur-xl lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Order Pipeline & Fulfillment Status</h2>
              <p className="text-xs text-slate-400">Current status distribution across active database records</p>
            </div>
            <button
              onClick={() => navigate('/operations/orders')}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View All Orders →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Pending Fulfill</span>
              <p className="text-2xl font-black text-amber-400 mt-1">{kpis?.ordersAwaitingFulfillment ?? 0}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Partially Fulfilled</span>
              <p className="text-2xl font-black text-indigo-400 mt-1">{kpis?.partiallyFulfilledOrders ?? 0}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Fully Fulfilled</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">{kpis?.fulfilledOrders ?? 0}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Backordered Lines</span>
              <p className="text-2xl font-black text-rose-400 mt-1">{kpis?.openBackorders ?? 0}</p>
            </div>
          </div>

          {/* Quick Workflow Action Shortcuts */}
          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-900/40">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-3">
              Recommended Operational Next Steps
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => navigate('/operations/orders')}
                className="p-3 text-left rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 transition-all text-xs"
              >
                <div className="font-bold text-white">1. Review Pending Orders</div>
                <div className="text-slate-400 mt-1">Convert confirmed quotes & review lines</div>
              </button>
              <button
                onClick={() => navigate('/operations/fulfillment')}
                className="p-3 text-left rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 transition-all text-xs"
              >
                <div className="font-bold text-white">2. Allocate & Ship Stock</div>
                <div className="text-slate-400 mt-1">Choose AMD/BDQ warehouse & dispatch</div>
              </button>
              <button
                onClick={() => navigate('/operations/invoices')}
                className="p-3 text-left rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 transition-all text-xs"
              >
                <div className="font-bold text-white">3. Generate Invoices</div>
                <div className="text-slate-400 mt-1">Produce billing records & record payments</div>
              </button>
            </div>
          </div>
        </div>

        {/* Backorders Alert Feed */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-xl backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>⏳</span> Backorders Alert
            </h2>
            <button
              onClick={() => navigate('/operations/backorders')}
              className="text-xs font-bold text-rose-400 hover:text-rose-300"
            >
              Manage →
            </button>
          </div>

          {analytics?.openBackordersList && analytics.openBackordersList.length > 0 ? (
            <div className="space-y-3">
              {analytics.openBackordersList.slice(0, 5).map((bo: any) => (
                <div
                  key={bo.id}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-white">{bo.productName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{bo.sku}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-rose-400">
                      -{bo.quantity - bo.fulfilledQuantity} units
                    </span>
                    <div className="text-[10px] text-slate-500 uppercase">{bo.status}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">
              <span className="text-3xl">🎉</span>
              <p className="mt-2 text-xs font-medium text-slate-400">Zero open stock shortages!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
