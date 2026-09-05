import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuotation, createQuotation, updateQuotation, submitQuotation } from '../../services/quotations.api';
import { getCustomers } from '../../services/customers.api';
import { getProducts } from '../../services/products.api';
import type { Customer, Product, QuotationLine } from '../../types';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { useToast } from '../../components/Toast';

interface LineItem {
  product_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_percent: number;
}

const emptyLine: LineItem = { product_id: '', description: '', quantity: 1, unit_price: 0, discount_percent: 0, tax_percent: 0 };

export default function QuoteBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [lines, setLines] = useState<LineItem[]>([{ ...emptyLine }]);
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadRefs = async () => {
      try {
        const [custRes, prodRes] = await Promise.all([getCustomers(), getProducts()]);
        setCustomers(custRes.customers);
        setProducts(prodRes.products);
      } catch {
        toast('Failed to load data', 'error');
      }
    };
    loadRefs();
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getQuotation(id)
      .then((res) => {
        const q = res.quotation;
        setSelectedCustomer(q.customer_id);
        setLines(
          q.lines.map((l) => ({
            product_id: l.product_id,
            description: l.product_name || '',
            quantity: l.quantity,
            unit_price: l.unit_price,
            discount_percent: l.discount_percent,
            tax_percent: 0,
          }))
        );
        setNotes(q.notes || '');
        setValidUntil(q.valid_until || '');
      })
      .catch(() => toast('Failed to load quotation', 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  const addLine = () => setLines((prev) => [...prev, { ...emptyLine }]);
  const removeLine = (i: number) => setLines((prev) => prev.filter((_, idx) => idx !== i));
  const updateLine = (i: number, field: keyof LineItem, value: string | number) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));

  const selectProduct = (i: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setLines((prev) =>
        prev.map((l, idx) =>
          idx === i ? { ...l, product_id: productId, description: product.name, unit_price: product.base_price } : l
        )
      );
    }
  };

  const totals = useMemo(() => {
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    lines.forEach((l) => {
      const lineSubtotal = l.unit_price * l.quantity;
      const discount = (lineSubtotal * l.discount_percent) / 100;
      const afterDiscount = lineSubtotal - discount;
      const tax = (afterDiscount * l.tax_percent) / 100;
      subtotal += lineSubtotal;
      discountTotal += discount;
      taxTotal += tax;
    });

    const totalAmount = subtotal - discountTotal + taxTotal;
    const grossMargin = totalAmount > 0 ? ((totalAmount - discountTotal) / totalAmount) * 100 : 0;

    return { subtotal, discountTotal, taxTotal, totalAmount, grossMargin };
  }, [lines]);

  const handleSave = async (action: 'draft' | 'submit') => {
    if (!selectedCustomer) {
      toast('Please select a customer', 'warning');
      return;
    }
    if (lines.length === 0 || lines.every((l) => !l.product_id)) {
      toast('Add at least one line item', 'warning');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        customer_id: selectedCustomer,
        lines: lines
          .filter((l) => l.product_id)
          .map((l) => ({
            product_id: l.product_id,
            quantity: l.quantity,
            unit_price: l.unit_price,
            discount_percent: l.discount_percent,
            notes: l.description,
          })),
        notes,
        valid_until: validUntil || undefined,
      };

      let res;
      if (isEdit && id) {
        res = await updateQuotation(id, payload);
        if (action === 'submit') {
          await submitQuotation(id);
        }
      } else {
        res = await createQuotation(payload);
        if (action === 'submit') {
          await submitQuotation(res.quotation.id);
        }
      }
      toast(action === 'draft' ? 'Quotation saved' : 'Quotation submitted', 'success');
      navigate('/sales/quotations');
    } catch {
      toast('Failed to save quotation', 'error');
    } finally {
      setSaving(false);
    }
  };

  const customerOptions = customers.map((c) => ({ value: c.id, label: c.name }));
  const productOptions = products.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-gray-500">Loading quotation...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Quotation' : 'New Quotation'}</h1>
          <p className="text-sm text-gray-500">{isEdit ? 'Update quotation details' : 'Create a new sales quotation'}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate('/sales/quotations')}>Cancel</Button>
          <Button variant="secondary" onClick={() => handleSave('draft')} loading={saving}>Save Draft</Button>
          <Button onClick={() => handleSave('submit')} loading={saving}>Submit for Approval</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="mb-4 text-sm font-medium text-gray-900">Customer</h3>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Select Customer"
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                options={customerOptions}
                placeholder="Choose a customer"
              />
              <Input
                label="Valid Until"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900">Line Items</h3>
              <Button variant="secondary" onClick={addLine}>+ Add Line</Button>
            </div>

            <div className="space-y-4">
              {lines.map((line, i) => (
                <div key={i} className="rounded-lg border border-gray-200 p-4">
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-4">
                      <Select
                        value={line.product_id}
                        onChange={(e) => selectProduct(i, e.target.value)}
                        options={productOptions}
                        placeholder="Select product"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={String(line.quantity)}
                        onChange={(e) => updateLine(i, 'quantity', Number(e.target.value))}
                        placeholder="Qty"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={String(line.unit_price)}
                        onChange={(e) => updateLine(i, 'unit_price', Number(e.target.value))}
                        placeholder="Unit Price"
                      />
                    </div>
                    <div className="col-span-1">
                      <Input
                        type="number"
                        value={String(line.discount_percent)}
                        onChange={(e) => updateLine(i, 'discount_percent', Number(e.target.value))}
                        placeholder="Disc %"
                      />
                    </div>
                    <div className="col-span-1">
                      <Input
                        type="number"
                        value={String(line.tax_percent)}
                        onChange={(e) => updateLine(i, 'tax_percent', Number(e.target.value))}
                        placeholder="Tax %"
                      />
                    </div>
                    <div className="col-span-1 flex items-end text-sm text-gray-900 font-medium">
                      {(line.unit_price * line.quantity * (1 - line.discount_percent / 100) * (1 + line.tax_percent / 100)).toFixed(2)}
                    </div>
                    <div className="col-span-1 flex items-end">
                      {lines.length > 1 && (
                        <button
                          onClick={() => removeLine(i)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium text-gray-900">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                placeholder="Additional notes..."
              />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="mb-4 text-sm font-medium text-gray-900">Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900 font-medium">{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Discount</span>
                <span className="text-red-600 font-medium">-{totals.discountTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax</span>
                <span className="text-gray-900 font-medium">{totals.taxTotal.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="text-gray-900 font-semibold">Total</span>
                <span className="text-gray-900 font-semibold">{totals.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Gross Margin</span>
                <span className="text-green-600 font-medium">{totals.grossMargin.toFixed(1)}%</span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="mb-2 text-sm font-medium text-gray-900">Line Items: {lines.length}</h3>
            <p className="text-xs text-gray-500">Products selected: {lines.filter((l) => l.product_id).length}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
