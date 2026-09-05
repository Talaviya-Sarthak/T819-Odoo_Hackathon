import { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import Tabs from '../../components/Tabs';
import { useToast } from '../../components/Toast';
import type { User, Role } from '../../types';

const roleTabs = [
  { key: 'all', label: 'All' },
  { key: 'SALES_REP', label: 'Sales Rep' },
  { key: 'MANAGER_ADMIN', label: 'Manager' },
  { key: 'OPS_FINANCE', label: 'Ops/Finance' },
  { key: 'CUSTOMER', label: 'Customer' },
];

const roleBadgeVariant: Record<Role, 'info' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  ADMIN: 'danger',
  SALES_REP: 'info',
  SALES_MANAGER: 'success',
  FINANCE: 'warning',
  OPERATIONS: 'info',
  CUSTOMER: 'neutral',
  MANAGER_ADMIN: 'success',
  OPS_FINANCE: 'warning',
};

const roleOptions = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SALES_REP', label: 'Sales Rep' },
  { value: 'SALES_MANAGER', label: 'Sales Manager' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'OPERATIONS', label: 'Operations' },
  { value: 'CUSTOMER', label: 'Customer' },
];

export default function Users() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // In production, this would call a dedicated users API
      setUsers([]);
    } catch {
      toast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = roleFilter === 'all' ? users : users.filter((u) => u.role === roleFilter);

  const toggleStatus = (user: User) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u))
    );
    toast(`User ${user.status === 'active' ? 'deactivated' : 'activated'}`, 'success');
  };

  const changeRole = (user: User, newRole: Role) => {
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));
    toast('Role updated', 'success');
  };

  const columns = [
    { key: 'name', label: 'Name', render: (r: User) => r.name || '-' },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Role',
      render: (r: User) => <Badge variant={roleBadgeVariant[r.role] || 'neutral'}>{r.role.replace(/_/g, ' ')}</Badge>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (r: User) => (
        <span className={`text-xs font-medium ${(r.status || 'active') === 'active' ? 'text-green-600' : 'text-red-600'}`}>
          {(r.status || 'active').charAt(0).toUpperCase() + (r.status || 'active').slice(1)}
        </span>
      ),
    },
    {
      key: 'email_verified',
      label: 'Verified',
      render: (r: User) => (
        <span className={`text-xs font-medium ${r.email_verified ? 'text-green-600' : 'text-gray-400'}`}>
          {r.email_verified ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Joined',
      render: (r: User) => r.created_at ? new Date(r.created_at).toLocaleDateString() : '-',
    },
    {
      key: 'actions',
      label: '',
      render: (r: User) => (
        <div className="flex gap-1">
          <select
            value={r.role}
            onChange={(e) => { e.stopPropagation(); changeRole(r, e.target.value as Role); }}
            onClick={(e) => e.stopPropagation()}
            className="rounded border border-gray-200 px-1 py-0.5 text-xs text-gray-900"
          >
            {roleOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button
            onClick={(e) => { e.stopPropagation(); toggleStatus(r); }}
            className={`rounded px-2 py-0.5 text-xs font-medium ${(r.status || 'active') === 'active' ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
          >
            {(r.status || 'active') === 'active' ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500">Manage users, roles, and access</p>
      </div>

      <Tabs tabs={roleTabs} activeTab={roleFilter} onChange={setRoleFilter} />

      <DataTable columns={columns} data={filtered as any} loading={loading} emptyMessage="No users found" />
    </div>
  );
}
