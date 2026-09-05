import { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { getQuotations } from '../../services/quotations.api';
import type { Quotation, QuotationStatus } from '../../types';

const ORDER_STATUSES: QuotationStatus[] = ['ORDER_CONFIRMED', 'APPROVED', 'ACCEPTED'];

export default function CustomerOrders() {
  const [orders, setOrders] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      const all: Quotation[] = [];
      for (const status of ORDER_STATUSES) {
        const res = await getQuotations({ status, customer_id: user?.customer_id, limit: 100 });
        all.push(...res.quotations);
      }
      setOrders(all);
    } catch {
      toast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    { key: 'quotation_number', label: 'Order #', render: (row: Quotation) => row.id.slice(0, 8).toUpperCase() },
    { key: 'status', label: 'Status', render: (row: Quotation) => <StatusBadge status={row.status} type="quotation" /> },
    { key: 'grand_total', label: 'Total', render: (row: Quotation) => `${row.currency} ${row.grand_total.toLocaleString()}` },
    { key: 'created_at', label: 'Created', render: (row: Quotation) => new Date(row.created_at).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <p className="text-sm text-gray-500">Track your confirmed orders</p>
      </div>

      <DataTable
        columns={columns}
        data={orders as unknown as Record<string, unknown>[]}
        loading={loading}
        emptyMessage="No orders found"
      />
    </div>
  );
}
