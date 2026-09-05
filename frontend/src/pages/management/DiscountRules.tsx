import { useState } from 'react';
import DataTable from '../../components/DataTable';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { useToast } from '../../components/Toast';

interface DiscountRule {
  id: string;
  name: string;
  customer_tier: string;
  category: string;
  max_discount_percent: number;
  approval_required: boolean;
  approval_level: number;
}

const emptyRule: Omit<DiscountRule, 'id'> = {
  name: '',
  customer_tier: '',
  category: '',
  max_discount_percent: 0,
  approval_required: false,
  approval_level: 1,
};

export default function DiscountRules() {
  const { toast } = useToast();
  const [rules, setRules] = useState<DiscountRule[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DiscountRule | null>(null);
  const [form, setForm] = useState(emptyRule);
  const [saving, setSaving] = useState(false);

  const openCreate = () => { setEditing(null); setForm(emptyRule); setModalOpen(true); };
  const openEdit = (r: DiscountRule) => { setEditing(r); setForm(r); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name) { toast('Name is required', 'warning'); return; }
    setSaving(true);
    try {
      if (editing) {
        setRules((prev) => prev.map((r) => (r.id === editing.id ? { ...r, ...form } : r)));
        toast('Rule updated', 'success');
      } else {
        setRules((prev) => [...prev, { ...form, id: Date.now().toString() }]);
        toast('Rule created', 'success');
      }
      setModalOpen(false);
    } catch {
      toast('Failed to save rule', 'error');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'customer_tier', label: 'Customer Tier' },
    { key: 'category', label: 'Category' },
    { key: 'max_discount_percent', label: 'Max Discount', render: (r: DiscountRule) => `${r.max_discount_percent}%` },
    { key: 'approval_required', label: 'Approval Required', render: (r: DiscountRule) => (
      <span className={`text-xs font-medium ${r.approval_required ? 'text-yellow-600' : 'text-gray-500'}`}>{r.approval_required ? 'Yes' : 'No'}</span>
    )},
    { key: 'approval_level', label: 'Approval Level' },
    { key: 'actions', label: '', render: (r: DiscountRule) => (
      <button onClick={(e) => { e.stopPropagation(); openEdit(r); }} className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100">Edit</button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discount Rules</h1>
          <p className="text-sm text-gray-500">Manage discount rules and approval thresholds</p>
        </div>
        <Button onClick={openCreate}>Add Rule</Button>
      </div>

      <DataTable columns={columns} data={rules as any} emptyMessage="No discount rules configured" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Rule' : 'Add Rule'} size="md">
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Customer Tier" value={form.customer_tier} onChange={(e) => setForm({ ...form, customer_tier: e.target.value })} />
          <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <Input label="Max Discount %" type="number" value={String(form.max_discount_percent)} onChange={(e) => setForm({ ...form, max_discount_percent: Number(e.target.value) })} />
          <Input label="Approval Level" type="number" value={String(form.approval_level)} onChange={(e) => setForm({ ...form, approval_level: Number(e.target.value) })} />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="approval_required" checked={form.approval_required} onChange={(e) => setForm({ ...form, approval_required: e.target.checked })} className="rounded" />
            <label htmlFor="approval_required" className="text-sm text-gray-900">Requires Approval</label>
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
