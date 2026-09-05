import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
<<<<<<< Updated upstream
import { getNegotiation, sendMessage, requestChange } from '../../services/negotiations.api';
import type { NegotiationMessage } from '../../types';
=======
import { quotationsApi, negotiationsApi, type NegotiationThread } from '../../api';
import type { Quotation } from '../../types';
import { useToast } from '../../components/Toast';
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
>>>>>>> Stashed changes

export default function Negotiation() {
  const [searchParams] = useSearchParams();
<<<<<<< Updated upstream
  const quotationId = searchParams.get('quotation') || '';
  const [messages, setMessages] = useState<NegotiationMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
=======
  const { toast } = useToast();

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

>>>>>>> Stashed changes
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (quotationId) loadNegotiation();
  }, [quotationId]);

<<<<<<< Updated upstream
=======
  // 2. Load quotation details & negotiation thread
  useEffect(() => {
    if (!activeQuotationId) return;

    async function loadThread() {
      setLoading(true);
      try {
        const [qData, threadData] = await Promise.all([
          quotationsApi.getById(activeQuotationId),
          negotiationsApi.getMessages(activeQuotationId),
        ]);
        setCurrentQuotation(qData);
        setThread(threadData);
      } catch (err: any) {
        console.error('Failed to load negotiation thread:', err);
        toast.fail(err.message || 'Failed to load negotiation thread');
      } finally {
        setLoading(false);
      }
    }
    loadThread();
  }, [activeQuotationId]);

  // Scroll to bottom of chat
>>>>>>> Stashed changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadNegotiation() {
    try {
<<<<<<< Updated upstream
      setLoading(true);
      const res = await getNegotiation(quotationId);
      setMessages(res.negotiation?.messages || []);
    } catch {
      toast('Failed to load negotiation', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!newMessage.trim() || !quotationId) return;
    try {
      setSending(true);
      const res = await sendMessage(quotationId, { message: newMessage.trim() });
      setMessages((prev) => [...prev, res.message]);
      setNewMessage('');
      toast('Message sent', 'success');
    } catch {
      toast('Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  }

  async function handleDiscountRequest() {
    if (!discountPercent || !quotationId) return;
    try {
      setSending(true);
      await requestChange(quotationId, {
        field: 'discount_percent',
        current_value: 0,
        proposed_value: Number(discountPercent),
        message: `Requesting ${discountPercent}% discount`,
      });
      setDiscountPercent('');
      toast('Discount request submitted', 'success');
      loadNegotiation();
    } catch {
      toast('Failed to submit discount request', 'error');
=======
      await negotiationsApi.sendMessage(activeQuotationId, messageInput.trim());
      setMessageInput('');
      // Reload thread
      const updated = await negotiationsApi.getMessages(activeQuotationId);
      setThread(updated);
    } catch (err: any) {
      toast.fail(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Propose Counter-Discount / Change Request
  const handleSubmitCounterDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterDiscount || !activeQuotationId) return;

    setSending(true);
    try {
      const discountVal = parseFloat(counterDiscount);
      await negotiationsApi.requestChange(activeQuotationId, {
        requestedDiscountPercent: discountVal,
        notes: counterNotes,
        message: `Customer requests ${discountVal}% counter-discount. ${counterNotes}`,
      });

      toast.success('Counter-discount request submitted for manager review.', 'Offer Submitted');
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
      toast.fail(err.message || 'Failed to submit counter-discount request.', 'Request Failed');
>>>>>>> Stashed changes
    } finally {
      setSending(false);
    }
  }

  if (!quotationId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Negotiation</h1>
          <p className="text-sm text-gray-500">Select a quotation to view negotiation</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          Please select a quotation from the quotations page to start negotiation.
        </div>
      </div>
    );
  }

  return (
<<<<<<< Updated upstream
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Negotiation</h1>
        <p className="text-sm text-gray-500">Quotation #{quotationId.slice(0, 8).toUpperCase()}</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex h-96 flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <p className="text-center text-sm text-gray-500">Loading messages...</p>
            ) : messages.length === 0 ? (
              <p className="text-center text-sm text-gray-500">No messages yet. Start the conversation below.</p>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isMine = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs rounded-lg px-4 py-2 ${isMine ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
                        <p className="text-xs font-medium opacity-70">{msg.sender_name || 'User'}</p>
                        <p className="text-sm">{msg.message}</p>
                        <p className="mt-1 text-xs opacity-50">{new Date(msg.created_at).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
=======
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/customer/quotations')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 bg-card text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Negotiation & Inquiry Hub</h1>
            <p className="text-sm text-muted-foreground">
              Direct communication thread with your dedicated sales representative
            </p>
          </div>
        </div>

        {/* Quotation Selector */}
        {customerQuotations.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Select Quote:</span>
            <select
              value={activeQuotationId}
              onChange={(e) => setActiveQuotationId(e.target.value)}
              className="rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
            >
              {customerQuotations.map((q) => (
                <option key={q.id} value={q.id} className="bg-card text-foreground">
                  {(q as any).quotationNumber || (q as any).quotation_number || q.id.slice(0, 8)} (${Number((q as any).totalAmount || (q as any).grand_total || 0).toFixed(2)})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Grid: Left Chat, Right Quotation & Counter-Offer Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Chat Thread */}
        <div className="lg:col-span-2 flex flex-col rounded-xl border border-border/50 bg-card shadow-xs overflow-hidden h-[600px]">
          <div className="flex items-center justify-between border-b border-border/50 bg-muted/20 px-6 py-3.5">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-foreground">
                Discussion: {(currentQuotation as any)?.quotationNumber || activeQuotationId.slice(0, 8)}
              </span>
            </div>
            <span className="rounded-full bg-muted border border-border/50 px-2.5 py-0.5 text-xs font-bold text-foreground">
              {currentQuotation?.status || 'ACTIVE'}
            </span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-background/50">
            {loading ? (
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">Loading negotiation messages...</span>
              </div>
            ) : !thread?.messages || thread.messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm font-medium text-foreground">No messages in this negotiation yet</p>
                <p className="text-xs text-muted-foreground">Start the conversation below or request a counter-discount.</p>
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
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 px-1">
                      <span className="font-semibold text-foreground/80">{senderName}</span>
                      <span>•</span>
                      <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`max-w-md rounded-2xl px-4 py-2.5 text-sm shadow-xs ${
                        isChangeRequest
                          ? 'border border-amber-500/30 bg-amber-500/10 font-medium text-amber-300'
                          : isCustomerSender
                          ? 'bg-primary text-primary-foreground'
                          : 'border border-border/50 bg-muted/40 text-foreground'
                      }`}
                    >
                      {m.message}
                    </div>
                  </div>
                );
              })
>>>>>>> Stashed changes
            )}
          </div>

<<<<<<< Updated upstream
          <div className="border-t border-gray-200 p-4">
            <div className="mb-3 flex items-end gap-2">
              <div className="flex-1">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                />
              </div>
              <Button onClick={handleSend} loading={sending}>Send</Button>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  placeholder="Discount %"
                />
              </div>
              <Button variant="secondary" onClick={handleDiscountRequest} loading={sending}>
                Request Discount
              </Button>
            </div>
          </div>
=======
          {/* Message Input Form */}
          <form onSubmit={handleSendMessage} className="border-t border-border/50 bg-card p-3 flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type a message or inquiry to sales representative..."
              disabled={sending}
              className="flex-1 rounded-lg border border-border/60 bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending || !messageInput.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Send className="h-4 w-4" />
              Send
            </button>
          </form>
        </div>

        {/* Right: Quotation Snapshot & Counter-Discount Form */}
        <div className="space-y-5">
          {/* Quotation Snapshot */}
          <div className="rounded-xl border border-border/50 bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="text-sm font-bold text-foreground">Quotation Summary</h3>
              <span className="text-xs font-semibold text-primary">
                {(currentQuotation as any)?.quotationNumber || activeQuotationId.slice(0, 8)}
              </span>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-foreground">${Number((currentQuotation as any)?.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Applied Discount:</span>
                <span className="font-semibold text-rose-400">-${Number((currentQuotation as any)?.discountAmount || (currentQuotation as any)?.discount_total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax:</span>
                <span className="font-semibold text-foreground">+${Number((currentQuotation as any)?.taxAmount || (currentQuotation as any)?.tax_total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-border/40 pt-2 text-sm font-bold">
                <span>Total Amount:</span>
                <span className="text-primary">${Number((currentQuotation as any)?.totalAmount || (currentQuotation as any)?.grand_total || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowCounterForm(!showCounterForm)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs font-bold text-purple-400 hover:bg-purple-500/20 transition-colors shadow-xs"
              >
                <Percent className="h-4 w-4" />
                {showCounterForm ? 'Hide Counter-Discount Form' : 'Request Counter-Discount'}
              </button>
            </div>
          </div>

          {/* Counter-Discount Submission Box */}
          {showCounterForm && (
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                <Sliders className="h-4 w-4" />
                <span>Submit Counter-Discount Offer</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Submit a target discount percentage. Your request will be evaluated under discount governance and submitted for manager approval.
              </p>

              <form onSubmit={handleSubmitCounterDiscount} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
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
                    className="w-full rounded-lg border border-border/60 bg-background p-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Justification / Commitment
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Requesting 15% discount for bulk deployment commitment..."
                    value={counterNotes}
                    onChange={(e) => setCounterNotes(e.target.value)}
                    className="w-full rounded-lg border border-border/60 bg-background p-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending || !counterDiscount}
                  className="w-full rounded-lg bg-primary p-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {sending ? 'Submitting for Governance...' : 'Submit Counter-Offer'}
                </button>
              </form>
            </div>
          )}
>>>>>>> Stashed changes
        </div>
      </div>
    </div>
  );
}
