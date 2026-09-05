import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  X, 
  BotMessageSquare, 
  RotateCcw, 
  ChevronDown, 
  FileText, 
  Check, 
  Copy, 
  ArrowUp
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../../context/AuthContext';
import { ragChatApi, type ChatCitation } from '../../api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolUsed?: string;
  citations?: ChatCitation[];
  isError?: boolean;
}

// Routes where the support chatbot should NOT appear
const AUTH_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-otp',
  '/auth',
  '/unauthorized'
];

export default function SupportChatbot() {
  const { user } = useAuth();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeCitationDoc, setActiveCitationDoc] = useState<string | null>(null);

  const sessionIdRef = useRef<string>(
    sessionStorage.getItem('rag_chat_session_id') || `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: "Hello! I am your **DealFlow Support Chatbot**.\n\nAsk any question regarding products, pricing, quotation workflows, discount approvals, or platform policies.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);

  // Persist session ID
  useEffect(() => {
    sessionStorage.setItem('rag_chat_session_id', sessionIdRef.current);
  }, []);

  // Smooth scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Handle textarea auto-resize
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    const textarea = e.target;
    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    textarea.style.height = `${Math.min(Math.max(scrollHeight, 24), 160)}px`;
  };

  // Close with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Visibility guard: Hide chatbot if not authenticated or on any auth routes
  const isAuthPage = AUTH_ROUTES.some((route) => location.pathname.startsWith(route)) || location.pathname === '/';
  if (!user || isAuthPage) {
    return null;
  }

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '24px';
    }
    setIsLoading(true);

    try {
      const response = await ragChatApi.sendMessage(
        text,
        sessionIdRef.current,
        user ? user.id : undefined
      );

      if (response && response.success) {
        const botAnswer = response.message || response.answer || (response as any).data?.answer || (response as any).data?.message;
        const assistantMessage: Message = {
          id: `asst_${Date.now()}`,
          role: 'assistant',
          content: botAnswer || "I couldn't find a direct answer in the knowledge base.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          toolUsed: response.toolUsed,
          citations: response.citations,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(response?.error || 'Failed to generate response');
      }
    } catch (err: any) {
      const errorMessage: Message = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: "I encountered an error querying the knowledge base. Please try rephrasing your question.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        role: 'assistant',
        content: "Conversation history cleared. What can I help you with?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans antialiased text-zinc-100">
      {/* Floating Trigger Button - Minimalist Black/White/Grey Chatbot Logo */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center justify-center w-13 h-13 rounded-full bg-zinc-950 hover:bg-zinc-900 text-white border border-zinc-800 hover:border-zinc-600 shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none"
          title="Open Support Chatbot"
          aria-label="Open Support Chatbot"
        >
          <div className="relative flex items-center justify-center">
            <BotMessageSquare className="w-6 h-6 text-zinc-100 group-hover:text-white transition-colors" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-zinc-950 rounded-full" />
          </div>
        </button>
      )}

      {/* Chat Window Container - Monochromatic Black / Grey / White */}
      {isOpen && (
        <div
          className="flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden w-[92vw] sm:w-[420px] md:w-[440px] h-[580px] max-h-[85vh]"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08)'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/90 border-b border-zinc-800 select-none">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 text-white">
                <BotMessageSquare className="w-4.5 h-4.5 text-zinc-100" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white tracking-tight">DealFlow Chatbot</span>
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                    RAG
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Online</span>
                </div>
              </div>
            </div>

            {/* Window Controls - Clear & Close */}
            <div className="flex items-center gap-1 text-zinc-400">
              <button
                onClick={handleClearChat}
                className="p-1.5 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                title="Clear conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                title="Close chat (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm scroll-smooth">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-start gap-2.5 max-w-[88%]">
                  {msg.role === 'assistant' && (
                    <div className="flex-shrink-0 w-6 h-6 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 mt-1">
                      <BotMessageSquare className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`rounded-2xl px-4 py-3 text-[13px] leading-relaxed transition-all ${
                      msg.role === 'user'
                        ? 'bg-zinc-100 text-zinc-950 font-medium rounded-tr-xs shadow-sm'
                        : msg.isError
                        ? 'bg-zinc-900 border border-red-900/60 text-red-300 rounded-tl-xs'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-xs shadow-sm'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="chatbot-markdown text-zinc-200">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}

                  </div>
                </div>

                {/* Metadata & Actions row */}
                <div className="flex items-center gap-2 mt-1 px-1 text-[10.5px] text-zinc-500">
                  <span>{msg.timestamp}</span>
                  {msg.role === 'assistant' && !msg.isError && (
                    <button
                      onClick={() => handleCopy(msg.content, msg.id)}
                      className="hover:text-zinc-300 transition-colors p-0.5 rounded"
                      title="Copy answer"
                    >
                      {copiedId === msg.id ? (
                        <span className="flex items-center gap-1 text-zinc-200 font-medium">
                          <Check className="w-3 h-3" /> Copied
                        </span>
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator with monochrome bouncing dots */}
            {isLoading && (
              <div className="flex items-start gap-2.5 max-w-[85%]">
                <div className="w-6 h-6 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 mt-1">
                  <BotMessageSquare className="w-3.5 h-3.5" />
                </div>
                <div className="rounded-2xl rounded-tl-xs px-4 py-3 bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-2.5 text-xs">
                  <div className="flex items-center gap-1 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-zinc-400">Searching knowledge base...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Standard Chatbot Input Area */}
          <div className="p-3 bg-zinc-950 border-t border-zinc-800">
            <div className="flex items-end gap-2 bg-zinc-900 border border-zinc-800 focus-within:border-zinc-600 rounded-2xl p-2.5 transition-all">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                disabled={isLoading}
                className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none leading-6 px-1 py-0.5 max-h-40 overflow-y-auto block"
                style={{ minHeight: '24px' }}
              />
              
              {/* Send / Upload Button with High-Visibility White Arrow */}
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all flex-shrink-0 mb-0.5 ${
                  input.trim() && !isLoading
                    ? 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 shadow-sm cursor-pointer active:scale-95'
                    : 'bg-zinc-900/50 border border-zinc-800/80 cursor-not-allowed opacity-50'
                }`}
                title="Send message (Enter)"
                aria-label="Send message"
              >
                <ArrowUp 
                  className={`w-4 h-4 transition-colors ${input.trim() && !isLoading ? 'text-white' : 'text-zinc-400'}`} 
                  strokeWidth={2.5} 
                />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 px-1 text-[10.5px] text-zinc-500">
              <span>DealFlow Support</span>
              <span>Enter to send • Shift + Enter for new line</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
