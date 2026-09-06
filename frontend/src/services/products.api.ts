import { apiGet, apiPost, apiPut } from './api';
import type { Product, ProductVariant } from '../types';

interface ProductsResponse {
  products: Product[];
  total: number;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  page?: number;
  limit?: number;
  totalPages?: number;
}

interface ProductResponse {
  product: Product;
}

export async function getProducts(params?: { categoryId?: string; search?: string; page?: number; limit?: number } | string): Promise<ProductsResponse> {
  let qs = '';
  if (typeof params === 'string') {
    qs = `?category_id=${params}`;
  } else if (params) {
    const q = new URLSearchParams();
    if (params.categoryId) q.append('categoryId', params.categoryId);
    if (params.search) q.append('search', params.search);
    if (params.page) q.append('page', String(params.page));
    if (params.limit) q.append('limit', String(params.limit));
    qs = q.toString() ? `?${q.toString()}` : '';
  }
  return apiGet<ProductsResponse>(`/api/products${qs}`);
}

export async function getProduct(id: string): Promise<ProductResponse> {
  return apiGet<ProductResponse>(`/api/products/${id}`);
}

export async function createProduct(data: Partial<Product>): Promise<{ product: Product }> {
  return apiPost<{ product: Product }>('/api/products', data);
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<{ product: Product }> {
  return apiPut<{ product: Product }>(`/api/products/${id}`, data);
}
