import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { quotationsApi, negotiationsApi, type NegotiationThread } from '../../api';
import type { Quotation } from '../../types';
import { 
  Send, 
  MessageSquare, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  RefreshCw,
  Percent,
  Sliders,
  Sparkles
} from 'lucide-react';

export default function Negotiation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const params = useParams<{ quotationId?: string }>();
  const [searchParams] = useSearchParams();

  const [activeQuotationId, setActiveQuotationId] = useState<string>(
    params.quotationId || searchParams.get('quotation') || ''
  );

  const [customerQuotations, setCustomerQuotations] = useState<Quotation[]>([]);
  const [currentQuotation, setCurrentQuotation] = useState<Quotation | null>(null);
  const [thread, setThread] = useState<NegotiationThread | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageInput, setMessageInput] = useState('');

  // Counter-discount & change request form state
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [counterDiscount, setCounterDiscount] = useState('');
  const [counterNotes, setCounterNotes] = useState('');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Load customer quotations for switcher
  useEffect(() => {
    async function loadQuotes() {
      try {
        const quotes = await quotationsApi.getAll();
        setCustomerQuotations(quotes || []);
        if (!activeQuotationId && quotes && quotes.length > 0 && quotes[0]) {
          setActiveQuotationId(quotes[0].id);
        }
      } catch (err) {
        console.error('Failed to load quotations:', err);
      }
    }
    loadQuotes();
  }, []);

  // 2. Load quotation details & negotiation thread
  useEffect(() => {
    if (!activeQuotationId) return;

    async function loadThread() {
      setLoading(true);
      setStatusNotice(null);
      try {
        const [qData, threadData] = await Promise.all([
          quotationsApi.getById(activeQuotationId),
          negotiationsApi.getMessages(activeQuotationId),
        ]);
        setCurrentQuotation(qData);
        setThread(threadData);
      } catch (err) {
        console.error('Failed to load negotiation thread:', err);
      } finally {
        setLoading(false);
      }
    }
    loadThread();
  }, [activeQuotationId]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages]);

  // Send regular message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeQuotationId) return;

    setSending(true);
    try {
      await negotiationsApi.sendMessage(activeQuotationId, messageInput.trim());
      setMessageInput('');
      // Reload thread
      const updated = await negotiationsApi.getMessages(activeQuotationId);
      setThread(updated);
    } catch (err: any) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  // Propose Counter-Discount / Change Request
  const handleSubmitCounterDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterDiscount || !activeQuotationId) return;

    setSending(true);
    setStatusNotice(null);

    try {
      const discountVal = parseFloat(counterDiscount);
      const res = await negotiationsApi.requestChange(activeQuotationId, {
        requestedDiscountPercent: discountVal,
        notes: counterNotes,
        message: `Customer requests ${discountVal}% counter-discount. ${counterNotes}`,
      });

      setStatusNotice('Request submitted for approval.');
      setShowCounterForm(false);
      setCounterDiscount('');
      setCounterNotes('');

      // Refresh thread and quotation status from backend
      const [updatedQ, updatedThread] = await Promise.all([
        quotationsApi.getById(activeQuotationId),
        negotiationsApi.getMessages(activeQuotationId),
      ]);
      setCurrentQuotation(updatedQ);
      setThread(updatedThread);
    } catch (err: any) {
      setStatusNotice(err.message || 'Failed to submit counter-discount request.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/customer/quotations')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Negotiation & Inquiry Hub</h1>
            <p className="text-sm text-slate-500">
              Direct communication thread with your dedicated sales representative
            </p>
          </div>
        </div>

        {/* Quotation Selector */}
        {customerQuotations.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Select Quote:</span>
            <select
              value={activeQuotationId}
              onChange={(e) => setActiveQuotationId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-600 focus:outline-none"
            >
              {customerQuotations.map((q) => (
                <option key={q.id} value={q.id}>
                  {(q as any).quotationNumber || (q as any).quotation_number || q.id.slice(0, 8)} (${Number((q as any).totalAmount || (q as any).grand_total || 0).toFixed(2)})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {statusNotice && (
        <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm font-semibold text-indigo-900 shadow-xs">
          <span>{statusNotice}</span>
          <button onClick={() => setStatusNotice(null)} className="text-xs font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Left Chat, Right Quotation & Counter-Offer Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Chat Thread */}
        <div className="lg:col-span-2 flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden h-[600px]">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3.5">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-bold text-slate-800">
                Discussion: {(currentQuotation as any)?.quotationNumber || activeQuotationId.slice(0, 8)}
              </span>
            </div>
            <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700">
              {currentQuotation?.status || 'ACTIVE'}
            </span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              </div>
            ) : !thread?.messages || thread.messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                <MessageSquare className="h-10 w-10 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">No messages in this negotiation yet</p>
                <p className="text-xs text-slate-400">Start the conversation below or request a counter-discount.</p>
              </div>
            ) : (
              thread.messages.map((m) => {
                const isCustomerSender = m.sender?.role === 'CUSTOMER' || m.senderId === user?.id;
                const senderName = isCustomerSender ? 'You' : (m.sender?.name || 'Sales Representative');
                const isChangeRequest = m.message.includes('[CHANGE REQUEST]');

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isCustomerSender ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1 px-1">
                      <span className="font-semibold text-slate-700">{senderName}</span>
                      <span>•</span>
                      <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`max-w-md rounded-2xl px-4 py-2.5 text-sm shadow-xs ${
                        isChangeRequest
                          ? 'border-2 border-amber-300 bg-amber-50 font-medium text-amber-950'
                          : isCustomerSender
                          ? 'bg-indigo-600 text-white'
                          : 'border border-slate-200 bg-white text-slate-800'
                      }`}
                    >
                      {m.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Form */}
          <form onSubmit={handleSendMessage} className="border-t border-slate-200 bg-white p-3 flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type a message or inquiry to sales representative..."
              disabled={sending}
              className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending || !messageInput.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Send className="h-4 w-4" />
              Send
            </button>
          </form>
        </div>

        {/* Right: Quotation Snapshot & Counter-Discount Form */}
        <div className="space-y-5">
          {/* Quotation Snapshot */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Quotation Summary</h3>
              <span className="text-xs font-semibold text-indigo-600">
                {(currentQuotation as any)?.quotationNumber || activeQuotationId.slice(0, 8)}
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">${Number((currentQuotation as any)?.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Applied Discount:</span>
                <span className="font-semibold text-rose-600">-${Number((currentQuotation as any)?.discountAmount || (currentQuotation as any)?.discount_total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax:</span>
                <span className="font-semibold text-slate-900">+${Number((currentQuotation as any)?.taxAmount || (currentQuotation as any)?.tax_total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-bold">
                <span>Total Amount:</span>
                <span className="text-indigo-600">${Number((currentQuotation as any)?.totalAmount || (currentQuotation as any)?.grand_total || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowCounterForm(!showCounterForm)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-purple-300 bg-purple-50 px-4 py-2 text-xs font-bold text-purple-800 hover:bg-purple-100 transition-colors shadow-xs"
              >
                <Percent className="h-4 w-4" />
                {showCounterForm ? 'Hide Counter-Discount Form' : 'Request Counter-Discount'}
              </button>
            </div>
          </div>

          {/* Counter-Discount Submission Box */}
          {showCounterForm && (
            <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
                <Sliders className="h-4 w-4" />
                <span>Submit Counter-Discount Offer</span>
              </div>
              <p className="text-xs text-purple-800/80 leading-relaxed">
                Submit a target discount percentage. Your request will be evaluated under DealFlow360 discount governance and submitted for manager approval.
              </p>

              <form onSubmit={handleSubmitCounterDiscount} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-purple-900 mb-1">
                    Requested Discount (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    step="0.5"
                    required
                    placeholder="e.g. 15"
                    value={counterDiscount}
                    onChange={(e) => setCounterDiscount(e.target.value)}
                    className="w-full rounded-lg border border-purple-300 bg-white p-2 text-sm text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-purple-900 mb-1">
                    Justification / Commitment
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Requesting 15% discount for bulk deployment commitment..."
                    value={counterNotes}
                    onChange={(e) => setCounterNotes(e.target.value)}
                    className="w-full rounded-lg border border-purple-300 bg-white p-2 text-xs text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending || !counterDiscount}
                  className="w-full rounded-lg bg-purple-700 p-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple-800 disabled:opacity-50 transition-colors"
                >
                  {sending ? 'Submitting for Governance...' : 'Submit Counter-Offer'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
