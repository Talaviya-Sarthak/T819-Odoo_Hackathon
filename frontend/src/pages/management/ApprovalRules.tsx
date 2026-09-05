import { useState } from 'react';
import DataTable from '../../components/DataTable';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import { useToast } from '../../components/Toast';

interface ApprovalRule {
  id: string;
  name: string;
  min_amount: number;
  max_amount: number;
  risk_threshold: number;
  required_level: number;
  is_active: boolean;
}

const emptyRule: Omit<ApprovalRule, 'id'> = {
  name: '',
  min_amount: 0,
  max_amount: 0,
  risk_threshold: 0,
  required_level: 1,
  is_active: true,
};

export default function ApprovalRules() {
  const { toast } = useToast();
  const [rules, setRules] = useState<ApprovalRule[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApprovalRule | null>(null);
  const [form, setForm] = useState(emptyRule);
  const [saving, setSaving] = useState(false);

  const openCreate = () => { setEditing(null); setForm(emptyRule); setModalOpen(true); };
  const openEdit = (r: ApprovalRule) => { setEditing(r); setForm(r); setModalOpen(true); };

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
    { key: 'min_amount', label: 'Min Amount', render: (r: ApprovalRule) => `$${r.min_amount.toLocaleString()}` },
    { key: 'max_amount', label: 'Max Amount', render: (r: ApprovalRule) => `$${r.max_amount.toLocaleString()}` },
    { key: 'risk_threshold', label: 'Risk Threshold', render: (r: ApprovalRule) => `${r.risk_threshold}%` },
    { key: 'required_level', label: 'Required Level' },
    { key: 'is_active', label: 'Active', render: (r: ApprovalRule) => (
      <span className={`text-xs font-medium ${r.is_active ? 'text-green-600' : 'text-gray-400'}`}>{r.is_active ? 'Yes' : 'No'}</span>
    )},
    { key: 'actions', label: '', render: (r: ApprovalRule) => (
      <button onClick={(e) => { e.stopPropagation(); openEdit(r); }} className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100">Edit</button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approval Rules</h1>
          <p className="text-sm text-gray-500">Define amount thresholds and approval level requirements</p>
        </div>
        <Button onClick={openCreate}>Add Rule</Button>
      </div>

      <DataTable columns={columns} data={rules as any} emptyMessage="No approval rules configured" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Rule' : 'Add Rule'} size="md">
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Min Amount" type="number" value={String(form.min_amount)} onChange={(e) => setForm({ ...form, min_amount: Number(e.target.value) })} />
          <Input label="Max Amount" type="number" value={String(form.max_amount)} onChange={(e) => setForm({ ...form, max_amount: Number(e.target.value) })} />
          <Input label="Risk Threshold %" type="number" value={String(form.risk_threshold)} onChange={(e) => setForm({ ...form, risk_threshold: Number(e.target.value) })} />
          <Input label="Required Level" type="number" value={String(form.required_level)} onChange={(e) => setForm({ ...form, required_level: Number(e.target.value) })} />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
            <label htmlFor="is_active" className="text-sm text-gray-900">Active</label>
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
