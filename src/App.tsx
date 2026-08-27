import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import ToastContainer from './components/ToastContainer';
import ConfirmModal from './components/ConfirmModal';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Dispatch from './pages/Dispatch';
import Shippers from './pages/Shippers';
import ShipperDetail from './pages/ShipperDetail';
import Users from './pages/Users';
import Permissions from './pages/Permissions';
import Payments from './pages/Payments';
import Vouchers from './pages/Vouchers';
import Notifications from './pages/Notifications';
import Tracking from './pages/Tracking';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import CustomerView from './pages/CustomerView';
import ShipperMobile from './pages/ShipperMobile';

function AppRoutes() {
  const { isLoggedIn } = useApp();

  return (
    <Routes>
      {/* Auth */}
      <Route
        path="/login"
        element={isLoggedIn ? <Navigate to="/" replace /> : <Login />}
      />

      {/* Standalone views — auth required */}
      <Route
        path="/customer"
        element={isLoggedIn ? <CustomerView /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/shipper-mobile"
        element={isLoggedIn ? <ShipperMobile /> : <Navigate to="/login" replace />}
      />

      {/* Admin shell — auth required */}
      {isLoggedIn ? (
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/dispatch" element={<Dispatch />} />
          <Route path="/shippers" element={<Shippers />} />
          <Route path="/shippers/:id" element={<ShipperDetail />} />
          <Route path="/users" element={<Users />} />
          <Route path="/permissions" element={<Permissions />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/vouchers" element={<Vouchers />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}

      <Route
        path="*"
        element={<Navigate to={isLoggedIn ? '/' : '/login'} replace />}
      />
    </Routes>
  );
}

function AppShell() {
  return (
    <>
      <AppRoutes />
      <ToastContainer />
      <ConfirmModal />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AppProvider>
  );
}
