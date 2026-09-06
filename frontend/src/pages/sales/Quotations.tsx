import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { quotationsApi } from '../../api';
import type { Quotation } from '../../types';
import { useToast } from '../../components/Toast';
import { Skeleton } from '../../components/ui/skeleton';
import PaginationControls from '../../components/PaginationControls';
import { 
  Plus, 
  Search, 
  LayoutGrid, 
  List, 
  RefreshCw, 
  Calendar, 
  ArrowRight,
  TrendingUp,
  MessageSquare
} from 'lucide-react';

const KANBAN_COLUMNS: Array<{ id: string; label: string; accentColor: string }> = [
  { id: 'DRAFT', label: 'Draft', accentColor: 'border-muted-foreground/30 text-muted-foreground' },
  { id: 'PENDING_APPROVAL', label: 'Pending Approval', accentColor: 'border-amber-500/40 text-amber-400' },
  { id: 'APPROVED', label: 'Approved', accentColor: 'border-emerald-500/40 text-emerald-400' },
  { id: 'NEGOTIATION', label: 'Negotiation', accentColor: 'border-purple-500/40 text-purple-400' },
  { id: 'CUSTOMER_CONFIRMED', label: 'Customer Confirmed', accentColor: 'border-cyan-500/40 text-cyan-400' },
  { id: 'ORDER_CONFIRMED', label: 'Order Confirmed', accentColor: 'border-blue-500/40 text-blue-400' },
  { id: 'FULFILLMENT', label: 'Fulfillment', accentColor: 'border-indigo-500/40 text-indigo-400' },
  { id: 'PARTIALLY_FULFILLED', label: 'Partially Fulfilled', accentColor: 'border-orange-500/40 text-orange-400' },
  { id: 'FULFILLED', label: 'Fulfilled', accentColor: 'border-teal-500/40 text-teal-400' },
];

export default function Quotations() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadQuotations = async () => {
    try {
      setLoading(true);
      const data = await quotationsApi.getAll({
        page,
        limit,
        search: debouncedSearch || undefined,
      });
      const items = Array.isArray(data) ? data : [];
      setQuotations(items);
      if ((data as any).pagination) {
        setPagination((data as any).pagination);
      } else {
        const total = (data as any).total ?? items.length;
        setPagination({
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
          hasNextPage: page * limit < total,
          hasPreviousPage: page > 1,
        });
      }
    } catch (err: any) {
      console.error('Failed to load quotations:', err);
      toast.fail(err.message || 'Failed to load quotations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, [page, limit, debouncedSearch]);

  const filteredQuotes = quotations.filter((q) => {
    const qNum = (q as any).quotationNumber || (q as any).quotation_number || '';
    const custName = (q as any).customer?.name || (q as any).customer_name || '';
    const term = search.toLowerCase();
    return qNum.toLowerCase().includes(term) || custName.toLowerCase().includes(term);
  });

  const getColumnQuotes = (columnId: string) => {
    return filteredQuotes.filter((q) => {
      if (columnId === 'PENDING_APPROVAL') {
        return q.status === 'UNDER_REVIEW' || q.status === 'PENDING_APPROVAL';
      }
      return q.status === columnId;
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Quotations & Deals Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage quotation lifecycle stages, pricing exceptions, and deal velocity
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search quote # or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-60 rounded-lg border border-border/60 bg-background pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center rounded-lg border border-border/50 bg-card p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                viewMode === 'kanban' 
                  ? 'bg-primary text-primary-foreground shadow-xs' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                viewMode === 'table' 
                  ? 'bg-primary text-primary-foreground shadow-xs' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              List
            </button>
          </div>

          <button
            onClick={loadQuotations}
            disabled={loading}
            className="flex h-9 items-center justify-center rounded-lg border border-border/50 bg-card px-3 text-foreground hover:bg-white/5 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => navigate('/sales/quote-builder')}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Quotation
          </button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        /* Kanban Board View */
        <div className="flex gap-4 overflow-x-auto pb-6">
          {KANBAN_COLUMNS.map((col) => {
            const colQuotes = getColumnQuotes(col.id);
            const colTotal = colQuotes.reduce((sum, q) => sum + Number((q as any).totalAmount || (q as any).grand_total || 0), 0);

            return (
              <div
                key={col.id}
                className="flex w-80 flex-shrink-0 flex-col rounded-xl border border-border/50 bg-card/60 p-3 shadow-xs"
              >
                {/* Column Header */}
                <div className="mb-3 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">{col.label}</span>
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-background px-1.5 text-xs font-semibold text-muted-foreground border border-border/50">
                      {loading ? '...' : colQuotes.length}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {loading ? '...' : `$${colTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex flex-1 flex-col gap-3 overflow-y-auto max-h-[calc(100vh-260px)]">
                  {loading ? (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-border/50 bg-card p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-5 w-12 rounded-md" />
                        </div>
                        <Skeleton className="h-4 w-32" />
                        <div className="border-t border-border/40 pt-3 flex justify-between items-center">
                          <Skeleton className="h-3 w-14" />
                          <Skeleton className="h-5 w-16" />
                        </div>
                      </div>
                      <div className="rounded-lg border border-border/50 bg-card p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-5 w-14 rounded-md" />
                        </div>
                        <Skeleton className="h-4 w-28" />
                        <div className="border-t border-border/40 pt-3 flex justify-between items-center">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-5 w-14" />
                        </div>
                      </div>
                    </div>
                  ) : colQuotes.length === 0 ? (
                    <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border/40 bg-card/40 text-xs text-muted-foreground/60">
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
                          className="cursor-pointer rounded-lg border border-border/50 bg-card p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
                        >
                          <div className="flex items-start justify-between">
                            <span className="font-semibold text-sm text-foreground">{qNum}</span>
                            {margin !== undefined && (
                              <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-xs font-semibold text-emerald-400">
                                <TrendingUp className="h-3 w-3" />
                                {Number(margin).toFixed(1)}%
                              </span>
                            )}
                          </div>

                          <p className="mt-1.5 text-sm font-medium text-foreground/90 truncate">{custName}</p>

                          <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-3">
                            <div className="text-xs text-muted-foreground">
                              <span>{lineCount} {lineCount === 1 ? 'item' : 'items'}</span>
                            </div>
                            <span className="text-base font-bold text-foreground">
                              ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>

                          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                            {date ? (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(date).toLocaleDateString()}</span>
                              </div>
                            ) : <div />}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/sales/negotiation/${q.id}`);
                              }}
                              className="inline-flex items-center gap-1 rounded px-2 py-0.5 font-semibold text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-colors cursor-pointer"
                              title="Live Negotiation Chat"
                            >
                              <MessageSquare className="h-3 w-3" />
                              Chat
                            </button>
                          </div>
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
        <div className="rounded-xl border border-border/50 bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-foreground">
              <thead className="bg-muted/30 text-xs font-semibold uppercase text-muted-foreground border-b border-border/50">
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
              <tbody className="divide-y divide-border/40">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/40">
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-36" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-16 ml-auto rounded-md" /></td>
                    </tr>
                  ))
                ) : filteredQuotes.map((q, idx) => {
                  const qNum = (q as any).quotationNumber || (q as any).quotation_number || `QT-${q.id.slice(0, 6)}`;
                  const custName = (q as any).customer?.name || (q as any).customer_name || 'Customer';
                  const amount = Number((q as any).totalAmount || (q as any).grand_total || 0);
                  const margin = (q as any).marginPercentage;
                  const lineCount = (q as any).lines?.length || 0;
                  const date = (q as any).created_at || (q as any).createdAt;

                  return (
                    <motion.tr
                      key={q.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02, duration: 0.2 }}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-foreground">{qNum}</td>
                      <td className="px-6 py-4 font-medium text-foreground/90">{custName}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-muted border border-border/50 px-2.5 py-0.5 text-xs font-semibold text-foreground">
                          {q.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{lineCount} items</td>
                      <td className="px-6 py-4 font-medium text-emerald-400">
                        {margin !== undefined ? `${Number(margin).toFixed(1)}%` : '-'}
                      </td>
                      <td className="px-6 py-4 font-bold text-foreground">
                        ${amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {date ? new Date(date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button
                          onClick={() => navigate(`/sales/negotiation/${q.id}`)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300 hover:underline cursor-pointer"
                          title="Open Real-time Negotiation Chat"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          Chat
                        </button>
                        <button
                          onClick={() => navigate(`/sales/quote-builder/${q.id}`)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                        >
                          Edit / View <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PaginationControls
        page={pagination.page}
        limit={pagination.limit}
        total={pagination.total}
        totalPages={pagination.totalPages}
        onPageChange={(newPage) => setPage(newPage)}
        onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
      />
    </div>
  );
}
