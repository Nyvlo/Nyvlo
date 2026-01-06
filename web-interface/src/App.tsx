import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import DashboardPage from './pages/DashboardPage'
import InstancesPage from './pages/InstancesPage'
import LoggedAgentsPage from './pages/LoggedAgentsPage'
import ChatPage from './pages/ChatPage'
import UsersPage from './pages/UsersPage'
import MonitoringPage from './pages/MonitoringPage'
import AISettingsPage from './pages/AISettingsPage'
import MenuEditorPage from './pages/MenuEditorPage'
import MessagesPage from './pages/MessagesPage'
import FAQPage from './pages/FAQPage'
import CatalogPage from './pages/CatalogPage'
import AppointmentsPage from './pages/AppointmentsPage'
import LeadsPage from './pages/LeadsPage'
import TenantsPage from './pages/TenantsPage'
import TenantSettingsPage from './pages/TenantSettingsPage'
import PlansPage from './pages/PlansPage'
import PlansManagementPage from './pages/PlansManagementPage'
import FinancialPage from './pages/FinancialPage'
import SalesPage from './pages/SalesPage'
import CustomersPage from './pages/CustomersPage'
import AccountPage from './pages/AccountPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import './components/auth/ProtectedRoute.css'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />

      {/* Principal */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/:instanceId"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />

      {/* Admin only */}
      <Route
        path="/instances"
        element={
          <ProtectedRoute>
            <InstancesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/logged-agents"
        element={
          <ProtectedRoute requiredRole="admin">
            <LoggedAgentsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/monitoring"
        element={
          <ProtectedRoute requiredRole="admin">
            <MonitoringPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-settings"
        element={
          <ProtectedRoute requiredRole="admin">
            <AISettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <TenantSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plans"
        element={
          <ProtectedRoute>
            <PlansPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute requiredRole="admin">
            <UsersPage />
          </ProtectedRoute>
        }
      />

      {/* Admin or Supervisor / Automation */}
      <Route
        path="/menu-editor"
        element={
          <ProtectedRoute>
            <MenuEditorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <MessagesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faq"
        element={
          <ProtectedRoute>
            <FAQPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/catalog"
        element={
          <ProtectedRoute>
            <CatalogPage />
          </ProtectedRoute>
        }
      />

      {/* Data */}
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <CustomersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments"
        element={
          <ProtectedRoute>
            <AppointmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leads"
        element={
          <ProtectedRoute>
            <LeadsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales"
        element={
          <ProtectedRoute requiredRole="admin">
            <SalesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        }
      />

      {/* Platform Admin Only */}
      <Route
        path="/tenants"
        element={
          <ProtectedRoute requiredRole="superadmin">
            <TenantsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plans-management"
        element={
          <ProtectedRoute requiredRole="superadmin">
            <PlansManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/financial"
        element={
          <ProtectedRoute requiredRole="superadmin">
            <FinancialPage />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  )
}

export default App
