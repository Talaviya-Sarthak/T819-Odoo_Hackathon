import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
<<<<<<< Updated upstream
import { getQuotation, createQuotation, updateQuotation, submitQuotation } from '../../services/quotations.api';
import { getCustomers } from '../../services/customers.api';
import { getProducts } from '../../services/products.api';
import type { Customer, Product, QuotationLine } from '../../types';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { useToast } from '../../components/Toast';
=======
import { 
  quotationsApi, 
  customersApi, 
  productsApi, 
  recommendationsApi, 
  type DiscountCheckResult, 
  type RecommendationItem 
} from '../../api';
import type { Customer, Product, Quotation } from '../../types';
import { useToast } from '../../components/Toast';
import { Skeleton } from '../../components/ui/skeleton';
import { 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles, 
  ArrowLeft, 
  RefreshCw,
  TrendingUp,
  DollarSign
} from 'lucide-react';
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
  const isEdit = Boolean(id);
=======
>>>>>>> Stashed changes

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [lines, setLines] = useState<LineItem[]>([{ ...emptyLine }]);
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
<<<<<<< Updated upstream
=======
  const [checkingGovernance, setCheckingGovernance] = useState(false);
  const [governanceResult, setGovernanceResult] = useState<DiscountCheckResult | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [addingRecId, setAddingRecId] = useState<string | null>(null);
>>>>>>> Stashed changes

  useEffect(() => {
    const loadRefs = async () => {
      try {
<<<<<<< Updated upstream
        const [custRes, prodRes] = await Promise.all([getCustomers(), getProducts()]);
        setCustomers(custRes.customers);
        setProducts(prodRes.products);
      } catch {
        toast('Failed to load data', 'error');
=======
        const [custList, prodList] = await Promise.all([
          customersApi.getAll(),
          productsApi.getAll(),
        ]);
        const finalCust = Array.isArray(custList) ? custList : (custList as any)?.customers || [];
        const finalProd = Array.isArray(prodList) ? prodList : (prodList as any)?.products || [];
        setCustomers(finalCust);
        setProducts(finalProd);
      } catch (err: any) {
        console.error('Failed to load references:', err);
        toast.fail(err.message || 'Failed to load catalog data');
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
        setValidUntil(q.valid_until || '');
      })
      .catch(() => toast('Failed to load quotation', 'error'))
      .finally(() => setLoading(false));
=======
        if (q.valid_until || (q as any).validUntil) {
          const dateStr = new Date(q.valid_until || (q as any).validUntil).toISOString().split('T')[0] || '';
          setValidUntil(dateStr);
        }

        if (q.lines && q.lines.length > 0) {
          setLines(
            q.lines.map((l: any) => ({
              id: l.id,
              productId: l.product_id || l.productId,
              quantity: l.quantity,
              unitPrice: Number(l.unit_price || l.unitPrice || 0),
              unitCost: Number(l.unit_cost || l.unitCost || 0),
              discountPercent: Number(l.discount_percent || l.discountPercent || 0),
              taxRate: Number(l.tax_rate || l.taxRate || 0),
              billingType: l.billing_type || l.billingType || 'ONE_TIME',
            }))
          );
        }

        loadRecommendations(id!);
      } catch (err: any) {
        toast.fail(err.message || 'Failed to load quotation');
      } finally {
        setLoading(false);
      }
    }
    loadQuote();
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
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
=======
    setLines(lines.filter((_, i) => i !== index));
  };

  // Authoritative calculations
  const localCalculations = lines.reduce(
    (acc, l) => {
      const lineSub = l.quantity * l.unitPrice;
      const lineDisc = lineSub * (l.discountPercent / 100);
      const discountedSub = lineSub - lineDisc;
      const lineTax = discountedSub * (l.taxRate / 100);
      const lineTotal = discountedSub + lineTax;
      const lineCost = l.quantity * (l.unitCost || 0);
      const lineMargin = discountedSub - lineCost;

      return {
        subtotal: acc.subtotal + lineSub,
        discount: acc.discount + lineDisc,
        tax: acc.tax + lineTax,
        total: acc.total + lineTotal,
        cost: acc.cost + lineCost,
        margin: acc.margin + lineMargin,
>>>>>>> Stashed changes
      };

<<<<<<< Updated upstream
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
=======
  const displayMarginPercent = localCalculations.subtotal - localCalculations.discount > 0
    ? ((localCalculations.margin / (localCalculations.subtotal - localCalculations.discount)) * 100).toFixed(1)
    : '0.0';

  // Save Quotation Draft
  const handleSave = async (): Promise<string | null> => {
    if (!selectedCustomerId) {
      toast.warning('Please select a customer first.', 'Validation');
      return null;
    }

    const validLines = lines.filter((l) => l.productId);
    if (validLines.length === 0) {
      toast.warning('Please add at least one product line item.', 'Validation');
      return null;
    }

    setSaving(true);
    try {
      let savedQuote: Quotation;

      if (id) {
        savedQuote = await quotationsApi.update(id, {
          lines: validLines,
          notes,
          validUntil,
        });
        toast.success('Quotation draft updated successfully.');
      } else {
        savedQuote = await quotationsApi.create({
          customerId: selectedCustomerId,
          lines: validLines,
          notes,
          validUntil,
        });
        toast.success('Quotation draft created successfully.');
        navigate(`/sales/quote-builder/${savedQuote.id}`, { replace: true });
      }

      setQuotation(savedQuote);
      loadRecommendations(savedQuote.id);
      return savedQuote.id;
    } catch (err: any) {
      toast.fail(err.message || 'Failed to save quotation.');
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Run Discount Governance & Risk Check
  const handleCheckDiscount = async () => {
    let quoteId: string | undefined = id;
    if (!quoteId) {
      const savedId = await handleSave();
      if (!savedId) return;
      quoteId = savedId;
    } else {
      await handleSave();
    }

    setCheckingGovernance(true);
    try {
      const result = await quotationsApi.checkDiscount(quoteId);
      setGovernanceResult(result);
      if (result.requiresApproval) {
        toast.warning(
          `Discount of ${result.requestedDiscount}% requires ${result.approvalRoles.join(' & ')} approval.`,
          'Approval Required'
        );
      } else {
        toast.success(`Discount of ${result.requestedDiscount}% conforms to policy.`, 'Discount Approved');
      }
    } catch (err: any) {
      toast.fail(err.message || 'Governance check failed.', 'Check Failed');
    } finally {
      setCheckingGovernance(false);
    }
  };

  // Submit Quotation for Approval
  const handleSubmit = async () => {
    let quoteId: string | undefined = id;
    if (!quoteId) {
      const savedId = await handleSave();
      if (!savedId) return;
      quoteId = savedId;
    } else {
      await handleSave();
    }

    setSaving(true);
    try {
      const { quotation: submittedQuote, governance } = await quotationsApi.submit(quoteId);
      setQuotation(submittedQuote);
      setGovernanceResult(governance);
      if (submittedQuote.status === 'APPROVED') {
        toast.success('Quotation automatically approved!', 'Approval Success');
      } else {
        toast.warning('Quotation submitted. Pending approval review.', 'Approval Pending');
      }
    } catch (err: any) {
      toast.fail(err.message || 'Submission failed.', 'Submission Failed');
    } finally {
      setSaving(false);
    }
  };

  // 1-Click Add Recommendation to Quote
  const handleAddRecommendation = async (rec: RecommendationItem) => {
    setAddingRecId(rec.id);
    try {
      await recommendationsApi.add(rec.id);
      if (id) {
        const updated = await quotationsApi.getById(id);
        setQuotation(updated);
        if (updated.lines) {
          setLines(
            updated.lines.map((l: any) => ({
              id: l.id,
              productId: l.product_id || l.productId,
              quantity: l.quantity,
              unitPrice: Number(l.unit_price || l.unitPrice || 0),
              unitCost: Number(l.unit_cost || l.unitCost || 0),
              discountPercent: Number(l.discount_percent || l.discountPercent || 0),
              taxRate: Number(l.tax_rate || l.taxRate || 0),
              billingType: l.billing_type || l.billingType || 'ONE_TIME',
            }))
          );
        }
        loadRecommendations(id);
        toast.success(`Added ${rec.product.name} to quotation.`);
      }
    } catch (err: any) {
      toast.fail(err.message || 'Failed to add recommendation.');
>>>>>>> Stashed changes
    } finally {
      setSaving(false);
    }
  };

  const customerOptions = customers.map((c) => ({ value: c.id, label: c.name }));
  const productOptions = products.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }));

<<<<<<< Updated upstream
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
=======
  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/sales/quotations')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 bg-card text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {id ? `Quotation: ${(quotation as any)?.quotationNumber || (quotation as any)?.quotation_number || id.slice(0, 8)}` : 'Create Quotation'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure product lines, tiered pricing, and discount governance
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCheckDiscount}
            disabled={checkingGovernance || isLocked}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-sm font-semibold text-amber-400 hover:bg-amber-500/20 disabled:opacity-50 transition-colors"
          >
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            {checkingGovernance ? 'Checking Risk...' : 'Check Discount & Risk'}
          </button>

          <button
            onClick={handleSave}
            disabled={saving || isLocked}
            className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3.5 py-2 text-sm font-medium text-foreground hover:bg-white/5 disabled:opacity-50 transition-colors shadow-xs"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            onClick={handleSubmit}
            disabled={saving || isLocked}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Send className="h-4 w-4" />
            Submit for Approval
          </button>
        </div>
      </div>

      {/* Customer Header Details */}
      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Select Customer
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              disabled={isLocked}
              className="w-full rounded-lg border border-border/60 bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id} className="bg-card text-foreground">
                  {c.name} ({c.company || c.email}) - {getTierLabel(c.tier)} Tier
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Customer Tier & Status
            </label>
            <div className="flex h-10 items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 text-sm">
              <span className="font-semibold text-foreground">
                {currentCustomer ? `${currentCustomer.name} (${getTierLabel(currentCustomer.tier)} Tier)` : 'No customer selected'}
              </span>
              {currentCustomer && (
                <span className="rounded-md bg-primary/15 border border-primary/30 px-2 py-0.5 text-xs font-bold text-primary">
                  {getTierLabel(currentCustomer.tier)}
                </span>
              )}
>>>>>>> Stashed changes
            </div>

<<<<<<< Updated upstream
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-900">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                placeholder="Additional notes..."
              />
=======
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Quote Status
            </label>
            <div className="flex h-10 items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 text-sm font-semibold">
              <span className="text-muted-foreground">Workflow Status:</span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-foreground border border-border/50">
                {quotation?.status || 'NEW DRAFT'}
              </span>
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======

      {/* Discount Governance & Risk Alert Panel */}
      {governanceResult && (
        <div
          className={`rounded-xl border p-5 shadow-xs transition-all ${
            governanceResult.requiresApproval
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 font-bold text-base">
              {governanceResult.requiresApproval ? (
                <ShieldAlert className="h-5 w-5 text-amber-400" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              )}
              <span>
                Discount Governance: {governanceResult.requiresApproval ? 'Approval Required' : 'Pre-Approved'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk Level:</span>
              <span
                className={`rounded-md px-2 py-0.5 text-xs font-black uppercase ${
                  governanceResult.riskLevel === 'CRITICAL'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : governanceResult.riskLevel === 'HIGH'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : governanceResult.riskLevel === 'MEDIUM'
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {governanceResult.riskLevel} ({governanceResult.riskScore}/100)
              </span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Allowed Discount</p>
              <p className="text-base font-bold text-foreground">{governanceResult.allowedDiscount}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Requested Discount</p>
              <p className="text-base font-bold text-foreground">{governanceResult.requestedDiscount}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Excess Discount</p>
              <p className={`text-base font-bold ${governanceResult.excessDiscount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {governanceResult.excessDiscount}%
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Required Approval Roles</p>
              <p className="text-sm font-semibold text-foreground">
                {governanceResult.approvalRoles.length > 0 ? governanceResult.approvalRoles.join(' → ') : 'None (Auto)'}
              </p>
            </div>
          </div>

          {governanceResult.reasons.length > 0 && (
            <div className="mt-3 rounded-lg bg-black/20 border border-white/5 p-3 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">Triggered Governance Rules:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {governanceResult.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Product Line Items */}
      <div className="rounded-xl border border-border/50 bg-card shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">Quotation Line Items</h2>
          <button
            onClick={addLine}
            disabled={isLocked}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Line
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="bg-muted/30 text-xs font-semibold uppercase text-muted-foreground border-b border-border/50">
              <tr>
                <th className="px-6 py-3 min-w-[240px]">Product</th>
                <th className="px-4 py-3 w-24">Qty</th>
                <th className="px-4 py-3 w-32">Unit Price ($)</th>
                <th className="px-4 py-3 w-28">Discount (%)</th>
                <th className="px-4 py-3 w-24">Tax (%)</th>
                <th className="px-4 py-3 w-32">Billing</th>
                <th className="px-4 py-3 text-right w-32">Total ($)</th>
                <th className="px-4 py-3 text-center w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/40">
                    <td className="px-6 py-3"><Skeleton className="h-9 w-full rounded-md" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-9 w-16 rounded-md" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-9 w-20 rounded-md" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-9 w-16 rounded-md" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-9 w-16 rounded-md" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-9 w-20 rounded-md" /></td>
                    <td className="px-4 py-3 text-right"><Skeleton className="h-9 w-20 ml-auto rounded-md" /></td>
                    <td className="px-4 py-3"></td>
                  </tr>
                ))
              ) : lines.map((line, index) => {
                const lineSub = line.quantity * line.unitPrice;
                const lineDisc = lineSub * (line.discountPercent / 100);
                const lineTotal = (lineSub - lineDisc) * (1 + line.taxRate / 100);

                return (
                  <tr key={index} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-3">
                      <select
                        value={line.productId}
                        onChange={(e) => handleProductChange(index, e.target.value)}
                        disabled={isLocked}
                        className="w-full rounded-md border border-border/60 bg-background px-2.5 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none"
                      >
                        <option value="">-- Choose Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id} className="bg-card text-foreground">
                            {p.name} (${Number(p.base_price || (p as any).basePrice).toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) => handleLineChange(index, 'quantity', parseInt(e.target.value) || 1)}
                        disabled={isLocked}
                        className="w-full rounded-md border border-border/60 bg-background px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={line.unitPrice}
                        onChange={(e) => handleLineChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        disabled={isLocked}
                        className="w-full rounded-md border border-border/60 bg-background px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={line.discountPercent}
                        onChange={(e) => handleLineChange(index, 'discountPercent', parseFloat(e.target.value) || 0)}
                        disabled={isLocked}
                        className="w-full rounded-md border border-border/60 bg-background px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="0.5"
                        value={line.taxRate}
                        onChange={(e) => handleLineChange(index, 'taxRate', parseFloat(e.target.value) || 0)}
                        disabled={isLocked}
                        className="w-full rounded-md border border-border/60 bg-background px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={line.billingType}
                        onChange={(e) => handleLineChange(index, 'billingType', e.target.value as any)}
                        disabled={isLocked}
                        className="w-full rounded-md border border-border/60 bg-background px-2 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                      >
                        <option value="ONE_TIME" className="bg-card text-foreground">One-Time</option>
                        <option value="RECURRING" className="bg-card text-foreground">Recurring</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground">
                      ${lineTotal.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => removeLine(index)}
                        disabled={isLocked}
                        className="text-muted-foreground hover:text-rose-400 transition-colors disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Financial Summary Calculation Panel */}
        <div className="border-t border-border/50 bg-muted/20 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Authoritative Sales Engine Recalculation
              </span>
              <p className="text-xs text-muted-foreground/80">
                All line items are calculated with high-precision Decimal arithmetic on the backend
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-4 text-right">
              <div>
                <span className="text-xs text-muted-foreground">Subtotal:</span>
                <p className="text-base font-semibold text-foreground">${localCalculations.subtotal.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Discount:</span>
                <p className="text-base font-semibold text-rose-400">-${localCalculations.discount.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Tax:</span>
                <p className="text-base font-semibold text-foreground">+${localCalculations.tax.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Grand Total:</span>
                <p className="text-xl font-bold text-primary">${localCalculations.total.toFixed(2)}</p>
              </div>

              <div className="col-span-2 sm:col-span-4 border-t border-border/40 pt-2 mt-2 flex justify-end gap-6 text-xs text-muted-foreground">
                <span>Cost: <strong className="text-foreground">${localCalculations.cost.toFixed(2)}</strong></span>
                <span>Gross Margin: <strong className="text-foreground">${localCalculations.margin.toFixed(2)}</strong></span>
                <span>Margin %: <strong className="text-emerald-400">{displayMarginPercent}%</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendations Banner (Upsell / Cross-sell) */}
      {recommendations.length > 0 && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">Recommended Additions & Accessories</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="flex flex-col justify-between rounded-lg border border-border/50 bg-card p-4 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-foreground">{rec.product.name}</span>
                    <span className="rounded-md bg-primary/15 border border-primary/30 px-2 py-0.5 text-xs font-bold text-primary">
                      ${Number(rec.product.basePrice).toFixed(2)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{rec.reason}</p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
                  <div className="text-[11px] text-muted-foreground">
                    <span>Revenue: +${rec.revenueImpact}</span>
                    <span className="mx-1">•</span>
                    <span className="text-emerald-400 font-semibold">Margin: +${rec.marginImpact}</span>
                  </div>

                  <button
                    onClick={() => handleAddRecommendation(rec)}
                    disabled={addingRecId === rec.id}
                    className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    {addingRecId === rec.id ? 'Adding...' : 'Add to Quote'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
>>>>>>> Stashed changes
    </div>
  );
}
