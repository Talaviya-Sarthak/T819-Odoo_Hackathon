import { useState, useEffect } from 'react';
import { getQuotations, checkDiscount } from '../../services/quotations.api';
import type { Quotation } from '../../types';
import Button from '../../components/Button';
import Card from '../../components/Card';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { useToast } from '../../components/Toast';

interface DiscountRule {
  id: string;
  name: string;
  tier: string;
  category: string;
  max_discount: number;
  approval_required: boolean;
}

const mockRules: DiscountRule[] = [
  { id: '1', name: 'Bronze Tier Cap', tier: 'BRONZE', category: 'All', max_discount: 5, approval_required: false },
  { id: '2', name: 'Silver Tier Cap', tier: 'SILVER', category: 'All', max_discount: 10, approval_required: false },
  { id: '3', name: 'Gold Tier Cap', tier: 'GOLD', category: 'All', max_discount: 15, approval_required: true },
  { id: '4', name: 'Platinum Tier Cap', tier: 'PLATINUM', category: 'All', max_discount: 25, approval_required: true },
  { id: '5', name: 'Bulk Order Discount', tier: 'ALL', category: 'Electronics', max_discount: 20, approval_required: true },
];

export default function DiscountRequests() {
  const { toast } = useToast();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getQuotations();
      setQuotations(res.quotations.filter((q) => q.discount_total > 0));
    } catch {
      toast('Failed to load quotations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCheckDiscount = async (q: Quotation) => {
    setChecking(q.id);
    try {
      const res = await checkDiscount(q.id, { customer_id: q.customer_id, total: q.grand_total });
      if (res.eligible) {
        toast(`Discount eligible. Max: ${res.max_discount}%`, 'success');
      } else {
        toast(`Discount not eligible: ${res.reason || 'Exceeds limit'}`, 'warning');
      }
    } catch {
      toast('Failed to check discount eligibility', 'error');
    } finally {
      setChecking(null);
    }
  };

  const discountColumns = [
    { key: 'quotation_number', label: 'Quote #', render: (r: Quotation) => r.quotation_number || r.id.slice(0, 8) },
    { key: 'customer_name', label: 'Customer', render: (r: Quotation) => r.customer_name || r.customer_id },
    {
      key: 'discount_total',
      label: 'Discount',
      render: (r: Quotation) => (
        <span className="text-red-600 font-medium">-{r.currency} {r.discount_total.toLocaleString()}</span>
      ),
    },
    { key: 'grand_total', label: 'Total', render: (r: Quotation) => `${r.currency} ${r.grand_total.toLocaleString()}` },
    {
      key: 'actions',
      label: 'Action',
      render: (r: Quotation) => (
        <Button
          variant="secondary"
          onClick={(e) => { e.stopPropagation(); handleCheckDiscount(r); }}
          loading={checking === r.id}
        >
          Check Eligibility
        </Button>
      ),
    },
  ];

  const ruleColumns = [
    { key: 'name', label: 'Rule Name' },
    { key: 'tier', label: 'Tier' },
    { key: 'category', label: 'Category' },
    { key: 'max_discount', label: 'Max Discount', render: (r: DiscountRule) => `${r.max_discount}%` },
    {
      key: 'approval_required',
      label: 'Approval Required',
      render: (r: DiscountRule) => (
        <StatusBadge status={r.approval_required ? 'PENDING' : 'APPROVED'} type="approval" />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Discount Requests</h1>
        <p className="text-sm text-gray-500">Review discount eligibility and approval rules</p>
      </div>

      <Card>
        <h3 className="mb-4 text-sm font-medium text-gray-900">Quotations with Discounts</h3>
        <DataTable
          columns={discountColumns}
          data={quotations as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyMessage="No quotations with discounts found"
        />
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-medium text-gray-900">Discount Rules</h3>
        <DataTable
          columns={ruleColumns}
          data={mockRules as unknown as Record<string, unknown>[]}
          emptyMessage="No discount rules configured"
        />
      </Card>
    </div>
  );
}
