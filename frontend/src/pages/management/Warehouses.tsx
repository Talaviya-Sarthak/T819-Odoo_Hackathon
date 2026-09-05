import { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/DataTable';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import { useToast } from '../../components/Toast';
import type { Warehouse } from '../../types';

const emptyWarehouse: Omit<Warehouse, 'id'> = {
  name: '',
  city: '',
  country: '',
  is_active: true,
};

export default function Warehouses() {
  const { toast } = useToast();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [form, setForm] = useState(emptyWarehouse);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      // Using a generic approach since there's no direct warehouses API
      // In production, this would be a dedicated API call
      setWarehouses([]);
    } catch {
      toast('Failed to load warehouses', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchWarehouses(); }, [fetchWarehouses]);

  const openCreate = () => { setEditing(null); setForm(emptyWarehouse); setModalOpen(true); };
  const openEdit = (w: Warehouse) => { setEditing(w); setForm({ name: w.name, city: w.city || '', country: w.country || '', is_active: w.is_active }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name) { toast('Name is required', 'warning'); return; }
    setSaving(true);
    try {
      if (editing) {
        setWarehouses((prev) => prev.map((w) => (w.id === editing.id ? { ...w, ...form } : w)));
        toast('Warehouse updated', 'success');
      } else {
        setWarehouses((prev) => [...prev, { ...form, id: Date.now().toString() }]);
        toast('Warehouse created', 'success');
      }
      setModalOpen(false);
    } catch {
      toast('Failed to save warehouse', 'error');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'city', label: 'City' },
    { key: 'country', label: 'Country' },
    { key: 'is_active', label: 'Active', render: (r: Warehouse) => (
      <span className={`text-xs font-medium ${r.is_active ? 'text-green-600' : 'text-gray-400'}`}>{r.is_active ? 'Yes' : 'No'}</span>
    )},
    { key: 'actions', label: '', render: (r: Warehouse) => (
      <div className="flex gap-1">
        <button onClick={(e) => { e.stopPropagation(); openEdit(r); }} className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100">Edit</button>
        <button onClick={(e) => { e.stopPropagation(); setExpanded(expanded === r.id ? null : r.id); }} className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50">
          {expanded === r.id ? 'Hide' : 'Stock'}
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Warehouses</h1>
          <p className="text-sm text-muted-foreground">Manage warehouse locations and stock levels</p>
        </div>
        <Button onClick={openCreate}>Add Warehouse</Button>
      </div>

      <DataTable columns={columns} data={warehouses as any} loading={loading} emptyMessage="No warehouses found" />

      {expanded && (
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Stock Levels</h3>
          <p className="text-sm text-muted-foreground">Stock data for warehouse will appear here.</p>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Warehouse' : 'Add Warehouse'} size="md">
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="City" value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <Input label="Country" value={form.country || ''} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="wh_active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
            <label htmlFor="wh_active" className="text-sm text-foreground">Active</label>
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
