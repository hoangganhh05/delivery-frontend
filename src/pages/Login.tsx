import { useState } from 'react';
import { Truck, Eye, EyeOff, Shield, User, Package, Headphones } from 'lucide-react';
import { useApp, type Role } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { loginApi } from '../api/deliveryApi';

const roleCards = [
  {
    role: 'Admin' as Role,
    icon: Shield,
    label: 'Quản trị viên',
    desc: 'Toàn quyền hệ thống',
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    username: 'admin',
    defaultPassword: 'admin123',
    badge: 'bg-red-100 text-red-700',
  },
  {
    role: 'Shipper' as Role,
    icon: Truck,
    label: 'Shipper',
    desc: 'Giao hàng & cập nhật',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    username: 'shipper1',
    defaultPassword: 'shipper123',
    badge: 'bg-violet-100 text-violet-700',
  },
  {
    role: 'Customer' as Role,
    icon: User,
    label: 'Khách hàng',
    desc: 'Tạo & theo dõi đơn hàng',
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    username: 'customer',
    defaultPassword: 'customer123',
    badge: 'bg-green-100 text-green-700',
  },
];

const roleRoutes: Record<Role, string> = {
  Admin: '/',
  Staff: '/',
  Shipper: '/shipper-mobile',
  Customer: '/customer',
};

export default function Login() {
  const { loginWithAuthData, addToast } = useApp();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<Role>('Admin');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  const handleRoleSelect = (r: Role) => {
    setSelectedRole(r);
    const card = roleCards.find(c => c.role === r);
    if (card) {
      setUsername(card.username);
      setPassword(card.defaultPassword);
    }
    setErrors({});
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!username.trim()) e.username = 'Vui lòng nhập tên đăng nhập';
    if (!password) e.password = 'Vui lòng nhập mật khẩu';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await loginApi({ username: username.trim(), password });
      if (res && res.data && res.data.token) {
        const { token, role: rawRole, username: resUser, fullName } = res.data;
        loginWithAuthData(token, resUser || username, rawRole || selectedRole, fullName);
        addToast({
          type: 'success',
          title: 'Đăng nhập thành công!',
          message: `Chào mừng ${fullName || resUser || username} (${rawRole || selectedRole})`
        });
        const targetRoute = (rawRole && rawRole.toUpperCase() === 'SHIPPER') ? '/shipper-mobile'
          : (rawRole && rawRole.toUpperCase() === 'CUSTOMER') ? '/customer'
          : '/';
        navigate(targetRoute);
      } else {
        throw new Error('Phản hồi đăng nhập từ backend không hợp lệ');
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Đăng nhập thất bại',
        message: err.message || 'Không thể kết nối máy chủ backend. Đang sử dụng chế độ dự phòng.'
      });
    } finally {
      setLoading(false);
    }
  };

  const selected = roleCards.find(c => c.role === selectedRole) || roleCards[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex w-[480px] bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex-col justify-between p-12 flex-shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
            <circle cx="350" cy="50" r="200" fill="white" />
            <circle cx="50" cy="550" r="150" fill="white" />
          </svg>
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Truck size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white font-700 text-lg leading-tight">DeliveryMS</p>
              <p className="text-blue-300 text-xs">Viettel Logistics System</p>
            </div>
          </div>

          <h1 className="text-4xl font-800 text-white leading-tight mb-5">
            Quản lý giao<br />hàng thông minh
          </h1>
          <p className="text-blue-200 text-base leading-relaxed">
            Kết nối trực tiếp hệ thống Spring Boot Backend — từ tạo đơn, phân công shipper đến thanh toán VNPay và theo dõi thời gian thực.
          </p>
        </div>

        <div className="relative space-y-4">
          {[
            { label: 'Real-time API', desc: 'Đã kết nối Spring Boot Backend' },
            { label: 'JWT Security', desc: 'Xác thực bảo mật tài khoản' },
            { label: 'VNPay Gateway', desc: 'Thanh toán trực tuyến Sandbox' },
          ].map(({ label, desc }) => (
            <div key={label} className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Package size={18} className="text-white/80" />
              </div>
              <div>
                <p className="text-white font-700 text-lg leading-tight">{label}</p>
                <p className="text-blue-300 text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Truck size={15} className="text-white" />
            </div>
            <span className="font-700 text-slate-900">DeliveryMS</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-800 text-slate-900">Đăng nhập hệ thống</h2>
            <p className="text-slate-500 text-sm mt-1">Chọn vai trò hoặc nhập thông tin tài khoản Backend</p>
          </div>

          {/* Role selector */}
          <div className="mb-6">
            <p className="text-xs font-600 text-slate-600 uppercase tracking-wide mb-3">Tài khoản mẫu từ Backend</p>
            <div className="grid grid-cols-3 gap-2">
              {roleCards.map(({ role, icon: Icon, label, desc, color, bg, border, badge }) => {
                const isSelected = selectedRole === role;
                return (
                  <button
                    key={role}
                    onClick={() => handleRoleSelect(role)}
                    className={`p-3 rounded-xl border-2 text-left transition-all
                      ${isSelected ? `${border} ${bg}` : 'border-slate-100 bg-white hover:border-slate-200'}`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1.5 ${isSelected ? bg : 'bg-slate-100'}`}>
                      <Icon size={14} className={isSelected ? color : 'text-slate-400'} />
                    </div>
                    <p className={`text-xs font-700 ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>{label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-600 text-slate-700 mb-1.5">Tên đăng nhập (Username)</label>
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setErrors(p => ({ ...p, username: undefined })); }}
                className={`w-full h-11 px-4 text-sm border rounded-xl outline-none transition-colors
                  ${errors.username ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-slate-200 bg-slate-50 focus:border-blue-400 focus:bg-white'}
                  placeholder-slate-400 text-slate-800`}
                placeholder="VD: admin, shipper1, customer..."
              />
              {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-xs font-600 text-slate-700 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })); }}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="Nhập mật khẩu..."
                  className={`w-full h-11 pl-4 pr-11 text-sm border rounded-xl outline-none transition-colors
                    ${errors.password ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-slate-200 bg-slate-50 focus:border-blue-400 focus:bg-white'}
                    placeholder-slate-400 text-slate-800`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full h-11 rounded-xl bg-blue-600 text-white text-sm font-600 hover:bg-blue-700 disabled:opacity-70
                flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang xác thực Backend...
                </>
              ) : (
                `Đăng nhập API (${username})`
              )}
            </button>
          </div>

          <div className="mt-6 p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-800">
            <p className="font-700 mb-1">🔑 Tài khoản hệ thống mẫu (Spring Boot):</p>
            <ul className="space-y-0.5 text-[11px] text-blue-700">
              <li>• Admin: <code className="bg-blue-100 px-1 rounded">admin</code> / <code className="bg-blue-100 px-1 rounded">admin123</code></li>
              <li>• Shipper: <code className="bg-blue-100 px-1 rounded">shipper1</code> / <code className="bg-blue-100 px-1 rounded">shipper123</code></li>
              <li>• Customer: <code className="bg-blue-100 px-1 rounded">customer</code> / <code className="bg-blue-100 px-1 rounded">customer123</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
