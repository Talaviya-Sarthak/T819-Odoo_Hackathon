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
  ExternalLink,
  User,
  Wifi, 
  WifiOff,
  AlertTriangle,
  Clock
} from 'lucide-react';

export default function SalesNegotiation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const params = useParams<{ quotationId?: string }>();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [activeQuotationId, setActiveQuotationId] = useState<string>(
    params.quotationId || searchParams.get('quotation') || ''
  );

  const [quotationsList, setQuotationsList] = useState<Quotation[]>([]);
  const [currentQuotation, setCurrentQuotation] = useState<Quotation | null>(null);
  const [thread, setThread] = useState<NegotiationThread | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageInput, setMessageInput] = useState('');

  // Auto-refresh states
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // WebSocket real-time states
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [typingIndicator, setTypingIndicator] = useState<{ isTyping: boolean; name: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<any>(null);
  const incomingTypingTimerRef = useRef<any>(null);

  // Sync with URL parameter
  useEffect(() => {
    if (params.quotationId && params.quotationId !== activeQuotationId) {
      setActiveQuotationId(params.quotationId);
    }
  }, [params.quotationId]);

  // 1. Subscribe to connection status
  useEffect(() => {
    const unsubscribe = onConnectionStatusChange((status) => {
      setConnectionStatus(status);
    });
    return () => unsubscribe();
  }, []);

  // 2. Load quotations for dropdown switcher
  useEffect(() => {
    async function loadQuotes() {
      try {
        const quotes = await quotationsApi.getAll();
        setQuotationsList(quotes || []);
        if (!activeQuotationId && quotes && quotes.length > 0 && quotes[0]) {
          const defaultId = quotes[0].id;
          setActiveQuotationId(defaultId);
          navigate(`/sales/negotiation/${defaultId}`, { replace: true });
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
      if (document.visibilityState === 'visible' && !loading && !sending) {
        loadThread(activeQuotationId, true);
      }
    }, 5000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && autoRefresh && !loading && !sending) {
        loadThread(activeQuotationId, true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [autoRefresh, activeQuotationId, loading, sending, loadThread]);

  // 4. Manage WebSocket Room & Real-time Event Listeners
  useEffect(() => {
    if (!activeQuotationId) return;

    setActiveRoomQuotationId(activeQuotationId);
    const socket = getSocket();

    const doJoin = () => {
      joinNegotiation(activeQuotationId).catch((err) => {
        console.warn('Sales socket join_negotiation failed:', err.message);
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

        const exists = prev.messages.some(
          (m) => m.id === newMsg.id || (newMsg.clientMessageId && (m as any).clientMessageId === newMsg.clientMessageId)
        );

        if (exists) {
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

      setTypingIndicator(null);
    };

    // Handler for customer typing
    const handleUserTyping = (data: any) => {
      if (data.quotationId === activeQuotationId && data.userId !== user?.id) {
        if (data.isTyping) {
          setTypingIndicator({
            isTyping: true,
            name: data.name || 'Customer',
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

    // Handler for quotation status change
    const handleStatusChanged = (data: any) => {
      if (data.quotationId === activeQuotationId) {
        setCurrentQuotation((prev) => (prev ? { ...prev, status: data.status } : null));
        // Refresh change requests in thread
        negotiationsApi.getMessages(activeQuotationId).then(setThread).catch(() => {});
        if (data.notice) {
          toast.info(data.notice, 'Quotation Status Updated');
        }
      }
    };

    const handleReconnect = () => {
      joinNegotiation(activeQuotationId).catch(() => {});
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

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages, typingIndicator]);

  // Handle typing indicator emission
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

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = messageInput.trim();
    if (!text || !activeQuotationId) return;

    const clientMessageId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const optimisticMessage = {
      id: clientMessageId,
      clientMessageId,
      negotiationId: thread?.id || 'temp',
      senderId: user?.id || 'rep',
      message: text,
      createdAt: new Date().toISOString(),
      sender: {
        id: user?.id || 'rep',
        name: user?.name || 'Sales Representative',
        email: user?.email || '',
        role: user?.role || 'SALES_REP',
      },
      pending: true,
    };

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
      await sendChatMessage({
        quotationId: activeQuotationId,
        message: text,
        clientMessageId,
      });
    } catch (wsErr) {
      console.warn('Sales WebSocket message send failed, using REST fallback:', wsErr);
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
        toast.fail(restErr.message || 'Failed to send message');
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

  const customerName = (currentQuotation as any)?.customer?.name || (currentQuotation as any)?.customer_name || 'Client';
  const customerEmail = (currentQuotation as any)?.customer?.email || 'N/A';
  const quoteNumber = (currentQuotation as any)?.quotationNumber || (currentQuotation as any)?.quotation_number || activeQuotationId.slice(0, 8);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/sales/quotations')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 bg-card text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Customer Negotiation & Inquiry Hub</h1>
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
              Direct real-time negotiation channel with client for price adjustments and terms
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

          {/* Quotation Switcher */}
          {quotationsList.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Select Quotation:</span>
              <select
                value={activeQuotationId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setActiveQuotationId(newId);
                  navigate(`/sales/negotiation/${newId}`);
                }}
                className="rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
              >
                {quotationsList.map((q) => (
                  <option key={q.id} value={q.id} className="bg-card text-foreground">
                    {(q as any).quotationNumber || (q as any).quotation_number || q.id.slice(0, 8)} - {(q as any).customer?.name || 'Customer'} ({q.status})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Chat Thread on Left, Quotation & Counter-Offers on Right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chat Thread */}
        <div className="lg:col-span-2 flex flex-col rounded-xl border border-border/50 bg-card shadow-xs overflow-hidden h-[620px]">
          <div className="flex items-center justify-between border-b border-border/50 bg-muted/20 px-6 py-3.5">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-foreground">
                Quotation: {quoteNumber} ({customerName})
              </span>
              {isRefreshing && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 animate-pulse">
                  <RefreshCw className="h-2.5 w-2.5 animate-spin text-primary" />
                  Syncing
                </span>
              )}
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
                <span className="text-xs text-muted-foreground font-medium">Loading conversation...</span>
              </div>
            ) : !thread?.messages || thread.messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm font-medium text-foreground">No negotiation messages yet</p>
                <p className="text-xs text-muted-foreground">The client has not posted any inquiry or counter-offer for this quotation.</p>
              </div>
            ) : (
              thread.messages.map((m) => {
                const isSalesRep = m.sender?.role !== 'CUSTOMER' && (m.senderId === user?.id || m.sender?.role === 'SALES_REP' || m.sender?.role === 'ADMIN');
                const senderName = isSalesRep ? 'You (Sales Rep)' : (m.sender?.name || customerName);
                const isChangeRequest = m.message.includes('[CHANGE REQUEST]');
                const isPending = (m as any).pending;

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isSalesRep ? 'items-end' : 'items-start'}`}
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
                          : isSalesRep
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

          {/* Reply Input Form */}
          <form onSubmit={handleSendMessage} className="border-t border-border/50 bg-card p-3 flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={handleInputChange}
              placeholder="Type your response to the client..."
              disabled={sending}
              className="flex-1 rounded-lg border border-border/60 bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending || !messageInput.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Send className="h-4 w-4" />
              Reply
            </button>
          </form>
        </div>

        {/* Right: Quotation Summary & Counter-Offer Queue */}
        <div className="space-y-5">
          {/* Quotation Info Box */}
          <div className="rounded-xl border border-border/50 bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="text-sm font-bold text-foreground">Deal Overview</h3>
              <button
                onClick={() => navigate(`/sales/quote-builder/${activeQuotationId}`)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                Quote Builder <ExternalLink className="h-3 w-3" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Customer:
                </span>
                <span className="font-semibold text-foreground">{customerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Email:</span>
                <span className="font-mono text-foreground">{customerEmail}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Stage:</span>
                <span className="font-semibold text-primary">{currentQuotation?.status || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border/40 pt-2 text-sm font-bold">
                <span>Total Amount:</span>
                <span className="text-foreground">
                  ${Number((currentQuotation as any)?.totalAmount || (currentQuotation as any)?.grand_total || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Change Requests / Counter-Offers History */}
          <div className="rounded-xl border border-border/50 bg-card p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-bold text-foreground">Change Requests</h3>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                {thread?.changeRequests?.length || 0} requested
              </span>
            </div>

            {!thread?.changeRequests || thread.changeRequests.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 text-center">
                No change requests or counter-discounts on record.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto">
                {thread.changeRequests.map((cr: any) => (
                  <div
                    key={cr.id}
                    className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-300 uppercase tracking-wide text-[11px]">
                        {cr.changeType}
                      </span>
                      <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-purple-300">
                        {cr.status}
                      </span>
                    </div>

                    {cr.newValue?.requestedDiscountPercent !== undefined && (
                      <p className="text-foreground font-medium">
                        Target Discount: <span className="text-rose-400 font-bold">{cr.newValue.requestedDiscountPercent}%</span>
                      </p>
                    )}

                    {cr.newValue?.notes && (
                      <p className="text-muted-foreground italic text-[11px]">
                        "{cr.newValue.notes}"
                      </p>
                    )}

                    <div className="pt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{new Date(cr.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
