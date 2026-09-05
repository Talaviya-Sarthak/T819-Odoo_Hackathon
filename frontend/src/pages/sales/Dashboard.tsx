import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { quotationsApi } from '../../api';
import type { Quotation } from '../../types';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  ShoppingBag, 
  Percent, 
  TrendingUp, 
  DollarSign, 
  Plus, 
  ArrowRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function SalesDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await quotationsApi.getAll();
      setQuotations(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute live metrics directly from backend quotation dataset
  const list = Array.isArray(quotations) ? quotations : [];
  const totalPipeline = list.reduce((sum, q) => sum + Number(q.grand_total || (q as any).totalAmount || 0), 0);
  const draftCount = list.filter((q) => q.status === 'DRAFT').length;
  const pendingCount = list.filter((q) => q.status === 'PENDING_APPROVAL' || (q.status as any) === 'UNDER_REVIEW' || q.status === 'PENDING').length;
  const approvedCount = list.filter((q) => q.status === 'APPROVED').length;
  const negotiationCount = list.filter((q) => q.status === 'NEGOTIATION').length;
  const confirmedCount = list.filter((q) => q.status === 'CUSTOMER_CONFIRMED' || q.status === 'ORDER_CONFIRMED').length;

  const validMarginQuotes = list.filter((q) => (q as any).marginPercentage !== undefined);
  const avgMargin = validMarginQuotes.length > 0
    ? (validMarginQuotes.reduce((sum, q) => sum + Number((q as any).marginPercentage || 0), 0) / validMarginQuotes.length).toFixed(1)
    : '0.0';

  const totalSubtotal = list.reduce((sum, q) => sum + Number((q as any).subtotal || 0), 0);
  const totalDiscount = list.reduce((sum, q) => sum + Number((q as any).discountAmount || (q as any).discount_total || 0), 0);
  const avgDiscount = totalSubtotal > 0
    ? ((totalDiscount / totalSubtotal) * 100).toFixed(1)
    : '0.0';

  const recentQuotations = [...list]
    .sort((a, b) => new Date(b.created_at || (b as any).createdAt || 0).getTime() - new Date(a.created_at || (a as any).createdAt || 0).getTime())
    .slice(0, 6);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">DRAFT</span>;
      case 'PENDING_APPROVAL':
      case 'UNDER_REVIEW':
        return <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">UNDER REVIEW</span>;
      case 'APPROVED':
        return <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">APPROVED</span>;
      case 'NEGOTIATION':
        return <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800">NEGOTIATION</span>;
      case 'CUSTOMER_CONFIRMED':
        return <span className="inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-semibold text-cyan-800">CUSTOMER CONFIRMED</span>;
      case 'ORDER_CONFIRMED':
        return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">ORDER CONFIRMED</span>;
      default:
        return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Performance Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time pipeline metrics and deal velocity for {user?.name || user?.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/sales/quote-builder')}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-500/20 hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Quotation
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 8 Authoritative Core Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Pipeline"
          value={`$${totalPipeline.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Cumulative quotation value"
          icon={<DollarSign className="h-5 w-5 text-indigo-600" />}
          color="bg-indigo-50"
        />
        <MetricCard
          title="Draft Quotes"
          value={draftCount}
          subtitle="Work in progress"
          icon={<FileText className="h-5 w-5 text-slate-600" />}
          color="bg-slate-100"
        />
        <MetricCard
          title="Pending Approval"
          value={pendingCount}
          subtitle="In governance review"
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          color="bg-amber-50"
        />
        <MetricCard
          title="Approved Quotes"
          value={approvedCount}
          subtitle="Ready for customer"
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          color="bg-emerald-50"
        />
        <MetricCard
          title="Negotiations"
          value={negotiationCount}
          subtitle="Customer discussions"
          icon={<MessageSquare className="h-5 w-5 text-purple-600" />}
          color="bg-purple-50"
        />
        <MetricCard
          title="Confirmed Orders"
          value={confirmedCount}
          subtitle="Won / confirmed deals"
          icon={<ShoppingBag className="h-5 w-5 text-cyan-600" />}
          color="bg-cyan-50"
        />
        <MetricCard
          title="Average Discount"
          value={`${avgDiscount}%`}
          subtitle="Across active catalog"
          icon={<Percent className="h-5 w-5 text-rose-600" />}
          color="bg-rose-50"
        />
        <MetricCard
          title="Average Margin"
          value={`${avgMargin}%`}
          subtitle="Gross profitability"
          icon={<TrendingUp className="h-5 w-5 text-teal-600" />}
          color="bg-teal-50"
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Quotations Table */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">Recent Quotations</h2>
            <button
              onClick={() => navigate('/sales/quotations')}
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              View Kanban Board
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            </div>
          ) : recentQuotations.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <FileText className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-2 text-sm font-medium">No quotations recorded yet</p>
              <button
                onClick={() => navigate('/sales/quote-builder')}
                className="mt-3 text-sm font-semibold text-indigo-600 hover:underline"
              >
                Create your first quotation
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Quote #</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentQuotations.map((q) => {
                    const qId = q.id;
                    const qNum = (q as any).quotationNumber || (q as any).quotation_number || `QT-${qId.slice(0, 6)}`;
                    const custName = (q as any).customer?.name || (q as any).customer_name || 'Customer';
                    const amount = Number((q as any).totalAmount || (q as any).grand_total || 0);

                    return (
                      <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-3.5 font-medium text-slate-900">{qNum}</td>
                        <td className="px-6 py-3.5">{custName}</td>
                        <td className="px-6 py-3.5 font-semibold text-slate-900">${amount.toFixed(2)}</td>
                        <td className="px-6 py-3.5">{getStatusBadge(q.status)}</td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            onClick={() => navigate(`/sales/quote-builder/${q.id}`)}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                          >
                            Open Quote →
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

        {/* Action Panel & Workflow Quick Guide */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Sales Workflow Shortcuts</h3>
            <p className="mt-1 text-xs text-slate-500">Streamlined quotation and negotiation stages</p>

            <div className="mt-4 space-y-2.5">
              <button
                onClick={() => navigate('/sales/quote-builder')}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <span>➕ Create Draft Quotation</span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </button>
              <button
                onClick={() => navigate('/sales/quotations')}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <span>📋 Open Quotation Kanban</span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </button>
              <button
                onClick={() => navigate('/sales/customers')}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <span>👥 Customer Tiers & Catalog</span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-purple-50/70 p-5">
            <div className="flex items-center gap-2 text-indigo-800 font-semibold text-sm">
              <CheckCircle2 className="h-4 w-4" />
              <span>Discount Governance Protocol</span>
            </div>
            <p className="mt-2 text-xs text-indigo-900/80 leading-relaxed">
              Discounts beyond category rules or customer tier thresholds automatically calculate a 0–100 risk score and trigger sequential approval from Sales Management and Finance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>{icon}</div>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
    </div>
  );
}
