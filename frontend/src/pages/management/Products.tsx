import { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/DataTable';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import { useToast } from '../../components/Toast';
import { getProducts, createProduct, updateProduct } from '../../services/products.api';
import type { Product } from '../../types';

const emptyProduct = { name: '', sku: '', category_id: '', base_price: 0, unit: 'unit', is_active: true };

export default function Products() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProducts();
      const list = Array.isArray(res) ? res : res?.products || [];
      setProducts(list);
    } catch {
      toast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const list = Array.isArray(products) ? products : [];
  const filtered = list.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditing(null); setForm(emptyProduct); setModalOpen(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku,
      category_id: (p as any).categoryId || p.category_id || '',
      base_price: Number((p as any).basePrice || p.base_price || 0),
      unit: p.unit || 'unit',
      is_active: (p as any).active ?? p.is_active ?? true,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.sku) { toast('Name and SKU are required', 'warning'); return; }
    setSaving(true);
    try {
      if (editing) {
        await updateProduct(editing.id, form);
        toast('Product updated', 'success');
      } else {
        await createProduct(form);
        toast('Product created', 'success');
      }
      setModalOpen(false);
      fetchProducts();
    } catch {
      toast('Failed to save product', 'error');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Name' },
    {
      key: 'category_id',
      label: 'Category',
      render: (r: Product) => (r as any).category?.name || (r as any).category || (r as any).categoryId || r.category_id || '-',
    },
    {
      key: 'base_price',
      label: 'Base Price',
      render: (r: Product) => {
        const price = Number((r as any).basePrice || r.base_price || 0);
        return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      },
    },
    { key: 'unit', label: 'Unit', render: (r: Product) => r.unit || 'unit' },
    {
      key: 'is_active',
      label: 'Active',
      render: (r: Product) => {
        const active = (r as any).active ?? r.is_active ?? true;
        return (
          <span className={`text-xs font-medium ${active ? 'text-green-600' : 'text-gray-400'}`}>
            {active ? 'Yes' : 'No'}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: '',
      render: (r: Product) => (
        <button onClick={(e) => { e.stopPropagation(); openEdit(r); }} className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100">Edit</button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">Manage your product catalog</p>
        </div>
        <Button onClick={openCreate}>Add Product</Button>
      </div>

      <div className="max-w-sm">
        <Input placeholder="Search by name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <DataTable columns={columns} data={filtered as any} loading={loading} emptyMessage="No products found" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Product' : 'Add Product'} size="md">
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
          <Input label="Category ID" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} />
          <Input label="Base Price" type="number" value={String(form.base_price)} onChange={(e) => setForm({ ...form, base_price: Number(e.target.value) })} />
          <Input label="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
            <label htmlFor="active" className="text-sm text-gray-900">Active</label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
