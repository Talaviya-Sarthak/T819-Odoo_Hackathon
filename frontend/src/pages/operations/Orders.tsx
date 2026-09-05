import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Select from '../../components/Select';
import { useToast } from '../../components/Toast';
import { getQuotations } from '../../services/quotations.api';
import type { Quotation, QuotationStatus } from '../../types';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'ORDER_CONFIRMED', label: 'Order Confirmed' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'ACCEPTED', label: 'Accepted' },
];

const ORDER_STATUSES: QuotationStatus[] = ['ORDER_CONFIRMED', 'APPROVED', 'ACCEPTED'];

export default function Orders() {
  const [orders, setOrders] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      const all: Quotation[] = [];
      for (const status of ORDER_STATUSES) {
        const res = await getQuotations({ status, limit: 100 });
        all.push(...res.quotations);
      }
      setOrders(all);
    } catch {
      toast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  }

  const filtered = statusFilter
    ? orders.filter((o) => o.status === statusFilter)
    : orders;

  const columns = [
    { key: 'quotation_number', label: 'Quotation #', render: (row: Quotation) => row.id.slice(0, 8).toUpperCase() },
    { key: 'customer_name', label: 'Customer', render: (row: Quotation) => row.customer_name || row.customer_id },
    { key: 'status', label: 'Status', render: (row: Quotation) => <StatusBadge status={row.status} type="quotation" /> },
    { key: 'grand_total', label: 'Total', render: (row: Quotation) => `${row.currency} ${row.grand_total.toLocaleString()}` },
    { key: 'created_at', label: 'Created', render: (row: Quotation) => new Date(row.created_at).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500">Manage confirmed orders and track fulfillment</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-64">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={STATUS_OPTIONS}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered as unknown as Record<string, unknown>[]}
        loading={loading}
        emptyMessage="No confirmed orders found"
        onRowClick={(row) => navigate(`/operations/fulfillment?quotation=${(row as unknown as Quotation).id}`)}
      />
    </div>
  );
}
