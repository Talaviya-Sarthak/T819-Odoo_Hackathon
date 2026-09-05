import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { getQuotations } from '../../services/quotations.api';
import type { Quotation } from '../../types';

export default function CustomerQuotations() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadQuotations();
  }, []);

  async function loadQuotations() {
    try {
      setLoading(true);
      const res = await getQuotations({ customer_id: user?.customer_id, limit: 100 });
      setQuotations(res.quotations);
    } catch {
      toast('Failed to load quotations', 'error');
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    { key: 'quotation_number', label: 'Quotation #', render: (row: Quotation) => row.id.slice(0, 8).toUpperCase() },
    { key: 'status', label: 'Status', render: (row: Quotation) => <StatusBadge status={row.status} type="quotation" /> },
    { key: 'grand_total', label: 'Total', render: (row: Quotation) => `${row.currency} ${row.grand_total.toLocaleString()}` },
    { key: 'currency', label: 'Currency' },
    { key: 'created_at', label: 'Created', render: (row: Quotation) => new Date(row.created_at).toLocaleDateString() },
    { key: 'valid_until', label: 'Valid Until', render: (row: Quotation) => row.valid_until ? new Date(row.valid_until).toLocaleDateString() : '—' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Quotations</h1>
        <p className="text-sm text-gray-500">View your quotations and their status</p>
      </div>

      <DataTable
        columns={columns}
        data={quotations as unknown as Record<string, unknown>[]}
        loading={loading}
        emptyMessage="No quotations found"
        onRowClick={(row) => navigate(`/customer/negotiation?quotation=${(row as unknown as Quotation).id}`)}
      />
    </div>
  );
}
