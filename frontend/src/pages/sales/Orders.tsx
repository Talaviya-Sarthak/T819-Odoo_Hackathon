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
      const list = Array.isArray(res) ? res : res?.quotations || [];
      setQuotations(list.filter((q) => orderStatuses.includes(q.status)));
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
    {
      key: 'quotation_number',
      label: 'Order #',
      render: (r: Quotation) => (r as any).quotationNumber || r.quotation_number || (r.id ? r.id.slice(0, 8) : 'Order'),
    },
    {
      key: 'customer_name',
      label: 'Customer',
      render: (r: Quotation) => (r as any).customer?.name || (r as any).customer?.company || r.customer_name || r.customer_id || '-',
    },
    {
      key: 'status',
      label: 'Status',
      render: (r: Quotation) => <StatusBadge status={r.status} type="quotation" />,
    },
    {
      key: 'grand_total',
      label: 'Total',
      render: (r: Quotation) => {
        const curr = r.currency || (r as any).customer?.currency || 'USD';
        const total = Number(r.grand_total || (r as any).totalAmount || 0);
        return `${curr} ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      },
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (r: Quotation) => {
        const dt = r.created_at || (r as any).createdAt;
        return dt ? new Date(dt).toLocaleDateString() : '-';
      },
    },
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
        onRowClick={(r) => navigate(`/sales/quote-builder/${(r as Quotation).id}`)}
      />
    </div>
  );
}
