import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuotations } from '../../services/quotations.api';
import type { Quotation, QuotationStatus } from '../../types';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Tabs from '../../components/Tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '../../components/Toast';
import { 
  ShoppingBag, 
  RefreshCw, 
  ArrowRight
} from 'lucide-react';

const statusTabs = [
  { key: 'ALL', label: 'All Orders' },
  { key: 'ORDER_CONFIRMED', label: 'Confirmed Orders' },
  { key: 'APPROVED', label: 'Approved Ready' },
  { key: 'ACCEPTED', label: 'Customer Accepted' },
];

const orderStatuses: QuotationStatus[] = ['ORDER_CONFIRMED', 'APPROVED', 'ACCEPTED'];

export default function Orders() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');

  const load = async (status?: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (status && status !== 'ALL') params.status = status;
      const res = await getQuotations(params as { status?: QuotationStatus });
      const list = Array.isArray(res) ? res : res?.quotations || [];
      setQuotations(list.filter((q) => orderStatuses.includes(q.status)));
    } catch (err: any) {
      toast.fail(err?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(activeTab === 'ALL' ? undefined : activeTab);
  }, [activeTab]);

  const stats = useMemo(() => {
    const count = quotations.length;
    const totalRev = quotations.reduce((sum, q) => sum + Number(q.grand_total || (q as any).totalAmount || 0), 0);
    const avgSize = count > 0 ? totalRev / count : 0;
    return { count, totalRev, avgSize };
  }, [quotations]);

  const columns = [
    {
      key: 'quotation_number',
      label: 'Order Reference',
      render: (r: Quotation) => (
        <span className="font-mono font-bold text-foreground text-xs">
          {(r as any).quotationNumber || r.quotation_number || (r.id ? `ORD-${r.id.slice(0, 6)}` : 'Order')}
        </span>
      ),
    },
    {
      key: 'customer_name',
      label: 'Customer Entity',
      render: (r: Quotation) => (
        <div>
          <span className="font-semibold text-foreground text-xs">
            {(r as any).customer?.name || (r as any).customer?.company || r.customer_name || 'Customer'}
          </span>
          {((r as any).customer?.tier?.name || (r as any).customer?.tier) && (
            <span className="block text-[10px] text-muted-foreground mt-0.5">
              {((r as any).customer?.tier?.name || (r as any).customer?.tier)} Tier
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Fulfillment Status',
      render: (r: Quotation) => <StatusBadge status={r.status} type="quotation" />,
    },
    {
      key: 'grand_total',
      label: 'Order Value',
      render: (r: Quotation) => {
        const total = Number(r.grand_total || (r as any).totalAmount || 0);
        return (
          <span className="font-bold text-foreground text-xs">
            ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Order Date',
      render: (r: Quotation) => {
        const dt = r.created_at || (r as any).createdAt;
        return (
          <span className="text-xs text-muted-foreground">
            {dt ? new Date(dt).toLocaleDateString() : '—'}
          </span>
        );
      },
    },
    {
      key: 'action',
      label: '',
      render: (r: Quotation) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/sales/quote-builder/${r.id}`);
            }}
            className="h-7 px-2 text-xs text-primary hover:bg-primary/10"
          >
            View Details <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Confirmed Sales Orders</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary border border-primary/20">
              <ShoppingBag className="w-3 h-3" /> Execution Pipeline
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Track confirmed quotes transitioning into operational fulfillment and invoice generation
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => load(activeTab === 'ALL' ? undefined : activeTab)}
          disabled={loading}
          className="flex items-center gap-2 border-border/60 bg-card text-foreground hover:bg-white/5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Orders
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-xs">
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Confirmed Orders</span>
          <div className="mt-1.5 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-foreground">{stats.count}</p>
            <span className="text-xs text-muted-foreground font-medium">Ready for dispatch</span>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-xs">
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Realized Revenue</span>
          <div className="mt-1.5 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-foreground">
              ${stats.totalRev.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-xs text-emerald-400 font-medium">Confirmed</span>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-xs">
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Average Order Size</span>
          <div className="mt-1.5 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-foreground">
              ${stats.avgSize.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-xs text-muted-foreground font-medium">Per deal</span>
          </div>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-xs">
        <Tabs tabs={statusTabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={quotations as unknown as Record<string, unknown>[]}
        loading={loading}
        emptyMessage="No confirmed orders found in this category."
        onRowClick={(r) => navigate(`/sales/quote-builder/${(r as Quotation).id}`)}
      />
    </div>
  );
}
