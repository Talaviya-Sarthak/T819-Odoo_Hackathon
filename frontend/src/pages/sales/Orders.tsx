import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuotations } from '../../services/quotations.api';
import type { Quotation, QuotationStatus } from '../../types';
import Card from '../../components/Card';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Tabs from '../../components/Tabs';
import { useToast } from '../../components/Toast';

const statusTabs = [
  { key: 'ALL', label: 'All' },
  { key: 'ORDER_CONFIRMED', label: 'Confirmed' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'ACCEPTED', label: 'Accepted' },
];

const orderStatuses: QuotationStatus[] = ['ORDER_CONFIRMED', 'APPROVED', 'ACCEPTED'];

export default function Orders() {
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
      setQuotations(res.quotations.filter((q) => orderStatuses.includes(q.status)));
    } catch {
      toast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(activeTab === 'ALL' ? undefined : activeTab);
  }, [activeTab]);

  const columns = [
    { key: 'quotation_number', label: 'Order #', render: (r: Quotation) => r.quotation_number || r.id.slice(0, 8) },
    { key: 'customer_name', label: 'Customer', render: (r: Quotation) => r.customer_name || r.customer_id },
    {
      key: 'status',
      label: 'Status',
      render: (r: Quotation) => <StatusBadge status={r.status} type="quotation" />,
    },
    { key: 'grand_total', label: 'Total', render: (r: Quotation) => `${r.currency} ${r.grand_total.toLocaleString()}` },
    { key: 'created_at', label: 'Date', render: (r: Quotation) => new Date(r.created_at).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500">Confirmed and approved quotations</p>
      </div>

      <Card padding="p-0">
        <Tabs tabs={statusTabs} activeTab={activeTab} onChange={setActiveTab} />
      </Card>

      <DataTable
        columns={columns}
        data={quotations as unknown as Record<string, unknown>[]}
        loading={loading}
        emptyMessage="No orders found"
        onRowClick={(r) => navigate(`/sales/quotations/${(r as Quotation).id}`)}
      />
    </div>
  );
}
