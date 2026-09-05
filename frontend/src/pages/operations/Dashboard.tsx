import { useAuth } from '../../context/AuthContext';

export default function OperationsDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Operations & Finance Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome back, {user?.name || user?.email}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Orders to Fulfill" value="15" change="5 urgent" />
        <StatCard title="Outstanding Invoices" value="$89K" change="12 invoices" />
        <StatCard title="Warehouse Stock" value="1,240" change="SKU items" />
        <StatCard title="Payment Received" value="$340K" change="this month" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Fulfillment Status</h3>
          <p className="text-sm text-gray-500">No orders pending fulfillment.</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Payment Overview</h3>
          <p className="text-sm text-gray-500">Payment status will appear here.</p>
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
