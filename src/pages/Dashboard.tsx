import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { ArrowRight } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { mapBackendStatusToUI } from '../utils/status';
import { getDashboardStatsApi, searchOrdersApi } from '../api/deliveryApi';
import { useApp } from '../context/AppContext';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
      <p className="text-xs font-600 text-slate-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-xs text-slate-600">
          <span className="font-500">{p.name === 'orders' ? 'Đơn hàng' : 'Doanh thu'}:</span>{' '}
          {p.name === 'revenue' ? `₫${(p.value / 1000000).toFixed(1)}M` : p.value}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useApp();
  const [stats, setStats] = useState({
    totalOrders: 0,
    successOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [statsRes, ordersRes] = await Promise.all([
          getDashboardStatsApi().catch(() => null),
          searchOrdersApi({ page: 0, size: 5 }).catch(() => null),
        ]);

        if (statsRes && statsRes.data) {
          setStats({
            totalOrders: Number(statsRes.data.totalOrders || 0),
            successOrders: Number(statsRes.data.deliveredOrders ?? statsRes.data.successOrders ?? 0),
            cancelledOrders: Number(statsRes.data.cancelledOrders || 0),
            totalRevenue: Number(statsRes.data.totalRevenue || 0),
          });
        }
        if (ordersRes && ordersRes.data && ordersRes.data.items) {
          setRecentOrders(ordersRes.data.items);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const processingOrders = Math.max(0, stats.totalOrders - stats.successOrders - stats.cancelledOrders);
  const completionRate = stats.totalOrders > 0
    ? Math.min(100, Math.max(0, (stats.successOrders / stats.totalOrders) * 100))
    : 0;

  const kpis = [
    {
      label: 'Tổng đơn hàng',
      value: stats.totalOrders.toLocaleString(),
      change: 'Đã ghi nhận',
      sub: 'Tổng số đơn đã ghi nhận',
    },
    {
      label: 'Đang giao / Chờ giao',
      value: processingOrders.toLocaleString(),
      change: 'Đang xử lý',
      sub: 'Số đơn đang xử lý',
    },
    {
      label: 'Giao thành công',
      value: stats.successOrders.toLocaleString(),
      change: `${completionRate.toFixed(1)}%`,
      sub: 'Tỷ lệ hoàn thành đơn',
    },
    {
      label: 'Tổng doanh thu',
      value: `₫${(stats.totalRevenue || 0).toLocaleString()}`,
      change: 'Đã ghi nhận',
      sub: 'Doanh thu cước vận chuyển',
    },
  ];

  const orderStatusData = [
    { name: 'Delivered', value: Math.max(0, stats.successOrders), color: '#16A34A' },
    { name: 'Shipping', value: processingOrders, color: '#2563EB' },
    { name: 'Cancelled', value: Math.max(0, stats.cancelledOrders), color: '#DC2626' },
  ];
  const hasOrderData = orderStatusData.some(({ value }) => value > 0);
  const chartStatusData = hasOrderData
    ? orderStatusData
    : [{ name: 'Empty', value: 1, color: '#E2E8F0' }];

  const orderAnalyticsData = [
    { date: 'Hoàn thành', orders: stats.successOrders },
    { date: 'Đang xử lý', orders: Math.max(0, stats.totalOrders - stats.successOrders - stats.cancelledOrders) },
    { date: 'Đã hủy', orders: stats.cancelledOrders },
  ];

  const revenueData = [
    { month: 'Hiện tại', revenue: stats.totalRevenue || 0 },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-7 space-y-5 sm:space-y-6 max-w-[1600px] mx-auto">
      {/* Welcome bar */}
      <div className="dashboard-hero rounded-2xl p-5 sm:p-7 text-white">
        <div className="relative z-10">
          <p className="text-xs font-700 uppercase tracking-[0.18em] text-indigo-200 mb-2">Tổng quan quản trị</p>
          <h2 className="text-2xl sm:text-3xl font-800 tracking-tight text-white">
            Xin chào, {user?.fullName || user?.username || 'Quản trị viên'}
          </h2>
          <p className="text-sm text-indigo-100/80 mt-2 max-w-xl">Theo dõi đơn hàng, doanh thu và kết quả giao hàng.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(({ label, value, change, sub }) => (
          <div key={label} className="kpi-card bg-white rounded-2xl p-5 border border-slate-100">
            <div className="flex items-start justify-between gap-3 mb-4">
              <p className="text-sm font-600 text-slate-600">{label}</p>
              <span className="text-xs font-500 text-slate-500 whitespace-nowrap">{change}</span>
            </div>
            <p className="text-2xl font-800 tracking-tight text-slate-900 mb-1">{value}</p>
            <p className="text-xs text-slate-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Order Analytics - 2/3 */}
        <div className="xl:col-span-2 bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
            <div>
              <h3 className="text-sm font-600 text-slate-900">Thống kê đơn hàng</h3>
              <p className="text-xs text-slate-400 mt-0.5">Số lượng đơn theo trạng thái</p>
            </div>
          </div>
          {loading || !hasOrderData ? (
            <div className="h-[200px] rounded-xl border border-dashed border-slate-200 bg-slate-50/60 flex items-center justify-center text-sm text-slate-500">
              {loading ? 'Đang tải dữ liệu...' : 'Chưa có dữ liệu đơn hàng'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={orderAnalyticsData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="orders" name="orders" stroke="#2563EB" strokeWidth={2} fill="url(#ordersGrad)" dot={{ r: 3, fill: '#2563EB', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order Status Donut - 1/3 */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100">
          <h3 className="text-sm font-600 text-slate-900 mb-1">Tỷ lệ trạng thái đơn</h3>
          <p className="text-xs text-slate-400 mb-4">Số đơn theo từng trạng thái</p>
          <div
            className="relative h-[150px]"
            role="img"
            aria-label={`Tỷ lệ giao thành công ${completionRate.toFixed(0)} phần trăm`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={62}
                  dataKey="value"
                  stroke={hasOrderData ? '#FFFFFF' : 'none'}
                  strokeWidth={2}
                >
                  {chartStatusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                {hasOrderData && <Tooltip formatter={(v: any) => [Number(v).toLocaleString(), 'Đơn hàng']} />}
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-800 tracking-tight text-slate-900">{completionRate.toFixed(0)}%</span>
              <span className="text-[10px] text-slate-500">hoàn thành</span>
            </div>
          </div>
          <div className="space-y-1.5 mt-2">
            {orderStatusData.map(({ name, value, color }) => {
              const labels: Record<string, string> = { Delivered: 'Giao thành công', Shipping: 'Đang xử lý / giao', Cancelled: 'Đã hủy' };
              return (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color ?? '#ccc' }} />
                    <span className="text-xs text-slate-600">{labels[name] || name}</span>
                  </div>
                  <span className="text-xs font-600 text-slate-800">{value.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Revenue chart + Recent orders */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Revenue */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100">
          <h3 className="text-sm font-600 text-slate-900 mb-1">Doanh thu giao hàng</h3>
          <p className="text-xs text-slate-400 mb-4">VNĐ</p>
          {loading || stats.totalRevenue <= 0 ? (
            <div className="h-[180px] rounded-xl border border-dashed border-slate-200 bg-slate-50/60 flex items-center justify-center text-sm text-slate-500">
              {loading ? 'Đang tải dữ liệu...' : 'Chưa có dữ liệu doanh thu'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={revenueData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={v => `₫${Number(v).toLocaleString()}`} />
                <Tooltip formatter={(v: any) => [`₫${Number(v).toLocaleString()}`, 'Doanh thu']} />
                <Bar dataKey="revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} maxBarSize={72} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Orders */}
        <div className="xl:col-span-2 bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-600 text-slate-900">Đơn hàng mới nhất</h3>
            <button
              onClick={() => navigate('/orders')}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-500"
            >
              Xem tất cả <ArrowRight size={13} />
            </button>
          </div>
          {recentOrders.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              {loading ? 'Đang tải đơn hàng...' : 'Chưa có đơn hàng nào'}
            </div>
          ) : (
            <div className="overflow-x-auto"><table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Mã vận đơn', 'Người gửi', 'Người nhận', 'Cước phí', 'Trạng thái'].map(h => (
                    <th key={h} className="text-left text-xs font-600 text-slate-500 pb-3 first:pl-0 last:text-right">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id || order.trackingNumber}
                    className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
                    onClick={() => navigate(`/orders/${order.trackingNumber || order.id}`)}
                  >
                    <td className="py-3 text-xs font-600 text-blue-600">{order.trackingNumber || `DH${order.id}`}</td>
                    <td className="py-3 text-xs text-slate-700">{order.senderName || 'Chưa cập nhật'}</td>
                    <td className="py-3 text-xs text-slate-600">{order.receiverName || 'Chưa cập nhật'}</td>
                    <td className="py-3 text-xs font-500 text-slate-800">
                      {(order.totalFee != null ? order.totalFee : order.shippingFee || 0).toLocaleString()}đ
                    </td>
                    <td className="py-3 text-right">
                      <StatusBadge status={mapBackendStatusToUI(order.status)} type="order" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </div>
      </div>
    </div>
  );
}
