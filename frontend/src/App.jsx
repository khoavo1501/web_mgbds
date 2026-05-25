import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import CustomerLayout from "./layouts/CustomerLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { FavoritesProvider } from "./context/FavoritesContext";

// Public & Auth Pages
import Homepage from "./pages/public/Homepage";
import PropertyList from "./pages/public/PropertyList";
import PropertyDetail from "./pages/public/PropertyDetail";
import Auth from "./pages/public/Auth";

// Customer Pages
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import CustomerTransactions from "./pages/customer/CustomerTransactions";
import MyAppointments from "./pages/customer/MyAppointments";
import AppointmentDetail from "./pages/customer/AppointmentDetail";
import BookAppointmentFlow from "./pages/customer/BookAppointmentFlow";
import BookAppointment from "./pages/customer/BookAppointment";
import RescheduleAppointment from "./pages/customer/RescheduleAppointment";
import CancelAppointment from "./pages/customer/CancelAppointment";

// Broker Pages
import BrokerDashboard from "./pages/broker/BrokerDashboard";
import BrokerFinance from "./pages/broker/BrokerFinance";
import PropertyUpload from "./pages/broker/PropertyUpload";
import BrokerTransactionHistory from "./pages/broker/BrokerTransactionHistory";
import CreateTransaction from "./pages/broker/CreateTransaction";
import BrokerAppointments from "./pages/broker/BrokerAppointments";
import BrokerLayout from "./layouts/BrokerLayout";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import PropertyManagement from "./pages/admin/PropertyManagement";
import PropertyApproval from "./pages/admin/PropertyApproval";
import FinancialManagement from "./pages/admin/FinancialManagement";
import UserManagement from "./pages/admin/UserManagement";
import AdminTransactionManagement from "./pages/admin/AdminTransactionManagement";

function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Homepage />} />
              <Route path="/properties" element={<PropertyList />} />
              <Route path="/properties/:id" element={<PropertyDetail />} />
              <Route path="/auth" element={<Auth />} />

            </Route>

            {/* Customer Routes - Sidebar Layout */}
            <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
              <Route element={<CustomerLayout />}>
                <Route path="/customer" element={<CustomerDashboard />} />
                <Route path="/customer/profile" element={<CustomerDashboard mode="profile" />} />
                <Route path="/customer/appointments" element={<CustomerDashboard mode="appointments" />} />
                <Route path="/customer/favorites" element={<CustomerDashboard mode="favorites" />} />
                <Route path="/customer/transactions" element={<CustomerTransactions />} />
                <Route path="/customer/transactions/active" element={<Navigate to="/customer/transactions" replace />} />
                <Route path="/customer/transactions/:transactionId" element={<CustomerTransactions detail />} />
                <Route path="/customer/appointments/legacy" element={<MyAppointments />} />
                <Route path="/customer/appointments/:id" element={<AppointmentDetail />} />
                <Route path="/customer/appointments/:id/reschedule" element={<RescheduleAppointment />} />
                <Route path="/customer/appointments/:id/cancel" element={<CancelAppointment />} />
                <Route path="/properties/:propertyId/book" element={<BookAppointment />} />
                <Route path="/properties/:propertyId/book-flow" element={<BookAppointmentFlow />} />
              </Route>
            </Route>

            {/* Broker Routes — Sidebar Layout */}
            <Route element={<ProtectedRoute allowedRoles={['broker']} />}>
              <Route element={<BrokerLayout />}>
                <Route path="/broker" element={<BrokerDashboard />} />
                <Route path="/broker/appointments" element={<BrokerAppointments />} />
                <Route path="/broker/finance" element={<BrokerFinance />} />
                <Route path="/broker/transaction" element={<Navigate to="/broker/transactions/history" replace />} />
                <Route path="/broker/transactions/history" element={<BrokerTransactionHistory />} />
                <Route path="/broker/transactions/create" element={<CreateTransaction />} />
                <Route path="/broker/upload" element={<PropertyUpload />} />
              </Route>
            </Route>

            {/* Admin Dashboard Routes - Sidebar Layout */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route element={<DashboardLayout />}>
                {/* Admin */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/properties" element={<PropertyManagement />} />
                <Route path="/admin/approval" element={<PropertyApproval />} />
                <Route path="/admin/transactions" element={<AdminTransactionManagement />} />
                <Route path="/admin/finance" element={<FinancialManagement />} />
                <Route path="/admin/users" element={<UserManagement />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </FavoritesProvider>
    </AuthProvider>
  );
}

export default App;
