import { useAuth } from '../../context/AuthContext';

export default function CustomerDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customer Portal</h1>
        <p className="text-sm text-gray-500">Welcome back, {user?.name || user?.email}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="My Quotations" value="3" change="1 pending review" />
        <StatCard title="Active Orders" value="2" change="1 in transit" />
        <StatCard title="Pending Invoices" value="$4,200" change="2 invoices" />
        <StatCard title="Subscriptions" value="1" change="Active" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Recent Quotations</h3>
          <p className="text-sm text-gray-500">Your quotations will appear here.</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Order Status</h3>
          <p className="text-sm text-gray-500">Your order status will appear here.</p>
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
