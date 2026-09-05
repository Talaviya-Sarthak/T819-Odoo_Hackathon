import { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { getBilling } from '../../services/billing.api';
import { getQuotations } from '../../services/quotations.api';
import type { Payment } from '../../types';

interface PaymentRow extends Record<string, unknown> {
  id: string;
  invoiceNumber: string;
  amount: number;
  method: string;
  status: string;
  paidAt: string;
}

export default function CustomerPayments() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadPayments();
  }, []);

  async function loadPayments() {
    try {
      setLoading(true);
      const quotRes = await getQuotations({ customer_id: user?.customer_id, limit: 100 });
      const allPayments: PaymentRow[] = [];

      for (const q of quotRes.quotations) {
        try {
          const billing = await getBilling(q.id);
          for (const p of billing.payments) {
            allPayments.push({
              id: p.id,
              invoiceNumber: p.invoice_number || '—',
              amount: p.amount,
              method: p.method,
              status: p.status,
              paidAt: p.paid_at || '—',
            });
          }
        } catch {
          // skip
        }
      }
      setPayments(allPayments);
    } catch {
      toast('Failed to load payments', 'error');
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    { key: 'invoiceNumber', label: 'Invoice #' },
    { key: 'amount', label: 'Amount', render: (row: PaymentRow) => `$${row.amount.toLocaleString()}` },
    { key: 'method', label: 'Method', render: (row: PaymentRow) => row.method.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) },
    { key: 'status', label: 'Status', render: (row: PaymentRow) => <StatusBadge status={row.status} type="payment" /> },
    { key: 'paidAt', label: 'Paid At' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
        <p className="text-sm text-gray-500">View your payment history</p>
      </div>

      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        emptyMessage="No payments found"
      />
    </div>
  );
}
