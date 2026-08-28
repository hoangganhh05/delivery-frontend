import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp, type Role } from './context/AppContext';
import { lazy, Suspense, type ReactNode } from 'react';
import Layout from './components/Layout';
import ToastContainer from './components/ToastContainer';
import ConfirmModal from './components/ConfirmModal';
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const Dispatch = lazy(() => import('./pages/Dispatch'));
const Shippers = lazy(() => import('./pages/Shippers'));
const ShipperDetail = lazy(() => import('./pages/ShipperDetail'));
const Users = lazy(() => import('./pages/Users'));
const Permissions = lazy(() => import('./pages/Permissions'));
const Payments = lazy(() => import('./pages/Payments'));
const Vouchers = lazy(() => import('./pages/Vouchers'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Tracking = lazy(() => import('./pages/Tracking'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const CustomerView = lazy(() => import('./pages/CustomerView'));
const ShipperMobile = lazy(() => import('./pages/ShipperMobile'));

function AppRoutes() {
  const { isLoggedIn, role } = useApp();
  const homeRoute = role === 'Customer' ? '/customer' : role === 'Shipper' ? '/shipper-mobile' : '/';

  const allow = (roles: Role[], element: ReactNode) =>
    roles.includes(role) ? element : <Navigate to={homeRoute} replace />;

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-slate-400">Đang tải giao diện...</div>}>
    <Routes>
      {/* Auth */}
      <Route
        path="/login"
        element={isLoggedIn ? <Navigate to={homeRoute} replace /> : <Login />}
      />

      {/* Standalone views — auth required */}
      <Route
        path="/customer"
        element={isLoggedIn ? allow(['Customer', 'Admin'], <CustomerView />) : <Navigate to="/login" replace />}
      />
      <Route
        path="/shipper-mobile"
        element={isLoggedIn ? allow(['Shipper', 'Admin'], <ShipperMobile />) : <Navigate to="/login" replace />}
      />

      {/* Admin shell — auth required */}
      {isLoggedIn ? (
        <Route element={<Layout />}>
          <Route path="/" element={allow(['Admin', 'Staff'], <Dashboard />)} />
          <Route path="/orders" element={allow(['Admin', 'Staff'], <Orders />)} />
          <Route path="/orders/:id" element={allow(['Admin', 'Staff'], <OrderDetail />)} />
          <Route path="/dispatch" element={allow(['Admin', 'Staff'], <Dispatch />)} />
          <Route path="/shippers" element={allow(['Admin', 'Staff'], <Shippers />)} />
          <Route path="/shippers/:id" element={allow(['Admin', 'Staff'], <ShipperDetail />)} />
          <Route path="/users" element={allow(['Admin'], <Users />)} />
          <Route path="/permissions" element={allow(['Admin'], <Permissions />)} />
          <Route path="/payments" element={allow(['Admin', 'Staff'], <Payments />)} />
          <Route path="/vouchers" element={allow(['Admin', 'Staff'], <Vouchers />)} />
          <Route path="/notifications" element={allow(['Admin', 'Staff'], <Notifications />)} />
          <Route path="/tracking" element={allow(['Admin', 'Staff'], <Tracking />)} />
          <Route path="/reports" element={allow(['Admin', 'Staff'], <Reports />)} />
          <Route path="/settings" element={allow(['Admin'], <Settings />)} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}

      <Route
        path="*"
        element={<Navigate to={isLoggedIn ? homeRoute : '/login'} replace />}
      />
    </Routes>
    </Suspense>
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
