import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { getCustomers, createCustomer, updateCustomer } from '../../services/customers.api';
import type { Customer, CustomerTier } from '../../types';
import { Button } from '@/components/ui/button';
import Input from '../../components/Input';
import { Skeleton } from '@/components/ui/skeleton';
import Modal from '../../components/Modal';
import Select from '../../components/Select';
import { useToast } from '../../components/Toast';
import { 
  Users, 
  Plus, 
  Search, 
  Building, 
  Mail, 
  Phone, 
  Globe, 
  CreditCard,
  Edit2,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Briefcase
} from 'lucide-react';

const tierBadgeStyles: Record<string, string> = {
  BRONZE: 'bg-amber-700/15 text-amber-500 border-amber-700/30',
  SILVER: 'bg-slate-400/15 text-slate-300 border-slate-400/30',
  GOLD: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  PLATINUM: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
};

const tierOptions = [
  { value: 'BRONZE', label: 'Bronze Tier' },
  { value: 'SILVER', label: 'Silver Tier' },
  { value: 'GOLD', label: 'Gold Tier' },
  { value: 'PLATINUM', label: 'Platinum Tier' },
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

const rowVariants: any = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.03,
      duration: 0.2,
      ease: 'easeOut',
    },
  }),
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
      setCustomers(res.customers || []);
    } catch (err: any) {
      toast.fail(err?.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return customers.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [customers, search]);

  const getTierName = (tier: any): string => {
    if (!tier) return 'BRONZE';
    if (typeof tier === 'object' && tier.name) return String(tier.name).toUpperCase();
    if (typeof tier === 'string') return tier.toUpperCase();
    return 'BRONZE';
  };

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
      city: (c as any).city || '',
      country: (c as any).country || '',
      tier: getTierName(c.tier) as CustomerTier,
      currency: (c as any).currency || 'USD',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) {
      toast.warning('Name and email are required', 'Validation');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        tier: form.tier ? (form.tier as CustomerTier) : undefined,
      };
      if (editing) {
        await updateCustomer(editing.id, payload);
        toast.success('Customer profile updated successfully');
      } else {
        await createCustomer(payload);
        toast.success('New customer registered successfully');
      }
      setModalOpen(false);
      load();
    } catch (err: any) {
      toast.fail(err?.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // KPI Calculations
  const stats = useMemo(() => {
    const total = customers.length;
    const enterprise = customers.filter((c) => {
      const t = getTierName(c.tier);
      return t === 'GOLD' || t === 'PLATINUM';
    }).length;
    return { total, enterprise };
  }, [customers]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Customer Accounts & Accounts Directory</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary border border-primary/20">
              <Building className="w-3 h-3" /> CRM Master
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Authoritative accounts directory with tiered pricing classification and contact details
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 border-border/60 bg-card text-foreground hover:bg-white/5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button onClick={openAdd} size="sm" className="flex items-center gap-1.5 shadow-xs">
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Clean Minimal KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-xs">
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Total Accounts</span>
          <div className="mt-1.5 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <span className="text-xs text-muted-foreground font-medium">Registered clients</span>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-xs">
          <span className="text-[11px] font-semibold tracking-wider text-amber-400 uppercase">Tier 1 Enterprise</span>
          <div className="mt-1.5 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-amber-400">{stats.enterprise}</p>
            <span className="text-xs text-muted-foreground font-medium">Gold & Platinum tier</span>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-xs">
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Billing Currency</span>
          <div className="mt-1.5 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-foreground">USD ($)</p>
            <span className="text-xs text-emerald-400 font-medium">Global Standard</span>
          </div>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/60 p-3 rounded-xl border border-border/50">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by company name, contact, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-lg border border-border/60 bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
          />
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          Showing {filtered.length} of {customers.length} accounts
        </span>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-border/50 bg-card shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <RefreshCw className="h-5 w-5 animate-spin" />
            </div>
            <span className="text-sm font-medium text-foreground">Loading accounts directory...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Users className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
            <h3 className="text-base font-semibold text-foreground">No Customer Accounts Found</h3>
            <p className="mt-1 text-xs text-muted-foreground">Try adjusting your search query or add a new account.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-foreground">
              <thead className="bg-muted/30 text-xs font-semibold uppercase text-muted-foreground border-b border-border/50">
                <tr>
                  <th className="px-6 py-3.5">Account & Contact</th>
                  <th className="px-6 py-3.5">Company</th>
                  <th className="px-6 py-3.5">Contact Details</th>
                  <th className="px-6 py-3.5">Location</th>
                  <th className="px-6 py-3.5">Tier Classification</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/40">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-lg" />
                          <div className="space-y-1.5">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-40" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5"><Skeleton className="h-4 w-28" /></td>
                      <td className="px-6 py-3.5"><Skeleton className="h-4 w-36" /></td>
                      <td className="px-6 py-3.5"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-3.5"><Skeleton className="h-5 w-20 rounded-full" /></td>
                      <td className="px-6 py-3.5 text-right"><Skeleton className="h-8 w-16 ml-auto rounded-md" /></td>
                    </tr>
                  ))
                ) : filtered.map((c, idx) => {
                  const tier = getTierName(c.tier);
                  const tierStyle = tierBadgeStyles[tier] || tierBadgeStyles.BRONZE;
                  const initials = c.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

                  return (
                    <motion.tr
                      key={c.id}
                      custom={idx}
                      initial="hidden"
                      animate="visible"
                      variants={rowVariants}
                      onClick={() => openEdit(c)}
                      className="cursor-pointer hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground text-sm">{c.name}</div>
                            <div className="text-xs text-muted-foreground">{c.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1.5 text-foreground text-xs font-medium">
                          <Building className="w-3.5 h-3.5 text-muted-foreground/60" />
                          <span>{c.company || '—'}</span>
                        </div>
                      </td>

                      <td className="px-6 py-3.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground/60" />
                          <span>{c.phone || '—'}</span>
                        </div>
                      </td>

                      <td className="px-6 py-3.5 text-xs text-muted-foreground">
                        <span>{c.city ? `${c.city}, ${c.country || ''}` : c.country || '—'}</span>
                      </td>

                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide ${tierStyle}`}>
                          {tier}
                        </span>
                      </td>

                      <td className="px-6 py-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(c);
                          }}
                          className="h-7 px-2.5 text-xs text-primary hover:bg-primary/10"
                        >
                          <Edit2 className="w-3 h-3 mr-1" /> Edit
                        </Button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Clean Edit / Create Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer Profile' : 'Register New Customer'} size="lg">
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Primary Contact Name" value={form.name} onChange={updateField('name')} required placeholder="e.g. Eleanor Vance" />
            <Input label="Business Email" value={form.email} onChange={updateField('email')} type="email" required placeholder="e.g. eleanor@apexlogistics.com" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Phone Number" value={form.phone} onChange={updateField('phone')} placeholder="+1 (555) 019-2834" />
            <Input label="Company / Entity Name" value={form.company} onChange={updateField('company')} placeholder="e.g. Apex Global Logistics" />
          </div>

          <Input label="Street Address" value={form.address} onChange={updateField('address')} placeholder="100 Enterprise Way, Suite 400" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="City" value={form.city} onChange={updateField('city')} placeholder="San Francisco" />
            <Input label="Country" value={form.country} onChange={updateField('country')} placeholder="United States" />
            <Input label="Currency" value={form.currency} onChange={updateField('currency')} placeholder="USD" />
          </div>

          <Select
            label="Pricing Tier Assignment"
            value={form.tier}
            onChange={updateField('tier')}
            options={tierOptions}
            placeholder="Select customer pricing tier"
          />

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border/40">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Update Account' : 'Register Account'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
