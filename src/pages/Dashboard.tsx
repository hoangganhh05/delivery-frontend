import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import {
  Package, Truck, CheckCircle2, DollarSign,
  ArrowRight, Clock
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import type { OrderStatus } from '../types/domain';
import { mapBackendStatusToUI } from '../utils/status';
import { getDashboardStatsApi, searchOrdersApi } from '../api/deliveryApi';
import { useApp } from '../context/AppContext';

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

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

  const kpis = [
    {
      label: 'Tổng đơn hàng',
      value: stats.totalOrders.toLocaleString(),
      icon: Package,
      change: 'Đã ghi nhận',
      trend: 'up',
      sub: 'Tổng số đơn đã ghi nhận',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Đang giao / Chờ giao',
      value: (stats.totalOrders - stats.successOrders - stats.cancelledOrders > 0 ? stats.totalOrders - stats.successOrders - stats.cancelledOrders : 0).toLocaleString(),
      icon: Truck,
      change: 'Đang xử lý',
      trend: 'up',
      sub: 'Số đơn đang xử lý',
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      label: 'Giao thành công',
      value: stats.successOrders.toLocaleString(),
      icon: CheckCircle2,
      change: stats.totalOrders > 0 ? `${((stats.successOrders / stats.totalOrders) * 100).toFixed(1)}%` : '100%',
      trend: 'up',
      sub: 'Tỷ lệ hoàn thành đơn',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Tổng doanh thu',
      value: `₫${(stats.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      change: 'Đã ghi nhận',
      trend: 'up',
      sub: 'Doanh thu cước vận chuyển',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  const orderStatusData = [
    { name: 'Delivered', value: stats.successOrders || 1, color: '#16A34A' },
    { name: 'Shipping', value: Math.max(0, stats.totalOrders - stats.successOrders - stats.cancelledOrders), color: '#2563EB' },
    { name: 'Cancelled', value: stats.cancelledOrders || 0, color: '#DC2626' },
  ];

  const orderAnalyticsData = [
    { date: 'Hoàn thành', orders: stats.successOrders },
    { date: 'Đang xử lý', orders: Math.max(0, stats.totalOrders - stats.successOrders - stats.cancelledOrders) },
    { date: 'Đã hủy', orders: stats.cancelledOrders },
  ];

  const revenueData = [
    { month: 'Hiện tại', revenue: stats.totalRevenue || 0 },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
      {/* Welcome bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">Không gian quản lý giao hàng</p>
          <h2 className="text-xl font-700 text-slate-900">
            Xin chào, {user?.fullName || user?.username || 'Quản trị viên'}! 👋
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Dữ liệu đang cập nhật</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, change, trend, sub, color, bg }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}>
                <Icon size={18} className={color} />
              </div>
              <div className="flex items-center gap-1 text-xs font-500 text-slate-500">
                {change}
              </div>
            </div>
            <p className="text-2xl font-700 text-slate-900 mb-1">{value}</p>
            <p className="text-sm font-500 text-slate-600 mb-0.5">{label}</p>
            <p className="text-xs text-slate-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Order Analytics - 2/3 */}
        <div className="xl:col-span-2 bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-100 min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
            <div>
              <h3 className="text-sm font-600 text-slate-900">Thống kê đơn hàng</h3>
              <p className="text-xs text-slate-400 mt-0.5">Tổng quan hoạt động đơn hàng</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={orderAnalyticsData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="orders" name="orders" stroke="#2563EB" strokeWidth={2} fill="url(#ordersGrad)" dot={{ r: 3, fill: '#2563EB', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Donut - 1/3 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-600 text-slate-900 mb-1">Tỷ lệ trạng thái đơn</h3>
          <p className="text-xs text-slate-400 mb-4">Phân bổ dữ liệu thực tế</p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={38} outerRadius={60}
                dataKey="value" labelLine={false} label={renderCustomizedLabel}>
                {orderStatusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v: any) => [Number(v).toLocaleString(), '']} />
            </PieChart>
          </ResponsiveContainer>
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
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-600 text-slate-900 mb-1">Doanh thu cước vận chuyển</h3>
          <p className="text-xs text-slate-400 mb-4">VNĐ</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={revenueData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `₫${Number(v).toLocaleString()}`} />
              <Tooltip formatter={(v: any) => [`₫${Number(v).toLocaleString()}`, 'Doanh thu']} />
              <Bar dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Orders */}
        <div className="xl:col-span-2 bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-100 min-w-0">
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
                    <td className="py-3 text-xs text-slate-700">{order.senderName || 'N/A'}</td>
                    <td className="py-3 text-xs text-slate-600">{order.receiverName || 'N/A'}</td>
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
