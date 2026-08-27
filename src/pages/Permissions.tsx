import { useState } from 'react';
import { Shield, Check, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

type Role = 'Admin' | 'Staff' | 'Shipper' | 'Customer';

const permissionGroups = [
  {
    group: 'Đơn hàng',
    permissions: [
      { id: 'view_orders', label: 'Xem đơn hàng', Admin: true, Staff: true, Shipper: true, Customer: true },
      { id: 'create_order', label: 'Tạo đơn hàng', Admin: true, Staff: true, Shipper: false, Customer: true },
      { id: 'edit_order', label: 'Chỉnh sửa đơn hàng', Admin: true, Staff: true, Shipper: false, Customer: false },
      { id: 'cancel_order', label: 'Hủy đơn hàng', Admin: true, Staff: true, Shipper: false, Customer: true },
      { id: 'assign_shipper', label: 'Phân công shipper', Admin: true, Staff: true, Shipper: false, Customer: false },
    ]
  },
  {
    group: 'Shipper',
    permissions: [
      { id: 'view_shippers', label: 'Xem danh sách shipper', Admin: true, Staff: true, Shipper: false, Customer: false },
      { id: 'manage_shippers', label: 'Quản lý shipper', Admin: true, Staff: true, Shipper: false, Customer: false },
      { id: 'update_delivery', label: 'Cập nhật trạng thái giao hàng', Admin: true, Staff: true, Shipper: true, Customer: false },
    ]
  },
  {
    group: 'Người dùng',
    permissions: [
      { id: 'view_users', label: 'Xem người dùng', Admin: true, Staff: false, Shipper: false, Customer: false },
      { id: 'manage_users', label: 'Quản lý người dùng', Admin: true, Staff: false, Shipper: false, Customer: false },
      { id: 'manage_roles', label: 'Quản lý vai trò', Admin: true, Staff: false, Shipper: false, Customer: false },
    ]
  },
  {
    group: 'Tài chính',
    permissions: [
      { id: 'view_payments', label: 'Xem thanh toán', Admin: true, Staff: true, Shipper: false, Customer: true },
      { id: 'manage_payments', label: 'Quản lý thanh toán', Admin: true, Staff: false, Shipper: false, Customer: false },
      { id: 'manage_vouchers', label: 'Quản lý voucher', Admin: true, Staff: true, Shipper: false, Customer: false },
      { id: 'apply_voucher', label: 'Sử dụng voucher', Admin: true, Staff: true, Shipper: false, Customer: true },
    ]
  },
  {
    group: 'Báo cáo & Hệ thống',
    permissions: [
      { id: 'view_reports', label: 'Xem báo cáo', Admin: true, Staff: true, Shipper: false, Customer: false },
      { id: 'export_data', label: 'Xuất dữ liệu', Admin: true, Staff: true, Shipper: false, Customer: false },
      { id: 'system_settings', label: 'Cài đặt hệ thống', Admin: true, Staff: false, Shipper: false, Customer: false },
      { id: 'view_notifications', label: 'Thông báo', Admin: true, Staff: true, Shipper: true, Customer: true },
    ]
  }
];

const roleColors: Record<Role, string> = {
  Admin: 'text-red-600 bg-red-50',
  Staff: 'text-blue-600 bg-blue-50',
  Shipper: 'text-violet-600 bg-violet-50',
  Customer: 'text-green-600 bg-green-50',
};

export default function Permissions() {
  const { addToast } = useApp();
  const [matrix, setMatrix] = useState(() => {
    const saved = localStorage.getItem('permissionMatrix');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* use defaults */ }
    }
    const m: Record<string, Record<Role, boolean>> = {};
    permissionGroups.forEach(g => g.permissions.forEach(p => {
      m[p.id] = { Admin: p.Admin, Staff: p.Staff, Shipper: p.Shipper, Customer: p.Customer };
    }));
    return m;
  });

  const toggle = (permId: string, role: Role) => {
    if (role === 'Admin') return; // Admin always has all
    setMatrix(prev => ({ ...prev, [permId]: { ...prev[permId], [role]: !prev[permId][role] } }));
  };

  const roles: Role[] = ['Admin', 'Staff', 'Shipper', 'Customer'];

  const savePermissions = () => {
    localStorage.setItem('permissionMatrix', JSON.stringify(matrix));
    addToast({ type: 'success', title: 'Đã lưu phân quyền', message: 'Ma trận quyền đã được lưu trên trình duyệt này.' });
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-700 text-slate-900">Phân quyền & Vai trò</h2>
          <p className="text-xs text-slate-500 mt-0.5">Quản lý quyền truy cập theo từng vai trò</p>
        </div>
        <button onClick={savePermissions} className="flex items-center gap-2 h-9 px-4 rounded-lg bg-blue-600 text-sm text-white font-500 hover:bg-blue-700">
          Lưu thay đổi
        </button>
      </div>

      {/* Role description cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {roles.map(role => (
          <div key={role} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${roleColors[role]}`}>
              <Shield size={18} />
            </div>
            <p className="text-sm font-700 text-slate-900">{role}</p>
            <p className="text-xs text-slate-500 mt-1">
              {role === 'Admin' && 'Toàn quyền hệ thống'}
              {role === 'Staff' && 'Quản lý vận hành'}
              {role === 'Shipper' && 'Giao hàng & cập nhật'}
              {role === 'Customer' && 'Tạo và theo dõi đơn'}
            </p>
          </div>
        ))}
      </div>

      {/* Permission Matrix */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
        <div className="grid grid-cols-[1fr_repeat(4,_120px)] border-b border-slate-100 bg-slate-50">
          <div className="py-3 px-4 text-xs font-600 text-slate-500">Quyền</div>
          {roles.map(role => (
            <div key={role} className="py-3 px-4 text-center">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-600 ${roleColors[role]}`}>
                <Shield size={10} />
                {role}
              </span>
            </div>
          ))}
        </div>

        {permissionGroups.map(({ group, permissions }) => (
          <div key={group}>
            <div className="px-4 py-2.5 bg-slate-50 border-y border-slate-100">
              <p className="text-xs font-700 text-slate-600 uppercase tracking-wide">{group}</p>
            </div>
            {permissions.map((perm) => (
              <div key={perm.id}
                className="grid grid-cols-[1fr_repeat(4,_120px)] border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <div className="py-3 px-4">
                  <p className="text-sm text-slate-700">{perm.label}</p>
                </div>
                {roles.map(role => {
                  const allowed = matrix[perm.id]?.[role] ?? false;
                  const isAdmin = role === 'Admin';
                  return (
                    <div key={role} className="py-3 px-4 flex justify-center items-center">
                      <button
                        onClick={() => toggle(perm.id, role)}
                        disabled={isAdmin}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all
                          ${allowed
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-slate-100 text-slate-300 hover:bg-slate-200'}
                          ${isAdmin ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        title={isAdmin ? 'Admin luôn có toàn quyền' : allowed ? 'Bấm để thu hồi' : 'Bấm để cấp quyền'}
                      >
                        {allowed ? <Check size={13} strokeWidth={2.5} /> : <X size={13} strokeWidth={2.5} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-400 text-center">
        * Admin luôn có toàn quyền và không thể thay đổi. Nhấn "Lưu thay đổi" để áp dụng.
      </p>
    </div>
  );
}
