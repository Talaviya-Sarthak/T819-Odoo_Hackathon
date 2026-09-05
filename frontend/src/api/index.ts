import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from '../services/api';
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

// ─── Sales Orders API ───────────────────────────────────────────────────────
export const ordersApi = {
  getAll: async (params: { status?: string; customerId?: string; search?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.customerId) query.append('customerId', params.customerId);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await apiGet<any>(`/api/orders${qs}`);
    return res.orders || res.data || [];
  },

  getById: async (id: string) => {
    const res = await apiGet<any>(`/api/orders/${id}`);
    return res.order || res.data;
  },

  createFromQuotation: async (quotationId: string) => {
    const res = await apiPost<any>(`/api/orders/from-quotation/${quotationId}`);
    return res.order || res.data;
  },

  confirm: async (id: string) => {
    const res = await apiPost<any>(`/api/orders/${id}/confirm`);
    return res.order || res.data;
  },

  cancel: async (id: string, reason?: string) => {
    const res = await apiPost<any>(`/api/orders/${id}/cancel`, { reason });
    return res.order || res.data;
  },
};

// ─── Warehouses API ─────────────────────────────────────────────────────────
export const warehousesApi = {
  getAll: async () => {
    const res = await apiGet<any>('/api/warehouses');
    return res.warehouses || res.data || [];
  },

  getById: async (id: string) => {
    const res = await apiGet<any>(`/api/warehouses/${id}`);
    return res.warehouse || res.data;
  },

  create: async (data: { name: string; code: string; location?: string; address?: string }) => {
    const res = await apiPost<any>('/api/warehouses', data);
    return res.warehouse || res.data;
  },

  update: async (id: string, data: Partial<{ name: string; code: string; location?: string; address?: string; active?: boolean }>) => {
    const res = await apiPut<any>(`/api/warehouses/${id}`, data);
    return res.warehouse || res.data;
  },

  delete: async (id: string) => {
    const res = await apiDelete<any>(`/api/warehouses/${id}`);
    return res.data || res;
  },
};

// ─── Inventory API ──────────────────────────────────────────────────────────
export const inventoryApi = {
  getAll: async (params: { warehouseId?: string; lowStock?: boolean } = {}) => {
    const query = new URLSearchParams();
    if (params.warehouseId) query.append('warehouseId', params.warehouseId);
    if (params.lowStock) query.append('lowStock', 'true');
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await apiGet<any>(`/api/inventory${qs}`);
    return res.stocks || res.inventory || res.data || [];
  },

  getById: async (id: string) => {
    const res = await apiGet<any>(`/api/inventory/${id}`);
    return res.stock || res.data;
  },

  getByWarehouse: async (warehouseId: string) => {
    const res = await apiGet<any>(`/api/inventory/warehouse/${warehouseId}`);
    return res.stocks || res.data || [];
  },

  adjust: async (id: string, data: { adjustment: number; reason?: string }) => {
    const res = await apiPost<any>(`/api/inventory/${id}/adjust`, data);
    return res.stock || res.data;
  },

  reserve: async (data: { warehouseId: string; productId: string; quantity: number }) => {
    const res = await apiPost<any>('/api/inventory/reserve', data);
    return res.stock || res.data;
  },

  release: async (data: { warehouseId: string; productId: string; quantity: number }) => {
    const res = await apiPost<any>('/api/inventory/release', data);
    return res.stock || res.data;
  },
};

// ─── Fulfillment Orders API ─────────────────────────────────────────────────
export const fulfillmentApi = {
  getAll: async (params: { status?: string; warehouseId?: string; orderId?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.warehouseId) query.append('warehouseId', params.warehouseId);
    if (params.orderId) query.append('orderId', params.orderId);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await apiGet<any>(`/api/fulfillments${qs}`);
    return res.fulfillments || res.data || [];
  },

  getById: async (id: string) => {
    const res = await apiGet<any>(`/api/fulfillments/${id}`);
    return res.fulfillment || res.data;
  },

  create: async (data: { salesOrderId: string; warehouseId: string; lines: Array<{ salesOrderLineId: string; quantityToFulfill: number }> }) => {
    const res = await apiPost<any>('/api/fulfillments', data);
    return res.fulfillment || res.data;
  },

  fulfill: async (id: string, data?: { trackingNumber?: string; notes?: string }) => {
    const res = await apiPost<any>(`/api/fulfillments/${id}/fulfill`, data || {});
    return res.fulfillment || res.data;
  },

  cancel: async (id: string, reason?: string) => {
    const res = await apiPost<any>(`/api/fulfillments/${id}/cancel`, { reason });
    return res.fulfillment || res.data;
  },
};

// ─── Backorders API ─────────────────────────────────────────────────────────
export const backordersApi = {
  getAll: async (params: { status?: string; productId?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.productId) query.append('productId', params.productId);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await apiGet<any>(`/api/backorders${qs}`);
    return res.backorders || res.data || [];
  },

  getById: async (id: string) => {
    const res = await apiGet<any>(`/api/backorders/${id}`);
    return res.backorder || res.data;
  },

  fulfill: async (id: string, data: { warehouseId: string; quantity: number }) => {
    const res = await apiPost<any>(`/api/backorders/${id}/fulfill`, data);
    return res.data || res;
  },
};

// ─── Invoices API ───────────────────────────────────────────────────────────
export const invoicesApi = {
  getAll: async (params: { status?: string; customerId?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.customerId) query.append('customerId', params.customerId);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await apiGet<any>(`/api/invoices${qs}`);
    return res.invoices || res.data || [];
  },

  getById: async (id: string) => {
    const res = await apiGet<any>(`/api/invoices/${id}`);
    return res.invoice || res.data;
  },

  createFromOrder: async (salesOrderId: string) => {
    const res = await apiPost<any>(`/api/invoices/from-order/${salesOrderId}`);
    return res.invoice || res.data;
  },

  createFromSchedule: async (scheduleId: string) => {
    const res = await apiPost<any>(`/api/invoices/from-schedule/${scheduleId}`);
    return res.invoice || res.data;
  },
};

// ─── Payments API ───────────────────────────────────────────────────────────
export const paymentsApi = {
  getAll: async (params: { invoiceId?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.invoiceId) query.append('invoiceId', params.invoiceId);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await apiGet<any>(`/api/payments${qs}`);
    return res.payments || res.data || [];
  },

  getById: async (id: string) => {
    const res = await apiGet<any>(`/api/payments/${id}`);
    return res.payment || res.data;
  },

  record: async (data: { invoiceId: string; amount: number; paymentMethod?: string; method?: string; reference?: string }) => {
    const res = await apiPost<any>('/api/payments', data);
    return res.data || res;
  },
};

// ─── Subscriptions & Plans API ──────────────────────────────────────────────
export const subscriptionsApi = {
  getAll: async (params: { status?: string; customerId?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.customerId) query.append('customerId', params.customerId);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await apiGet<any>(`/api/subscriptions${qs}`);
    return res.subscriptions || res.data || [];
  },

  getById: async (id: string) => {
    const res = await apiGet<any>(`/api/subscriptions/${id}`);
    return res.subscription || res.data;
  },

  getPlans: async () => {
    const res = await apiGet<any>('/api/subscription-plans');
    return res.plans || res.data || [];
  },

  getBillingSchedule: async (subscriptionId: string) => {
    const res = await apiGet<any>(`/api/subscriptions/${subscriptionId}/schedule`);
    return res.schedule || res.data || [];
  },

  getAllSchedules: async (params: { subscriptionId?: string; status?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.subscriptionId) query.append('subscriptionId', params.subscriptionId);
    if (params.status) query.append('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await apiGet<any>(`/api/billing-schedules${qs}`);
    return res.schedules || res.data || [];
  },

  pause: async (id: string) => {
    const res = await apiPost<any>(`/api/subscriptions/${id}/pause`);
    return res.subscription || res.data;
  },

  resume: async (id: string) => {
    const res = await apiPost<any>(`/api/subscriptions/${id}/resume`);
    return res.subscription || res.data;
  },

  cancel: async (id: string) => {
    const res = await apiPost<any>(`/api/subscriptions/${id}/cancel`);
    return res.subscription || res.data;
  },
};

// ─── Operations Dashboard & Analytics API ───────────────────────────────────
export const operationsApi = {
  getDashboard: async () => {
    const res = await apiGet<any>('/api/operations/dashboard');
    return res.data || res;
  },

  getKPIs: async () => {
    const res = await apiGet<any>('/api/analytics/operations/kpis');
    return res.data || res;
  },

  getOperationsAnalytics: async () => {
    const res = await apiGet<any>('/api/analytics/operations');
    return res.data || res;
  },

  getInventoryAnalytics: async () => {
    const res = await apiGet<any>('/api/analytics/inventory');
    return res.data || res;
  },

  getBillingAnalytics: async () => {
    const res = await apiGet<any>('/api/analytics/billing');
    return res.data || res;
  },

  getRevenueAnalytics: async () => {
    const res = await apiGet<any>('/api/analytics/revenue');
    return res.data || res;
  },
};

// ─── RAG Chatbot API ────────────────────────────────────────────────────────
export interface ChatCitation {
  documentId?: string;
  source?: string;
  chunkId?: string;
  similarity?: number;
  score?: number;
  preview?: string;
  text?: string;
  metadata?: Record<string, any>;
}

export interface ChatMessageResponse {
  success: boolean;
  message?: string;
  answer?: string;
  toolUsed?: string;
  citations?: ChatCitation[];
  executionTimeMs?: number;
  metadata?: Record<string, any>;
  error?: string;
}

export const ragChatApi = {
  sendMessage: async (message: string, sessionId?: string, userId?: string): Promise<ChatMessageResponse> => {
    const res = await apiPost<any>('/api/ai/chat', {
      message,
      sessionId: sessionId || `session_${Date.now()}`,
      userId,
    });
    return {
      ...res,
      message: res.message || res.answer || res.response?.answer || res.data?.message || res.data?.answer,
    };
  },

  getTools: async () => {
    return apiGet<{ success: boolean; tools: any[] }>('/api/ai/tools');
  },

  queryDirect: async (query: string, topK: number = 4) => {
    return apiPost<{ success: boolean; count: number; results: any[] }>('/api/rag/query', {
      query,
      topK,
    });
  },
};

// ─── Admin Knowledge Base (PDF Management) API ──────────────────────────────
export interface IngestedDocument {
  id: string;
  filename: string;
  originalName?: string;
  pageCount?: number;
  totalPages?: number;
  chunkCount?: number;
  fileSize?: number;
  size?: number;
  status: 'PROCESSED' | 'INDEXED' | 'FAILED' | 'PROCESSING';
  uploadedAt: string;
  createdAt?: string;
}

export const knowledgeBaseApi = {
  getDocuments: async (): Promise<IngestedDocument[]> => {
    try {
      const res = await apiGet<{ success: boolean; documents?: IngestedDocument[]; uploads?: IngestedDocument[]; count?: number }>('/api/uploads');
      const list = res.documents || res.uploads || [];
      return list.map((d: any) => ({
        ...d,
        id: d.id || d.fileId,
        fileSize: d.fileSize || d.sizeBytes || d.size || 0,
        pageCount: d.pageCount || d.totalPages || 1,
        chunkCount: d.chunkCount ?? 0,
        originalName: d.originalName || d.filename,
        uploadedAt: d.uploadedAt || d.createdAt,
      }));
    } catch {
      const adminRes = await apiGet<{ success: boolean; documents?: IngestedDocument[]; pdfs?: IngestedDocument[] }>('/api/ai/admin/pdfs');
      const list = adminRes.documents || adminRes.pdfs || [];
      return list.map((d: any) => ({
        ...d,
        id: d.id || d.fileId,
        fileSize: d.fileSize || d.sizeBytes || d.size || 0,
        pageCount: d.pageCount || d.totalPages || 1,
        chunkCount: d.chunkCount ?? 0,
        originalName: d.originalName || d.filename,
        uploadedAt: d.uploadedAt || d.createdAt,
      }));
    }
  },

  uploadPdf: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      return await apiUpload<any>('/api/uploads/ingest', formData);
    } catch {
      return await apiUpload<any>('/api/ai/admin/upload-pdf', formData);
    }
  },

  deleteDocument: async (id: string): Promise<any> => {
    return apiDelete<any>(`/api/uploads/${id}`);
  },

  reprocessDocument: async (id: string): Promise<any> => {
    return apiPost<any>(`/api/uploads/${id}/reprocess`);
  },

  getDocumentChunks: async (id: string): Promise<any[]> => {
    try {
      const res = await apiGet<{ success: boolean; chunks?: any[] }>(`/api/uploads/${id}/chunks`);
      return res.chunks || [];
    } catch {
      const adminRes = await apiGet<{ success: boolean; chunks?: any[] }>(`/api/ai/admin/documents/${id}/chunks`);
      return adminRes.chunks || [];
    }
  },
};

