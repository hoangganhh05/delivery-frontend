import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, Truck, Users, Navigation, MapPin,
  CreditCard, Tag, Bell, BarChart2, Settings, LogOut, ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Role } from '../context/AppContext';

const allNavGroups = [
  {
    label: 'Tổng quan',
    items: [
      { path: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['Admin', 'Staff'], permission: 'VIEW_REPORTS' },
    ]
  },
  {
    label: 'Vận hành',
    items: [
      { path: '/orders', icon: Package, label: 'Đơn hàng', roles: ['Admin', 'Staff'], permission: 'VIEW_ORDERS' },
      { path: '/dispatch', icon: Navigation, label: 'Điều phối', roles: ['Admin', 'Staff'], permission: 'ASSIGN_SHIPPER' },
      { path: '/tracking', icon: MapPin, label: 'Tracking', roles: ['Admin', 'Staff'], permission: 'VIEW_ORDERS' },
    ]
  },
  {
    label: 'Quản lý',
    items: [
      { path: '/shippers', icon: Truck, label: 'Shipper', roles: ['Admin', 'Staff'], permission: 'VIEW_SHIPPERS' },
      { path: '/users', icon: Users, label: 'Người dùng', roles: ['Admin', 'Staff'], permission: 'VIEW_USERS' },
      { path: '/permissions', icon: Settings, label: 'Phân quyền', roles: ['Admin', 'Staff'], permission: 'MANAGE_ROLES' },
    ]
  },
  {
    label: 'Tài chính',
    items: [
      { path: '/payments', icon: CreditCard, label: 'Thanh toán', roles: ['Admin', 'Staff'], permission: 'VIEW_PAYMENTS' },
      { path: '/vouchers', icon: Tag, label: 'Voucher', roles: ['Admin', 'Staff'], permission: 'MANAGE_VOUCHERS' },
    ]
  },
  {
    label: 'Khác',
    items: [
      { path: '/notifications', icon: Bell, label: 'Thông báo', roles: ['Admin', 'Staff'], permission: 'VIEW_NOTIFICATIONS' },
      { path: '/reports', icon: BarChart2, label: 'Báo cáo', roles: ['Admin', 'Staff'], permission: 'VIEW_REPORTS' },
      { path: '/settings', icon: Settings, label: 'Cài đặt', roles: ['Admin', 'Staff'], permission: 'SYSTEM_SETTINGS' },
    ]
  },
];

const demoViews = [
  { path: '/customer', label: 'Giao diện khách hàng', icon: Users },
  { path: '/shipper-mobile', label: 'Giao diện Shipper', icon: Truck },
];

const roleInfo: Record<Role, { color: string; bg: string; initials: string }> = {
  Admin: { color: 'text-red-700', bg: 'bg-red-100', initials: 'AD' },
  Staff: { color: 'text-blue-700', bg: 'bg-blue-100', initials: 'ST' },
  Shipper: { color: 'text-violet-700', bg: 'bg-violet-100', initials: 'SP' },
  Customer: { color: 'text-green-700', bg: 'bg-green-100', initials: 'KH' },
};

export default function Sidebar() {
  const location = useLocation();
  const { role, user, logout, openConfirm, sidebarOpen, setSidebarOpen, addToast, hasPermission } = useApp();
  const info = roleInfo[role];
  const displayName = user?.fullName || user?.username || role;
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map(part => part.charAt(0).toUpperCase())
    .join('') || info.initials;

  const handleLogout = () => {
    openConfirm({
      title: 'Đăng xuất',
      message: 'Bạn có chắc chắn muốn đăng xuất không?',
      confirmLabel: 'Đăng xuất',
      danger: true,
      onConfirm: () => {
        logout();
        addToast({ type: 'info', title: 'Đã đăng xuất', message: 'Hẹn gặp lại bạn!' });
      },
    });
  };

  return (
    <aside className={`app-sidebar fixed inset-y-0 left-0 z-40 w-60 min-h-screen border-r
      flex flex-col flex-shrink-0 transition-all duration-200 lg:static lg:z-auto
      ${sidebarOpen ? 'translate-x-0 lg:w-60' : '-translate-x-full lg:translate-x-0 lg:w-16'}`}>
      {/* Logo */}
      <div className="sidebar-brand h-[4.25rem] px-4 flex items-center gap-3 border-b overflow-hidden">
        <div className="sidebar-logo w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0">
          <Truck size={16} className="text-white" />
        </div>
        {sidebarOpen && (
          <div className="flex-1 min-w-0">
            <p className="sidebar-title text-sm font-800 leading-tight truncate tracking-tight">DeliveryMS</p>
            <p className="sidebar-caption text-[10px] leading-tight mt-0.5">Giao hàng thông minh</p>
          </div>
        )}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="sidebar-toggle w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        >
          {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {allNavGroups.map((group) => {
          const visibleItems = group.items.filter(item => item.roles.includes(role) && hasPermission(item.permission));
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label} className="mb-5">
              {sidebarOpen && (
                <p className="sidebar-group text-[10px] font-700 uppercase tracking-[0.15em] px-3 mb-2">
                  {group.label}
                </p>
              )}
              {visibleItems.map(({ path, icon: Icon, label }) => {
                const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
                return (
                  <NavLink
                    key={path}
                    to={path}
                    onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                    title={!sidebarOpen ? label : undefined}
                    className={`sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-600
                      ${isActive ? 'sidebar-link-active' : ''}`}
                  >
                    <Icon size={16} className="flex-shrink-0" />
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 truncate">{label}</span>
                        {isActive && <ChevronRight size={11} className="text-blue-300 flex-shrink-0" />}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          );
        })}

        {/* Demo views */}
        {sidebarOpen && (
          <div className="mb-4">
            <p className="sidebar-group text-[10px] font-700 uppercase tracking-[0.15em] px-3 mb-2">Trải nghiệm</p>
            {demoViews.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <NavLink key={path} to={path} onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                  className={`sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-xs font-600 ${isActive ? 'sidebar-link-active' : ''}`}>
                  <Icon size={14} className="flex-shrink-0" />
                  <span className="truncate">{label}</span>
                </NavLink>
              );
            })}
          </div>
        )}
      </nav>

      {/* User section */}
      <div className="sidebar-user border-t p-3">
        {sidebarOpen ? (
          <div>
            <NavLink to="/settings" className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 cursor-pointer mb-1">
              <div className={`w-8 h-8 ${info.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                <span className={`text-xs font-700 ${info.color}`}>{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="sidebar-user-name text-xs font-700 truncate">{displayName}</p>
                <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-600 ${info.bg} ${info.color}`}>
                  {role.toUpperCase()}
                </span>
              </div>
            </NavLink>
            <button onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors">
              <LogOut size={13} />
              <span>Đăng xuất</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className={`w-8 h-8 ${info.bg} rounded-full flex items-center justify-center`} title={displayName}>
              <span className={`text-xs font-700 ${info.color}`}>{initials}</span>
            </div>
            <button onClick={handleLogout} title="Đăng xuất"
              className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-500">
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
