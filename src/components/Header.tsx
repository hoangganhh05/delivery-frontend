import { useState, useRef, useEffect } from 'react';
import { Search, Bell, HelpCircle, ChevronDown, LogOut, User, Settings, Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp, type Role } from '../context/AppContext';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/orders': 'Quản lý đơn hàng',
  '/dispatch': 'Trung tâm điều phối',
  '/tracking': 'Tracking đơn hàng',
  '/shippers': 'Quản lý Shipper',
  '/users': 'Quản lý người dùng',
  '/permissions': 'Phân quyền',
  '/payments': 'Quản lý thanh toán',
  '/vouchers': 'Quản lý Voucher',
  '/notifications': 'Thông báo',
  '/reports': 'Báo cáo & Thống kê',
  '/settings': 'Cài đặt hệ thống',
};

const roleColors: Record<Role, string> = {
  Admin: 'bg-red-100 text-red-700',
  Staff: 'bg-blue-100 text-blue-700',
  Shipper: 'bg-violet-100 text-violet-700',
  Customer: 'bg-green-100 text-green-700',
};

export default function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { role, user, logout, openConfirm, addToast, sidebarOpen, setSidebarOpen } = useApp();

  const [search, setSearch] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const title = Object.entries(pageTitles).find(([p]) =>
    p === '/' ? pathname === '/' : pathname.startsWith(p)
  )?.[1] ?? 'Dashboard';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    setShowUserMenu(false);
    openConfirm({
      title: 'Đăng xuất',
      message: 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?',
      confirmLabel: 'Đăng xuất',
      danger: true,
      onConfirm: () => {
        logout();
        addToast({ type: 'info', title: 'Đã đăng xuất thành công' });
        navigate('/login');
      },
    });
  };

  const displayName = user?.fullName || user?.username || role;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center px-4 gap-3 flex-shrink-0">
      {/* Mobile hamburger */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)}
        className="w-8 h-8 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-400 lg:hidden">
        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Page title */}
      <div className="flex-1">
        <h1 className="text-sm font-600 text-slate-900">{title}</h1>
      </div>

      {/* Search */}
      <div className="relative hidden md:block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm mã vận đơn, khách hàng..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-9 w-64 pl-9 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none
            focus:border-blue-400 focus:bg-white placeholder-slate-400 text-slate-700 transition-all
            focus:w-80"
        />
      </div>

      {/* Notifications */}
      <button
        onClick={() => navigate('/notifications')}
        className="w-8 h-8 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 relative"
      >
        <Bell size={17} />
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
      </button>

      {/* User menu */}
      <div className="relative" ref={userMenuRef}>
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-2.5 pl-3 border-l border-slate-100 hover:opacity-80"
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-700 ${roleColors[role]}`}>
            {initial}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-600 text-slate-900 leading-tight">{displayName}</p>
            <span className={`text-[10px] font-600 px-1.5 py-0.5 rounded ${roleColors[role]}`}>{role}</span>
          </div>
          <ChevronDown size={13} className={`text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
        </button>

        {showUserMenu && (
          <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50
            animate-in slide-in-from-top-2 fade-in duration-150">
            <div className="px-3 py-2 border-b border-slate-50 mb-1">
              <p className="text-xs font-600 text-slate-900">{displayName}</p>
              <p className="text-[10px] text-slate-400">{role} · Spring Boot API Session</p>
            </div>
            <button onClick={() => { setShowUserMenu(false); navigate('/settings'); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
              <Settings size={14} className="text-slate-400" /> Cài đặt tài khoản
            </button>
            <div className="border-t border-slate-50 mt-1 pt-1">
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                <LogOut size={14} /> Đăng xuất
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
