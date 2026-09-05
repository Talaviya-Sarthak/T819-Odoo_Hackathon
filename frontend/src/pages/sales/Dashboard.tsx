<<<<<<< Updated upstream
import { useAuth } from '../../context/AuthContext';
=======
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
  ArrowRight,
  RefreshCw,
  AlertCircle,
  FolderKanban,
  Users,
  ShieldAlert,
  ListFilter,
  Columns,
  ExternalLink
} from 'lucide-react';
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome back, {user?.name || user?.email}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Quotations" value="12" change="+3 this week" />
        <StatCard title="Pending Approvals" value="4" change="2 urgent" />
        <StatCard title="Closed Deals" value="8" change="+2 this month" />
        <StatCard title="Revenue Pipeline" value="$245K" change="+12%" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Recent Quotations</h3>
          <p className="text-sm text-gray-500">No quotations yet. Create your first quote to get started.</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">AI Deal Recommendations</h3>
          <p className="text-sm text-gray-500">AI recommendations will appear here once you have active deals.</p>
=======
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
            <Input
              placeholder="Filter quote # or customer..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-48 sm:w-64 h-9"
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <ListFilter className="h-3.5 w-3.5" />
                  <span>Status</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked={statusFilter === "all"} onCheckedChange={() => setStatusFilter("all")}>All Statuses</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === "DRAFT"} onCheckedChange={() => setStatusFilter("DRAFT")}>Draft</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === "PENDING_APPROVAL"} onCheckedChange={() => setStatusFilter("PENDING_APPROVAL")}>Pending Approval</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === "APPROVED"} onCheckedChange={() => setStatusFilter("APPROVED")}>Approved</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === "NEGOTIATION"} onCheckedChange={() => setStatusFilter("NEGOTIATION")}>Negotiation</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === "ORDER_CONFIRMED"} onCheckedChange={() => setStatusFilter("ORDER_CONFIRMED")}>Confirmed</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Columns className="h-3.5 w-3.5" />
                  <span>Columns</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {[
                  { key: 'quoteNum', label: 'Quote #' },
                  { key: 'customer', label: 'Customer' },
                  { key: 'amount', label: 'Amount' },
                  { key: 'margin', label: 'Margin' },
                  { key: 'assignee', label: 'Team / Assignee' },
                  { key: 'status', label: 'Status' },
                ].map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.key}
                    checked={visibleColumns.has(col.key)}
                    onCheckedChange={() => toggleColumn(col.key)}
                  >
                    {col.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Animated Table Container */}
        <div className="rounded-lg border border-border/50 bg-background/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/50">
                {visibleColumns.has('quoteNum') && <TableHead className="font-semibold text-xs uppercase tracking-wider">Quote #</TableHead>}
                {visibleColumns.has('customer') && <TableHead className="font-semibold text-xs uppercase tracking-wider">Customer</TableHead>}
                {visibleColumns.has('amount') && <TableHead className="font-semibold text-xs uppercase tracking-wider">Total Amount</TableHead>}
                {visibleColumns.has('margin') && <TableHead className="font-semibold text-xs uppercase tracking-wider">Margin</TableHead>}
                {visibleColumns.has('assignee') && <TableHead className="font-semibold text-xs uppercase tracking-wider">Contributors</TableHead>}
                {visibleColumns.has('status') && <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>}
                {visibleColumns.has('action') && <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.size} className="h-32 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                      <span>Loading live quotation dataset...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredQuotations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.size} className="h-28 text-center text-muted-foreground">
                    No matching quotations found.
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
                        <TableCell className="font-semibold text-foreground text-sm">
                          ${amount.toFixed(2)}
                        </TableCell>
                      )}

                      {visibleColumns.has('margin') && (
                        <TableCell className="text-sm font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                          {marginPct}
                        </TableCell>
                      )}

                      {visibleColumns.has('assignee') && (
                        <TableCell>
                          <div className="flex -space-x-2">
                            <Avatar className="h-7 w-7 border-2 border-background">
                              <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&q=80" alt="Sales Rep" />
                              <AvatarFallback>SR</AvatarFallback>
                            </Avatar>
                            <Avatar className="h-7 w-7 border-2 border-background">
                              <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&q=80" alt="Reviewer" />
                              <AvatarFallback>M</AvatarFallback>
                            </Avatar>
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
                            className="h-8 px-2.5 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10"
                          >
                            <span>Open</span>
                            <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
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

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
          <span>Showing {filteredQuotations.length} of {quotations.length} deals</span>
          <Button
            variant="link"
            size="sm"
            onClick={() => navigate('/sales/quotations')}
            className="text-xs text-primary"
          >
            Switch to Kanban Board View →
          </Button>
        </div>
      </div>

      {/* Action Panel & Workflow Quick Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => navigate('/sales/quote-builder')}
          className="rounded-xl border border-border/50 bg-card p-4 hover:border-border cursor-pointer transition-all flex items-center gap-3.5 group"
        >
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Plus className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors">Create Draft Quotation</h4>
            <p className="text-[11px] text-muted-foreground">Select customer, configure items & tiered discounts</p>
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
>>>>>>> Stashed changes
        </div>
      </div>
    </div>
  );
}

<<<<<<< Updated upstream
function StatCard({ title, value, change }: { title: string; value: string; change: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-green-600">{change}</p>
=======
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
>>>>>>> Stashed changes
    </div>
  );
}
