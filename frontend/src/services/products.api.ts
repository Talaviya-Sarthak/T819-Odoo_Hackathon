import { apiGet, apiPost, apiPut } from './api';
import type { Product, ProductVariant } from '../types';

interface ProductsResponse {
  products: Product[];
  total: number;
}

interface ProductResponse {
  product: Product;
  variants: ProductVariant[];
}

export async function getProducts(categoryId?: string): Promise<ProductsResponse> {
  const params = categoryId ? `?category_id=${categoryId}` : '';
  return apiGet<ProductsResponse>(`/api/products${params}`);
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
