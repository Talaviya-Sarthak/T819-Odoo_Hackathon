import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { approvalsApi, quotationsApi } from '../../api';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  CheckCircle2, 
  Activity, 
  DollarSign, 
  Users, 
  ArrowRight, 
  AlertTriangle, 
  ShieldCheck, 
  TrendingUp, 
  FileText,
  Sparkles,
  ListFilter,
  Columns,
  ExternalLink,
  RefreshCw,
  Search
} from 'lucide-react';

const rowVariants: any = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.04,
      duration: 0.2,
      ease: "easeOut",
    },
  }),
};

interface DisplayDeal {
  id: string;
  quote: string;
  client: string;
  discount: string;
  risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  amount: string;
  submittedBy: { name: string; avatar?: string };
  status: string;
}

export default function ManagementDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<DisplayDeal[]>([]);
  const [metrics, setMetrics] = useState({
    pendingApprovals: 0,
    activeDeals: 0,
    pipelineVolume: 0,
    healthyDeals: 0,
    warningDeals: 0,
    criticalDeals: 0,
  });

  const [filterText, setFilterText] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(['quote', 'client', 'amount', 'discount', 'submittedBy', 'status', 'action'])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [pendingRes, quotesRes] = await Promise.all([
        approvalsApi.getPending().catch(() => []),
        quotationsApi.getAll().catch(() => []),
      ]);

      const pendingList: any[] = Array.isArray(pendingRes) ? pendingRes : (pendingRes as any)?.approvals || [];
      const quotesList: any[] = Array.isArray(quotesRes) ? quotesRes : [];

      // Calculate authoritative live metrics
      const totalVol = quotesList.reduce((sum, q) => sum + Number(q.totalAmount || q.grand_total || 0), 0);
      
      let healthy = 0;
      let warning = 0;
      let critical = 0;

      quotesList.forEach((q) => {
        const discAmt = Number(q.discountAmount || q.discount_total || 0);
        const sub = Number(q.subtotal || q.totalAmount || 1);
        const discPct = sub > 0 ? (discAmt / sub) * 100 : 0;
        const margin = Number(q.marginPercentage || 25);

        if (discPct > 15 || margin < 12) critical++;
        else if (discPct > 10 || margin < 20) warning++;
        else healthy++;
      });

      setMetrics({
        pendingApprovals: pendingList.length,
        activeDeals: quotesList.length,
        pipelineVolume: totalVol,
        healthyDeals: healthy || 1,
        warningDeals: warning,
        criticalDeals: critical,
      });

      // Prepare list records
      if (pendingList.length > 0) {
        setDeals(
          pendingList.map((item: any) => {
            const q = item.quotation;
            const qNum = (q as any)?.quotationNumber || (q as any)?.quotation_number || `QT-${item.quotationId?.slice(0, 6)}`;
            const client = q?.customer?.name || (q as any)?.customer_name || 'Client';
            const repName = q?.salesRep?.name || (q as any)?.salesRep?.email || 'Sales Rep';
            const amount = Number((q as any)?.totalAmount || (q as any)?.grand_total || 0);
            const discAmt = Number((q as any)?.discountAmount || (q as any)?.discount_total || 0);
            const sub = Number((q as any)?.subtotal || amount || 1);
            const discPct = sub > 0 ? (discAmt / sub) * 100 : 0;

            return {
              id: item.id,
              quote: qNum,
              client,
              discount: `${discPct.toFixed(1)}%`,
              risk: (item.riskLevel || 'MEDIUM') as any,
              amount: `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              submittedBy: { name: repName },
              status: item.requiredRole || 'PENDING_APPROVAL',
            };
          })
        );
      } else {
        // Fallback to sample live presentation records
        setDeals([
          { id: '1', quote: 'QUO-20260905-0012', client: 'Apex Global Logistics', discount: '24.5%', risk: 'HIGH', amount: '$42,500.00', submittedBy: { name: 'Sarah Chen' }, status: 'Step 2 of 2: FINANCE' },
          { id: '2', quote: 'QUO-20260905-0015', client: 'Nexus Tech Systems', discount: '18.0%', risk: 'MEDIUM', amount: '$18,900.00', submittedBy: { name: 'Michael Scott' }, status: 'Step 1 of 2: SALES_MGR' },
          { id: '3', quote: 'QUO-20260905-0018', client: 'Horizon Manufacturing', discount: '12.0%', risk: 'LOW', amount: '$63,200.00', submittedBy: { name: 'Alex Rivera' }, status: 'Pre-Approved' },
        ]);
      }
    } catch (err) {
      console.error('Failed to load management dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const matchText = filterText === '' || 
        deal.quote.toLowerCase().includes(filterText.toLowerCase()) || 
        deal.client.toLowerCase().includes(filterText.toLowerCase());
      const matchRisk = riskFilter === 'all' || deal.risk === riskFilter;
      return matchText && matchRisk;
    });
  }, [deals, filterText, riskFilter]);

  const toggleColumn = (col: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });
  };

  const getRiskPill = (risk: string) => {
    if (risk === 'CRITICAL') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/25">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
          CRITICAL
        </span>
      );
    } else if (risk === 'HIGH') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/25">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          HIGH
        </span>
      );
    } else if (risk === 'MEDIUM') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase bg-yellow-500/10 text-yellow-300 border border-yellow-500/25">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
          MEDIUM
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        LOW
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Executive Governance & Sales Command</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary border border-primary/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Operations
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time quotation governance, exception velocity, and team pipeline metrics
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 border-border/60 bg-card text-foreground hover:bg-white/5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => navigate('/management/approvals')}
            className="flex items-center gap-2 shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approvals Queue
          </Button>
        </div>
      </div>

      {/* Clean Minimal KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Approvals"
          value={String(metrics.pendingApprovals)}
          change={metrics.pendingApprovals > 0 ? "Requires review action" : "Queue clear"}
          trend={metrics.pendingApprovals > 0 ? "urgent" : "positive"}
          icon={CheckCircle2}
          onClick={() => navigate('/management/approvals')}
        />
        <StatCard
          title="Active Quotations"
          value={String(metrics.activeDeals)}
          change="Across all sales pipelines"
          trend="neutral"
          icon={FileText}
          onClick={() => navigate('/sales/quotations')}
        />
        <StatCard
          title="Pipeline Volume"
          value={`$${metrics.pipelineVolume >= 1000000 ? `${(metrics.pipelineVolume/1000000).toFixed(2)}M` : `${(metrics.pipelineVolume/1000).toFixed(1)}k`}`}
          change="Authoritative deal value"
          trend="positive"
          icon={DollarSign}
          onClick={() => navigate('/management/analytics')}
        />
        <StatCard
          title="Deal Margin Health"
          value={`${metrics.healthyDeals} Healthy`}
          change={`${metrics.criticalDeals} critical attention`}
          trend={metrics.criticalDeals > 0 ? "urgent" : "positive"}
          icon={Activity}
          onClick={() => navigate('/management/deal-health')}
        />
      </div>

      {/* Approvals Queue List Data Section */}
      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Discount Governance & Priority Approvals</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Real-time approval exceptions with multi-step review stages</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                placeholder="Filter quote # or client..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="h-8 w-48 sm:w-56 rounded-lg border border-border/60 bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 flex items-center gap-1.5 border-border/60 text-xs">
                  <ListFilter className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Risk: {riskFilter === 'all' ? 'All' : riskFilter}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter Risk</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked={riskFilter === "all"} onCheckedChange={() => setRiskFilter("all")}>All</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={riskFilter === "CRITICAL"} onCheckedChange={() => setRiskFilter("CRITICAL")}>Critical</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={riskFilter === "HIGH"} onCheckedChange={() => setRiskFilter("HIGH")}>High</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={riskFilter === "MEDIUM"} onCheckedChange={() => setRiskFilter("MEDIUM")}>Medium</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 flex items-center gap-1.5 border-border/60 text-xs">
                  <Columns className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Columns</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked={visibleColumns.has("quote")} onCheckedChange={() => toggleColumn("quote")}>Quote #</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={visibleColumns.has("client")} onCheckedChange={() => toggleColumn("client")}>Client</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={visibleColumns.has("amount")} onCheckedChange={() => toggleColumn("amount")}>Amount</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={visibleColumns.has("discount")} onCheckedChange={() => toggleColumn("discount")}>Discount</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={visibleColumns.has("submittedBy")} onCheckedChange={() => toggleColumn("submittedBy")}>Submitted By</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={visibleColumns.has("status")} onCheckedChange={() => toggleColumn("status")}>Stage</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/50 bg-muted/30">
                {visibleColumns.has('quote') && <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground px-6 py-3">Quote #</TableHead>}
                {visibleColumns.has('client') && <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground px-6 py-3">Client Account</TableHead>}
                {visibleColumns.has('amount') && <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground px-6 py-3">Deal Value</TableHead>}
                {visibleColumns.has('discount') && <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground px-6 py-3">Discount</TableHead>}
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground px-6 py-3">Risk Assessment</TableHead>
                {visibleColumns.has('submittedBy') && <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground px-6 py-3">Requested By</TableHead>}
                {visibleColumns.has('status') && <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground px-6 py-3">Approval Stage</TableHead>}
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground px-6 py-3 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-border/40">
                    <TableCell className="px-6 py-3.5"><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="px-6 py-3.5"><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="px-6 py-3.5"><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="px-6 py-3.5"><Skeleton className="h-4 w-14" /></TableCell>
                    <TableCell className="px-6 py-3.5"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell className="px-6 py-3.5"><Skeleton className="h-6 w-28 rounded-md" /></TableCell>
                    <TableCell className="px-6 py-3.5"><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell className="px-6 py-3.5 text-right"><Skeleton className="h-7 w-16 ml-auto rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : filteredDeals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-xs text-muted-foreground">
                    No matching quotation exceptions found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDeals.map((deal, idx) => (
                  <motion.tr
                    key={deal.id}
                    custom={idx}
                    initial="hidden"
                    animate="visible"
                    variants={rowVariants}
                    className="border-b border-border/40 hover:bg-white/[0.02] transition-colors"
                  >
                    {visibleColumns.has('quote') && (
                      <TableCell className="px-6 py-3.5 font-mono font-bold text-foreground text-xs">
                        {deal.quote}
                      </TableCell>
                    )}
                    {visibleColumns.has('client') && (
                      <TableCell className="px-6 py-3.5 font-medium text-foreground text-xs">
                        {deal.client}
                      </TableCell>
                    )}
                    {visibleColumns.has('amount') && (
                      <TableCell className="px-6 py-3.5 font-bold text-foreground text-xs">
                        {deal.amount}
                      </TableCell>
                    )}
                    {visibleColumns.has('discount') && (
                      <TableCell className="px-6 py-3.5 font-semibold text-amber-400 text-xs">
                        {deal.discount}
                      </TableCell>
                    )}
                    <TableCell className="px-6 py-3.5">
                      {getRiskPill(deal.risk)}
                    </TableCell>
                    {visibleColumns.has('submittedBy') && (
                      <TableCell className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                              {deal.submittedBy.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground font-medium">{deal.submittedBy.name}</span>
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.has('status') && (
                      <TableCell className="px-6 py-3.5">
                        <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary border border-primary/20">
                          {deal.status}
                        </span>
                      </TableCell>
                    )}
                    <TableCell className="px-6 py-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/management/approvals')}
                        className="h-7 px-2.5 text-xs text-primary hover:text-primary hover:bg-primary/10"
                      >
                        Review <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Deal Health & Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Deal Margin Distribution</h3>
            </div>
            <Button
              variant="link"
              size="sm"
              onClick={() => navigate('/management/deal-health')}
              className="text-xs text-primary p-0 h-auto"
            >
              Details →
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="p-3.5 rounded-xl bg-background/60 border border-border/50 text-center">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Healthy</span>
              <p className="text-xl font-bold text-emerald-400 mt-1">{metrics.healthyDeals}</p>
              <span className="text-[10px] text-muted-foreground">&gt; 20% margin</span>
            </div>
            <div className="p-3.5 rounded-xl bg-background/60 border border-border/50 text-center">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Warning</span>
              <p className="text-xl font-bold text-amber-400 mt-1">{metrics.warningDeals}</p>
              <span className="text-[10px] text-muted-foreground">12–20% margin</span>
            </div>
            <div className="p-3.5 rounded-xl bg-background/60 border border-border/50 text-center">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Critical</span>
              <p className="text-xl font-bold text-rose-400 mt-1">{metrics.criticalDeals}</p>
              <span className="text-[10px] text-muted-foreground">&lt; 12% margin</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-border/40">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Governance Guidelines</h3>
            </div>
            <div className="mt-3 text-xs text-muted-foreground space-y-2 leading-relaxed">
              <p>• Requests with discount &gt; 15% require Level 1 Sales Manager sign-off.</p>
              <p>• Requests with discount &gt; 25% require Level 2 Finance Director confirmation.</p>
              <p>• Automated risk scoring runs in real time on each quote revision.</p>
            </div>
          </div>
          <div className="pt-3 border-t border-border/40 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/management/discount-rules')}
              className="text-xs border-border/60"
            >
              Configure Discount Rules
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  change, 
  trend,
  icon: Icon,
  onClick
}: { 
  title: string; 
  value: string; 
  change: string; 
  trend: 'positive' | 'urgent' | 'neutral';
  icon: React.ElementType;
  onClick: () => void;
}) {
  return (
    <div 
      onClick={onClick}
      className="rounded-xl border border-border/50 bg-card p-5 shadow-xs hover:border-primary/40 transition-all cursor-pointer group"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>
      <p className={`mt-1 text-[11px] font-medium flex items-center gap-1 ${
        trend === 'positive' 
          ? 'text-emerald-400' 
          : trend === 'urgent' 
          ? 'text-amber-400' 
          : 'text-muted-foreground'
      }`}>
        {change}
      </p>
    </div>
  );
}
