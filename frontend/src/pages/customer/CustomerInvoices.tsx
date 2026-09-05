import { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { getBilling } from '../../services/billing.api';
import { getQuotations } from '../../services/quotations.api';
import type { Invoice } from '../../types';

interface InvoiceRow extends Record<string, unknown> {
  id: string;
  invoiceNumber: string;
  type: string;
  total: number;
  status: string;
  dueDate: string;
  paidAt: string;
}

export default function CustomerInvoices() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    try {
      setLoading(true);
      const quotRes = await getQuotations({ customer_id: user?.customer_id, limit: 100 });
      const allInvoices: InvoiceRow[] = [];

      for (const q of quotRes.quotations) {
        try {
          const billing = await getBilling(q.id);
          for (const inv of billing.invoices) {
            allInvoices.push({
              id: inv.id,
              invoiceNumber: inv.invoice_number,
              type: inv.subscription_id ? 'Subscription' : 'One-time',
              total: inv.total,
              status: inv.status,
              dueDate: inv.due_date || '—',
              paidAt: inv.paid_at || '—',
            });
          }
        } catch {
          // skip
        }
      }
      setInvoices(allInvoices);
    } catch {
      toast('Failed to load invoices', 'error');
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    { key: 'invoiceNumber', label: 'Invoice #' },
    { key: 'type', label: 'Type' },
    { key: 'total', label: 'Total', render: (row: InvoiceRow) => `$${row.total.toLocaleString()}` },
    { key: 'status', label: 'Status', render: (row: InvoiceRow) => <StatusBadge status={row.status} type="payment" /> },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'paidAt', label: 'Paid At' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Invoices</h1>
        <p className="text-sm text-gray-500">View and manage your invoices</p>
      </div>

      <DataTable
        columns={columns}
        data={invoices}
        loading={loading}
        emptyMessage="No invoices found"
      />
    </div>
  );
}
