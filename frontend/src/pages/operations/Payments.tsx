import { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { useToast } from '../../components/Toast';
import { getBilling, createPayment } from '../../services/billing.api';
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

export default function Payments() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPayments();
  }, []);

  async function loadPayments() {
    try {
      setLoading(true);
      const quotRes = await getQuotations({ limit: 100 });
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

  async function handleRecordPayment() {
    if (!invoiceId || !amount) return;
    try {
      setSubmitting(true);
      await createPayment({
        invoice_id: invoiceId,
        amount: Number(amount),
        method,
        reference: reference || undefined,
      });
      toast('Payment recorded successfully', 'success');
      setModalOpen(false);
      setInvoiceId('');
      setAmount('');
      setReference('');
      loadPayments();
    } catch {
      toast('Failed to record payment', 'error');
    } finally {
      setSubmitting(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500">Track and record payments</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Record Payment</Button>
      </div>

      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        emptyMessage="No payments found"
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Record Payment">
        <div className="space-y-4">
          <Input label="Invoice ID" value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} placeholder="Enter invoice ID" required />
          <Input label="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" required />
          <Select
            label="Payment Method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            options={[
              { value: 'bank_transfer', label: 'Bank Transfer' },
              { value: 'credit_card', label: 'Credit Card' },
              { value: 'cash', label: 'Cash' },
              { value: 'check', label: 'Check' },
              { value: 'other', label: 'Other' },
            ]}
          />
          <Input label="Reference (optional)" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Payment reference" />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleRecordPayment} loading={submitting}>Record Payment</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
