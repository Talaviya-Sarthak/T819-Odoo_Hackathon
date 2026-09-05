import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quotationsApi } from '../../api';
import type { Quotation } from '../../types';
import { useToast } from '../../components/Toast';
import { 
  FileText, 
  CheckCircle2, 
  MessageSquare, 
  RefreshCw, 
  Calendar, 
  Sparkles,
  X
} from 'lucide-react';

export default function CustomerQuotations() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);
  const [confirming, setConfirming] = useState(false);

  const loadQuotations = async () => {
    setLoading(true);
    try {
      const data = await quotationsApi.getAll();
      setQuotations(data || []);
    } catch (err: any) {
      toast.fail(err.message || 'Failed to fetch quotations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, []);

  const handleConfirmQuote = async (quoteId: string) => {
    setConfirming(true);
    try {
      const updated = await quotationsApi.customerConfirm(quoteId);
      toast.success('Quotation confirmed! Order processing has commenced.', 'Quotation Accepted');
      setSelectedQuote(updated);
      await loadQuotations();
    } catch (err: any) {
      toast.fail(err.message || 'Failed to confirm quotation.', 'Confirmation Error');
    } finally {
      setConfirming(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <span className="rounded-full bg-muted border border-border/50 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">Draft Preparation</span>;
      case 'UNDER_REVIEW':
      case 'PENDING_APPROVAL':
        return <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold text-amber-400">Under Review</span>;
      case 'APPROVED':
        return <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">Ready for Confirmation</span>;
      case 'NEGOTIATION':
        return <span className="rounded-full bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 text-xs font-semibold text-purple-400">Negotiation Open</span>;
      case 'CUSTOMER_CONFIRMED':
        return <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 text-xs font-semibold text-cyan-400">Confirmed by You</span>;
      case 'ORDER_CONFIRMED':
        return <span className="rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-xs font-semibold text-blue-400">Order Confirmed</span>;
      default:
        return <span className="rounded-full bg-muted border border-border/50 px-2.5 py-0.5 text-xs font-semibold text-foreground">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Quotations & Proposals</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review quotation terms, communicate with your sales representative, and confirm orders
          </p>
        </div>

        <button
          onClick={loadQuotations}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3.5 py-2 text-sm font-medium text-foreground hover:bg-white/5 disabled:opacity-50 transition-colors shadow-xs"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-border/50 bg-card shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <RefreshCw className="h-5 w-5 animate-spin" />
            </div>
            <span className="text-sm text-foreground font-medium">Retrieving your quotations...</span>
          </div>
        ) : quotations.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-3 text-base font-semibold text-foreground">No Quotations Found</h3>
            <p className="mt-1 text-sm text-muted-foreground">You currently have no active quotations.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-foreground">
              <thead className="bg-muted/30 text-xs font-semibold uppercase text-muted-foreground border-b border-border/50">
                <tr>
                  <th className="px-6 py-3.5">Quotation #</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Total Amount</th>
                  <th className="px-6 py-3.5">Valid Until</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {quotations.map((q) => {
                  const qNum = (q as any).quotationNumber || (q as any).quotation_number || `QT-${q.id.slice(0, 6)}`;
                  const amount = Number((q as any).totalAmount || (q as any).grand_total || 0);
                  const date = (q as any).validUntil || q.valid_until;

                  return (
                    <tr key={q.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">{qNum}</td>
                      <td className="px-6 py-4">{getStatusBadge(q.status)}</td>
                      <td className="px-6 py-4 font-bold text-primary">${amount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {date ? new Date(date).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {(q.status === 'APPROVED' || q.status === 'NEGOTIATION') && (
                          <button
                            onClick={() => handleConfirmQuote(q.id)}
                            disabled={confirming}
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/25 transition-colors shadow-xs"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {confirming ? '...' : 'Confirm'}
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedQuote(q)}
                          className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/30 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/60 transition-colors"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => navigate(`/customer/negotiation/${q.id}`)}
                          className="inline-flex items-center gap-1 rounded-md border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-400 hover:bg-purple-500/20 transition-colors"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          Negotiate
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Quotation View Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl bg-card border border-border/60 p-6 shadow-2xl space-y-6 my-8">
            <div className="flex items-start justify-between border-b border-border/50 pb-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Quotation: {(selectedQuote as any).quotationNumber || (selectedQuote as any).quotation_number || selectedQuote.id.slice(0, 8)}
                </h2>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Status:</span>
                  {getStatusBadge(selectedQuote.status)}
                </div>
              </div>
              <button
                onClick={() => setSelectedQuote(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Line Items Table */}
            <div>
              <h3 className="text-sm font-bold text-foreground mb-2">Quotation Line Items</h3>
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <table className="w-full text-left text-xs text-foreground">
                  <thead className="bg-muted/30 font-semibold uppercase text-muted-foreground border-b border-border/50">
                    <tr>
                      <th className="px-4 py-2.5">Product</th>
                      <th className="px-3 py-2.5">Qty</th>
                      <th className="px-3 py-2.5">Unit Price</th>
                      <th className="px-3 py-2.5">Discount %</th>
                      <th className="px-4 py-2.5 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {(selectedQuote as any).lines?.map((line: any, idx: number) => {
                      const prodName = line.product?.name || line.product_name || `Product ID: ${line.productId?.slice(0, 8)}`;
                      const unitP = Number(line.unitPrice || line.unit_price || 0);
                      const discP = Number(line.discountPercent || line.discount_percent || 0);
                      const totalP = Number(line.lineTotal || line.line_total || line.total || (unitP * line.quantity * (1 - discP / 100)));

                      return (
                        <tr key={idx} className="hover:bg-muted/10 transition-colors">
                          <td className="px-4 py-2.5 font-medium text-foreground">{prodName}</td>
                          <td className="px-3 py-2.5">{line.quantity}</td>
                          <td className="px-3 py-2.5">${unitP.toFixed(2)}</td>
                          <td className="px-3 py-2.5 font-semibold text-primary">{discP}%</td>
                          <td className="px-4 py-2.5 text-right font-bold text-foreground">${totalP.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Customer Totals Summary */}
            <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-right">
                <div>
                  <span className="text-xs text-muted-foreground">Subtotal:</span>
                  <p className="text-sm font-semibold text-foreground">
                    ${Number((selectedQuote as any).subtotal || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Discount Savings:</span>
                  <p className="text-sm font-semibold text-rose-400">
                    -${Number((selectedQuote as any).discountAmount || (selectedQuote as any).discount_total || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Estimated Tax:</span>
                  <p className="text-sm font-semibold text-foreground">
                    +${Number((selectedQuote as any).taxAmount || (selectedQuote as any).tax_total || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Total Payable:</span>
                  <p className="text-lg font-bold text-primary">
                    ${Number((selectedQuote as any).totalAmount || (selectedQuote as any).grand_total || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
              <button
                onClick={() => {
                  const qId = selectedQuote.id;
                  setSelectedQuote(null);
                  navigate(`/customer/negotiation/${qId}`);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-400 hover:bg-purple-500/20 transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                Request Changes / Negotiate
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedQuote(null)}
                  className="rounded-lg border border-border/60 bg-muted/30 px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted/60 transition-colors"
                >
                  Close
                </button>

                {(selectedQuote.status === 'APPROVED' || selectedQuote.status === 'NEGOTIATION') && (
                  <button
                    onClick={() => handleConfirmQuote(selectedQuote.id)}
                    disabled={confirming}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {confirming ? 'Confirming...' : 'Accept & Confirm Quotation'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
