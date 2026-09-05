import { useState, useEffect } from 'react';
import { getCustomers, createCustomer, updateCustomer } from '../../services/customers.api';
import type { Customer, CustomerTier } from '../../types';
import Button from '../../components/Button';
import Card from '../../components/Card';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { useToast } from '../../components/Toast';

const tierBadgeVariant: Record<string, 'neutral' | 'info' | 'warning' | 'success'> = {
  BRONZE: 'neutral',
  SILVER: 'info',
  GOLD: 'warning',
  PLATINUM: 'success',
};

const tierOptions = [
  { value: 'BRONZE', label: 'Bronze' },
  { value: 'SILVER', label: 'Silver' },
  { value: 'GOLD', label: 'Gold' },
  { value: 'PLATINUM', label: 'Platinum' },
];

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  company: '',
  address: '',
  city: '',
  country: '',
  tier: '' as CustomerTier | '',
  currency: 'USD',
};

export default function Customers() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getCustomers();
      setCustomers(res.customers);
    } catch (err) {
      toast('Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      name: c.name,
      email: c.email,
      phone: c.phone || '',
      company: c.company || '',
      address: c.address || '',
      city: c.city || '',
      country: c.country || '',
      tier: c.tier,
      currency: 'USD',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) {
      toast('Name and email are required', 'warning');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, tier: form.tier as CustomerTier };
      if (editing) {
        await updateCustomer(editing.id, payload);
        toast('Customer updated', 'success');
      } else {
        await createCustomer(payload);
        toast('Customer created', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast('Failed to save customer', 'error');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'company', label: 'Company', render: (r: Customer) => r.company || '-' },
    { key: 'email', label: 'Email' },
    { key: 'city', label: 'City', render: (r: Customer) => r.city || '-' },
    { key: 'country', label: 'Country', render: (r: Customer) => r.country || '-' },
    {
      key: 'tier',
      label: 'Tier',
      render: (r: Customer) => (
        <Badge variant={tierBadgeVariant[r.tier] || 'neutral'}>{r.tier}</Badge>
      ),
    },
  ];

  const updateField = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500">Manage your customer accounts</p>
        </div>
        <Button onClick={openAdd}>Add Customer</Button>
      </div>

      <Card padding="p-4">
        <input
          type="text"
          placeholder="Search by name, company, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
        />
      </Card>

      <DataTable
        columns={columns}
        data={filtered as unknown as Record<string, unknown>[]}
        loading={loading}
        emptyMessage="No customers found"
        onRowClick={(r) => openEdit(r as unknown as Customer)}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'Add Customer'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Name" value={form.name} onChange={updateField('name')} required />
            <Input label="Email" value={form.email} onChange={updateField('email')} type="email" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" value={form.phone} onChange={updateField('phone')} />
            <Input label="Company" value={form.company} onChange={updateField('company')} />
          </div>
          <Input label="Address" value={form.address} onChange={updateField('address')} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="City" value={form.city} onChange={updateField('city')} />
            <Input label="Country" value={form.country} onChange={updateField('country')} />
            <Input label="Currency" value={form.currency} onChange={updateField('currency')} />
          </div>
          <Select
            label="Tier"
            value={form.tier}
            onChange={updateField('tier')}
            options={tierOptions}
            placeholder="Select tier"
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
