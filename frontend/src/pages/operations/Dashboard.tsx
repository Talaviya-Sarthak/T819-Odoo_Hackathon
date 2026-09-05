import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { operationsApi } from '../../api';
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
  ClipboardList,
  Clock,
  Boxes,
  Receipt,
  CreditCard,
  RefreshCw,
  Truck,
  CheckCircle2,
  Lock,
  ArrowRight,
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

  // Table filtering & column toggle
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(['sku', 'product', 'deficit', 'warehouse', 'status', 'action'])
  );

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
        const kpiData = await operationsApi.getKPIs();
        setKpis(kpiData);
      }
    } catch (err) {
      console.error('Failed to load operations dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  }

  const backorderList = useMemo(() => {
    const list = analytics?.openBackordersList || [
      { id: 'bo-1', sku: 'SKU-IND-401', productName: 'Heavy Industrial Servo Motor', quantity: 20, fulfilledQuantity: 8, status: 'BACKORDERED', warehouse: 'Ahmedabad Central' },
      { id: 'bo-2', sku: 'SKU-ELE-109', productName: 'Optocoupler Relay Module 24V', quantity: 15, fulfilledQuantity: 0, status: 'CRITICAL', warehouse: 'Vadodara Hub' },
      { id: 'bo-3', sku: 'SKU-HYD-550', productName: 'High-Pressure Hydraulic Valve', quantity: 8, fulfilledQuantity: 2, status: 'REORDER_SENT', warehouse: 'Surat Depot' },
      { id: 'bo-4', sku: 'SKU-SEN-802', productName: 'Digital Hall Effect Sensor Array', quantity: 35, fulfilledQuantity: 15, status: 'BACKORDERED', warehouse: 'Ahmedabad Central' },
    ];

    return list.filter((item: any) => {
      const matchSearch = searchFilter === '' || 
        item.sku.toLowerCase().includes(searchFilter.toLowerCase()) || 
        item.productName.toLowerCase().includes(searchFilter.toLowerCase());
      const matchStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [analytics, searchFilter, statusFilter]);

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
      case 'CRITICAL':
        return <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20">CRITICAL DEFICIT</Badge>;
      case 'BACKORDERED':
        return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20">AWAITING RESTOCK</Badge>;
      case 'REORDER_SENT':
        return <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20">PO SENT TO SUPPLIER</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Operations & Fulfillment Hub</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Sparkles className="w-3 h-3" /> Live Telemetry
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time multi-warehouse fulfillment, inventory allocation, and automated backorder dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboard}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/operations/orders')}
            className="flex items-center gap-2"
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Process Orders
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/operations/fulfillment')}
            className="flex items-center gap-2"
          >
            <Truck className="h-3.5 w-3.5 text-muted-foreground" />
            Dispatch Shipment
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-card border border-border/50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Orders Awaiting Fulfillment */}
          <div
            onClick={() => navigate('/operations/orders')}
            className="group cursor-pointer rounded-xl border border-border/50 bg-card p-5 shadow-xs hover:border-border transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Orders to Fulfill</span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                <ClipboardList className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold tracking-tight text-foreground">{kpis?.ordersAwaitingFulfillment ?? 0}</span>
              <span className="text-xs text-muted-foreground ml-2">of {kpis?.totalOrders ?? 0} total</span>
            </div>
            <p className="mt-1 text-[11px] font-medium text-amber-500">
              {kpis?.partiallyFulfilledOrders ?? 0} partially fulfilled
            </p>
          </div>

          {/* Open Backorders */}
          <div
            onClick={() => navigate('/operations/backorders')}
            className="group cursor-pointer rounded-xl border border-border/50 bg-card p-5 shadow-xs hover:border-border transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Open Backorders</span>
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">{kpis?.openBackorders ?? 0}</span>
              <span className="text-xs text-rose-500/80 ml-2">({kpis?.openBackordersQuantity ?? 0} units deficit)</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {kpis?.lowStockProducts ?? 0} SKUs below reorder point
            </p>
          </div>

          {/* Total Available Inventory */}
          <div
            onClick={() => navigate('/operations/inventory')}
            className="group cursor-pointer rounded-xl border border-border/50 bg-card p-5 shadow-xs hover:border-border transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Available Stock</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{kpis?.availableStockQuantity ?? 0}</span>
              <span className="text-xs text-muted-foreground ml-2">of {kpis?.totalQuantityOnHand ?? 0} on-hand</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Valuation: ${kpis?.totalInventoryValue?.toLocaleString() ?? 0}
            </p>
          </div>

          {/* Outstanding Invoices & Receivables */}
          <div
            onClick={() => navigate('/operations/invoices')}
            className="group cursor-pointer rounded-xl border border-border/50 bg-card p-5 shadow-xs hover:border-border transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Receivables Due</span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                ${kpis?.outstandingBalance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {kpis?.outstandingInvoices ?? 0} pending invoices
            </p>
          </div>

          {/* Revenue Collected */}
          <div
            onClick={() => navigate('/operations/payments')}
            className="group cursor-pointer rounded-xl border border-border/50 bg-card p-5 shadow-xs hover:border-border transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Collected</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                ${kpis?.totalCollectedRevenue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {kpis?.paidInvoices ?? 0} invoices fully settled
            </p>
          </div>

          {/* Monthly Recurring Revenue */}
          <div
            onClick={() => navigate('/operations/subscriptions')}
            className="group cursor-pointer rounded-xl border border-border/50 bg-card p-5 shadow-xs hover:border-border transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Monthly Recurring</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <RefreshCw className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
                ${kpis?.monthlyRecurringRevenue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {kpis?.activeSubscriptions ?? 0} active subscriptions
            </p>
          </div>

          {/* Reserved Stock Ratio */}
          <div
            onClick={() => navigate('/operations/inventory')}
            className="group cursor-pointer rounded-xl border border-border/50 bg-card p-5 shadow-xs hover:border-border transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Stock Reserved</span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                <Lock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold tracking-tight text-foreground">{kpis?.totalQuantityReserved ?? 0}</span>
              <span className="text-xs text-muted-foreground ml-2">units allocated</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Guaranteed for confirmed orders
            </p>
          </div>

          {/* Fulfilled Orders Total */}
          <div
            onClick={() => navigate('/operations/orders')}
            className="group cursor-pointer rounded-xl border border-border/50 bg-card p-5 shadow-xs hover:border-border transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Fulfilled Orders</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{kpis?.fulfilledOrders ?? 0}</span>
              <span className="text-xs text-muted-foreground ml-2">completed</span>
            </div>
            <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              100% order completion rate
            </p>
          </div>
        </div>
      )}

      {/* Main List Data Section with ProjectDataTable styling */}
      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Stock Deficit & Backorders Monitoring</h2>
            <p className="text-xs text-muted-foreground">Live shortage resolution queue with warehouse distribution</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Filter SKU or product..."
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
                <DropdownMenuCheckboxItem checked={statusFilter === "CRITICAL"} onCheckedChange={() => setStatusFilter("CRITICAL")}>Critical Deficit</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === "BACKORDERED"} onCheckedChange={() => setStatusFilter("BACKORDERED")}>Awaiting Restock</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === "REORDER_SENT"} onCheckedChange={() => setStatusFilter("REORDER_SENT")}>PO Sent</DropdownMenuCheckboxItem>
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
                  { key: 'sku', label: 'SKU' },
                  { key: 'product', label: 'Product Name' },
                  { key: 'deficit', label: 'Shortage Deficit' },
                  { key: 'warehouse', label: 'Fulfillment Facility' },
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
                {visibleColumns.has('sku') && <TableHead className="font-semibold text-xs uppercase tracking-wider">SKU</TableHead>}
                {visibleColumns.has('product') && <TableHead className="font-semibold text-xs uppercase tracking-wider">Product</TableHead>}
                {visibleColumns.has('deficit') && <TableHead className="font-semibold text-xs uppercase tracking-wider">Shortage Deficit</TableHead>}
                {visibleColumns.has('warehouse') && <TableHead className="font-semibold text-xs uppercase tracking-wider">Assigned Warehouse</TableHead>}
                {visibleColumns.has('status') && <TableHead className="font-semibold text-xs uppercase tracking-wider">Fulfillment Status</TableHead>}
                {visibleColumns.has('action') && <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {backorderList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.size} className="h-28 text-center text-muted-foreground">
                    Zero open shortages match the selected criteria.
                  </TableCell>
                </TableRow>
              ) : (
                backorderList.map((bo: any, idx: number) => {
                  const deficit = bo.quantity - (bo.fulfilledQuantity || 0);

                  return (
                    <motion.tr
                      key={bo.id}
                      custom={idx}
                      initial="hidden"
                      animate="visible"
                      variants={rowVariants}
                      className="border-b border-border/40 hover:bg-muted/40 transition-colors"
                    >
                      {visibleColumns.has('sku') && (
                        <TableCell className="font-mono text-xs font-semibold text-foreground">
                          {bo.sku}
                        </TableCell>
                      )}

                      {visibleColumns.has('product') && (
                        <TableCell className="text-sm font-medium text-foreground">
                          {bo.productName}
                        </TableCell>
                      )}

                      {visibleColumns.has('deficit') && (
                        <TableCell className="font-mono font-bold text-rose-500 text-sm">
                          -{deficit} units
                        </TableCell>
                      )}

                      {visibleColumns.has('warehouse') && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6 border border-border">
                              <AvatarImage src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=64&q=80" alt="Warehouse" />
                              <AvatarFallback>WH</AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">{bo.warehouse || 'Central Facility'}</span>
                          </div>
                        </TableCell>
                      )}

                      {visibleColumns.has('status') && (
                        <TableCell>
                          {getStatusBadge(bo.status)}
                        </TableCell>
                      )}

                      {visibleColumns.has('action') && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/operations/backorders')}
                            className="h-8 px-2.5 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10"
                          >
                            <span>Resolve</span>
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
          <span>Multi-facility stock auto-allocation enabled</span>
          <Button
            variant="link"
            size="sm"
            onClick={() => navigate('/operations/fulfillment')}
            className="text-xs text-primary"
          >
            Open Shipment Allocation Console →
          </Button>
        </div>
      </div>

      {/* Operational Next Steps Dock */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => navigate('/operations/orders')}
          className="rounded-xl border border-border/50 bg-card p-4 hover:border-border cursor-pointer transition-all flex items-center gap-3.5 group"
        >
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <ClipboardList className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors">1. Review Pending Orders</h4>
            <p className="text-[11px] text-muted-foreground">Convert confirmed quotes into active delivery orders</p>
          </div>
        </div>

        <div
          onClick={() => navigate('/operations/fulfillment')}
          className="rounded-xl border border-border/50 bg-card p-4 hover:border-border cursor-pointer transition-all flex items-center gap-3.5 group"
        >
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors">2. Allocate & Ship Stock</h4>
            <p className="text-[11px] text-muted-foreground">Select fulfillment facility and generate dispatch manifests</p>
          </div>
        </div>

        <div
          onClick={() => navigate('/operations/invoices')}
          className="rounded-xl border border-border/50 bg-card p-4 hover:border-border cursor-pointer transition-all flex items-center gap-3.5 group"
        >
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors">3. Automated Billing</h4>
            <p className="text-[11px] text-muted-foreground">Issue tax invoices and record settlements</p>
          </div>
        </div>
      </div>
    </div>
  );
}
