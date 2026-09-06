import { apiGet, apiPost, apiPut } from './api';
import type { Customer, CustomerTier } from '../types';

interface CustomersResponse {
  customers: Customer[];
  total: number;
}

interface CustomerResponse {
  customer: Customer;
}

export interface GetCustomersOptions {
  tier?: CustomerTier;
  page?: number;
  limit?: number;
  search?: string;
}

export async function getCustomers(tierOrOptions?: CustomerTier | GetCustomersOptions): Promise<CustomersResponse & { pagination?: any; page?: number; limit?: number; totalPages?: number }> {
  let queryString = '';
  if (typeof tierOrOptions === 'string') {
    queryString = `?tier=${tierOrOptions}`;
  } else if (tierOrOptions && typeof tierOrOptions === 'object') {
    const query = new URLSearchParams();
    if (tierOrOptions.tier) query.append('tier', tierOrOptions.tier);
    if (tierOrOptions.page) query.append('page', String(tierOrOptions.page));
    if (tierOrOptions.limit) query.append('limit', String(tierOrOptions.limit));
    if (tierOrOptions.search) query.append('search', tierOrOptions.search);
    const qs = query.toString();
    if (qs) queryString = `?${qs}`;
  }
  return apiGet<CustomersResponse & { pagination?: any; page?: number; limit?: number; totalPages?: number }>(`/api/customers${queryString}`);
}

export async function getCustomer(id: string): Promise<CustomerResponse> {
  return apiGet<CustomerResponse>(`/api/customers/${id}`);
}

export async function createCustomer(data: Partial<Customer>): Promise<{ customer: Customer }> {
  return apiPost<{ customer: Customer }>('/api/customers', data);
}

export async function updateCustomer(id: string, data: Partial<Customer>): Promise<{ customer: Customer }> {
  return apiPut<{ customer: Customer }>(`/api/customers/${id}`, data);
}
