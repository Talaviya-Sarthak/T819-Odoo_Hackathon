import { useState, useEffect } from 'react';
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
import { 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles, 
  ArrowLeft, 
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  DollarSign,
  PackageCheck
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

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
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
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Initial Reference Data Loading
  useEffect(() => {
    async function loadRefs() {
      try {
        const [custList, prodList] = await Promise.all([
          customersApi.getAll(),
          productsApi.getAll(),
        ]);
        setCustomers(custList);
        setProducts(prodList);
      } catch (err: any) {
        console.error('Failed to load references:', err);
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

        // Load recommendations for this quote
        loadRecommendations(id!);
      } catch (err: any) {
        setStatusMessage({ type: 'error', text: err.message || 'Failed to load quotation' });
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
      setStatusMessage({ type: 'error', text: 'Please select a customer first.' });
      return null;
    }

    const validLines = lines.filter((l) => l.productId);
    if (validLines.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please add at least one product line.' });
      return null;
    }

    setSaving(true);
    setStatusMessage(null);

    try {
      let savedQuote: Quotation;

      if (id) {
        savedQuote = await quotationsApi.update(id, {
          lines: validLines,
          notes,
          validUntil,
        });
        setStatusMessage({ type: 'success', text: 'Quotation draft updated successfully.' });
      } else {
        savedQuote = await quotationsApi.create({
          customerId: selectedCustomerId,
          lines: validLines,
          notes,
          validUntil,
        });
        setStatusMessage({ type: 'success', text: 'Quotation draft created successfully.' });
        navigate(`/sales/quote-builder/${savedQuote.id}`, { replace: true });
      }

      setQuotation(savedQuote);
      loadRecommendations(savedQuote.id);
      return savedQuote.id;
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save quotation.' });
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
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Governance check failed.' });
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
      setStatusMessage({
        type: 'success',
        text: submittedQuote.status === 'APPROVED'
          ? 'Quotation automatically approved!'
          : 'Quotation submitted for approval review.',
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Submission failed.' });
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
        setStatusMessage({ type: 'success', text: `Added ${rec.product.name} to quotation.` });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to add recommendation.' });
    } finally {
      setAddingRecId(null);
    }
  };

  const isLocked = Boolean(quotation && quotation.status !== 'DRAFT' && quotation.status !== 'NEGOTIATION' && quotation.status !== 'RETURNED');

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
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
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {id ? `Quotation: ${(quotation as any)?.quotationNumber || (quotation as any)?.quotation_number || id.slice(0, 8)}` : 'Create Quotation'}
            </h1>
            <p className="text-sm text-slate-500">
              Configure product lines, tiered pricing, and discount governance
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCheckDiscount}
            disabled={checkingGovernance || isLocked}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50 transition-colors"
          >
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            {checkingGovernance ? 'Checking Risk...' : 'Check Discount & Risk'}
          </button>

          <button
            onClick={handleSave}
            disabled={saving || isLocked}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-xs"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            onClick={handleSubmit}
            disabled={saving || isLocked}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <Send className="h-4 w-4" />
            Submit for Approval
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`flex items-center justify-between rounded-lg p-4 text-sm font-medium ${
            statusMessage.type === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-xs font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Customer Header Details */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Select Customer
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              disabled={isLocked}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none disabled:bg-slate-100"
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.company || c.email}) - {getTierLabel(c.tier)} Tier
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Customer Tier & Status
            </label>
            <div className="flex h-10 items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm">
              <span className="font-semibold text-slate-800">
                {currentCustomer ? `${currentCustomer.name} (${getTierLabel(currentCustomer.tier)} Tier)` : 'No customer selected'}
              </span>
              {currentCustomer && (
                <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800">
                  {getTierLabel(currentCustomer.tier)}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Quote Status
            </label>
            <div className="flex h-10 items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold">
              <span className="text-slate-700">Workflow Status:</span>
              <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-800">
                {quotation?.status || 'NEW DRAFT'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Discount Governance & Risk Alert Panel */}
      {governanceResult && (
        <div
          className={`rounded-xl border p-5 shadow-sm transition-all ${
            governanceResult.requiresApproval
              ? 'border-amber-300 bg-amber-50/80 text-amber-950'
              : 'border-emerald-300 bg-emerald-50/80 text-emerald-950'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-amber-200/60 pb-3">
            <div className="flex items-center gap-2 font-bold text-base">
              {governanceResult.requiresApproval ? (
                <ShieldAlert className="h-5 w-5 text-amber-600" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              )}
              <span>
                Discount Governance: {governanceResult.requiresApproval ? 'Approval Required' : 'Pre-Approved'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Risk Level:</span>
              <span
                className={`rounded-md px-2 py-0.5 text-xs font-black uppercase ${
                  governanceResult.riskLevel === 'CRITICAL'
                    ? 'bg-rose-600 text-white'
                    : governanceResult.riskLevel === 'HIGH'
                    ? 'bg-amber-600 text-white'
                    : governanceResult.riskLevel === 'MEDIUM'
                    ? 'bg-yellow-500 text-slate-900'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {governanceResult.riskLevel} ({governanceResult.riskScore}/100)
              </span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
            <div>
              <p className="text-xs text-slate-500">Allowed Discount</p>
              <p className="text-base font-bold">{governanceResult.allowedDiscount}%</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Requested Discount</p>
              <p className="text-base font-bold">{governanceResult.requestedDiscount}%</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Excess Discount</p>
              <p className={`text-base font-bold ${governanceResult.excessDiscount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {governanceResult.excessDiscount}%
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Required Approval Roles</p>
              <p className="text-sm font-semibold">
                {governanceResult.approvalRoles.length > 0 ? governanceResult.approvalRoles.join(' → ') : 'None (Auto)'}
              </p>
            </div>
          </div>

          {governanceResult.reasons.length > 0 && (
            <div className="mt-3 rounded-lg bg-white/70 p-3 text-xs text-slate-700">
              <p className="font-semibold text-slate-900 mb-1">Triggered Governance Rules:</p>
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
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Quotation Line Items</h2>
          <button
            onClick={addLine}
            disabled={isLocked}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-600 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Line
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
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
            <tbody className="divide-y divide-slate-100">
              {lines.map((line, index) => {
                const lineSub = line.quantity * line.unitPrice;
                const lineDisc = lineSub * (line.discountPercent / 100);
                const lineTotal = (lineSub - lineDisc) * (1 + line.taxRate / 100);

                return (
                  <tr key={index} className="hover:bg-slate-50/70">
                    <td className="px-6 py-3">
                      <select
                        value={line.productId}
                        onChange={(e) => handleProductChange(index, e.target.value)}
                        disabled={isLocked}
                        className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
                      >
                        <option value="">-- Choose Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
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
                        className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={line.unitPrice}
                        onChange={(e) => handleLineChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        disabled={isLocked}
                        className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
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
                        className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
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
                        className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={line.billingType}
                        onChange={(e) => handleLineChange(index, 'billingType', e.target.value as any)}
                        disabled={isLocked}
                        className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
                      >
                        <option value="ONE_TIME">One-Time</option>
                        <option value="RECURRING">Recurring</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      ${lineTotal.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => removeLine(index)}
                        disabled={isLocked}
                        className="text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-30"
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
        <div className="border-t border-slate-200 bg-slate-50/70 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Authoritative Sales Engine Recalculation
              </span>
              <p className="text-xs text-slate-400">
                All line items are calculated with high-precision Decimal arithmetic on the backend
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-4 text-right">
              <div>
                <span className="text-xs text-slate-500">Subtotal:</span>
                <p className="text-base font-semibold text-slate-900">${localCalculations.subtotal.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Discount:</span>
                <p className="text-base font-semibold text-rose-600">-${localCalculations.discount.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Tax:</span>
                <p className="text-base font-semibold text-slate-900">+${localCalculations.tax.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Grand Total:</span>
                <p className="text-xl font-bold text-indigo-600">${localCalculations.total.toFixed(2)}</p>
              </div>

              <div className="col-span-2 sm:col-span-4 border-t border-slate-200 pt-2 mt-2 flex justify-end gap-6 text-xs text-slate-500">
                <span>Cost: <strong className="text-slate-700">${localCalculations.cost.toFixed(2)}</strong></span>
                <span>Gross Margin: <strong className="text-slate-700">${localCalculations.margin.toFixed(2)}</strong></span>
                <span>Margin %: <strong className="text-emerald-600">{displayMarginPercent}%</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendations Banner (Upsell / Cross-sell) */}
      {recommendations.length > 0 && (
        <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/80 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Recommended Additions & Accessories</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-900">{rec.product.name}</span>
                    <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800">
                      ${Number(rec.product.basePrice).toFixed(2)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600 line-clamp-2">{rec.reason}</p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="text-[11px] text-slate-500">
                    <span>Revenue: +${rec.revenueImpact}</span>
                    <span className="mx-1">•</span>
                    <span className="text-emerald-600 font-semibold">Margin: +${rec.marginImpact}</span>
                  </div>

                  <button
                    onClick={() => handleAddRecommendation(rec)}
                    disabled={addingRecId === rec.id}
                    className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-colors"
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
