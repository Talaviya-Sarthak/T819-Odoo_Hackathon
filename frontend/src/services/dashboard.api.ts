import { apiGet } from './api';
import type { DealHealth, Alert } from '../types';

interface DealHealthResponse {
  deal_health: DealHealth;
}

interface AlertsResponse {
  alerts: Alert[];
  unread_count: number;
}

export async function getDealHealth(): Promise<DealHealthResponse> {
  return apiGet<DealHealthResponse>('/api/dashboard/deal-health');
}

export async function getAlerts(): Promise<AlertsResponse> {
  return apiGet<AlertsResponse>('/api/dashboard/alerts');
}
