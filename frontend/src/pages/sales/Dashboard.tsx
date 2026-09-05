import { useAuth } from '../../context/AuthContext';

export default function SalesDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome back, {user?.name || user?.email}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Quotations" value="12" change="+3 this week" />
        <StatCard title="Pending Approvals" value="4" change="2 urgent" />
        <StatCard title="Closed Deals" value="8" change="+2 this month" />
        <StatCard title="Revenue Pipeline" value="$245K" change="+12%" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Recent Quotations</h3>
          <p className="text-sm text-gray-500">No quotations yet. Create your first quote to get started.</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">AI Deal Recommendations</h3>
          <p className="text-sm text-gray-500">AI recommendations will appear here once you have active deals.</p>
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
