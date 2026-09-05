import { apiGet, apiPost } from './api';
import type { Subscription, SubscriptionPlan, BillingSchedule, Invoice, Payment } from '../types';

interface BillingResponse {
  invoices: Invoice[];
  payments: Payment[];
  subscription?: Subscription;
}

interface SubscriptionResponse {
  subscription: Subscription;
}

interface SubscriptionScheduleResponse {
  schedule: BillingSchedule[];
}

interface PlanResponse {
  plans: SubscriptionPlan[];
}

interface InvoiceResponse {
  invoice: Invoice;
}

interface PaymentResponse {
  payment: Payment;
}

export async function getBilling(quotationId: string): Promise<BillingResponse> {
  return apiGet<BillingResponse>(`/api/quotations/${quotationId}/billing`);
}

export async function getSubscription(id: string): Promise<SubscriptionResponse> {
  return apiGet<SubscriptionResponse>(`/api/subscriptions/${id}`);
}

export async function getSubscriptionSchedule(id: string): Promise<SubscriptionScheduleResponse> {
  return apiGet<SubscriptionScheduleResponse>(`/api/subscriptions/${id}/schedule`);
}

export async function createSubscription(data: {
  customer_id: string;
  plan_id: string;
  lines: {
    product_id: string;
    quantity: number;
  }[];
  start_date?: string;
}): Promise<SubscriptionResponse> {
  return apiPost<SubscriptionResponse>('/api/subscriptions', data);
}

export async function createInvoice(data: {
  customer_id: string;
  quotation_id?: string;
  subscription_id?: string;
  due_date?: string;
}): Promise<InvoiceResponse> {
  return apiPost<InvoiceResponse>('/api/invoices', data);
}

export async function createPayment(data: {
  invoice_id: string;
  amount: number;
  method: string;
  reference?: string;
}): Promise<PaymentResponse> {
  return apiPost<PaymentResponse>('/api/payments', data);
}
