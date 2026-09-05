import { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import { useToast } from '../../components/Toast';
import { getProducts } from '../../services/products.api';
import type { Product } from '../../types';

interface PriceItem {
  product_name: string;
  price: number;
  min_quantity: number;
  max_quantity: number | null;
}

export default function Pricing() {
  const { toast } = useToast();
  const [items, setItems] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getProducts();
        const priceItems: PriceItem[] = res.products.map((p: Product) => ({
          product_name: p.name,
          price: p.base_price,
          min_quantity: 1,
          max_quantity: null,
        }));
        setItems(priceItems);
      } catch {
        toast('Failed to load pricing', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [toast]);

  const columns = [
    { key: 'product_name', label: 'Product' },
    { key: 'price', label: 'Price', render: (r: PriceItem) => `$${r.price.toLocaleString()}` },
    { key: 'min_quantity', label: 'Min Qty' },
    { key: 'max_quantity', label: 'Max Qty', render: (r: PriceItem) => r.max_quantity ?? 'No limit' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pricing</h1>
        <p className="text-sm text-gray-500">Manage product pricing and price lists</p>
      </div>

      <DataTable columns={columns} data={items as any} loading={loading} emptyMessage="No pricing data available" />
    </div>
  );
}
