import { apiGet, apiPost } from './api';
import type { ApprovalRequest, ApprovalStatus } from '../types';

interface ApprovalsResponse {
  approvals: ApprovalRequest[];
  total: number;
}

interface ApprovalResponse {
  approval: ApprovalRequest;
}

interface ActionResponse {
  message: string;
}

export async function getApprovals(status?: ApprovalStatus): Promise<ApprovalsResponse> {
  const params = status ? `?status=${status}` : '';
  return apiGet<ApprovalsResponse>(`/api/approvals${params}`);
}

export async function getApproval(id: string): Promise<ApprovalResponse> {
  return apiGet<ApprovalResponse>(`/api/approvals/${id}`);
}

export async function approveRequest(
  id: string,
  data: { manager_notes?: string }
): Promise<ActionResponse> {
  return apiPost<ActionResponse>(`/api/approvals/${id}/approve`, data);
}

export async function rejectRequest(
  id: string,
  data: { manager_notes: string }
): Promise<ActionResponse> {
  return apiPost<ActionResponse>(`/api/approvals/${id}/reject`, data);
}

export async function returnRequest(
  id: string,
  data: { manager_notes: string }
): Promise<ActionResponse> {
  return apiPost<ActionResponse>(`/api/approvals/${id}/return`, data);
}
