import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quotationsApi } from '../../api';
import type { Quotation } from '../../types';
import { 
  Plus, 
  Search, 
  LayoutGrid, 
  List, 
  RefreshCw, 
  Calendar, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';

const KANBAN_COLUMNS: Array<{ id: string; label: string; color: string; bg: string }> = [
  { id: 'DRAFT', label: 'Draft', color: 'border-slate-300 text-slate-700', bg: 'bg-slate-50' },
  { id: 'PENDING_APPROVAL', label: 'Pending Approval', color: 'border-amber-400 text-amber-800', bg: 'bg-amber-50/60' },
  { id: 'APPROVED', label: 'Approved', color: 'border-emerald-400 text-emerald-800', bg: 'bg-emerald-50/60' },
  { id: 'NEGOTIATION', label: 'Negotiation', color: 'border-purple-400 text-purple-800', bg: 'bg-purple-50/60' },
  { id: 'CUSTOMER_CONFIRMED', label: 'Customer Confirmed', color: 'border-cyan-400 text-cyan-800', bg: 'bg-cyan-50/60' },
  { id: 'ORDER_CONFIRMED', label: 'Order Confirmed', color: 'border-blue-400 text-blue-800', bg: 'bg-blue-50/60' },
  { id: 'FULFILLMENT', label: 'Fulfillment', color: 'border-indigo-400 text-indigo-800', bg: 'bg-indigo-50/60' },
  { id: 'PARTIALLY_FULFILLED', label: 'Partially Fulfilled', color: 'border-orange-400 text-orange-800', bg: 'bg-orange-50/60' },
  { id: 'FULFILLED', label: 'Fulfilled', color: 'border-teal-400 text-teal-800', bg: 'bg-teal-50/60' },
];

export default function Quotations() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [search, setSearch] = useState('');

  const loadQuotations = async () => {
    try {
      setLoading(true);
      const data = await quotationsApi.getAll();
      setQuotations(data || []);
    } catch (err) {
      console.error('Failed to load quotations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, []);

  const filteredQuotes = quotations.filter((q) => {
    const qNum = (q as any).quotationNumber || (q as any).quotation_number || '';
    const custName = (q as any).customer?.name || (q as any).customer_name || '';
    const term = search.toLowerCase();
    return qNum.toLowerCase().includes(term) || custName.toLowerCase().includes(term);
  });

  const getColumnQuotes = (columnId: string) => {
    return filteredQuotes.filter((q) => {
      if (columnId === 'PENDING_APPROVAL') {
        return q.status === 'PENDING_APPROVAL' || (q.status as any) === 'UNDER_REVIEW' || q.status === 'PENDING';
      }
      return q.status === columnId;
    });
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quotation Pipeline</h1>
          <p className="text-sm text-slate-500 mt-1">Manage quotation stages from draft creation to order fulfillment</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search quotes or customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-64 rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none"
            />
          </div>

          {/* View Switcher */}
          <div className="flex rounded-lg border border-slate-300 bg-white p-0.5 shadow-sm">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                viewMode === 'kanban' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                viewMode === 'table' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              List
            </button>
          </div>

          <button
            onClick={loadQuotations}
            disabled={loading}
            className="flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => navigate('/sales/quote-builder')}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Quotation
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-9 w-9 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
            <p className="text-sm text-slate-500 font-medium">Syncing pipeline from backend...</p>
          </div>
        </div>
      ) : viewMode === 'kanban' ? (
        /* Kanban Board View */
        <div className="flex gap-4 overflow-x-auto pb-6">
          {KANBAN_COLUMNS.map((col) => {
            const colQuotes = getColumnQuotes(col.id);
            const colTotal = colQuotes.reduce((sum, q) => sum + Number((q as any).totalAmount || (q as any).grand_total || 0), 0);

            return (
              <div
                key={col.id}
                className="flex w-80 flex-shrink-0 flex-col rounded-xl border border-slate-200 bg-slate-100/70 p-3 shadow-xs"
              >
                {/* Column Header */}
                <div className="mb-3 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">{col.label}</span>
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1.5 text-xs font-semibold text-slate-600 shadow-2xs border border-slate-200">
                      {colQuotes.length}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    ${colTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex flex-1 flex-col gap-3 overflow-y-auto max-h-[calc(100vh-260px)]">
                  {colQuotes.length === 0 ? (
                    <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white/40 text-xs text-slate-400">
                      No quotations
                    </div>
                  ) : (
                    colQuotes.map((q) => {
                      const qNum = (q as any).quotationNumber || (q as any).quotation_number || `QT-${q.id.slice(0, 6)}`;
                      const custName = (q as any).customer?.name || (q as any).customer_name || 'Customer';
                      const amount = Number((q as any).totalAmount || (q as any).grand_total || 0);
                      const margin = (q as any).marginPercentage;
                      const lineCount = (q as any).lines?.length || 0;
                      const date = (q as any).created_at || (q as any).createdAt;

                      return (
                        <div
                          key={q.id}
                          onClick={() => navigate(`/sales/quote-builder/${q.id}`)}
                          className="cursor-pointer rounded-lg border border-slate-200 bg-white p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
                        >
                          <div className="flex items-start justify-between">
                            <span className="font-semibold text-sm text-indigo-900">{qNum}</span>
                            {margin !== undefined && (
                              <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">
                                <TrendingUp className="h-3 w-3" />
                                {Number(margin).toFixed(1)}%
                              </span>
                            )}
                          </div>

                          <p className="mt-1.5 text-sm font-medium text-slate-800 truncate">{custName}</p>

                          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                            <div className="text-xs text-slate-500">
                              <span>{lineCount} {lineCount === 1 ? 'item' : 'items'}</span>
                            </div>
                            <span className="text-base font-bold text-slate-900">
                              ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>

                          {date && (
                            <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(date).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table List View */
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Quote #</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Items</th>
                <th className="px-6 py-3.5">Margin %</th>
                <th className="px-6 py-3.5">Total Amount</th>
                <th className="px-6 py-3.5">Created Date</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotes.map((q) => {
                const qNum = (q as any).quotationNumber || (q as any).quotation_number || `QT-${q.id.slice(0, 6)}`;
                const custName = (q as any).customer?.name || (q as any).customer_name || 'Customer';
                const amount = Number((q as any).totalAmount || (q as any).grand_total || 0);
                const margin = (q as any).marginPercentage;
                const lineCount = (q as any).lines?.length || 0;
                const date = (q as any).created_at || (q as any).createdAt;

                return (
                  <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-indigo-900">{qNum}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{custName}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                        {q.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{lineCount} items</td>
                    <td className="px-6 py-4 font-medium text-emerald-700">
                      {margin !== undefined ? `${Number(margin).toFixed(1)}%` : '-'}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      ${amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {date ? new Date(date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/sales/quote-builder/${q.id}`)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        Edit / View <ArrowRight className="h-3.5 w-3.5" />
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
  );
}
