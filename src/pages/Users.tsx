import { useState, useEffect } from 'react';
import { Search, Shield, RefreshCw } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { getShippersApi } from '../api/deliveryApi';

const seededUsers = [
  { id: '1', username: 'admin', fullName: 'Quản Trị Viên Hệ Thống', phone: '0988888888', email: 'admin@viettel.vn', role: 'Admin', status: 'Active' },
  { id: '2', username: 'shipper1', fullName: 'Shipper Nguyễn Văn Giao', phone: '0977777771', email: 'shipper1@viettel.vn', role: 'Shipper', status: 'Active' },
  { id: '3', username: 'shipper2', fullName: 'Shipper Trần Văn Nhanh', phone: '0977777772', email: 'shipper2@viettel.vn', role: 'Shipper', status: 'Active' },
  { id: '4', username: 'customer', fullName: 'Khách Hàng Hoàng Anh', phone: '0966666666', email: 'customer@gmail.com', role: 'Customer', status: 'Active' },
];

export default function Users() {
  const [usersList, setUsersList] = useState<any[]>(seededUsers);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getShippersApi();
      if (res && res.data && Array.isArray(res.data)) {
        const fetchedShippers = res.data.map((s: any) => ({
          id: String(s.id),
          username: s.username,
          fullName: s.fullName || s.username,
          phone: s.phoneNumber || 'N/A',
          email: s.email || 'N/A',
          role: 'Shipper',
          status: 'Active',
        }));
        setUsersList([
          seededUsers[0], // Admin
          ...fetchedShippers,
          seededUsers[3], // Customer
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = usersList.filter(u => {
    const name = u.fullName || u.username;
    return search === '' || name.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-700 text-slate-900">Quản lý Tài Khoản & Người Dùng (Spring Boot)</h2>
          <p className="text-xs text-slate-500 mt-0.5">Danh sách tài khoản xác thực JWT trong CSDL</p>
        </div>
        <button onClick={fetchUsers} className="flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Tải lại
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Tìm tên, username..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:bg-white placeholder-slate-400" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['ID / Username', 'Họ và tên', 'Số điện thoại', 'Email', 'Vai trò', 'Trạng thái'].map(h => (
                <th key={h} className="text-left text-xs font-600 text-slate-500 py-3 px-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="py-3 px-4 text-xs font-700 text-blue-600">
                  #{user.id} · @{user.username}
                </td>
                <td className="py-3 px-4 text-xs font-600 text-slate-900">{user.fullName}</td>
                <td className="py-3 px-4 text-xs text-slate-600">{user.phone}</td>
                <td className="py-3 px-4 text-xs text-slate-500">{user.email}</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-600 bg-blue-50 text-blue-700">
                    <Shield size={10} />
                    {user.role}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <StatusBadge status="Active" type="user" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
