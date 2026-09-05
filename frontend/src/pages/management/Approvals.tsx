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

export default function Approvals() {
  const { toast } = useToast();
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<ApprovalRequest | null>(null);
  const [actionModal, setActionModal] = useState<'approve' | 'reject' | 'return' | null>(null);
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const status = filter === 'all' ? undefined : filter;
      const res = await getApprovals(status as any);
      setApprovals(res.approvals);
    } catch {
      toast('Failed to load approvals', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => { fetchApprovals(); }, [fetchApprovals]);

  const handleAction = async () => {
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
      }
      setActionModal(null);
      setSelected(null);
      setNotes('');
      fetchApprovals();
    } catch {
      toast('Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

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
          </div>
        )}
      </Modal>

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
          </div>
        </div>
      </Modal>
    </div>
  );
}
