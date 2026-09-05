import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { approvalsApi, type PendingApprovalItem } from '../../api';
import { 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  ShieldAlert, 
  Clock, 
  User, 
  Building, 
  ArrowRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function Approvals() {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<PendingApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<PendingApprovalItem | null>(null);
  const [actionModal, setActionModal] = useState<'approve' | 'reject' | 'return' | null>(null);
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPendingApprovals = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const data = await approvalsApi.getPending();
      setApprovals(data || []);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to fetch pending approvals' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const handleAction = async () => {
    if (!selectedApproval || !actionModal) return;

    if ((actionModal === 'reject' || actionModal === 'return') && !comment.trim()) {
      setStatusMessage({ type: 'error', text: 'Comments are mandatory when rejecting or returning for revision.' });
      return;
    }

    setProcessing(true);
    setStatusMessage(null);

    try {
      if (actionModal === 'approve') {
        await approvalsApi.approve(selectedApproval.id, comment);
        setStatusMessage({ type: 'success', text: `Quotation approval step successfully granted.` });
      } else if (actionModal === 'reject') {
        await approvalsApi.reject(selectedApproval.id, comment);
        setStatusMessage({ type: 'success', text: `Quotation rejected.` });
      } else if (actionModal === 'return') {
        await approvalsApi.returnForRevision(selectedApproval.id, comment);
        setStatusMessage({ type: 'success', text: `Quotation returned to sales rep for revision.` });
      }

      setActionModal(null);
      setSelectedApproval(null);
      setComment('');
      // Authoritative reload
      await fetchPendingApprovals();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Action failed.' });
    } finally {
      setProcessing(false);
    }
  };

  const getRiskBadge = (level: string, score: number) => {
    let colorClass = 'bg-slate-100 text-slate-800';
    if (level === 'CRITICAL') colorClass = 'bg-rose-100 text-rose-800 border-rose-200';
    else if (level === 'HIGH') colorClass = 'bg-amber-100 text-amber-900 border-amber-300';
    else if (level === 'MEDIUM') colorClass = 'bg-yellow-100 text-yellow-900 border-yellow-200';
    else if (level === 'LOW') colorClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';

    return (
      <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold uppercase border ${colorClass}`}>
        <ShieldAlert className="h-3.5 w-3.5" />
        {level} ({score}/100)
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Governance & Approval Queue</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review, validate, or reject quotation discount and margin exceptions
          </p>
        </div>

        <button
          onClick={fetchPendingApprovals}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-xs"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Queue
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

      {/* Main Approvals Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : approvals.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500/60" />
            <h3 className="mt-3 text-base font-semibold text-slate-900">Approval Queue Clear</h3>
            <p className="mt-1 text-sm text-slate-400">All submitted quotations have been reviewed and processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Quote #</th>
                  <th className="px-6 py-3.5">Customer & Tier</th>
                  <th className="px-6 py-3.5">Requested By</th>
                  <th className="px-6 py-3.5">Quote Amount</th>
                  <th className="px-6 py-3.5">Risk & Score</th>
                  <th className="px-6 py-3.5">Approval Stage</th>
                  <th className="px-6 py-3.5 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {approvals.map((item) => {
                  const q = item.quotation;
                  const qNum = (q as any)?.quotationNumber || (q as any)?.quotation_number || `QT-${item.quotationId.slice(0, 6)}`;
                  const custName = q?.customer?.name || (q as any)?.customer_name || 'Customer';
                  const custTier = q?.customer?.tier?.name || 'Standard';
                  const repName = q?.salesRep?.name || (q as any)?.salesRep?.email || 'Sales Rep';
                  const amount = Number((q as any)?.totalAmount || (q as any)?.grand_total || 0);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-bold text-indigo-900">{qNum}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{custName}</div>
                        <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 mt-0.5">
                          {custTier} Tier
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{repName}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">${amount.toFixed(2)}</td>
                      <td className="px-6 py-4">{getRiskBadge(item.riskLevel, item.riskScore)}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200">
                          Step {item.currentStep} of {item.totalSteps}: {item.requiredRole}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedApproval(item)}
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
                        >
                          Review <ArrowRight className="h-3.5 w-3.5" />
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

      {/* Detail & Action Modal */}
      {selectedApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl space-y-6 my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Quotation Approval Request: {(selectedApproval.quotation as any)?.quotationNumber || `QT-${selectedApproval.quotationId.slice(0, 6)}`}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Step {selectedApproval.currentStep} of {selectedApproval.totalSteps} • Target Role: <strong>{selectedApproval.requiredRole}</strong>
                </p>
              </div>

              <button
                onClick={() => setSelectedApproval(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Risk & Reason Header */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-amber-900">Exception Trigger Reason:</span>
                {getRiskBadge(selectedApproval.riskLevel, selectedApproval.riskScore)}
              </div>
              <p className="mt-1.5 text-sm font-semibold text-amber-950">{selectedApproval.reason}</p>
            </div>

            {/* Line Items Breakdown */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">Quotation Line Items</h3>
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 font-semibold uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Item</th>
                      <th className="px-3 py-2.5">Qty</th>
                      <th className="px-3 py-2.5">Unit Price</th>
                      <th className="px-3 py-2.5">Discount %</th>
                      <th className="px-4 py-2.5 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedApproval.quotation.lines?.map((line: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-4 py-2.5 font-medium text-slate-900">
                          {line.product?.name || line.product_name || `Product ID: ${(line.productId || line.product_id || '').slice(0, 8)}`}
                        </td>
                        <td className="px-3 py-2.5">{line.quantity}</td>
                        <td className="px-3 py-2.5">${Number(line.unitPrice || line.unit_price || 0).toFixed(2)}</td>
                        <td className="px-3 py-2.5">
                          <span className={`font-bold ${Number(line.discountPercent || line.discount_percent || 0) > 15 ? 'text-rose-600' : 'text-slate-900'}`}>
                            {Number(line.discountPercent || line.discount_percent || 0)}%
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                          ${Number(line.lineTotal || line.line_total || line.total || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="flex justify-between border-t border-slate-200 pt-3 text-sm">
              <span className="text-slate-500 font-medium">Grand Total Value:</span>
              <span className="text-lg font-bold text-indigo-700">
                ${Number((selectedApproval.quotation as any)?.totalAmount || (selectedApproval.quotation as any)?.grand_total || 0).toFixed(2)}
              </span>
            </div>

            {/* Action Selection Prompt */}
            {!actionModal ? (
              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  onClick={() => setActionModal('return')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  Return for Revision
                </button>
                <button
                  onClick={() => setActionModal('reject')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-900 hover:bg-rose-100 transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  Reject Quotation
                </button>
                <button
                  onClick={() => setActionModal('approve')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve Quotation
                </button>
              </div>
            ) : (
              /* Confirmation Box with Comments */
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold capitalize text-slate-900">
                    Confirm {actionModal} Action
                  </span>
                  <button
                    onClick={() => setActionModal(null)}
                    className="text-xs font-semibold text-slate-500 hover:underline"
                  >
                    Cancel
                  </button>
                </div>

                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    actionModal === 'approve'
                      ? 'Optional manager approval comments...'
                      : 'Provide mandatory reasons / feedback for this decision...'
                  }
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
                />

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setActionModal(null)}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleAction}
                    disabled={processing}
                    className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-bold text-white shadow-xs transition-colors disabled:opacity-50 ${
                      actionModal === 'approve'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : actionModal === 'reject'
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : 'bg-amber-600 hover:bg-amber-700'
                    }`}
                  >
                    {processing ? 'Processing...' : `Confirm ${actionModal.toUpperCase()}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
