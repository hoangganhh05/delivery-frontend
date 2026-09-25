import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp, type Role } from './context/AppContext';
import { lazy, Suspense, type ReactNode } from 'react';
import Layout from './components/Layout';
import DocumentTitle from './components/DocumentTitle';
import ToastContainer from './components/ToastContainer';
import ConfirmModal from './components/ConfirmModal';
import { LoadingState } from './components/Skeleton';
import { I18nProvider } from './i18n/I18nProvider';
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
const AccountSettings = lazy(() => import('./components/AccountSettings'));
const CustomerView = lazy(() => import('./pages/CustomerView'));
const ShipperMobile = lazy(() => import('./pages/ShipperMobile'));

function AppRoutes() {
  const { isLoggedIn, role, hasPermission } = useApp();
  const homeRoute = role === 'Customer' ? '/customer' : role === 'Shipper' ? '/shipper-mobile' : '/';

  const allow = (roles: Role[], element: ReactNode) =>
    roles.includes(role) ? element : <Navigate to={homeRoute} replace />;
  const permit = (code: string, element: ReactNode) =>
    hasPermission(code) ? element : <Navigate to={homeRoute} replace />;

  return (
    <Suspense fallback={<LoadingState label="Đang mở trang..." className="min-h-screen" />}>
    <Routes>
      {/* Auth */}
      <Route
        path="/login"
        element={isLoggedIn ? <Navigate to={homeRoute} replace /> : <Login />}
      />

      {/* Standalone views — auth required */}
      <Route
        path="/customer"
        element={isLoggedIn ? allow(['Customer'], <CustomerView />) : <Navigate to="/login" replace />}
      />
      <Route
        path="/shipper-mobile"
        element={isLoggedIn ? allow(['Shipper'], <ShipperMobile />) : <Navigate to="/login" replace />}
      />

      {/* Admin shell — auth required */}
      {isLoggedIn ? (
        <Route element={<Layout />}>
          <Route path="/" element={allow(['Admin', 'Staff'], <Dashboard />)} />
          <Route path="/orders" element={permit('VIEW_ORDERS', <Orders />)} />
          <Route path="/orders/:id" element={permit('VIEW_ORDERS', <OrderDetail />)} />
          <Route path="/dispatch" element={permit('ASSIGN_SHIPPER', <Dispatch />)} />
          <Route path="/shippers" element={permit('VIEW_SHIPPERS', <Shippers />)} />
          <Route path="/shippers/:id" element={permit('VIEW_SHIPPERS', <ShipperDetail />)} />
          <Route path="/users" element={permit('VIEW_USERS', <Users />)} />
          <Route path="/permissions" element={permit('MANAGE_ROLES', <Permissions />)} />
          <Route path="/payments" element={permit('VIEW_PAYMENTS', <Payments />)} />
          <Route path="/vouchers" element={permit('MANAGE_VOUCHERS', <Vouchers />)} />
          <Route path="/notifications" element={permit('VIEW_NOTIFICATIONS', <Notifications />)} />
          <Route path="/tracking" element={allow(['Admin', 'Staff'], <Tracking />)} />
          <Route path="/reports" element={permit('VIEW_REPORTS', <Reports />)} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/account" element={<AccountSettings />} />
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
  const { user } = useApp();

  return (
    <I18nProvider language={user?.settings?.language ?? 'vi'}>
      <DocumentTitle />
      <AppRoutes />
      <ToastContainer />
      <ConfirmModal />
    </I18nProvider>
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
