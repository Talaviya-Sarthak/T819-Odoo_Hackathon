import { apiGet, apiPost } from './api';
import type { Negotiation, NegotiationMessage } from '../types';

interface NegotiationResponse {
  negotiation: Negotiation;
}

interface MessageResponse {
  message: NegotiationMessage;
}

interface ActionResponse {
  message: string;
}

export async function getNegotiation(quotationId: string): Promise<NegotiationResponse> {
  return apiGet<NegotiationResponse>(`/api/quotations/${quotationId}/negotiation`);
}

export async function sendMessage(
  quotationId: string,
  data: { message: string; attachment_url?: string }
): Promise<MessageResponse> {
  return apiPost<MessageResponse>(`/api/quotations/${quotationId}/negotiation/messages`, data);
}

export async function requestChange(
  quotationId: string,
  data: {
    field: string;
    current_value: unknown;
    proposed_value: unknown;
    message?: string;
  }
): Promise<ActionResponse> {
  return apiPost<ActionResponse>(`/api/quotations/${quotationId}/negotiation/request-change`, data);
}
