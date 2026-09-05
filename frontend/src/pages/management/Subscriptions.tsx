import { useState } from 'react';
import DataTable from '../../components/DataTable';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { useToast } from '../../components/Toast';

interface Plan {
  id: string;
  name: string;
  billing_interval: string;
  price: number;
  currency: string;
  proration_enabled: boolean;
  is_active: boolean;
}

const emptyPlan: Omit<Plan, 'id'> = {
  name: '',
  billing_interval: 'monthly',
  price: 0,
  currency: 'USD',
  proration_enabled: false,
  is_active: true,
};

const intervalOptions = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function Subscriptions() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState(emptyPlan);
  const [saving, setSaving] = useState(false);

  const openCreate = () => { setEditing(null); setForm(emptyPlan); setModalOpen(true); };
  const openEdit = (p: Plan) => { setEditing(p); setForm(p); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name) { toast('Name is required', 'warning'); return; }
    setSaving(true);
    try {
      if (editing) {
        setPlans((prev) => prev.map((p) => (p.id === editing.id ? { ...p, ...form } : p)));
        toast('Plan updated', 'success');
      } else {
        setPlans((prev) => [...prev, { ...form, id: Date.now().toString() }]);
        toast('Plan created', 'success');
      }
      setModalOpen(false);
    } catch {
      toast('Failed to save plan', 'error');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'billing_interval', label: 'Interval', render: (r: Plan) => r.billing_interval.charAt(0).toUpperCase() + r.billing_interval.slice(1) },
    { key: 'price', label: 'Price', render: (r: Plan) => `${r.currency} $${r.price.toLocaleString()}` },
    { key: 'proration_enabled', label: 'Proration', render: (r: Plan) => (
      <span className={`text-xs font-medium ${r.proration_enabled ? 'text-green-600' : 'text-gray-400'}`}>{r.proration_enabled ? 'Enabled' : 'Disabled'}</span>
    )},
    { key: 'is_active', label: 'Active', render: (r: Plan) => (
      <span className={`text-xs font-medium ${r.is_active ? 'text-green-600' : 'text-gray-400'}`}>{r.is_active ? 'Yes' : 'No'}</span>
    )},
    { key: 'actions', label: '', render: (r: Plan) => (
      <button onClick={(e) => { e.stopPropagation(); openEdit(r); }} className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100">Edit</button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-sm text-gray-500">Manage subscription billing plans</p>
        </div>
        <Button onClick={openCreate}>Add Plan</Button>
      </div>

      <DataTable columns={columns} data={plans as any} emptyMessage="No subscription plans" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Plan' : 'Add Plan'} size="md">
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Select label="Billing Interval" value={form.billing_interval} onChange={(e) => setForm({ ...form, billing_interval: e.target.value })} options={intervalOptions} />
          <Input label="Price" type="number" value={String(form.price)} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
          <Input label="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="proration" checked={form.proration_enabled} onChange={(e) => setForm({ ...form, proration_enabled: e.target.checked })} className="rounded" />
            <label htmlFor="proration" className="text-sm text-gray-900">Enable Proration</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="plan_active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
            <label htmlFor="plan_active" className="text-sm text-gray-900">Active</label>
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
