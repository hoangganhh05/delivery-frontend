import { useState, useEffect } from 'react';
import { Search, TrendingUp, DollarSign, Clock, RefreshCw } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { getDashboardStatsApi, searchOrdersApi } from '../api/deliveryApi';
import { paymentStatusFromOrder } from '../utils/status';

export default function Payments() {
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, successOrders: 0 });
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, ordersRes] = await Promise.all([
        getDashboardStatsApi().catch(() => null),
        searchOrdersApi({ page: 0, size: 50 }).catch(() => null),
      ]);

      if (statsRes && statsRes.data) {
        setStats({
          totalRevenue: Number(statsRes.data.totalRevenue || 0),
          totalOrders: Number(statsRes.data.totalOrders || 0),
          successOrders: Number(statsRes.data.deliveredOrders ?? statsRes.data.successOrders ?? 0),
        });
      }
      if (ordersRes && ordersRes.data && ordersRes.data.items) {
        setOrdersList(ordersRes.data.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = ordersList.filter(o => {
    const tracking = o.trackingNumber || '';
    const receiver = o.receiverName || '';
    return search === '' || tracking.toLowerCase().includes(search.toLowerCase()) || receiver.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-700 text-slate-900">Quản lý Thanh toán & Doanh thu</h2>
          <p className="text-xs text-slate-500 mt-0.5">Theo dõi thanh toán VNPay và COD</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Tải lại
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3 text-blue-600">
            <DollarSign size={18} />
          </div>
          <p className="text-xl font-700 text-slate-900">₫{(stats.totalRevenue || 0).toLocaleString()}</p>
          <p className="text-xs font-500 text-slate-600 mt-0.5">Tổng doanh thu cước giao hàng</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3 text-green-600">
            <TrendingUp size={18} />
          </div>
          <p className="text-xl font-700 text-slate-900">{stats.successOrders}</p>
          <p className="text-xs font-500 text-slate-600 mt-0.5">Số đơn giao & thanh toán thành công</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-3 text-amber-600">
            <Clock size={18} />
          </div>
          <p className="text-xl font-700 text-slate-900">{stats.totalOrders - stats.successOrders}</p>
          <p className="text-xs font-500 text-slate-600 mt-0.5">Số đơn đang xử lý thanh toán / COD</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Tìm mã vận đơn, người nhận..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:bg-white placeholder-slate-400" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['Mã vận đơn', 'Khách nhận', 'Cước phí', 'Thu hộ COD', 'Chiết khấu', 'Tổng thu', 'Trạng thái'].map(h => (
                <th key={h} className="text-left text-xs font-600 text-slate-500 py-3 px-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-xs text-slate-400">Đang tải dữ liệu thanh toán...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-xs text-slate-400">Chưa có giao dịch thanh toán nào</td>
              </tr>
            ) : filtered.map((o) => (
              <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="py-3 px-4 text-xs font-700 text-blue-600">{o.trackingNumber}</td>
                <td className="py-3 px-4 text-xs text-slate-700">{o.receiverName} ({o.receiverPhone})</td>
                <td className="py-3 px-4 text-xs font-500 text-slate-800">{(o.shippingFee || 0).toLocaleString()}đ</td>
                <td className="py-3 px-4 text-xs font-600 text-amber-600">{(o.codAmount || 0).toLocaleString()}đ</td>
                <td className="py-3 px-4 text-xs text-green-600">-{(o.discountFee || 0).toLocaleString()}đ</td>
                <td className="py-3 px-4 text-xs font-700 text-blue-700">{(o.totalFee || 0).toLocaleString()}đ</td>
                <td className="py-3 px-4">
                  <StatusBadge status={paymentStatusFromOrder(o.status)} type="payment" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
