import { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { useToast } from '../../components/Toast';
import { getBilling, createInvoice } from '../../services/billing.api';
import { getQuotations } from '../../services/quotations.api';
import type { Invoice, Quotation } from '../../types';

interface InvoiceRow extends Record<string, unknown> {
  id: string;
  invoiceNumber: string;
  customer: string;
  total: number;
  status: string;
  dueDate: string;
  paidAt: string;
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [quotationId, setQuotationId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    try {
      setLoading(true);
      const quotRes = await getQuotations({ limit: 100 });
      const allInvoices: InvoiceRow[] = [];

      for (const q of quotRes.quotations) {
        try {
          const billing = await getBilling(q.id);
          for (const inv of billing.invoices) {
            allInvoices.push({
              id: inv.id,
              invoiceNumber: inv.invoice_number,
              customer: inv.customer_name || q.customer_name || q.customer_id,
              total: inv.total,
              status: inv.status,
              dueDate: inv.due_date || '—',
              paidAt: inv.paid_at || '—',
            });
          }
        } catch {
          // skip quotations without billing
        }
      }
      setInvoices(allInvoices);
    } catch {
      toast('Failed to load invoices', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateInvoice() {
    if (!customerId) return;
    try {
      setSubmitting(true);
      await createInvoice({
        customer_id: customerId,
        quotation_id: quotationId || undefined,
        due_date: dueDate || undefined,
      });
      toast('Invoice created successfully', 'success');
      setModalOpen(false);
      setCustomerId('');
      setQuotationId('');
      setDueDate('');
      loadInvoices();
    } catch {
      toast('Failed to create invoice', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = statusFilter
    ? invoices.filter((i) => i.status === statusFilter)
    : invoices;

  const columns = [
    { key: 'invoiceNumber', label: 'Invoice #' },
    { key: 'customer', label: 'Customer' },
    { key: 'total', label: 'Total', render: (row: InvoiceRow) => `$${row.total.toLocaleString()}` },
    { key: 'status', label: 'Status', render: (row: InvoiceRow) => <StatusBadge status={row.status} type="payment" /> },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'paidAt', label: 'Paid At' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500">Manage invoices and track payments</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Create Invoice</Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-64">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'DRAFT', label: 'Draft' },
              { value: 'SENT', label: 'Sent' },
              { value: 'PAID', label: 'Paid' },
              { value: 'OVERDUE', label: 'Overdue' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyMessage="No invoices found"
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Invoice">
        <div className="space-y-4">
          <Input label="Customer ID" value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="Enter customer ID" required />
          <Input label="Quotation ID (optional)" value={quotationId} onChange={(e) => setQuotationId(e.target.value)} placeholder="Enter quotation ID" />
          <Input label="Due Date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateInvoice} loading={submitting}>Create Invoice</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
