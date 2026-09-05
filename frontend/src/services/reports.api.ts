import { apiGet } from './api';
import type {
  ReportParams,
  SalesReport,
  ApprovalReport,
  FulfillmentReport,
  BillingReport,
} from '../types';

function buildQuery(params?: ReportParams): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  return entries.length
    ? `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()}`
    : '';
}

interface SalesReportResponse {
  report: SalesReport[];
  summary: {
    total_sales: number;
    total_orders: number;
    average_order_value: number;
  };
}

interface ApprovalReportResponse {
  report: ApprovalReport[];
  summary: {
    total_requests: number;
    approval_rate: number;
  };
}

interface FulfillmentReportResponse {
  report: FulfillmentReport[];
  summary: {
    total_orders: number;
    fulfillment_rate: number;
  };
}

interface BillingReportResponse {
  report: BillingReport[];
  summary: {
    total_invoiced: number;
    collection_rate: number;
  };
}

export async function getSalesReport(params?: ReportParams): Promise<SalesReportResponse> {
  return apiGet<SalesReportResponse>(`/api/reports/sales${buildQuery(params)}`);
}

export async function getApprovalReport(params?: ReportParams): Promise<ApprovalReportResponse> {
  return apiGet<ApprovalReportResponse>(`/api/reports/approvals${buildQuery(params)}`);
}

export async function getFulfillmentReport(params?: ReportParams): Promise<FulfillmentReportResponse> {
  return apiGet<FulfillmentReportResponse>(`/api/reports/fulfillment${buildQuery(params)}`);
}

export async function getBillingReport(params?: ReportParams): Promise<BillingReportResponse> {
  return apiGet<BillingReportResponse>(`/api/reports/billing${buildQuery(params)}`);
}
