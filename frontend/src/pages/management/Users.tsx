import { useState, useEffect, useCallback, useMemo } from 'react';
import DataTable from '../../components/DataTable';
import Tabs from '../../components/Tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '../../components/Toast';
import { apiGet, apiPut } from '../../services/api';
import type { User, Role } from '../../types';
import { 
  ShieldCheck, 
  UserCheck, 
  Users as UsersIcon, 
  RefreshCw, 
  Mail, 
  Calendar 
} from 'lucide-react';

const roleTabs = [
  { key: 'all', label: 'All Roles' },
  { key: 'SALES_MANAGER', label: 'Managers' },
  { key: 'SALES_REP', label: 'Sales Representatives' },
  { key: 'FINANCE', label: 'Finance' },
  { key: 'OPERATIONS', label: 'Operations' },
  { key: 'CUSTOMER', label: 'Customers' },
];

const rolePills: Record<string, string> = {
  ADMIN: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
  SALES_MANAGER: 'bg-primary/10 text-primary border-primary/20',
  SALES_REP: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
  FINANCE: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
  OPERATIONS: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25',
  CUSTOMER: 'bg-muted text-muted-foreground border-border/50',
};

const roleOptions: { value: Role; label: string }[] = [
  { value: 'SALES_REP', label: 'Sales Representative' },
  { value: 'SALES_MANAGER', label: 'Sales Manager' },
  { value: 'FINANCE', label: 'Finance Manager' },
  { value: 'OPERATIONS', label: 'Operations Specialist' },
  { value: 'CUSTOMER', label: 'Customer User' },
  { value: 'ADMIN', label: 'Administrator' },
];


export default function Users() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<any>('/api/management/users?limit=100');
      const list = res.users || res.data?.users || res.data || [];
      if (Array.isArray(list) && list.length > 0) {
        setUsers(list);
      }
    } catch {
      toast.error('Failed to load users from database');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = useMemo(() => {
    return roleFilter === 'all' ? users : users.filter((u) => u.role === roleFilter);
  }, [users, roleFilter]);

  const toggleStatus = (user: User) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u))
    );
    toast.success(`User account ${user.status === 'active' ? 'deactivated' : 'activated'}`);
  };

  const changeRole = (user: User, newRole: Role) => {
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));
    toast.success(`Role updated to ${newRole.replace(/_/g, ' ')}`);
  };

  const columns = [
    { 
      key: 'name', 
      label: 'Team Member', 
      render: (r: User) => {
        const initials = (r.name || r.email).split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
        return (
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold border border-primary/20">
              {initials}
            </div>
            <div>
              <span className="font-semibold text-foreground text-xs">{r.name || 'Member'}</span>
              <span className="block text-[10px] text-muted-foreground">{r.email}</span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'role',
      label: 'Role & Permissions',
      render: (r: User) => {
        const pillStyle = rolePills[r.role] || rolePills.CUSTOMER;
        return (
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${pillStyle}`}>
            {r.role.replace(/_/g, ' ')}
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'Account Status',
      render: (r: User) => {
        const active = (r.status || 'active') === 'active';
        return (
          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
            active ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            {active ? 'Active' : 'Suspended'}
          </span>
        );
      },
    },
    {
      key: 'email_verified',
      label: 'Verification',
      render: (r: User) => (
        <span className={`text-xs font-medium ${r.email_verified ? 'text-emerald-400' : 'text-muted-foreground'}`}>
          {r.email_verified ? 'Verified (SSO)' : 'Pending'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Joined Date',
      render: (r: User) => (
        <span className="text-xs text-muted-foreground">
          {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (r: User) => (
        <div className="flex items-center justify-end gap-2">
          <select
            value={r.role}
            onChange={(e) => { e.stopPropagation(); changeRole(r, e.target.value as Role); }}
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg border border-border/60 bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            {roleOptions.map((o) => <option key={o.value} value={o.value} className="bg-card text-foreground">{o.label}</option>)}
          </select>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); toggleStatus(r); }}
            className={`h-7 px-2 text-xs font-semibold ${
              (r.status || 'active') === 'active' 
                ? 'text-rose-400 hover:bg-rose-500/10' 
                : 'text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            {(r.status || 'active') === 'active' ? 'Suspend' : 'Activate'}
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
            <h1 className="text-2xl font-bold tracking-tight text-foreground">User Roles & Access Governance</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary border border-primary/20">
              <ShieldCheck className="w-3 h-3" /> IAM Policy
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage personnel access control, approval hierarchies, and role assignments
          </p>
        </div>
      </div>

      {/* Role Filter Tabs */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-xs">
        <Tabs tabs={roleTabs} activeTab={roleFilter} onChange={setRoleFilter} />
      </div>

      <DataTable columns={columns} data={filtered as any} loading={loading} emptyMessage="No users found in this role." />
    </div>
  );
}
