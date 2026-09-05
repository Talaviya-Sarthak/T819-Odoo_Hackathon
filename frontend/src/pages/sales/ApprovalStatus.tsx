import { useState, useEffect } from 'react';
import { getApprovals, getApproval } from '../../services/approvals.api';
import type { ApprovalRequest, ApprovalStatus as ApprovalStatusType } from '../../types';
import Card from '../../components/Card';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import Tabs from '../../components/Tabs';
import { useToast } from '../../components/Toast';

const statusTabs = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'RETURNED', label: 'Returned' },
];

export default function ApprovalStatusPage() {
  const { toast } = useToast();
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [selected, setSelected] = useState<ApprovalRequest | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async (status?: string) => {
    setLoading(true);
    try {
      const res = await getApprovals(status === 'ALL' ? undefined : (status as ApprovalStatusType));
      setApprovals(res.approvals);
    } catch {
      toast('Failed to load approvals', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(activeTab);
  }, [activeTab]);

  const openDetail = async (row: ApprovalRequest) => {
    setDetailLoading(true);
    setSelected(row);
    try {
      const res = await getApproval(row.id);
      setSelected(res.approval);
    } catch {
      toast('Failed to load details', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    { key: 'quotation_number', label: 'Quotation #', render: (r: ApprovalRequest) => r.quotation_number || r.quotation_id.slice(0, 8) },
    { key: 'requested_by_name', label: 'Requested By', render: (r: ApprovalRequest) => r.requested_by_name || r.requested_by },
    { key: 'reason', label: 'Reason', render: (r: ApprovalRequest) => <span className="truncate max-w-[200px] block">{r.reason}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (r: ApprovalRequest) => <StatusBadge status={r.status} type="approval" />,
    },
    { key: 'discount_percent', label: 'Discount %', render: (r: ApprovalRequest) => r.discount_percent ? `${r.discount_percent}%` : '-' },
    { key: 'created_at', label: 'Created', render: (r: ApprovalRequest) => new Date(r.created_at).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Approval Status</h1>
        <p className="text-sm text-gray-500">Track quotation approval requests</p>
      </div>

      <Card padding="p-0">
        <Tabs tabs={statusTabs} activeTab={activeTab} onChange={setActiveTab} />
      </Card>

      <DataTable
        columns={columns}
        data={approvals as unknown as Record<string, unknown>[]}
        loading={loading}
        emptyMessage="No approval requests found"
        onRowClick={(r) => openDetail(r as unknown as ApprovalRequest)}
      />

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Approval Details" size="lg">
        {detailLoading ? (
          <p className="text-sm text-gray-500">Loading details...</p>
        ) : selected ? (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500">Quotation</p>
                <p className="font-medium text-gray-900">{selected.quotation_number || selected.quotation_id}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <StatusBadge status={selected.status} type="approval" />
              </div>
              <div>
                <p className="text-gray-500">Requested By</p>
                <p className="font-medium text-gray-900">{selected.requested_by_name || selected.requested_by}</p>
              </div>
              <div>
                <p className="text-gray-500">Assigned To</p>
                <p className="font-medium text-gray-900">{selected.assigned_to_name || selected.assigned_to || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">Discount %</p>
                <p className="font-medium text-gray-900">{selected.discount_percent ? `${selected.discount_percent}%` : '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">Created</p>
                <p className="font-medium text-gray-900">{new Date(selected.created_at).toLocaleString()}</p>
              </div>
            </div>
            <div>
              <p className="text-gray-500">Reason</p>
              <p className="mt-1 text-gray-900">{selected.reason}</p>
            </div>
            {selected.manager_notes && (
              <div>
                <p className="text-gray-500">Manager Notes</p>
                <p className="mt-1 text-gray-900">{selected.manager_notes}</p>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
