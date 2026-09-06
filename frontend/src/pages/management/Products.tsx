import { useState, useEffect, useCallback, useMemo } from 'react';
import DataTable from '../../components/DataTable';
import { Button } from '@/components/ui/button';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { getProducts, createProduct, updateProduct } from '../../services/products.api';
import type { Product } from '../../types';
import { 
  Boxes, 
  Plus, 
  Search, 
  RefreshCw, 
  Edit2
} from 'lucide-react';

const emptyProduct = { name: '', sku: '', category_id: '', base_price: 0, unit: 'unit', is_active: true };

export default function Products() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProducts({ page, limit, search: search.trim() || undefined });
      const list = Array.isArray(res) ? res : res?.products || [];
      setProducts(list);
      if ((res as any)?.pagination) {
        setPagination((res as any).pagination);
      } else if (res?.total !== undefined) {
        setPagination({
          page: (res as any).page || page,
          limit: (res as any).limit || limit,
          total: res.total,
          totalPages: (res as any).totalPages || Math.ceil(res.total / limit) || 1,
        });
      }
    } catch {
      toast.fail('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const list = Array.isArray(products) ? products : [];

  const stats = useMemo(() => {
    const total = pagination.total || list.length;
    const active = list.filter(p => (p as any).active ?? p.is_active ?? true).length;
    const avgPrice = list.length > 0 ? list.reduce((sum, p) => sum + Number((p as any).basePrice || p.base_price || 0), 0) / list.length : 0;
    return { total, active, avgPrice };
  }, [list, pagination.total]);

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
    if (!form.name || !form.sku) { 
      toast.warning('Name and SKU are required', 'Validation'); 
      return; 
    }
    setSaving(true);
    try {
      if (editing) {
        await updateProduct(editing.id, form);
        toast.success('Product updated successfully');
      } else {
        await createProduct(form);
        toast.success('Product registered in catalog');
      }
      setModalOpen(false);
      fetchProducts();
    } catch {
      toast.fail('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { 
      key: 'sku', 
      label: 'SKU Code',
      render: (r: Product) => (
        <span className="font-mono font-bold text-xs text-foreground bg-muted/40 border border-border/50 px-2 py-0.5 rounded-md">
          {r.sku}
        </span>
      )
    },
    { 
      key: 'name', 
      label: 'Product Name',
      render: (r: Product) => (
        <div>
          <span className="font-semibold text-foreground text-xs">{r.name}</span>
          <span className="block text-[11px] text-muted-foreground">Standard Inventory</span>
        </div>
      )
    },
    {
      key: 'category_id',
      label: 'Category',
      render: (r: Product) => (
        <span className="text-xs text-muted-foreground font-medium">
          {(r as any).category?.name || (r as any).category || (r as any).categoryId || r.category_id || 'General'}
        </span>
      ),
    },
    {
      key: 'base_price',
      label: 'Base Price',
      render: (r: Product) => {
        const price = Number((r as any).basePrice || r.base_price || 0);
        return <span className="font-bold text-foreground text-xs">${price.toFixed(2)}</span>;
      },
    },
    { 
      key: 'unit', 
      label: 'Unit Type', 
      render: (r: Product) => (
        <span className="text-xs text-muted-foreground uppercase font-mono">{r.unit || 'unit'}</span>
      )
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (r: Product) => {
        const active = (r as any).active ?? r.is_active ?? true;
        return (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            active 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' 
              : 'bg-muted text-muted-foreground border border-border/50'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
            {active ? 'Active' : 'Disabled'}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: '',
      render: (r: Product) => (
        <div className="flex justify-end">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={(e) => { e.stopPropagation(); openEdit(r); }} 
            className="h-7 px-2 text-xs text-primary hover:bg-primary/10"
          >
            <Edit2 className="w-3 h-3 mr-1" /> Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Product & Service Catalog</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary border border-primary/20">
              <Boxes className="w-3 h-3" /> SKU Master
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Authoritative product definitions, pricing baselines, and catalog lifecycle status
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProducts}
            disabled={loading}
            className="flex items-center gap-2 border-border/60 bg-card text-foreground hover:bg-white/5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button onClick={openCreate} size="sm" className="flex items-center gap-1.5 shadow-xs">
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-xs">
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Total SKUs</span>
          <div className="mt-1.5 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <span className="text-xs text-muted-foreground font-medium">Catalog items</span>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-xs">
          <span className="text-[11px] font-semibold tracking-wider text-emerald-400 uppercase">Active Catalog</span>
          <div className="mt-1.5 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
            <span className="text-xs text-muted-foreground font-medium">Available to quote</span>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-xs">
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Average Base Price</span>
          <div className="mt-1.5 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-foreground">${stats.avgPrice.toFixed(2)}</p>
            <span className="text-xs text-primary font-medium">Baseline</span>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/60 p-3 rounded-xl border border-border/50">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search product name or SKU..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-8 w-full rounded-lg border border-border/60 bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
          />
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          Showing {list.length} of {pagination.total || list.length} products
        </span>
      </div>

      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        emptyMessage="No products found in catalog"
        pagination={pagination}
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
      />

      {/* Clean Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Product SKU' : 'Add New Product SKU'} size="md">
        <div className="space-y-4 pt-2">
          <Input label="Product Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Enterprise Cloud Compute Node" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="SKU Code" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required placeholder="e.g. SRV-NODE-01" />
            <Input label="Category" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} placeholder="Hardware / SaaS" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Base Price ($)" type="number" value={String(form.base_price)} onChange={(e) => setForm({ ...form, base_price: Number(e.target.value) })} placeholder="0.00" />
            <Input label="Unit of Measure" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="unit / license" />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input type="checkbox" id="active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded accent-primary" />
            <label htmlFor="active" className="text-xs font-semibold text-foreground">Active in quotation catalog</label>
          </div>
          <div className="flex justify-end gap-2.5 pt-4 border-t border-border/40">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={saving} onClick={handleSave}>{editing ? 'Update SKU' : 'Register SKU'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
