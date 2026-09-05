import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import RoleRoute from './routes/RoleRoute';
import LoginPage from './auth/LoginPage';
import SignUpPage from './auth/SignUpPage';
import VerifyOTP from './auth/VerifyOTP';
import ForgotPasswordPage from './auth/ForgotPasswordPage';
import ResetPassword from './auth/ResetPassword';
import Callback from './auth/Callback';
import Unauthorized from './pages/Unauthorized';
import AppShell from './components/layout/AppShell';

// Sales Pages
import SalesDashboard from './pages/sales/Dashboard';
import SalesCustomers from './pages/sales/Customers';
import SalesQuotations from './pages/sales/Quotations';
import QuoteBuilder from './pages/sales/QuoteBuilder';
import SalesOrders from './pages/sales/Orders';
import AIAdvisor from './pages/sales/AIAdvisor';
import DiscountRequests from './pages/sales/DiscountRequests';
import ApprovalStatus from './pages/sales/ApprovalStatus';

// Management Pages
import ManagementDashboard from './pages/management/Dashboard';
import ManagementApprovals from './pages/management/Approvals';
import DealHealth from './pages/management/DealHealth';
import Analytics from './pages/management/Analytics';
import Reports from './pages/management/Reports';
import Products from './pages/management/Products';
import Pricing from './pages/management/Pricing';
import DiscountRules from './pages/management/DiscountRules';
import ApprovalRules from './pages/management/ApprovalRules';
import ManagementWarehouses from './pages/management/Warehouses';
import ManagementSubscriptions from './pages/management/Subscriptions';
import Users from './pages/management/Users';

// Operations Pages
import OperationsDashboard from './pages/operations/Dashboard';
import OperationsOrders from './pages/operations/Orders';
import Fulfillment from './pages/operations/Fulfillment';
import OperationsWarehouses from './pages/operations/Warehouses';
import Invoices from './pages/operations/Invoices';
import Payments from './pages/operations/Payments';
import OperationsSubscriptions from './pages/operations/Subscriptions';

// Customer Pages
import CustomerDashboard from './pages/customer/Dashboard';
import CustomerQuotations from './pages/customer/CustomerQuotations';
import Negotiation from './pages/customer/Negotiation';
import CustomerOrders from './pages/customer/CustomerOrders';
import CustomerInvoices from './pages/customer/CustomerInvoices';
import CustomerPayments from './pages/customer/CustomerPayments';
import CustomerSubscriptions from './pages/customer/CustomerSubscriptions';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<SignUpPage />} />
            <Route path="/verify-email" element={<VerifyOTP />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<Callback />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Sales Portal */}
            <Route
              path="/sales"
              element={
                <RoleRoute allowedRoles={['SALES_REP', 'SALES_MANAGER', 'ADMIN']}>
                  <AppShell portalName="Sales Portal" />
                </RoleRoute>
              }
            >
              <Route path="dashboard" element={<SalesDashboard />} />
              <Route path="customers" element={<SalesCustomers />} />
              <Route path="quotations" element={<SalesQuotations />} />
              <Route path="quote-builder" element={<QuoteBuilder />} />
              <Route path="quote-builder/:id" element={<QuoteBuilder />} />
              <Route path="orders" element={<SalesOrders />} />
              <Route path="ai-advisor" element={<AIAdvisor />} />
              <Route path="discount-requests" element={<DiscountRequests />} />
              <Route path="approval-status" element={<ApprovalStatus />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>

            {/* Management Portal */}
            <Route
              path="/management"
              element={
                <RoleRoute allowedRoles={['SALES_MANAGER', 'FINANCE', 'ADMIN', 'MANAGER_ADMIN']}>
                  <AppShell portalName="Management Portal" />
                </RoleRoute>
              }
            >
              <Route path="dashboard" element={<ManagementDashboard />} />
              <Route path="approvals" element={<ManagementApprovals />} />
              <Route path="deal-health" element={<DealHealth />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="reports" element={<Reports />} />
              <Route path="products" element={<Products />} />
              <Route path="pricing" element={<Pricing />} />
              <Route path="discount-rules" element={<DiscountRules />} />
              <Route path="approval-rules" element={<ApprovalRules />} />
              <Route path="warehouses" element={<ManagementWarehouses />} />
              <Route path="subscriptions" element={<ManagementSubscriptions />} />
              <Route path="users" element={<Users />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>

            {/* Operations & Finance Portal */}
            <Route
              path="/operations"
              element={
                <RoleRoute allowedRoles={['OPERATIONS', 'FINANCE', 'ADMIN', 'OPS_FINANCE']}>
                  <AppShell portalName="Operations & Finance Portal" />
                </RoleRoute>
              }
            >
              <Route path="dashboard" element={<OperationsDashboard />} />
              <Route path="orders" element={<OperationsOrders />} />
              <Route path="fulfillment" element={<Fulfillment />} />
              <Route path="warehouses" element={<OperationsWarehouses />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="payments" element={<Payments />} />
              <Route path="subscriptions" element={<OperationsSubscriptions />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>

            {/* Customer Portal */}
            <Route
              path="/customer"
              element={
                <RoleRoute allowedRoles={['CUSTOMER']}>
                  <AppShell portalName="Customer Portal" />
                </RoleRoute>
              }
            >
              <Route path="dashboard" element={<CustomerDashboard />} />
              <Route path="quotations" element={<CustomerQuotations />} />
              <Route path="negotiation" element={<Negotiation />} />
              <Route path="negotiation/:quotationId" element={<Negotiation />} />
              <Route path="orders" element={<CustomerOrders />} />
              <Route path="invoices" element={<CustomerInvoices />} />
              <Route path="payments" element={<CustomerPayments />} />
              <Route path="subscriptions" element={<CustomerSubscriptions />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>

            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
