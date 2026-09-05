import { useState, useEffect, useCallback } from 'react';
import Tabs from '../../components/Tabs';
import DataTable from '../../components/DataTable';
import { useToast } from '../../components/Toast';
import { getSalesReport, getApprovalReport, getFulfillmentReport, getBillingReport } from '../../services/reports.api';
import type { SalesReport, ApprovalReport, FulfillmentReport, BillingReport } from '../../types';

const tabs = [
  { key: 'sales', label: 'Sales Report' },
  { key: 'approvals', label: 'Approval Report' },
  { key: 'fulfillment', label: 'Fulfillment Report' },
  { key: 'billing', label: 'Billing Report' },
];

export default function Reports() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('sales');
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<SalesReport[]>([]);
  const [approvalData, setApprovalData] = useState<ApprovalReport[]>([]);
  const [fulfillmentData, setFulfillmentData] = useState<FulfillmentReport[]>([]);
  const [billingData, setBillingData] = useState<BillingReport[]>([]);

  const loadTab = useCallback(async (tab: string) => {
    setLoading(true);
    try {
      if (tab === 'sales') {
        const res = await getSalesReport();
        setSalesData(res.report);
      } else if (tab === 'approvals') {
        const res = await getApprovalReport();
        setApprovalData(res.report);
      } else if (tab === 'fulfillment') {
        const res = await getFulfillmentReport();
        setFulfillmentData(res.report);
      } else {
        const res = await getBillingReport();
        setBillingData(res.report);
      }
    } catch {
      toast('Failed to load report', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadTab(activeTab); }, [activeTab, loadTab]);

  const salesColumns = [
    { key: 'period', label: 'Period' },
    { key: 'total_sales', label: 'Total Sales', render: (r: SalesReport) => `$${r.total_sales.toLocaleString()}` },
    { key: 'total_orders', label: 'Orders' },
    { key: 'average_order_value', label: 'Avg Order', render: (r: SalesReport) => `$${r.average_order_value.toLocaleString()}` },
    { key: 'top_products', label: 'Top Products', render: (r: SalesReport) => r.top_products?.map((p) => p.product_name).join(', ') || '-' },
  ];

  const approvalColumns = [
    { key: 'period', label: 'Period' },
    { key: 'total_requests', label: 'Total Requests' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'returned', label: 'Returned' },
    { key: 'average_processing_time', label: 'Avg Time (h)', render: (r: ApprovalReport) => r.average_processing_time?.toFixed(1) ?? '-' },
  ];

  const fulfillmentColumns = [
    { key: 'period', label: 'Period' },
    { key: 'total_orders', label: 'Total Orders' },
    { key: 'fulfilled', label: 'Fulfilled' },
    { key: 'pending', label: 'Pending' },
    { key: 'backordered', label: 'Backordered' },
    { key: 'average_fulfillment_time', label: 'Avg Time (h)', render: (r: FulfillmentReport) => r.average_fulfillment_time?.toFixed(1) ?? '-' },
  ];

  const billingColumns = [
    { key: 'period', label: 'Period' },
    { key: 'total_invoiced', label: 'Invoiced', render: (r: BillingReport) => `$${r.total_invoiced.toLocaleString()}` },
    { key: 'total_collected', label: 'Collected', render: (r: BillingReport) => `$${r.total_collected.toLocaleString()}` },
    { key: 'outstanding', label: 'Outstanding', render: (r: BillingReport) => `$${r.outstanding.toLocaleString()}` },
    { key: 'overdue', label: 'Overdue', render: (r: BillingReport) => `$${r.overdue.toLocaleString()}` },
    { key: 'collection_rate', label: 'Rate', render: (r: BillingReport) => `${r.collection_rate}%` },
  ];

  const columnsMap: Record<string, any[]> = {
    sales: salesColumns,
    approvals: approvalColumns,
    fulfillment: fulfillmentColumns,
    billing: billingColumns,
  };

  const dataMap: Record<string, any[]> = {
    sales: salesData,
    approvals: approvalData,
    fulfillment: fulfillmentData,
    billing: billingData,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500">View detailed business reports</p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <DataTable
        columns={columnsMap[activeTab]}
        data={dataMap[activeTab] as any}
        loading={loading}
        emptyMessage="No report data available"
      />
    </div>
  );
}
