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
  CheckCircle2, 
  MessageSquare, 
  ArrowRight, 
  RefreshCw, 
  ShoppingBag,
  Sparkles,
  ListFilter,
  Columns,
  ExternalLink
} from 'lucide-react';

const rowVariants: any = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.25,
      ease: "easeInOut",
    },
  }),
};

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(['quoteNum', 'items', 'amount', 'assignee', 'status', 'action'])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await quotationsApi.getAll();
      setQuotations(data || []);
    } catch (err) {
      console.error('Failed to load customer quotations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingReview = quotations.filter((q) => q.status === 'APPROVED' || q.status === 'DRAFT').length;
  const inNegotiation = quotations.filter((q) => q.status === 'NEGOTIATION' || q.status === 'PENDING_APPROVAL').length;
  const confirmed = quotations.filter((q) => q.status === 'CUSTOMER_CONFIRMED' || q.status === 'ORDER_CONFIRMED').length;

  const filteredQuotes = useMemo(() => {
    return quotations.filter((q) => {
      const qNum = ((q as any).quotationNumber || (q as any).quotation_number || `QT-${q.id.slice(0, 6)}`).toLowerCase();
      const matchSearch = searchFilter === '' || qNum.includes(searchFilter.toLowerCase());
      const matchStatus = statusFilter === 'all' || q.status === statusFilter;
      return matchSearch && matchStatus;
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
        return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20">PENDING APPROVAL</Badge>;
      case 'APPROVED':
        return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">READY TO CONFIRM</Badge>;
      case 'NEGOTIATION':
        return <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20">NEGOTIATION</Badge>;
      case 'CUSTOMER_CONFIRMED':
      case 'ORDER_CONFIRMED':
        return <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20">ORDER CONFIRMED</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Client Portal Overview</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Sparkles className="w-3 h-3" /> Tier 1 Account
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, {user?.name || user?.email}. Manage quotes, counter-offers, and confirmed orders.
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
            onClick={() => navigate('/customer/quotations')}
            className="flex items-center gap-2"
          >
            <FileText className="h-3.5 w-3.5" />
            Review Quotes
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div 
          onClick={() => navigate('/customer/quotations')}
          className="rounded-xl border border-border/50 bg-card p-5 shadow-xs hover:border-border transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Quotes for Review</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{pendingReview}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Awaiting review or customer confirmation</p>
        </div>

        <div 
          onClick={() => navigate('/customer/negotiation')}
          className="rounded-xl border border-border/50 bg-card p-5 shadow-xs hover:border-border transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active Negotiations</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{inNegotiation}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Counter-proposals in active discussion</p>
        </div>

        <div 
          onClick={() => navigate('/customer/orders')}
          className="rounded-xl border border-border/50 bg-card p-5 shadow-xs hover:border-border transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Confirmed Orders</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{confirmed}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Accepted deals converted to sales orders</p>
        </div>
      </div>

      {/* Main List Section with ProjectDataTable styling */}
      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Your Quotations & Orders</h2>
            <p className="text-xs text-muted-foreground">Review proposal lines, track discounts, and confirm agreements</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Filter quote #..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-44 sm:w-56 h-9"
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
                <DropdownMenuCheckboxItem checked={statusFilter === "all"} onCheckedChange={() => setStatusFilter("all")}>All</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === "APPROVED"} onCheckedChange={() => setStatusFilter("APPROVED")}>Ready to Confirm</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === "NEGOTIATION"} onCheckedChange={() => setStatusFilter("NEGOTIATION")}>Negotiation</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === "CUSTOMER_CONFIRMED"} onCheckedChange={() => setStatusFilter("CUSTOMER_CONFIRMED")}>Confirmed</DropdownMenuCheckboxItem>
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
                  { key: 'quoteNum', label: 'Quotation #' },
                  { key: 'items', label: 'Item Count' },
                  { key: 'amount', label: 'Total Amount' },
                  { key: 'assignee', label: 'Assigned Specialist' },
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

        {/* Animated Table */}
        <div className="rounded-lg border border-border/50 bg-background/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/50">
                {visibleColumns.has('quoteNum') && <TableHead className="font-semibold text-xs uppercase tracking-wider">Quotation #</TableHead>}
                {visibleColumns.has('items') && <TableHead className="font-semibold text-xs uppercase tracking-wider">Items</TableHead>}
                {visibleColumns.has('amount') && <TableHead className="font-semibold text-xs uppercase tracking-wider">Total Amount</TableHead>}
                {visibleColumns.has('assignee') && <TableHead className="font-semibold text-xs uppercase tracking-wider">Sales Specialist</TableHead>}
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
                      <span>Loading your proposals...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredQuotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.size} className="h-28 text-center text-muted-foreground">
                    No quotations found matching the filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuotes.map((q, idx) => {
                  const qNum = (q as any).quotationNumber || (q as any).quotation_number || `QT-${q.id.slice(0, 6)}`;
                  const amount = Number((q as any).totalAmount || (q as any).grand_total || 0);
                  const itemCount = (q as any).lines?.length || 1;

                  return (
                    <motion.tr
                      key={q.id}
                      custom={idx}
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

                      {visibleColumns.has('items') && (
                        <TableCell className="text-sm text-muted-foreground">
                          {itemCount} {itemCount === 1 ? 'line item' : 'line items'}
                        </TableCell>
                      )}

                      {visibleColumns.has('amount') && (
                        <TableCell className="text-sm font-semibold text-foreground">
                          ${amount.toFixed(2)}
                        </TableCell>
                      )}

                      {visibleColumns.has('assignee') && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7 border border-border">
                              <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&q=80" alt="Specialist" />
                              <AvatarFallback>SP</AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">DealFlow Desk</span>
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
                            onClick={() => navigate('/customer/quotations')}
                            className="h-8 px-2.5 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10"
                          >
                            <span>Review & Confirm</span>
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
          <span>Instant electronic acceptance & digital signing</span>
          <Button
            variant="link"
            size="sm"
            onClick={() => navigate('/customer/negotiation')}
            className="text-xs text-primary"
          >
            Open Live Negotiation Chat →
          </Button>
        </div>
      </div>

      {/* Quick Customer Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title: 'My Quotations', desc: 'Accept, reject, or request revisions', path: '/customer/quotations', icon: FileText },
          { title: 'Negotiation Room', desc: 'Live counter-offers with sales team', path: '/customer/negotiation', icon: MessageSquare },
          { title: 'Orders & Invoices', desc: 'Track shipments and download receipts', path: '/customer/orders', icon: ShoppingBag },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              onClick={() => navigate(item.path)}
              className="rounded-xl border border-border/50 bg-card p-4 hover:border-border cursor-pointer transition-all flex items-center gap-3.5 group"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Icon className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <h4 className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors truncate">{item.title}</h4>
                <p className="text-[11px] text-muted-foreground truncate">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
