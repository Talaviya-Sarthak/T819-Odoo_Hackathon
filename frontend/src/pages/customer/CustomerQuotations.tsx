import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quotationsApi } from '../../api';
import type { Quotation } from '../../types';
import { 
  FileText, 
  CheckCircle2, 
  MessageSquare, 
  RefreshCw, 
  Calendar, 
  ArrowRight,
  Sparkles,
  DollarSign
} from 'lucide-react';

export default function CustomerQuotations() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadQuotations = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const data = await quotationsApi.getAll();
      setQuotations(data || []);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to fetch quotations' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, []);

  const handleConfirmQuote = async (quoteId: string) => {
    setConfirming(true);
    setStatusMessage(null);
    try {
      const updated = await quotationsApi.customerConfirm(quoteId);
      setStatusMessage({
        type: 'success',
        text: 'Quotation confirmed! Order processing has commenced.',
      });
      setSelectedQuote(updated);
      await loadQuotations();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to confirm quotation.' });
    } finally {
      setConfirming(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">Draft Preparation</span>;
      case 'UNDER_REVIEW':
      case 'PENDING_APPROVAL':
        return <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">Under Review</span>;
      case 'APPROVED':
        return <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">Ready for Confirmation</span>;
      case 'NEGOTIATION':
        return <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800">Negotiation Open</span>;
      case 'CUSTOMER_CONFIRMED':
        return <span className="rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-semibold text-cyan-800">Confirmed by You</span>;
      case 'ORDER_CONFIRMED':
        return <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">Order Confirmed</span>;
      default:
        return <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Quotations & Proposals</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review quotation terms, communicate with your sales representative, and confirm orders
          </p>
        </div>

        <button
          onClick={loadQuotations}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-xs"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
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

      {/* Main Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : quotations.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-2 text-base font-semibold text-slate-900">No Quotations Found</h3>
            <p className="mt-1 text-sm text-slate-400">You currently have no active quotations.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Quotation #</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Total Amount</th>
                  <th className="px-6 py-3.5">Created Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotations.map((q) => {
                  const qNum = (q as any).quotationNumber || (q as any).quotation_number || `QT-${q.id.slice(0, 6)}`;
                  const amount = Number((q as any).totalAmount || (q as any).grand_total || 0);
                  const date = (q as any).created_at || (q as any).createdAt;

                  return (
                    <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{qNum}</td>
                      <td className="px-6 py-4">{getStatusBadge(q.status)}</td>
                      <td className="px-6 py-4 font-bold text-indigo-700">${amount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {date ? new Date(date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedQuote(q)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => navigate(`/customer/negotiation/${q.id}`)}
                          className="inline-flex items-center gap-1 rounded-md border border-purple-300 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl space-y-6 my-8">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Quotation: {(selectedQuote as any).quotationNumber || (selectedQuote as any).quotation_number || selectedQuote.id.slice(0, 8)}
                </h2>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <span>Status:</span>
                  {getStatusBadge(selectedQuote.status)}
                </div>
              </div>
              <button
                onClick={() => setSelectedQuote(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Line Items Table */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">Quotation Line Items</h3>
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 font-semibold uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Product</th>
                      <th className="px-3 py-2.5">Qty</th>
                      <th className="px-3 py-2.5">Unit Price</th>
                      <th className="px-3 py-2.5">Discount %</th>
                      <th className="px-4 py-2.5 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedQuote as any).lines?.map((line: any, idx: number) => {
                      const prodName = line.product?.name || line.product_name || `Product ID: ${line.productId?.slice(0, 8)}`;
                      const unitP = Number(line.unitPrice || line.unit_price || 0);
                      const discP = Number(line.discountPercent || line.discount_percent || 0);
                      const totalP = Number(line.lineTotal || line.line_total || line.total || (unitP * line.quantity * (1 - discP / 100)));

                      return (
                        <tr key={idx}>
                          <td className="px-4 py-2.5 font-medium text-slate-900">{prodName}</td>
                          <td className="px-3 py-2.5">{line.quantity}</td>
                          <td className="px-3 py-2.5">${unitP.toFixed(2)}</td>
                          <td className="px-3 py-2.5 font-semibold text-indigo-700">{discP}%</td>
                          <td className="px-4 py-2.5 text-right font-bold text-slate-900">${totalP.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Customer Totals Summary (NO internal costs or margin exposed) */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-right">
                <div>
                  <span className="text-xs text-slate-500">Subtotal:</span>
                  <p className="text-sm font-semibold text-slate-900">
                    ${Number((selectedQuote as any).subtotal || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Discount Savings:</span>
                  <p className="text-sm font-semibold text-rose-600">
                    -${Number((selectedQuote as any).discountAmount || (selectedQuote as any).discount_total || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Estimated Tax:</span>
                  <p className="text-sm font-semibold text-slate-900">
                    +${Number((selectedQuote as any).taxAmount || (selectedQuote as any).tax_total || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Total Payable:</span>
                  <p className="text-lg font-bold text-indigo-700">
                    ${Number((selectedQuote as any).totalAmount || (selectedQuote as any).grand_total || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
              <button
                onClick={() => {
                  const qId = selectedQuote.id;
                  setSelectedQuote(null);
                  navigate(`/customer/negotiation/${qId}`);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-purple-300 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-100 transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                Request Changes / Negotiate
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedQuote(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>

                {selectedQuote.status === 'APPROVED' && (
                  <button
                    onClick={() => handleConfirmQuote(selectedQuote.id)}
                    disabled={confirming}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
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
