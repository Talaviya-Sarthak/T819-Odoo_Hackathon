import { apiGet, apiPost, apiPut } from './api';
import type { Customer, CustomerTier } from '../types';

interface CustomersResponse {
  customers: Customer[];
  total: number;
}

interface CustomerResponse {
  customer: Customer;
}

export async function getCustomers(tierId?: CustomerTier): Promise<CustomersResponse> {
  const params = tierId ? `?tier=${tierId}` : '';
  return apiGet<CustomersResponse>(`/api/customers${params}`);
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
