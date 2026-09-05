import { apiGet, apiPost } from './api';
import type { Recommendation } from '../types';

interface RecommendationsResponse {
  recommendations: Recommendation[];
}

interface ActionResponse {
  recommendation: Recommendation;
}

export async function getRecommendations(quotationId: string): Promise<RecommendationsResponse> {
  return apiGet<RecommendationsResponse>(`/api/quotations/${quotationId}/recommendations`);
}

export async function addRecommendation(id: string): Promise<ActionResponse> {
  return apiPost<ActionResponse>(`/api/recommendations/${id}/accept`);
}

export async function dismissRecommendation(id: string): Promise<ActionResponse> {
  return apiPost<ActionResponse>(`/api/recommendations/${id}/dismiss`);
}
