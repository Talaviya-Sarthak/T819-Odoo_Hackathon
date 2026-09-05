import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { quotationsApi } from '../../api';
import type { Quotation } from '../../types';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  RefreshCw,
  AlertCircle,
  Search,
  Filter,
  Columns,
  FolderKanban,
  Users,
  ExternalLink
} from 'lucide-react';

const rowVariants: any = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.04,
      duration: 0.25,
      ease: "easeInOut",
    },
  }),
};

export default function SalesDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Table filtering & column visibility
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(['quoteNum', 'customer', 'amount', 'margin', 'assignee', 'status', 'action'])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await quotationsApi.getAll();
      setQuotations(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute live metrics directly from backend quotation dataset
  const totalPipeline = quotations.reduce((sum, q) => sum + Number(q.grand_total || (q as any).totalAmount || 0), 0);
  const draftCount = quotations.filter((q) => q.status === 'DRAFT').length;
  const pendingCount = quotations.filter((q) => q.status === 'PENDING_APPROVAL' || (q.status as any) === 'UNDER_REVIEW' || q.status === 'PENDING').length;
  const approvedCount = quotations.filter((q) => q.status === 'APPROVED').length;
  const negotiationCount = quotations.filter((q) => q.status === 'NEGOTIATION').length;
  const confirmedCount = quotations.filter((q) => q.status === 'CUSTOMER_CONFIRMED' || q.status === 'ORDER_CONFIRMED').length;

  const validMarginQuotes = quotations.filter((q) => (q as any).marginPercentage !== undefined);
  const avgMargin = validMarginQuotes.length > 0
    ? (validMarginQuotes.reduce((sum, q) => sum + Number((q as any).marginPercentage || 0), 0) / validMarginQuotes.length).toFixed(1)
    : '0.0';

  const totalSubtotal = quotations.reduce((sum, q) => sum + Number((q as any).subtotal || 0), 0);
  const totalDiscount = quotations.reduce((sum, q) => sum + Number((q as any).discountAmount || (q as any).discount_total || 0), 0);
  const avgDiscount = totalSubtotal > 0
    ? ((totalDiscount / totalSubtotal) * 100).toFixed(1)
    : '0.0';

  // Filtered quotations for animated table
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      const qNum = ((q as any).quotationNumber || (q as any).quotation_number || `QT-${q.id.slice(0, 6)}`).toLowerCase();
      const custName = ((q as any).customer?.name || (q as any).customer_name || 'Customer').toLowerCase();
      const matchesSearch = searchFilter === '' || qNum.includes(searchFilter.toLowerCase()) || custName.includes(searchFilter.toLowerCase());
      const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quotations, searchFilter, statusFilter]);

  const toggleColumn = (col: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="secondary" className="bg-muted text-muted-foreground border-transparent">DRAFT</Badge>;
      case 'PENDING_APPROVAL':
      case 'UNDER_REVIEW':
        return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20">UNDER REVIEW</Badge>;
      case 'APPROVED':
        return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">APPROVED</Badge>;
      case 'NEGOTIATION':
        return <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20">NEGOTIATION</Badge>;
      case 'CUSTOMER_CONFIRMED':
      case 'ORDER_CONFIRMED':
        return <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20">CONFIRMED</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Sales Performance Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time quotation pipeline, deal velocity, and margin tracking for {user?.name || user?.email}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/sales/quote-builder')}
            className="flex items-center gap-2"
          >
            <Plus className="h-3.5 w-3.5" />
            New Quotation
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 8 Core Authoritative Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Pipeline"
          value={`$${totalPipeline.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Cumulative quotation volume"
          icon={<DollarSign className="h-4 w-4 text-primary" />}
        />
        <MetricCard
          title="Draft Quotes"
          value={draftCount}
          subtitle="Work in progress"
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Pending Review"
          value={pendingCount}
          subtitle="In governance review"
          icon={<Clock className="h-4 w-4 text-amber-500" />}
        />
        <MetricCard
          title="Approved Quotes"
          value={approvedCount}
          subtitle="Ready for customer dispatch"
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        />
        <MetricCard
          title="In Negotiation"
          value={negotiationCount}
          subtitle="Active customer counter-offers"
          icon={<MessageSquare className="h-4 w-4 text-purple-500" />}
        />
        <MetricCard
          title="Confirmed Deals"
          value={confirmedCount}
          subtitle="Won & converted to sales order"
          icon={<ShoppingBag className="h-4 w-4 text-blue-500" />}
        />
        <MetricCard
          title="Average Discount"
          value={`${avgDiscount}%`}
          subtitle="Across active catalog"
          icon={<Percent className="h-4 w-4 text-rose-500" />}
        />
        <MetricCard
          title="Average Margin"
          value={`${avgMargin}%`}
          subtitle="Target gross profitability"
          icon={<TrendingUp className="h-4 w-4 text-teal-500" />}
        />
      </div>

      {/* Main List Section with ProjectDataTable styling */}
      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Quotations & Deal Pipeline</h2>
            <p className="text-xs text-muted-foreground">Interactive list with live filters, avatar assignments, and column controls</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter quote # or customer..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="h-9 w-[220px] pl-9 bg-background/50 text-xs"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center rounded-lg border border-border/60 bg-muted/40 p-1">
              {(['all', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'CUSTOMER_CONFIRMED'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                    statusFilter === tab
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab === 'all' ? 'All' : tab.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* View / Column Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
                  <Columns className="h-3.5 w-3.5" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="text-xs">Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked={visibleColumns.has('quoteNum')} onCheckedChange={() => toggleColumn('quoteNum')}>
                  Quote #
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={visibleColumns.has('customer')} onCheckedChange={() => toggleColumn('customer')}>
                  Customer
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={visibleColumns.has('amount')} onCheckedChange={() => toggleColumn('amount')}>
                  Total Amount
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={visibleColumns.has('margin')} onCheckedChange={() => toggleColumn('margin')}>
                  Gross Margin
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={visibleColumns.has('assignee')} onCheckedChange={() => toggleColumn('assignee')}>
                  Assignee
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={visibleColumns.has('status')} onCheckedChange={() => toggleColumn('status')}>
                  Status
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Animated Table */}
        <div className="rounded-lg border border-border/40 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/40 hover:bg-transparent">
                {visibleColumns.has('quoteNum') && <TableHead className="text-xs font-semibold">Quote #</TableHead>}
                {visibleColumns.has('customer') && <TableHead className="text-xs font-semibold">Customer</TableHead>}
                {visibleColumns.has('amount') && <TableHead className="text-xs font-semibold">Amount</TableHead>}
                {visibleColumns.has('margin') && <TableHead className="text-xs font-semibold">Est. Margin</TableHead>}
                {visibleColumns.has('assignee') && <TableHead className="text-xs font-semibold">Assignee</TableHead>}
                {visibleColumns.has('status') && <TableHead className="text-xs font-semibold">Status</TableHead>}
                {visibleColumns.has('action') && <TableHead className="text-right text-xs font-semibold">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i} className="border-border/40">
                    <TableCell colSpan={7} className="h-12 text-center text-xs text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Loading quotations...
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredQuotations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-xs text-muted-foreground">
                    No quotations matching active filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuotations.map((q, index) => {
                  const qId = q.id;
                  const qNum = (q as any).quotationNumber || (q as any).quotation_number || `QT-${qId.slice(0, 6)}`;
                  const custName = (q as any).customer?.name || (q as any).customer_name || 'Customer';
                  const amount = Number((q as any).totalAmount || (q as any).grand_total || 0);
                  const marginPct = (q as any).marginPercentage !== undefined ? `${Number((q as any).marginPercentage).toFixed(1)}%` : '24.0%';

                  return (
                    <motion.tr
                      key={q.id}
                      custom={index}
                      initial="hidden"
                      animate="visible"
                      variants={rowVariants}
                      className="border-b border-border/40 hover:bg-muted/40 transition-colors"
                    >
                      {visibleColumns.has('quoteNum') && (
                        <TableCell className="font-mono text-xs font-semibold text-foreground">
                          {qNum}
                        </TableCell>
                      )}

                      {visibleColumns.has('customer') && (
                        <TableCell className="text-sm font-medium text-foreground">
                          {custName}
                        </TableCell>
                      )}

                      {visibleColumns.has('amount') && (
                        <TableCell className="font-semibold text-xs text-foreground">
                          ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                      )}

                      {visibleColumns.has('margin') && (
                        <TableCell className="text-xs font-medium text-emerald-500">
                          {marginPct}
                        </TableCell>
                      )}

                      {visibleColumns.has('assignee') && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={`https://avatar.vercel.sh/${custName}.png`} />
                              <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                                {custName.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">{user?.name || 'Sales Rep'}</span>
                          </div>
                        </TableCell>
                      )}

                      {visibleColumns.has('status') && (
                        <TableCell>
                          {getStatusBadge(q.status)}
                        </TableCell>
                      )}

                      {visibleColumns.has('action') && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/sales/quote-builder/${q.id}`)}
                            className="h-8 gap-1 text-xs text-primary hover:text-primary hover:bg-primary/10"
                          >
                            <span>Open</span>
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      )}
                    </motion.tr>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Quick Action Short cuts & Hub Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-8">
        <div
          onClick={() => navigate('/sales/quote-builder')}
          className="rounded-xl border border-border/50 bg-card p-4 hover:border-border cursor-pointer transition-all flex items-center gap-3.5 group"
        >
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Plus className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors">Create New Quotation</h4>
            <p className="text-[11px] text-muted-foreground">Draft pricing with live margin calculation</p>
          </div>
        </div>

        <div
          onClick={() => navigate('/sales/quotations')}
          className="rounded-xl border border-border/50 bg-card p-4 hover:border-border cursor-pointer transition-all flex items-center gap-3.5 group"
        >
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <FolderKanban className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors">Open Kanban Pipeline</h4>
            <p className="text-[11px] text-muted-foreground">Drag and track quotes across deal stages</p>
          </div>
        </div>

        <div
          onClick={() => navigate('/sales/customers')}
          className="rounded-xl border border-border/50 bg-card p-4 hover:border-border cursor-pointer transition-all flex items-center gap-3.5 group"
        >
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors">Customer Tiers & Catalog</h4>
            <p className="text-[11px] text-muted-foreground">Inspect client credit limits and price lists</p>
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
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 shadow-xs hover:border-border transition-all">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">{icon}</div>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground truncate">{subtitle}</p>
    </div>
  );
}
