import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { getNegotiation, sendMessage, requestChange } from '../../services/negotiations.api';
import type { NegotiationMessage } from '../../types';

export default function Negotiation() {
  const [searchParams] = useSearchParams();
  const quotationId = searchParams.get('quotation') || '';
  const [messages, setMessages] = useState<NegotiationMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (quotationId) loadNegotiation();
  }, [quotationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadNegotiation() {
    try {
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
            )}
          </div>

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
        </div>
      </div>
    </div>
  );
}
