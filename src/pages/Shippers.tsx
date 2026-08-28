import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Phone, Eye, RefreshCw } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { getShippersApi } from '../api/deliveryApi';
import { useApp } from '../context/AppContext';

export default function Shippers() {
  const navigate = useNavigate();
  const { addToast } = useApp();
  const [shippersList, setShippersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchShippers = async () => {
    try {
      setLoading(true);
      const res = await getShippersApi();
      if (res && res.data) {
        setShippersList(res.data);
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi tải danh sách Shipper', message: err.message || 'Không thể lấy dữ liệu' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShippers();
  }, []);

  const filtered = shippersList.filter(s => {
    const name = s.fullName || s.username || '';
    const phone = s.phoneNumber || '';
    return search === '' || name.toLowerCase().includes(search.toLowerCase()) || phone.includes(search);
  });

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-700 text-slate-900">Quản lý Đội ngũ Shipper</h2>
          <p className="text-xs text-slate-500 mt-0.5">{shippersList.length} nhân viên giao hàng</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchShippers} className="flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Tải lại
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Tìm tên shipper, số điện thoại..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:bg-white placeholder-slate-400" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['Mã / Username', 'Họ và tên', 'Số điện thoại', 'Email', 'Trạng thái', 'Thao tác'].map(h => (
                <th key={h} className="text-left text-xs font-600 text-slate-500 py-3 px-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs text-slate-400">Đang tải dữ liệu Shipper...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs text-slate-400">Không tìm thấy shipper nào</td>
              </tr>
            ) : filtered.map((shipper) => (
              <tr key={shipper.id} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer">
                <td className="py-3 px-4 text-xs font-700 text-blue-600">
                  #{shipper.id} · @{shipper.username}
                </td>
                <td className="py-3 px-4 text-xs font-600 text-slate-900">
                  {shipper.fullName || shipper.username}
                </td>
                <td className="py-3 px-4 text-xs text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Phone size={12} className="text-slate-400" />
                    {shipper.phoneNumber || 'N/A'}
                  </div>
                </td>
                <td className="py-3 px-4 text-xs text-slate-500">
                  {shipper.email || 'N/A'}
                </td>
                <td className="py-3 px-4">
                  <StatusBadge status={(shipper.status || 'ACTIVE') === 'ACTIVE' ? 'Available' : 'Offline'} type="shipper" />
                </td>
                <td className="py-3 px-4">
                  <button onClick={() => navigate('/dispatch')} className="h-7 px-3 rounded-lg bg-blue-50 text-blue-600 text-xs font-500 hover:bg-blue-100 flex items-center gap-1">
                    <Eye size={13} /> Điều phối đơn
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
