import { apiGet, apiPost, apiPut } from './api';
import type { Quotation, QuotationLine, QuotationStatus } from '../types';

interface QuotationFilters {
  status?: QuotationStatus;
  customer_id?: string;
  page?: number;
  limit?: number;
}

interface QuotationsResponse {
  quotations: Quotation[];
  total: number;
  page: number;
  limit: number;
}

interface QuotationResponse {
  quotation: Quotation;
}

interface DiscountCheckResponse {
  eligible: boolean;
  max_discount: number;
  reason?: string;
}

function buildQuery(params: QuotationFilters): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  return entries.length ? `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()}` : '';
}

export async function getQuotations(filters: QuotationFilters = {}): Promise<QuotationsResponse> {
  return apiGet<QuotationsResponse>(`/api/quotations${buildQuery(filters)}`);
}

export async function getQuotation(id: string): Promise<QuotationResponse> {
  return apiGet<QuotationResponse>(`/api/quotations/${id}`);
}

export async function createQuotation(data: {
  customer_id: string;
  lines: Omit<QuotationLine, 'id' | 'total'>[];
  notes?: string;
  valid_until?: string;
}): Promise<QuotationResponse> {
  return apiPost<QuotationResponse>('/api/quotations', data);
}

export async function updateQuotation(id: string, data: Partial<Quotation>): Promise<QuotationResponse> {
  return apiPut<QuotationResponse>(`/api/quotations/${id}`, data);
}

export async function submitQuotation(id: string): Promise<{ message: string }> {
  return apiPost<{ message: string }>(`/api/quotations/${id}/submit`);
}

export async function confirmQuotation(id: string): Promise<{ message: string }> {
  return apiPost<{ message: string }>(`/api/quotations/${id}/confirm`);
}

export async function checkDiscount(
  id: string,
  data: { customer_id: string; total: number }
): Promise<DiscountCheckResponse> {
  return apiPost<DiscountCheckResponse>(`/api/quotations/${id}/check-discount`, data);
}
