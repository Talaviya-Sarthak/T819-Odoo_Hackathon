import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

interface BuilderLine {
  id?: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  unitCost?: number;
  discountPercent: number;
  taxRate: number;
  billingType: 'ONE_TIME' | 'RECURRING';
}

export default function QuoteBuilder() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [lines, setLines] = useState<BuilderLine[]>([
    { productId: '', quantity: 1, unitPrice: 0, discountPercent: 0, taxRate: 0, billingType: 'ONE_TIME' },
  ]);
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkingGovernance, setCheckingGovernance] = useState(false);
  const [governanceResult, setGovernanceResult] = useState<DiscountCheckResult | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [addingRecId, setAddingRecId] = useState<string | null>(null);

  const filteredCustomers = useMemo(() => {
    let list = [...customers];
    if (customerSearch.trim()) {
      const q = customerSearch.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.company?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, customerSearch]);

  // 1. Initial Reference Data Loading
  useEffect(() => {
    async function loadRefs() {
      try {
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
      }
    }
    loadRefs();
  }, []);

  // 2. Load Existing Quotation if Edit Mode
  useEffect(() => {
    if (!id) return;

    async function loadQuote() {
      setLoading(true);
      try {
        const q = await quotationsApi.getById(id!);
        setQuotation(q);
        setSelectedCustomerId((q.customer_id || (q as any).customerId) || '');
        setNotes(q.notes || '');
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
  }, [id]);

  const loadRecommendations = async (quoteId: string) => {
    try {
      const recs = await recommendationsApi.get(quoteId);
      setRecommendations(recs || []);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    }
  };

  // Selected customer object
  const currentCustomer = customers.find((c) => c.id === selectedCustomerId);
  const getTierLabel = (tier: any): string => {
    if (!tier) return 'Standard';
    if (typeof tier === 'object' && tier.name) return String(tier.name);
    if (typeof tier === 'string') return tier;
    return 'Standard';
  };

  // Line item handlers
  const handleProductChange = (index: number, productId: string) => {
    const selectedProd = products.find((p) => p.id === productId);
    const updated = [...lines];
    if (updated[index]) {
      updated[index].productId = productId;
      if (selectedProd) {
        updated[index].unitPrice = Number(selectedProd.base_price || (selectedProd as any).basePrice || 0);
        updated[index].unitCost = Number((selectedProd as any).costPrice || (selectedProd as any).cost_price || 0);
        updated[index].taxRate = Number((selectedProd as any).taxPercent || (selectedProd as any).tax_percent || 0);
      }
      setLines(updated);
    }
  };

  const handleLineChange = (index: number, field: keyof BuilderLine, value: any) => {
    const updated = [...lines];
    if (updated[index]) {
      (updated[index] as any)[field] = value;
      setLines(updated);
    }
  };

  const addLine = () => {
    setLines([
      ...lines,
      { productId: '', quantity: 1, unitPrice: 0, discountPercent: 0, taxRate: 0, billingType: 'ONE_TIME' },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length === 1) {
      setLines([{ productId: '', quantity: 1, unitPrice: 0, discountPercent: 0, taxRate: 0, billingType: 'ONE_TIME' }]);
      return;
    }
    setLines(lines.filter((_, i) => i !== index));
  };

  // Authoritative calculations: compute locally for immediate preview, but backend is authority
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
      };
    },
    { subtotal: 0, discount: 0, tax: 0, total: 0, cost: 0, margin: 0 }
  );

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
      toast.warning('Please add at least one valid product line.', 'Validation');
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
        toast.success('Quotation draft updated successfully.', 'Draft Saved');
      } else {
        savedQuote = await quotationsApi.create({
          customerId: selectedCustomerId,
          lines: validLines,
          notes,
          validUntil,
        });
        toast.success('Quotation draft created successfully.', 'Draft Created');
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
      // Refresh quotation data
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
    } finally {
      setAddingRecId(null);
    }
  };

  const isLocked = Boolean(quotation && quotation.status !== 'DRAFT' && quotation.status !== 'NEGOTIATION' && quotation.status !== 'RETURNED');

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Select Customer ({customers.length})
              </label>
              <div className="flex items-center gap-2">
                {customers.length > 5 && (
                  <span className="text-[10px] text-muted-foreground">
                    {filteredCustomers.length} matching
                  </span>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await customersApi.getAll();
                      const list = Array.isArray(res) ? res : (res as any)?.customers || [];
                      setCustomers(list);
                      toast.success(`Refreshed ${list.length} customers`);
                    } catch (e: any) {
                      toast.fail('Failed to refresh customer list');
                    }
                  }}
                  title="Refresh customer list"
                  className="p-1 text-muted-foreground hover:text-primary transition-colors rounded hover:bg-muted/40"
                >
                  <RefreshCw className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              {customers.length > 8 && (
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Filter by name, email, or company..."
                  disabled={isLocked}
                  className="w-full rounded-md border border-border/40 bg-background/60 px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                />
              )}
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                disabled={isLocked}
                className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
              >
                <option value="">-- Choose Customer --</option>
                {filteredCustomers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.company || c.email || 'Direct'}) - {getTierLabel(c.tier)} Tier
                  </option>
                ))}
              </select>
            </div>
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
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Quote Status
            </label>
            <div className="flex h-10 items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 text-sm font-semibold">
              <span className="text-muted-foreground">Workflow Status:</span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-foreground border border-border/50">
                {quotation?.status || 'NEW DRAFT'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Discount Governance & Risk Alert Panel */}
      {governanceResult && (
        <div
          className={`rounded-xl border p-5 shadow-xs transition-all ${
            governanceResult.requiresApproval
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
              : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/40 pb-3">
            <div className="flex items-center gap-2 font-bold text-base">
              {governanceResult.requiresApproval ? (
                <>
                  <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0" />
                  <span>Discount Requires Management Approval</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  <span>Discount Conforms to Policy (Pre-Approved)</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <span>Requested: <strong className="text-foreground text-sm">{governanceResult.requestedDiscount}%</strong></span>
              <span>•</span>
              <span>Max Standard: <strong className="text-foreground text-sm">{(governanceResult as any).maxAllowed ?? governanceResult.allowedDiscount}%</strong></span>
            </div>
          </div>

          <p className="mt-3 text-sm text-foreground/90">{(governanceResult as any).reason || governanceResult.reasons?.join('. ')}</p>

          {governanceResult.requiresApproval && governanceResult.approvalRoles.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-border/30">
              <span className="text-xs font-semibold text-muted-foreground">Required Approval Roles:</span>
              {governanceResult.approvalRoles.map((role) => (
                <span
                  key={role}
                  className="rounded-md bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-xs font-bold text-amber-300 tracking-wide"
                >
                  {role}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Line Items Table Builder */}
      <div className="rounded-xl border border-border/50 bg-card shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Line Items & Pricing Engine</h2>
            <p className="text-xs text-muted-foreground">Manage products, pricing tiers, discounts, and billing intervals</p>
          </div>

          <button
            onClick={addLine}
            disabled={isLocked}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add Line
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="bg-muted/30 text-xs font-semibold uppercase text-muted-foreground border-b border-border/50">
              <tr>
                <th className="px-4 py-3 min-w-[220px]">Product</th>
                <th className="px-4 py-3 min-w-[120px]">Billing Type</th>
                <th className="px-4 py-3 w-24">Qty</th>
                <th className="px-4 py-3 w-32">Unit Price ($)</th>
                <th className="px-4 py-3 w-28">Discount %</th>
                <th className="px-4 py-3 w-24">Tax %</th>
                <th className="px-4 py-3 w-32 text-right">Line Total</th>
                <th className="px-4 py-3 w-16 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {lines.map((line, idx) => {
                const sub = line.quantity * line.unitPrice;
                const disc = sub * (line.discountPercent / 100);
                const afterDisc = sub - disc;
                const tax = afterDisc * (line.taxRate / 100);
                const lineTotal = afterDisc + tax;

                return (
                  <tr key={idx} className="hover:bg-muted/10 transition-colors">
                    {/* Product Selector */}
                    <td className="px-4 py-3">
                      <select
                        value={line.productId}
                        onChange={(e) => handleProductChange(idx, e.target.value)}
                        disabled={isLocked}
                        className="w-full rounded-md border border-border/60 bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
                      >
                        <option value="">-- Choose Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Billing Type */}
                    <td className="px-4 py-3">
                      <select
                        value={line.billingType}
                        onChange={(e) => handleLineChange(idx, 'billingType', e.target.value)}
                        disabled={isLocked}
                        className="w-full rounded-md border border-border/60 bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
                      >
                        <option value="ONE_TIME">One-Time</option>
                        <option value="RECURRING">Recurring</option>
                      </select>
                    </td>

                    {/* Quantity */}
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) => handleLineChange(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                        disabled={isLocked}
                        className="w-full rounded-md border border-border/60 bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
                      />
                    </td>

                    {/* Unit Price */}
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.unitPrice}
                        onChange={(e) => handleLineChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                        disabled={isLocked}
                        className="w-full rounded-md border border-border/60 bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
                      />
                    </td>

                    {/* Discount % */}
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="100"
                        value={line.discountPercent}
                        onChange={(e) => handleLineChange(idx, 'discountPercent', parseFloat(e.target.value) || 0)}
                        disabled={isLocked}
                        className="w-full rounded-md border border-border/60 bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
                      />
                    </td>

                    {/* Tax Rate % */}
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={line.taxRate}
                        onChange={(e) => handleLineChange(idx, 'taxRate', parseFloat(e.target.value) || 0)}
                        disabled={isLocked}
                        className="w-full rounded-md border border-border/60 bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
                      />
                    </td>

                    {/* Calculated Line Total */}
                    <td className="px-4 py-3 text-right font-semibold text-foreground">
                      ${lineTotal.toFixed(2)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => removeLine(idx)}
                        disabled={isLocked || lines.length <= 1}
                        className="text-muted-foreground hover:text-rose-400 disabled:opacity-30 transition-colors"
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

        {/* Calculation Summary Footer */}
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

      {/* Additional Terms & Notes */}
      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Quotation Validity (Valid Until)
            </label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              disabled={isLocked}
              className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Customer-Facing Terms & Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLocked}
              placeholder="Add delivery timelines, contractual terms, or customer notices..."
              className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none disabled:opacity-50"
            />
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
    </div>
  );
}
