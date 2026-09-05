import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Select from '../../components/Select';
import Input from '../../components/Input';
import { useToast } from '../../components/Toast';
import { getFulfillment, allocateStock, overrideStock } from '../../services/fulfillment.api';
import { getQuotations } from '../../services/quotations.api';
import type { Quotation, FulfillmentOrder } from '../../types';

interface FulfillmentRow extends Record<string, unknown> {
  quotationId: string;
  quotationNumber: string;
  warehouse: string;
  status: string;
  shippingCost: string;
  expectedDelivery: string;
}

export default function Fulfillment() {
  const [rows, setRows] = useState<FulfillmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [allocateModalOpen, setAllocateModalOpen] = useState(false);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<string>('');
  const [warehouseId, setWarehouseId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFulfillments();
  }, []);

  async function loadFulfillments() {
    try {
      setLoading(true);
      const quotRes = await getQuotations({ status: 'ORDER_CONFIRMED', limit: 100 });
      const results: FulfillmentRow[] = [];

      for (const q of quotRes.quotations) {
        try {
          const fRes = await getFulfillment(q.id);
          const f = fRes.fulfillment;
          const mainWarehouse = f.lines?.[0]?.warehouse_name || 'Unassigned';
          results.push({
            quotationId: q.id,
            quotationNumber: q.id.slice(0, 8).toUpperCase(),
            warehouse: mainWarehouse,
            status: f.status,
            shippingCost: `${q.currency} 0.00`,
            expectedDelivery: '—',
          });
        } catch {
          results.push({
            quotationId: q.id,
            quotationNumber: q.id.slice(0, 8).toUpperCase(),
            warehouse: 'Not allocated',
            status: 'PENDING',
            shippingCost: '—',
            expectedDelivery: '—',
          });
        }
      }
      setRows(results);
    } catch {
      toast('Failed to load fulfillment data', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleAllocate() {
    if (!selectedQuotation || !warehouseId) return;
    try {
      setSubmitting(true);
      await allocateStock(selectedQuotation, {
        lines: [{ quotation_line_id: 'default', quantity: Number(quantity), warehouse_id: warehouseId }],
      });
      toast('Stock allocated successfully', 'success');
      setAllocateModalOpen(false);
      loadFulfillments();
    } catch {
      toast('Failed to allocate stock', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOverride() {
    if (!selectedQuotation || !warehouseId || !reason) return;
    try {
      setSubmitting(true);
      await overrideStock(selectedQuotation, {
        lines: [{ quotation_line_id: 'default', quantity: Number(quantity), warehouse_id: warehouseId }],
        reason,
      });
      toast('Stock override applied', 'success');
      setOverrideModalOpen(false);
      setReason('');
      loadFulfillments();
    } catch {
      toast('Failed to override stock', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  function openAllocate(quotationId: string) {
    setSelectedQuotation(quotationId);
    setWarehouseId('');
    setQuantity('1');
    setAllocateModalOpen(true);
  }

  function openOverride(quotationId: string) {
    setSelectedQuotation(quotationId);
    setWarehouseId('');
    setQuantity('1');
    setReason('');
    setOverrideModalOpen(true);
  }

  const columns = [
    { key: 'quotationNumber', label: 'Quotation #' },
    { key: 'warehouse', label: 'Warehouse' },
    { key: 'status', label: 'Status', render: (row: FulfillmentRow) => <StatusBadge status={row.status as string} type="fulfillment" /> },
    { key: 'shippingCost', label: 'Shipping Cost' },
    { key: 'expectedDelivery', label: 'Expected Delivery' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: FulfillmentRow) => (
        <div className="flex gap-2">
          {(row.status === 'PENDING' || row.status === 'Not allocated') && (
            <Button variant="secondary" onClick={(e) => { e.stopPropagation(); openAllocate(row.quotationId); }}>
              Allocate Stock
            </Button>
          )}
          <Button variant="secondary" onClick={(e) => { e.stopPropagation(); openOverride(row.quotationId); }}>
            Override
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fulfillment Tracking</h1>
        <p className="text-sm text-gray-500">Track and manage order fulfillment</p>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        emptyMessage="No fulfillment orders found"
      />

      <Modal isOpen={allocateModalOpen} onClose={() => setAllocateModalOpen(false)} title="Allocate Stock">
        <div className="space-y-4">
          <Input label="Warehouse ID" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} placeholder="Enter warehouse ID" />
          <Input label="Quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setAllocateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAllocate} loading={submitting}>Allocate</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={overrideModalOpen} onClose={() => setOverrideModalOpen(false)} title="Override Stock Allocation">
        <div className="space-y-4">
          <Input label="Warehouse ID" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} placeholder="Enter warehouse ID" />
          <Input label="Quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          <Input label="Override Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for override" />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOverrideModalOpen(false)}>Cancel</Button>
            <Button onClick={handleOverride} loading={submitting}>Confirm Override</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
