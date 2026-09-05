import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuotations } from '../../services/quotations.api';
import type { Quotation, QuotationStatus } from '../../types';
import Button from '../../components/Button';
import Card from '../../components/Card';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Tabs from '../../components/Tabs';
import { useToast } from '../../components/Toast';

const statusTabs = [
  { key: 'ALL', label: 'All' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'SENT', label: 'Sent' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'EXPIRED', label: 'Expired' },
];

export default function Quotations() {
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
      setQuotations(res.quotations);
    } catch {
      toast('Failed to load quotations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(activeTab === 'ALL' ? undefined : activeTab);
  }, [activeTab]);

  const columns = [
    { key: 'quotation_number', label: 'Quote #', render: (r: Quotation) => r.quotation_number || r.id.slice(0, 8) },
    { key: 'customer_name', label: 'Customer', render: (r: Quotation) => r.customer_name || r.customer_id },
    {
      key: 'status',
      label: 'Status',
      render: (r: Quotation) => <StatusBadge status={r.status} type="quotation" />,
    },
    { key: 'grand_total', label: 'Total', render: (r: Quotation) => `${r.currency} ${r.grand_total.toLocaleString()}` },
    { key: 'currency', label: 'Currency' },
    { key: 'created_at', label: 'Created', render: (r: Quotation) => new Date(r.created_at).toLocaleDateString() },
    { key: 'valid_until', label: 'Valid Until', render: (r: Quotation) => r.valid_until ? new Date(r.valid_until).toLocaleDateString() : '-' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
          <p className="text-sm text-gray-500">Manage your sales quotations</p>
        </div>
        <Button onClick={() => navigate('/sales/quotations/new')}>New Quotation</Button>
      </div>

      <Card padding="p-0">
        <Tabs tabs={statusTabs} activeTab={activeTab} onChange={setActiveTab} />
      </Card>

      <DataTable
        columns={columns}
        data={quotations as unknown as Record<string, unknown>[]}
        loading={loading}
        emptyMessage="No quotations found"
        onRowClick={(r) => navigate(`/sales/quotations/${(r as Quotation).id}`)}
      />
    </div>
  );
}
