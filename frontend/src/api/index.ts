import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';
import type { Quotation, Product, Customer } from '../types';

export interface DiscountCheckResult {
  allowedDiscount: number;
  requestedDiscount: number;
  excessDiscount: number;
  requiresApproval: boolean;
  approvalRoles: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  affectedLines: Array<{
    productId: string;
    productName: string;
    requestedDiscount: number;
    allowedDiscount: number;
    excess: number;
  }>;
  reasons: string[];
}

export interface RecommendationItem {
  id: string;
  quotationId: string;
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string;
    basePrice: number | string;
    costPrice?: number | string;
    category?: string;
  };
  score: number;
  reason: string;
  revenueImpact: number;
  marginImpact: number;
  status: string;
}

export interface PendingApprovalItem {
  id: string;
  quotationId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED';
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  currentStep: number;
  totalSteps: number;
  requiredRole: string;
  reason: string;
  createdAt: string;
  quotation: Quotation & {
    customer?: { id: string; name: string; email: string; tier?: { name: string; defaultDiscount: number } };
    salesRep?: { id: string; name: string; email: string };
    lines?: Array<{
      id: string;
      productId: string;
      quantity: number;
      unitPrice: number | string;
      discountPercent: number | string;
      lineTotal: number | string;
      product?: { name: string; sku: string };
    }>;
  };
  history?: Array<{
    id: string;
    action: string;
    step: number;
    notes?: string;
    createdAt: string;
    user?: { name: string; role: string };
  }>;
}

export interface NegotiationThread {
  id: string;
  quotationId: string;
  customerId: string;
  status: string;
  messages: Array<{
    id: string;
    senderId: string;
    message: string;
    createdAt: string;
    sender?: { name?: string; role?: string; email?: string };
  }>;
  changeRequests?: Array<{
    id: string;
    changeType: string;
    status: string;
    newValue?: any;
    createdAt: string;
  }>;
}

// ─── Quotations API ─────────────────────────────────────────────────────────
export const quotationsApi = {
  getAll: async (params: { status?: string; customerId?: string; search?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.customerId) query.append('customerId', params.customerId);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await apiGet<any>(`/api/quotations${qs}`);
    return res.quotations || res.data || [];
  },

  getById: async (id: string) => {
    const res = await apiGet<any>(`/api/quotations/${id}`);
    return res.quotation || res.data;
  },

  create: async (data: { customerId: string; notes?: string; validUntil?: string; lines?: any[] }) => {
    const res = await apiPost<any>('/api/quotations', data);
    return res.quotation || res.data;
  },

  update: async (id: string, data: { lines?: any[]; notes?: string; validUntil?: string }) => {
    const res = await apiPut<any>(`/api/quotations/${id}`, data);
    return res.quotation || res.data;
  },

  checkDiscount: async (id: string) => {
    const res = await apiPost<any>(`/api/quotations/${id}/discount-check`);
    return res.data || res;
  },

  submit: async (id: string) => {
    const res = await apiPost<any>(`/api/quotations/${id}/submit`);
    return {
      quotation: res.quotation || res.data?.quotation || res.data,
      governance: res.governance || res.data?.governance || res,
    };
  },

  customerConfirm: async (id: string) => {
    const res = await apiPost<any>(`/api/quotations/${id}/customer-confirm`);
    return res.quotation || res.data;
  },

  transition: async (id: string, targetStatus: string, reason?: string) => {
    const res = await apiPost<any>(`/api/quotations/${id}/transition`, {
      targetStatus,
      reason,
    });
    return res.quotation || res.data;
  },
};

// ─── Approvals API ──────────────────────────────────────────────────────────
export const approvalsApi = {
  getPending: async () => {
    const res = await apiGet<any>('/api/approvals/pending');
    return res.approvals || res.data || [];
  },

  getHistory: async (id: string) => {
    const res = await apiGet<any>(`/api/approvals/${id}/history`);
    return res.history || res.data || [];
  },

  approve: async (id: string, comments?: string) => {
    const res = await apiPost<any>(`/api/approvals/${id}/approve`, { comments });
    return res.data || res;
  },

  reject: async (id: string, comments?: string) => {
    const res = await apiPost<any>(`/api/approvals/${id}/reject`, { comments });
    return res.data || res;
  },

  returnForRevision: async (id: string, comments?: string) => {
    const res = await apiPost<any>(`/api/approvals/${id}/return`, { comments });
    return res.data || res;
  },
};

// ─── Products & Customers API ───────────────────────────────────────────────
export const productsApi = {
  getAll: async () => {
    const res = await apiGet<any>('/api/products');
    return res.products || res.data || [];
  },

  getCategories: async () => {
    const res = await apiGet<any>('/api/products/categories');
    return res.categories || res.data || [];
  },
};

export const customersApi = {
  getAll: async () => {
    const res = await apiGet<any>('/api/customers');
    return res.customers || res.data || [];
  },

  getById: async (id: string) => {
    const res = await apiGet<any>(`/api/customers/${id}`);
    return res.customer || res.data;
  },
};

// ─── Negotiation API ────────────────────────────────────────────────────────
export const negotiationsApi = {
  getMessages: async (quotationId: string) => {
    const res = await apiGet<any>(`/api/quotations/${quotationId}/negotiation`);
    return res.negotiation || res.data || res;
  },

  sendMessage: async (quotationId: string, message: string) => {
    const res = await apiPost<any>(`/api/quotations/${quotationId}/negotiation/message`, {
      message,
    });
    return res.message || res.data;
  },

  requestChange: async (quotationId: string, payload: { requestedDiscountPercent?: number; notes?: string; message?: string }) => {
    const res = await apiPost<any>(`/api/quotations/${quotationId}/negotiation/request-change`, payload);
    return res.data || res;
  },
};

// ─── Recommendations API ────────────────────────────────────────────────────
export const recommendationsApi = {
  get: async (quotationId: string) => {
    const res = await apiGet<any>(`/api/quotations/${quotationId}/recommendations`);
    return res.recommendations || res.data?.recommendations || [];
  },

  add: async (recommendationId: string) => {
    const res = await apiPost<any>(`/api/recommendations/${recommendationId}/add`);
    return res.recommendation || res.data;
  },
};

// ─── Deal Health & Alerts API ───────────────────────────────────────────────
export const dealHealthApi = {
  getSummary: async () => {
    const res = await apiGet<any>('/api/deal-health');
    return res.deal_health || res.data || res;
  },

  getAlerts: async () => {
    const res = await apiGet<any>('/api/alerts');
    return res.alerts || res.data || [];
  },
};

// ─── Reports & Analytics API ────────────────────────────────────────────────
export const analyticsApi = {
  getSalesReport: async (period = 'all') => {
    const res = await apiGet<any>(`/api/reports/sales?period=${period}`);
    return res.report || res.data || res;
  },

  getApprovalReport: async () => {
    const res = await apiGet<any>(`/api/reports/approvals`);
    return res.report || res.data || res;
  },
};
