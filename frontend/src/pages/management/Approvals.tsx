<<<<<<< Updated upstream
import { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Tabs from '../../components/Tabs';
import Input from '../../components/Input';
import { useToast } from '../../components/Toast';
import { getApprovals, approveRequest, rejectRequest, returnRequest } from '../../services/approvals.api';
import type { ApprovalRequest } from '../../types';

const filterTabs = [
  { key: 'all', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'RETURNED', label: 'Returned' },
];
=======
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { approvalsApi, type PendingApprovalItem } from '../../api';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  ShieldAlert, 
  Clock, 
  User, 
  Building, 
  RefreshCw,
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  TrendingDown,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
>>>>>>> Stashed changes

const rowVariants: any = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.04,
      duration: 0.22,
      ease: "easeOut",
    },
  }),
};

export default function Approvals() {
  const { toast } = useToast();
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<ApprovalRequest | null>(null);
  const [actionModal, setActionModal] = useState<'approve' | 'reject' | 'return' | null>(null);
<<<<<<< Updated upstream
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
=======
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');
>>>>>>> Stashed changes

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
<<<<<<< Updated upstream
      const status = filter === 'all' ? undefined : filter;
      const res = await getApprovals(status as any);
      setApprovals(res.approvals);
    } catch {
      toast('Failed to load approvals', 'error');
=======
      const data = await approvalsApi.getPending();
      setApprovals(Array.isArray(data) ? data : (data as any)?.approvals || []);
    } catch (err: any) {
      toast.fail(err.message || 'Failed to fetch pending approvals');
>>>>>>> Stashed changes
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => { fetchApprovals(); }, [fetchApprovals]);

  const filteredApprovals = useMemo(() => {
    return approvals.filter((item) => {
      const q = item.quotation;
      const qNum = ((q as any)?.quotationNumber || (q as any)?.quotation_number || item.quotationId || '').toLowerCase();
      const custName = (q?.customer?.name || (q as any)?.customer_name || '').toLowerCase();
      const matchSearch = searchTerm === '' || qNum.includes(searchTerm.toLowerCase()) || custName.includes(searchTerm.toLowerCase());
      const matchRisk = riskFilter === 'ALL' || item.riskLevel === riskFilter;
      return matchSearch && matchRisk;
    });
  }, [approvals, searchTerm, riskFilter]);

  const stats = useMemo(() => {
    const total = approvals.length;
    const critical = approvals.filter(a => a.riskLevel === 'CRITICAL').length;
    const high = approvals.filter(a => a.riskLevel === 'HIGH').length;
    const totalValue = approvals.reduce((sum, a) => sum + Number((a.quotation as any)?.totalAmount || (a.quotation as any)?.grand_total || 0), 0);
    return { total, critical, high, totalValue };
  }, [approvals]);

  const handleAction = async () => {
<<<<<<< Updated upstream
    if (!selected || !actionModal) return;
    setActionLoading(true);
    try {
      if (actionModal === 'approve') {
        await approveRequest(selected.id, { manager_notes: notes || undefined });
        toast('Request approved', 'success');
      } else if (actionModal === 'reject') {
        if (!notes) { toast('Notes are required to reject', 'warning'); setActionLoading(false); return; }
        await rejectRequest(selected.id, { manager_notes: notes });
        toast('Request rejected', 'success');
      } else {
        if (!notes) { toast('Notes are required to return', 'warning'); setActionLoading(false); return; }
        await returnRequest(selected.id, { manager_notes: notes });
        toast('Request returned', 'success');
=======
    if (!selectedApproval || !actionModal) return;

    if ((actionModal === 'reject' || actionModal === 'return') && !comment.trim()) {
      toast.warning('Comments are mandatory when rejecting or returning for revision.');
      return;
    }

    setProcessing(true);

    try {
      if (actionModal === 'approve') {
        await approvalsApi.approve(selectedApproval.id, comment);
        toast.success('Quotation approval step successfully granted!');
      } else if (actionModal === 'reject') {
        await approvalsApi.reject(selectedApproval.id, comment);
        toast.warning('Quotation has been rejected.');
      } else if (actionModal === 'return') {
        await approvalsApi.returnForRevision(selectedApproval.id, comment);
        toast.info('Quotation returned to sales rep for revision.');
>>>>>>> Stashed changes
      }
      setActionModal(null);
<<<<<<< Updated upstream
      setSelected(null);
      setNotes('');
      fetchApprovals();
    } catch {
      toast('Action failed', 'error');
=======
      setSelectedApproval(null);
      setComment('');
      await fetchPendingApprovals();
    } catch (err: any) {
      toast.fail(err.message || 'Action failed.');
>>>>>>> Stashed changes
    } finally {
      setActionLoading(false);
    }
  };

<<<<<<< Updated upstream
  const columns = [
    { key: 'quotation_number', label: 'Quotation #' },
    { key: 'requested_by_name', label: 'Requested By' },
    { key: 'level', label: 'Level' },
    {
      key: 'status',
      label: 'Status',
      render: (row: ApprovalRequest) => <StatusBadge status={row.status} type="approval" />,
    },
    {
      key: 'discount_percent',
      label: 'Risk Score',
      render: (row: ApprovalRequest) => (
        <span className={`text-sm font-medium ${row.discount_percent && row.discount_percent > 20 ? 'text-red-600' : 'text-gray-900'}`}>
          {row.discount_percent ? `${row.discount_percent}%` : '-'}
        </span>
      ),
    },
    { key: 'reason', label: 'Reason' },
    {
      key: 'created_at',
      label: 'Created',
      render: (row: ApprovalRequest) => new Date(row.created_at).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: ApprovalRequest) =>
        row.status === 'PENDING' ? (
          <div className="flex gap-1">
            <button onClick={(e) => { e.stopPropagation(); setSelected(row); setActionModal('approve'); }} className="rounded px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50">Approve</button>
            <button onClick={(e) => { e.stopPropagation(); setSelected(row); setActionModal('reject'); }} className="rounded px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50">Reject</button>
            <button onClick={(e) => { e.stopPropagation(); setSelected(row); setActionModal('return'); }} className="rounded px-2 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-50">Return</button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
        <p className="text-sm text-gray-500">Manage quotation approval requests</p>
      </div>

      <Tabs tabs={filterTabs} activeTab={filter} onChange={setFilter} />

      <DataTable
        columns={columns}
        data={approvals as any}
        loading={loading}
        emptyMessage="No approval requests found"
        onRowClick={setSelected}
      />

      {/* Detail Modal */}
      <Modal isOpen={!!selected && !actionModal} onClose={() => setSelected(null)} title="Approval Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-500">Quotation #</p><p className="text-sm font-medium text-gray-900">{selected.quotation_number || selected.quotation_id}</p></div>
              <div><p className="text-xs text-gray-500">Requested By</p><p className="text-sm font-medium text-gray-900">{selected.requested_by_name || selected.requested_by}</p></div>
              <div><p className="text-xs text-gray-500">Status</p><StatusBadge status={selected.status} type="approval" /></div>
              <div><p className="text-xs text-gray-500">Discount</p><p className="text-sm font-medium text-gray-900">{selected.discount_percent ? `${selected.discount_percent}%` : '-'}</p></div>
              <div><p className="text-xs text-gray-500">Created</p><p className="text-sm font-medium text-gray-900">{new Date(selected.created_at).toLocaleString()}</p></div>
              <div><p className="text-xs text-gray-500">Updated</p><p className="text-sm font-medium text-gray-900">{new Date(selected.updated_at).toLocaleString()}</p></div>
            </div>
            <div><p className="text-xs text-gray-500">Reason</p><p className="text-sm text-gray-900">{selected.reason}</p></div>
            {selected.manager_notes && <div><p className="text-xs text-gray-500">Manager Notes</p><p className="text-sm text-gray-900">{selected.manager_notes}</p></div>}
=======
  const getRiskBadge = (level: string, score: number) => {
    if (level === 'CRITICAL') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/25">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
          {level} ({score}/100)
        </span>
      );
    } else if (level === 'HIGH') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/25">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          {level} ({score}/100)
        </span>
      );
    } else if (level === 'MEDIUM') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase bg-yellow-500/10 text-yellow-300 border border-yellow-500/25">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
          {level} ({score}/100)
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {level} ({score}/100)
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Governance & Approval Queue</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary border border-primary/20">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Live Queue
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Validate quotation discount, margin exceptions, and deal commitments
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchPendingApprovals}
          disabled={loading}
          className="flex items-center gap-2 border-border/60 bg-card text-foreground hover:bg-white/5 transition-all"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Queue
        </Button>
      </div>

      {/* Clean Minimal Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-xs">
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Pending In Queue</span>
          <div className="mt-1.5 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <span className="text-xs text-muted-foreground font-medium">Deals awaiting sign-off</span>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-xs">
          <span className="text-[11px] font-semibold tracking-wider text-amber-400 uppercase">High Risk Alerts</span>
          <div className="mt-1.5 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-amber-400">{stats.high + stats.critical}</p>
            <span className="text-xs text-muted-foreground font-medium">{stats.critical} critical urgency</span>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-xs">
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Value Under Review</span>
          <div className="mt-1.5 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-foreground">
              ${stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            <span className="text-xs text-emerald-400 font-medium">Authoritative</span>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-xs">
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Workflow Tier</span>
          <div className="mt-1.5 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-foreground">{user?.role === 'SALES_MANAGER' ? 'Manager L1' : 'Director L2'}</p>
            <span className="text-xs text-muted-foreground font-medium">Sign-off Authority</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/60 p-2.5 rounded-xl border border-border/50">
        <div className="flex items-center gap-1 overflow-x-auto">
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setRiskFilter(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                riskFilter === tab
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              {tab === 'ALL' ? 'All Risks' : `${tab.charAt(0) + tab.slice(1).toLowerCase()} Risk`}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search quote # or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 w-60 rounded-lg border border-border/60 bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Main Approvals Table */}
      <div className="rounded-xl border border-border/50 bg-card shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <RefreshCw className="h-5 w-5 animate-spin" />
            </div>
            <span className="text-sm font-medium text-foreground">Syncing pending approvals...</span>
          </div>
        ) : filteredApprovals.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400/80 mb-2" />
            <h3 className="text-base font-semibold text-foreground">Approval Queue Clear</h3>
            <p className="mt-1 text-xs text-muted-foreground">All submitted exceptions have been reviewed and resolved.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border/50 bg-muted/30">
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground px-6 py-3.5">Quote #</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground px-6 py-3.5">Customer</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground px-6 py-3.5">Requested By</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground px-6 py-3.5">Quote Amount</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground px-6 py-3.5">Risk & Score</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground px-6 py-3.5">Approval Stage</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground px-6 py-3.5 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-b border-border/40">
                      <TableCell className="px-6 py-4"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-36" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4"><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell className="px-6 py-4"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell className="px-6 py-4"><Skeleton className="h-6 w-32 rounded-full" /></TableCell>
                      <TableCell className="px-6 py-4 text-right"><Skeleton className="h-8 w-24 ml-auto rounded-md" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredApprovals.map((item, idx) => {
                  const q = item.quotation;
                  const qNum = (q as any)?.quotationNumber || (q as any)?.quotation_number || `QT-${item.quotationId.slice(0, 6)}`;
                  const custName = q?.customer?.name || (q as any)?.customer_name || 'Customer';
                  const custTier = q?.customer?.tier?.name || (q as any)?.customer?.tier || 'Standard';
                  const repName = q?.salesRep?.name || (q as any)?.salesRep?.email || 'Sales Rep';
                  const amount = Number((q as any)?.totalAmount || (q as any)?.grand_total || 0);

                  return (
                    <motion.tr
                      key={item.id}
                      custom={idx}
                      initial="hidden"
                      animate="visible"
                      variants={rowVariants}
                      className="border-b border-border/40 hover:bg-white/[0.02] transition-colors"
                    >
                      <TableCell className="px-6 py-4 font-mono font-bold text-foreground">
                        {qNum}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="font-medium text-foreground">{custName}</div>
                        <span className="inline-block text-[11px] font-medium text-muted-foreground mt-0.5">
                          {custTier} Tier
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-muted-foreground text-xs">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-muted-foreground/60" />
                          <span>{repName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 font-bold text-foreground text-sm">
                        ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {getRiskBadge(item.riskLevel, item.riskScore)}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary border border-primary/20">
                          Step {item.currentStep} of {item.totalSteps}: {item.requiredRole}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedApproval(item)}
                            className="h-8 px-3 text-xs font-semibold border-border/60 hover:bg-white/5"
                          >
                            Review
                          </Button>
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                await approvalsApi.approve(item.id, 'Approved via quick action');
                                toast.success('Quotation approved successfully!');
                                fetchPendingApprovals();
                              } catch (err: any) {
                                toast.fail(err.message || 'Approval failed');
                              }
                            }}
                            className="h-8 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
>>>>>>> Stashed changes
          </div>
        )}
      </Modal>

<<<<<<< Updated upstream
      {/* Action Modal */}
      <Modal isOpen={!!actionModal} onClose={() => { setActionModal(null); setNotes(''); }} title={`${actionModal === 'approve' ? 'Approve' : actionModal === 'reject' ? 'Reject' : 'Return'} Request`} size="sm">
        <div className="space-y-4">
          {actionModal === 'approve' && <p className="text-sm text-gray-500">Are you sure you want to approve this request?</p>}
          {actionModal !== 'approve' && <Input label="Notes (required)" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Enter reason..." />}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setActionModal(null); setNotes(''); }}>Cancel</Button>
            <Button loading={actionLoading} onClick={handleAction}>
              {actionModal === 'approve' ? 'Approve' : actionModal === 'reject' ? 'Reject' : 'Return'}
            </Button>
=======
      {/* Clean Minimal Detail Review Modal */}
      {selectedApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl border border-border/60 bg-card p-6 shadow-2xl space-y-6 my-8 text-foreground animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border/40 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">
                    Quotation Review: {(selectedApproval.quotation as any)?.quotationNumber || selectedApproval.quotationId.slice(0, 8)}
                  </h2>
                  {getRiskBadge(selectedApproval.riskLevel, selectedApproval.riskScore)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Customer: {selectedApproval.quotation?.customer?.name} • Stage {selectedApproval.currentStep} of {selectedApproval.totalSteps}
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedApproval(null);
                  setActionModal(null);
                }}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Financial Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/20 p-4 rounded-xl border border-border/40 text-center">
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground">Quote Total</span>
                <p className="text-base font-bold text-foreground mt-0.5">
                  ${Number((selectedApproval.quotation as any)?.totalAmount || (selectedApproval.quotation as any)?.grand_total || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground">Total Discount</span>
                <p className="text-base font-bold text-rose-400 mt-0.5">
                  -${Number((selectedApproval.quotation as any)?.discountAmount || (selectedApproval.quotation as any)?.discount_total || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground">Gross Margin</span>
                <p className="text-base font-bold text-emerald-400 mt-0.5">
                  {Number((selectedApproval.quotation as any)?.marginPercentage || 25).toFixed(1)}%
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground">Required Authority</span>
                <p className="text-sm font-bold text-primary mt-0.5">{selectedApproval.requiredRole}</p>
              </div>
            </div>

            {/* Line Items Breakdown */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Quotation Line Items</h3>
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <table className="w-full text-left text-xs text-foreground">
                  <thead className="bg-muted/30 font-semibold uppercase text-muted-foreground border-b border-border/50">
                    <tr>
                      <th className="px-4 py-2.5">Product</th>
                      <th className="px-3 py-2.5">Qty</th>
                      <th className="px-3 py-2.5">Unit Price</th>
                      <th className="px-3 py-2.5">Discount %</th>
                      <th className="px-4 py-2.5 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {((selectedApproval.quotation as any)?.lines || []).map((line: any, idx: number) => {
                      const prodName = line.product?.name || line.product_name || `Line #${idx + 1}`;
                      const unitPrice = Number(line.unitPrice || line.unit_price || 0);
                      const disc = Number(line.discountPercent || line.discount_percent || 0);
                      const total = Number(line.lineTotal || line.line_total || (unitPrice * line.quantity * (1 - disc / 100)));

                      return (
                        <tr key={idx} className="hover:bg-white/[0.02]">
                          <td className="px-4 py-2.5 font-medium text-foreground">{prodName}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{line.quantity}</td>
                          <td className="px-3 py-2.5">${unitPrice.toFixed(2)}</td>
                          <td className="px-3 py-2.5 font-semibold text-amber-400">{disc}%</td>
                          <td className="px-4 py-2.5 text-right font-bold text-foreground">${total.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Reason or Comments Box */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Governance Notes & Justification (Required for Reject / Return)
              </label>
              <textarea
                rows={3}
                placeholder="Enter review notes, approval stipulations, or revision requirements..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full rounded-lg border border-border/60 bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedApproval(null);
                  setActionModal(null);
                }}
              >
                Cancel
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={processing}
                  onClick={() => {
                    setActionModal('return');
                    handleAction();
                  }}
                  className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Return for Revision
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={processing}
                  onClick={() => {
                    setActionModal('reject');
                    handleAction();
                  }}
                  className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1.5" /> Reject
                </Button>

                <Button
                  size="sm"
                  disabled={processing}
                  onClick={() => {
                    setActionModal('approve');
                    handleAction();
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Confirm Approval
                </Button>
              </div>
            </div>
>>>>>>> Stashed changes
          </div>
        </div>
      </Modal>
    </div>
  );
}
