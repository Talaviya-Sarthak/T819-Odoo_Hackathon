import { useAuth } from '../../context/AuthContext';

export default function ManagementDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Management Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome back, {user?.name || user?.email}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pending Approvals" value="6" change="3 high priority" />
        <StatCard title="Active Deals" value="24" change="+5 this week" />
        <StatCard title="Total Revenue" value="$1.2M" change="+18% vs last month" />
        <StatCard title="Team Members" value="8" change="2 new hires" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Approval Queue</h3>
          <p className="text-sm text-gray-500">No pending approvals. All caught up!</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Deal Health Overview</h3>
          <p className="text-sm text-gray-500">Deal health metrics will appear here.</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change }: { title: string; value: string; change: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-green-600">{change}</p>
    </div>
  );
}
