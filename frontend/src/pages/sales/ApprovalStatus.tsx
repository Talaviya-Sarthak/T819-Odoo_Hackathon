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
    {
      key: 'quotation_number',
      label: 'Quotation #',
      render: (r: ApprovalRequest) => {
        const qNum = (r as any).quotation?.quotationNumber || (r as any).quotationNumber || r.quotation_number;
        const qId = (r as any).quotationId || r.quotation_id || r.id;
        return qNum || (qId ? String(qId).slice(0, 8) : 'Quotation');
      },
    },
    {
      key: 'requested_by_name',
      label: 'Requested By',
      render: (r: ApprovalRequest) => {
        return (r as any).quotation?.salesRep?.name || (r as any).user?.name || r.requested_by_name || r.requested_by || 'Sales Rep';
      },
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (r: ApprovalRequest) => <span className="truncate max-w-[200px] block">{r.reason || '-'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (r: ApprovalRequest) => <StatusBadge status={r.status} type="approval" />,
    },
    {
      key: 'discount_percent',
      label: 'Discount %',
      render: (r: ApprovalRequest) => {
        const disc = (r as any).discountPercent || r.discount_percent;
        return disc ? `${disc}%` : '-';
      },
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (r: ApprovalRequest) => {
        const dt = r.created_at || (r as any).createdAt;
        return dt ? new Date(dt).toLocaleDateString() : '-';
      },
    },
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
                <p className="font-medium text-gray-900">
                  {(selected as any).quotation?.quotationNumber || (selected as any).quotationNumber || selected.quotation_number || (selected as any).quotationId || selected.quotation_id || '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <StatusBadge status={selected.status} type="approval" />
              </div>
              <div>
                <p className="text-gray-500">Requested By</p>
                <p className="font-medium text-gray-900">
                  {(selected as any).quotation?.salesRep?.name || (selected as any).user?.name || selected.requested_by_name || selected.requested_by || 'Sales Rep'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Assigned To</p>
                <p className="font-medium text-gray-900">{(selected as any).approver?.name || selected.assigned_to_name || selected.assigned_to || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">Discount %</p>
                <p className="font-medium text-gray-900">
                  {(selected as any).discountPercent || selected.discount_percent ? `${(selected as any).discountPercent || selected.discount_percent}%` : '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Created</p>
                <p className="font-medium text-gray-900">
                  {selected.created_at || (selected as any).createdAt ? new Date(selected.created_at || (selected as any).createdAt).toLocaleString() : '-'}
                </p>
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
