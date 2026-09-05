import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import LoginPage from './auth/LoginPage';
import SignUpPage from './auth/SignUpPage';
import VerifyOTP from './auth/VerifyOTP';
import ForgotPasswordPage from './auth/ForgotPasswordPage';
import ResetPassword from './auth/ResetPassword';
import Callback from './auth/Callback';
import Unauthorized from './pages/Unauthorized';
import AppShell from './components/layout/AppShell';
import SalesDashboard from './pages/sales/Dashboard';
import ManagementDashboard from './pages/management/Dashboard';
import OperationsDashboard from './pages/operations/Dashboard';
import CustomerDashboard from './pages/customer/Dashboard';

function App() {
  return (
    <AuthProvider>
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
              <RoleRoute allowedRoles={['SALES_REP']}>
                <AppShell portalName="Sales Portal" />
              </RoleRoute>
            }
          >
            <Route path="dashboard" element={<SalesDashboard />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Management Portal */}
          <Route
            path="/management"
            element={
              <RoleRoute allowedRoles={['MANAGER_ADMIN']}>
                <AppShell portalName="Management Portal" />
              </RoleRoute>
            }
          >
            <Route path="dashboard" element={<ManagementDashboard />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Operations & Finance Portal */}
          <Route
            path="/operations"
            element={
              <RoleRoute allowedRoles={['OPS_FINANCE']}>
                <AppShell portalName="Operations & Finance Portal" />
              </RoleRoute>
            }
          >
            <Route path="dashboard" element={<OperationsDashboard />} />
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
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Legacy dashboard redirect */}
          <Route path="/dashboard" element={<ProtectedRoute><Navigate to="/login" replace /></ProtectedRoute>} />

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
