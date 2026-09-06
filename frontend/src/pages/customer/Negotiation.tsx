import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { quotationsApi, negotiationsApi, type NegotiationThread } from '../../api';
import type { Quotation } from '../../types';
import { useToast } from '../../components/Toast';
import { 
  getSocket, 
  joinNegotiation, 
  leaveNegotiation, 
  sendChatMessage, 
  sendCounterDiscountOffer, 
  emitTyping, 
  onConnectionStatusChange, 
  setActiveRoomQuotationId,
  type ConnectionStatus 
} from '../../services/socket';
import { 
  Send, 
  MessageSquare, 
  ArrowLeft, 
  RefreshCw, 
  Percent, 
  Sliders, 
  CheckCircle2, 
  Wifi, 
  WifiOff 
} from 'lucide-react';

export default function Negotiation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const params = useParams<{ quotationId?: string }>();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [activeQuotationId, setActiveQuotationId] = useState<string>(
    params.quotationId || searchParams.get('quotation') || ''
  );

  const [customerQuotations, setCustomerQuotations] = useState<Quotation[]>([]);
  const [currentQuotation, setCurrentQuotation] = useState<Quotation | null>(null);
  const [thread, setThread] = useState<NegotiationThread | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [messageInput, setMessageInput] = useState('');

  // Auto-refresh states
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // WebSocket real-time states
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [typingIndicator, setTypingIndicator] = useState<{ isTyping: boolean; name: string } | null>(null);

  // Counter-discount & change request form state
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [counterDiscount, setCounterDiscount] = useState('');
  const [counterNotes, setCounterNotes] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<any>(null);
  const incomingTypingTimerRef = useRef<any>(null);

  // Sync with URL parameter
  useEffect(() => {
    if (params.quotationId && params.quotationId !== activeQuotationId) {
      setActiveQuotationId(params.quotationId);
    }
  }, [params.quotationId]);

  // 1. Subscribe to WebSocket connection status
  useEffect(() => {
    const unsubscribe = onConnectionStatusChange((status) => {
      setConnectionStatus(status);
    });
    return () => unsubscribe();
  }, []);

  // 2. Load customer quotations for switcher
  useEffect(() => {
    async function loadQuotes() {
      try {
        const quotes = await quotationsApi.getAll();
        setCustomerQuotations(quotes || []);
        if (!activeQuotationId && quotes && quotes.length > 0 && quotes[0]) {
          const defaultId = quotes[0].id;
          setActiveQuotationId(defaultId);
          navigate(`/customer/negotiation/${defaultId}`, { replace: true });
        }
      } catch (err) {
        console.error('Failed to load quotations:', err);
      }
    }
    loadQuotes();
  }, []);

  // 3. Load quotation details & messages (supports silent background auto-refresh)
  const loadThread = useCallback(async (quoteId: string, silent = false) => {
    if (!quoteId) return;
    if (!silent) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    try {
      const [qData, threadData] = await Promise.all([
        quotationsApi.getById(quoteId, { forceRefresh: true }),
        negotiationsApi.getMessages(quoteId, { forceRefresh: true }),
      ]);
      setCurrentQuotation(qData);
      setThread((prev) => {
        if (!prev) return threadData;
        const prevMsgs = prev.messages || [];
        const newMsgs = threadData?.messages || [];
        if (prevMsgs.length === newMsgs.length) {
          const hasDifferentId = prevMsgs.some((m, idx) => m.id !== newMsgs[idx]?.id);
          const hasStatusChange = prev.status !== threadData?.status;
          const hasChangeReqDiff = (prev.changeRequests?.length || 0) !== (threadData?.changeRequests?.length || 0);
          if (!hasDifferentId && !hasStatusChange && !hasChangeReqDiff) {
            return prev;
          }
        }
        return threadData;
      });
      setLastRefreshed(new Date());
    } catch (err: any) {
      if (!silent) {
        console.error('Failed to load negotiation thread:', err);
        toast.fail(err.message || 'Failed to load negotiation thread');
      }
    } finally {
      if (!silent) setLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    if (activeQuotationId) {
      loadThread(activeQuotationId);
    }
  }, [activeQuotationId, loadThread]);

  // Background auto-refresh polling (every 5 seconds)
  useEffect(() => {
    if (!autoRefresh || !activeQuotationId) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !loading && !sending && !confirming) {
        loadThread(activeQuotationId, true);
      }
    }, 5000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && autoRefresh && !loading && !sending && !confirming) {
        loadThread(activeQuotationId, true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [autoRefresh, activeQuotationId, loading, sending, confirming, loadThread]);

  // 4. Manage WebSocket Room & Real-time Event Listeners
  useEffect(() => {
    if (!activeQuotationId) return;

    setActiveRoomQuotationId(activeQuotationId);
    const socket = getSocket();

    const doJoin = () => {
      joinNegotiation(activeQuotationId).catch((err) => {
        console.warn('Socket join_negotiation failed, relying on REST fallback:', err.message);
      });
    };

    doJoin();

    // Handler for incoming real-time messages
    const handleNewMessage = (newMsg: any) => {
      if (newMsg.quotationId && newMsg.quotationId !== activeQuotationId) {
        return;
      }

      setThread((prev) => {
        if (!prev) {
          return {
            id: newMsg.negotiationId || 'temp',
            quotationId: activeQuotationId,
            customerId: '',
            status: 'OPEN',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: [newMsg],
            changeRequests: [],
          };
        }

        // Check if message already exists by id or clientMessageId
        const exists = prev.messages.some(
          (m) => m.id === newMsg.id || (newMsg.clientMessageId && (m as any).clientMessageId === newMsg.clientMessageId)
        );

        if (exists) {
          // Replace optimistic placeholder with real confirmed message
          return {
            ...prev,
            messages: prev.messages.map((m) =>
              (newMsg.clientMessageId && (m as any).clientMessageId === newMsg.clientMessageId) || m.id === newMsg.id
                ? newMsg
                : m
            ),
          };
        }

        return {
          ...prev,
          messages: [...prev.messages, newMsg],
        };
      });

      // Clear typing indicator when a message arrives
      setTypingIndicator(null);
    };

    // Handler for typing notifications
    const handleUserTyping = (data: any) => {
      if (data.quotationId === activeQuotationId && data.userId !== user?.id) {
        if (data.isTyping) {
          setTypingIndicator({
            isTyping: true,
            name: data.name || 'Sales Representative',
          });

          if (incomingTypingTimerRef.current) {
            clearTimeout(incomingTypingTimerRef.current);
          }
          incomingTypingTimerRef.current = setTimeout(() => {
            setTypingIndicator(null);
          }, 3000);
        } else {
          setTypingIndicator(null);
        }
      }
    };

    // Handler for quotation status changes (e.g. counter discount submitted)
    const handleStatusChanged = (data: any) => {
      if (data.quotationId === activeQuotationId) {
        setCurrentQuotation((prev) => (prev ? { ...prev, status: data.status } : null));
        if (data.notice) {
          toast.info(data.notice, 'Quotation Status Updated');
        }
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('quotation_status_changed', handleStatusChanged);
    socket.on('connect', doJoin);
    socket.on('reconnect', doJoin);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('quotation_status_changed', handleStatusChanged);
      socket.off('connect', doJoin);
      socket.off('reconnect', doJoin);
      leaveNegotiation(activeQuotationId);
      setActiveRoomQuotationId(null);
    };
  }, [activeQuotationId, user?.id, toast]);

  // Auto-scroll to bottom of chat on new messages or typing
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages, typingIndicator]);

  // Handle typing debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    if (!activeQuotationId) return;

    emitTyping(activeQuotationId, true);

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    typingTimerRef.current = setTimeout(() => {
      emitTyping(activeQuotationId, false);
    }, 2000);
  };

  // Send regular message with optimistic update and WebSocket primary + REST fallback
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = messageInput.trim();
    if (!text || !activeQuotationId) return;

    const clientMessageId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const optimisticMessage = {
      id: clientMessageId,
      clientMessageId,
      negotiationId: thread?.id || 'temp',
      senderId: user?.id || 'me',
      message: text,
      createdAt: new Date().toISOString(),
      sender: {
        id: user?.id || 'me',
        name: user?.name || 'You',
        email: user?.email || '',
        role: user?.role || 'CUSTOMER',
      },
      pending: true,
    };

    // 1. Optimistic append
    setThread((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [...prev.messages, optimisticMessage as any],
      };
    });

    setMessageInput('');
    emitTyping(activeQuotationId, false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    setSending(true);

    try {
      // 2. Try sending via WebSocket
      await sendChatMessage({
        quotationId: activeQuotationId,
        message: text,
        clientMessageId,
      });
    } catch (wsErr: any) {
      console.warn('WebSocket message send failed, using REST API fallback:', wsErr);
      try {
        const saved = await negotiationsApi.sendMessage(activeQuotationId, text);
        setThread((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            messages: prev.messages.map((m) =>
              (m as any).clientMessageId === clientMessageId ? (saved as any) : m
            ),
          };
        });
      } catch (restErr: any) {
        toast.fail(restErr.message || 'Failed to send message.');
        // Remove optimistic message on permanent failure
        setThread((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            messages: prev.messages.filter((m) => (m as any).clientMessageId !== clientMessageId),
          };
        });
      }
    } finally {
      setSending(false);
    }
  };

  // Submit counter-discount request
  const handleSubmitCounterDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    const discount = parseFloat(counterDiscount);
    if (isNaN(discount) || discount <= 0 || !activeQuotationId) return;

    setSending(true);
    try {
      let result: any;
      try {
        const wsRes = await sendCounterDiscountOffer({
          quotationId: activeQuotationId,
          requestedDiscountPercent: discount,
          notes: counterNotes,
        });
        result = wsRes?.result;
      } catch (wsErr) {
        console.warn('WebSocket counter offer failed, falling back to REST:', wsErr);
        result = await negotiationsApi.requestChange(activeQuotationId, {
          requestedDiscountPercent: discount,
          notes: counterNotes,
        });
      }

      toast.success(
        result?.message?.message || result?.notice || `Counter-discount of ${discount}% submitted for review.`,
        'Counter-Offer Sent'
      );
      setCounterDiscount('');
      setCounterNotes('');
      setShowCounterForm(false);

      const [updatedQuote, updatedThread] = await Promise.all([
        quotationsApi.getById(activeQuotationId),
        negotiationsApi.getMessages(activeQuotationId),
      ]);
      setCurrentQuotation(updatedQuote);
      setThread(updatedThread);
    } catch (err: any) {
      toast.fail(err.message || 'Failed to submit counter-discount.');
    } finally {
      setSending(false);
    }
  };

  const handleConfirmQuote = async () => {
    if (!activeQuotationId) return;
    setConfirming(true);
    try {
      const updated = await quotationsApi.customerConfirm(activeQuotationId);
      toast.success('Quotation confirmed! Order processing has commenced.', 'Quotation Accepted');
      setCurrentQuotation(updated);
    } catch (err: any) {
      toast.fail(err.message || 'Failed to confirm quotation.', 'Confirmation Error');
    } finally {
      setConfirming(false);
    }
  };

  return (
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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Negotiation & Inquiry Hub</h1>
              {/* Real-time Connection Badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  connectionStatus === 'connected'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                    : connectionStatus === 'connecting' || connectionStatus === 'reconnecting'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                }`}
              >
                {connectionStatus === 'connected' ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <Wifi className="h-3 w-3" />
                    Live WebSocket
                  </>
                ) : connectionStatus === 'reconnecting' ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                    Reconnecting...
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3" />
                    Offline (Syncing)
                  </>
                )}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Direct real-time communication thread with your dedicated sales representative
            </p>
          </div>
        </div>

        {/* Header Right Side: Auto-refresh controls & Quotation Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Auto Refresh Controls */}
          <div className="flex items-center gap-2 bg-card border border-border/50 rounded-lg px-2.5 py-1.5 text-xs shadow-xs">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1.5 font-medium px-2 py-0.5 rounded transition-colors cursor-pointer ${
                autoRefresh 
                  ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20' 
                  : 'bg-muted text-muted-foreground hover:text-foreground border border-border/40'
              }`}
              title={autoRefresh ? "Auto-refresh is active (every 5s). Click to pause." : "Auto-refresh is paused. Click to resume."}
            >
              <span className={`h-2 w-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground'}`} />
              <span>Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}</span>
            </button>
            <button
              onClick={() => loadThread(activeQuotationId, false)}
              disabled={loading || isRefreshing}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh now"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${(loading || isRefreshing) ? 'animate-spin text-primary' : ''}`} />
            </button>
            {lastRefreshed && (
              <span className="text-[11px] text-muted-foreground hidden sm:inline" title="Last synced time">
                Synced {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>

          {/* Quotation Selector */}
          {customerQuotations.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Select Quote:</span>
              <select
                value={activeQuotationId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setActiveQuotationId(newId);
                  navigate(`/customer/negotiation/${newId}`);
                }}
                className="rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
              >
                {customerQuotations.map((q) => (
                  <option key={q.id} value={q.id} className="bg-card text-foreground">
                    {(q as any).quotationNumber || (q as any).quotation_number || q.id.slice(0, 8)} (${Number((q as any).totalAmount || (q as any).grand_total || 0).toFixed(2)}) - {q.status}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Left Chat, Right Quotation & Counter-Offer Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Chat Thread */}
        <div className="lg:col-span-2 flex flex-col rounded-xl border border-border/50 bg-card shadow-xs overflow-hidden h-[620px]">
          <div className="flex items-center justify-between border-b border-border/50 bg-muted/20 px-6 py-3.5">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-foreground">
                Discussion: {(currentQuotation as any)?.quotationNumber || activeQuotationId.slice(0, 8)}
              </span>
              {isRefreshing && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 animate-pulse">
                  <RefreshCw className="h-2.5 w-2.5 animate-spin text-primary" />
                  Syncing
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-muted border border-border/50 px-2.5 py-0.5 text-xs font-bold text-foreground">
                {currentQuotation?.status || 'ACTIVE'}
              </span>
            </div>
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
                const isPending = (m as any).pending;

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isCustomerSender ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 px-1">
                      <span className="font-semibold text-foreground/80">{senderName}</span>
                      <span>•</span>
                      <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isPending && <span className="text-[10px] text-muted-foreground italic">(sending...)</span>}
                    </div>

                    <div
                      className={`max-w-md rounded-2xl px-4 py-2.5 text-sm shadow-xs transition-opacity ${
                        isPending ? 'opacity-70' : 'opacity-100'
                      } ${
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
            )}

            {/* Live Typing Indicator */}
            {typingIndicator?.isTyping && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground italic py-1 px-2 animate-pulse">
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
                </span>
                <span>{typingIndicator.name} is typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Form */}
          <form onSubmit={handleSendMessage} className="border-t border-border/50 bg-card p-3 flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={handleInputChange}
              placeholder="Type a real-time message or inquiry to sales representative..."
              disabled={sending}
              className="flex-1 rounded-lg border border-border/60 bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending || !messageInput.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
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
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
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

            <div className="pt-2 space-y-2">
              {(currentQuotation?.status === 'APPROVED' || currentQuotation?.status === 'NEGOTIATION') && (
                <button
                  type="button"
                  onClick={handleConfirmQuote}
                  disabled={confirming}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {confirming ? 'Confirming...' : 'Accept & Confirm Quotation'}
                </button>
              )}

              <button
                onClick={() => setShowCounterForm(!showCounterForm)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs font-bold text-purple-400 hover:bg-purple-500/20 transition-colors shadow-xs cursor-pointer"
              >
                <Percent className="h-4 w-4" />
                {showCounterForm ? 'Hide Counter-Discount Form' : 'Request Counter-Discount'}
              </button>
            </div>
          </div>

          {/* Counter-Discount Submission Box */}
          {showCounterForm && (
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
                <Sliders className="h-4 w-4" />
                <span>Submit Counter-Discount Offer</span>
              </div>
              <p className="text-xs text-purple-300/80 leading-relaxed">
                Submit a target discount percentage. Your request will be evaluated under discount governance and submitted for manager approval.
              </p>

              <form onSubmit={handleSubmitCounterDiscount} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-purple-300 mb-1">
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
                  <label className="block text-xs font-semibold uppercase tracking-wider text-purple-300 mb-1">
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
                  className="w-full rounded-lg bg-primary p-2.5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
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
