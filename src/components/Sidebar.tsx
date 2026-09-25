import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, Truck, Users, Navigation, MapPin,
  CreditCard, Tag, Bell, BarChart2, Settings, LogOut, ChevronLeft,
  PanelLeftOpen
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Role } from '../context/AppContext';
import BrandLogo from './BrandLogo';
import { BRAND_SHORT_NAME, BRAND_TAGLINE } from '../config/brand';
import { getRoleLabel } from '../utils/role';
import { useTranslation, type TranslationKey } from '../i18n/I18nProvider';

const allNavGroups = [
  {
    labelKey: 'nav.overview' as TranslationKey,
    items: [
      { path: '/', icon: LayoutDashboard, labelKey: 'nav.overview' as TranslationKey, roles: ['Admin', 'Staff'], permission: 'VIEW_REPORTS' },
    ]
  },
  {
    labelKey: 'nav.delivery' as TranslationKey,
    items: [
      { path: '/orders', icon: Package, labelKey: 'nav.orders' as TranslationKey, roles: ['Admin', 'Staff'], permission: 'VIEW_ORDERS' },
      { path: '/dispatch', icon: Navigation, labelKey: 'nav.dispatch' as TranslationKey, roles: ['Admin', 'Staff'], permission: 'ASSIGN_SHIPPER' },
      { path: '/tracking', icon: MapPin, labelKey: 'nav.tracking' as TranslationKey, roles: ['Admin', 'Staff'], permission: 'VIEW_ORDERS' },
    ]
  },
  {
    labelKey: 'nav.management' as TranslationKey,
    items: [
      { path: '/shippers', icon: Truck, labelKey: 'nav.shippers' as TranslationKey, roles: ['Admin', 'Staff'], permission: 'VIEW_SHIPPERS' },
      { path: '/users', icon: Users, labelKey: 'nav.users' as TranslationKey, roles: ['Admin', 'Staff'], permission: 'VIEW_USERS' },
      { path: '/permissions', icon: Settings, labelKey: 'nav.permissions' as TranslationKey, roles: ['Admin', 'Staff'], permission: 'MANAGE_ROLES' },
    ]
  },
  {
    labelKey: 'nav.finance' as TranslationKey,
    items: [
      { path: '/payments', icon: CreditCard, labelKey: 'nav.payments' as TranslationKey, roles: ['Admin', 'Staff'], permission: 'VIEW_PAYMENTS' },
      { path: '/vouchers', icon: Tag, labelKey: 'nav.vouchers' as TranslationKey, roles: ['Admin', 'Staff'], permission: 'MANAGE_VOUCHERS' },
    ]
  },
  {
    labelKey: 'nav.reportsSettings' as TranslationKey,
    items: [
      { path: '/notifications', icon: Bell, labelKey: 'common.notifications' as TranslationKey, roles: ['Admin', 'Staff'], permission: 'VIEW_NOTIFICATIONS' },
      { path: '/reports', icon: BarChart2, labelKey: 'nav.reports' as TranslationKey, roles: ['Admin', 'Staff'], permission: 'VIEW_REPORTS' },
      { path: '/settings', icon: Settings, labelKey: 'common.settings' as TranslationKey, roles: ['Admin', 'Staff', 'Shipper', 'Customer'], permission: 'SYSTEM_SETTINGS' },
    ]
  },
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
  const { t } = useTranslation();
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
      title: t('sidebar.logoutConfirmTitle'),
      message: t('sidebar.logoutConfirmMessage'),
      confirmLabel: t('common.logout'),
      danger: true,
      onConfirm: () => {
        logout();
        addToast({ type: 'info', title: t('sidebar.loggedOut'), message: t('sidebar.seeYou') });
      },
    });
  };

  return (
    <aside className={`app-sidebar fixed inset-y-0 left-0 z-40 w-60 min-h-screen border-r
      flex flex-col flex-shrink-0 transition-all duration-200 lg:static lg:z-auto
      ${sidebarOpen ? 'translate-x-0 lg:w-60' : '-translate-x-full lg:translate-x-0 lg:w-16'}`}>
      {/* Logo */}
      <div className={`sidebar-brand h-[4.25rem] flex items-center border-b ${sidebarOpen ? 'gap-3 px-4' : 'justify-center px-2'}`}>
        {sidebarOpen ? (
          <>
            <BrandLogo size={36} className="flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="sidebar-title text-sm font-800 leading-tight truncate tracking-tight">{BRAND_SHORT_NAME}</p>
              <p className="sidebar-caption text-[10px] leading-tight mt-0.5 truncate">{BRAND_TAGLINE}</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label={t('sidebar.collapse')}
              aria-expanded={true}
              aria-controls="main-sidebar-navigation"
              title={t('sidebar.collapse')}
              className="sidebar-toggle w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            >
              <ChevronLeft size={15} />
            </button>
          </>
        ) : (
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label={t('sidebar.expand')}
            aria-expanded={false}
            aria-controls="main-sidebar-navigation"
            title={t('sidebar.expand')}
            className="sidebar-expand relative h-12 w-12 rounded-xl flex items-center justify-center"
          >
            <span className="sidebar-expand-logo" aria-hidden="true">
              <BrandLogo size={36} />
            </span>
            <span className="sidebar-expand-icon" aria-hidden="true">
              <PanelLeftOpen size={23} strokeWidth={1.9} />
            </span>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav id="main-sidebar-navigation" className="sidebar-nav flex-1 overflow-y-auto py-4 px-2" aria-label={t('sidebar.navigation')}>
        {allNavGroups.map((group) => {
          const visibleItems = group.items.filter(item => item.roles.includes(role) && (item.path === '/settings' || hasPermission(item.permission)));
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.labelKey} className="mb-5">
              {sidebarOpen && (
                <p className="sidebar-group text-[11px] font-700 uppercase tracking-[0.13em] px-3 mb-2">
                  {t(group.labelKey)}
                </p>
              )}
              {visibleItems.map(({ path, icon: Icon, labelKey }) => {
                const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
                return (
                  <NavLink
                    key={path}
                    to={path}
                    onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                    title={!sidebarOpen ? t(labelKey) : undefined}
                    className={`sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-600
                      ${isActive ? 'sidebar-link-active' : ''}`}
                  >
                    <Icon size={16} className="flex-shrink-0" />
                    {sidebarOpen && (
                      <span className="flex-1 truncate">{t(labelKey)}</span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          );
        })}

      </nav>

      {/* User section */}
      <div className="sidebar-user border-t p-3">
        {sidebarOpen ? (
          <div>
            <NavLink to="/account" className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 cursor-pointer mb-1">
              <div className={`w-8 h-8 ${info.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                <span className={`text-xs font-700 ${info.color}`}>{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="sidebar-user-name text-xs font-700 truncate">{displayName}</p>
                <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-600 ${info.bg} ${info.color}`}>
                  {getRoleLabel(role)}
                </span>
              </div>
            </NavLink>
            <button onClick={handleLogout}
              className="sidebar-logout w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors">
              <LogOut size={13} />
              <span>{t('common.logout')}</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className={`w-8 h-8 ${info.bg} rounded-full flex items-center justify-center`} title={displayName}>
              <span className={`text-xs font-700 ${info.color}`}>{initials}</span>
            </div>
            <button onClick={handleLogout} title={t('common.logout')}
              aria-label={t('common.logout')}
              className="sidebar-logout w-9 h-9 rounded-lg flex items-center justify-center">
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
