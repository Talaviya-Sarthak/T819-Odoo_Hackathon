import { apiGet, apiPost } from './api';
import type { FulfillmentOrder } from '../types';

interface FulfillmentResponse {
  fulfillment: FulfillmentOrder;
}

interface ActionResponse {
  message: string;
  fulfillment: FulfillmentOrder;
}

export async function getFulfillment(quotationId: string): Promise<FulfillmentResponse> {
  return apiGet<FulfillmentResponse>(`/api/quotations/${quotationId}/fulfillment`);
}

export async function allocateStock(
  quotationId: string,
  data: {
    lines: {
      quotation_line_id: string;
      quantity: number;
      warehouse_id: string;
    }[];
  }
): Promise<ActionResponse> {
  return apiPost<ActionResponse>(`/api/quotations/${quotationId}/fulfillment/allocate`, data);
}

export async function overrideStock(
  quotationId: string,
  data: {
    lines: {
      quotation_line_id: string;
      quantity: number;
      warehouse_id: string;
    }[];
    reason: string;
  }
): Promise<ActionResponse> {
  return apiPost<ActionResponse>(`/api/quotations/${quotationId}/fulfillment/override`, data);
}
