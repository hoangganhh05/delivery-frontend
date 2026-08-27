import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Phone, Mail, Truck, TrendingUp, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { shippers, orders } from '../data/mockData';
import StatusBadge from '../components/StatusBadge';
import type { ShipperStatus, OrderStatus, PaymentStatus } from '../data/mockData';

const perfData = [
  { day: 'T2', delivered: 12, failed: 1 },
  { day: 'T3', delivered: 18, failed: 0 },
  { day: 'T4', delivered: 15, failed: 2 },
  { day: 'T5', delivered: 22, failed: 1 },
  { day: 'T6', delivered: 19, failed: 0 },
  { day: 'T7', delivered: 25, failed: 1 },
  { day: 'CN', delivered: 8, failed: 0 },
];

export default function ShipperDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const shipper = shippers.find(s => s.id === id) ?? shippers[0];
  const shipperOrders = orders.filter(o => o.shipperId === shipper.id);

  const initials = (name: string) => name.split(' ').slice(-2).map(n => n[0]).join('');

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate('/shippers')} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
          <ArrowLeft size={15} />
        </button>
        <h2 className="text-base font-700 text-slate-900">Hồ sơ Shipper</h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="space-y-4">
          {/* Profile card */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl mx-auto flex items-center justify-center mb-3">
              <span className="text-xl font-700 text-white">{initials(shipper.name)}</span>
            </div>
            <h3 className="text-base font-700 text-slate-900">{shipper.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5 mb-3">ID: {shipper.id} · Tham gia {shipper.joinedDate}</p>
            <StatusBadge status={shipper.status as ShipperStatus} type="shipper" />

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5 text-left">
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <Phone size={13} className="text-slate-400" />
                {shipper.phone}
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <Mail size={13} className="text-slate-400" />
                {shipper.email}
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <Truck size={13} className="text-slate-400" />
                {shipper.vehicle}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 space-y-3">
            {[
              { label: 'Tổng đơn đã giao', value: shipper.completedOrders.toLocaleString() },
              { label: 'Tỷ lệ thành công', value: shipper.successRate > 0 ? `${shipper.successRate}%` : '—' },
              { label: 'Tổng doanh thu', value: shipper.revenue > 0 ? `₫${(shipper.revenue / 1000000).toFixed(1)}M` : '—' },
              { label: 'Khu vực hoạt động', value: shipper.zone },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                <span className="text-xs text-slate-500">{label}</span>
                <span className="text-xs font-600 text-slate-900">{value}</span>
              </div>
            ))}
          </div>

          {/* Rating */}
          {shipper.rating > 0 && (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex items-center gap-3">
              <Star size={28} className="text-amber-400 fill-amber-400 flex-shrink-0" />
              <div>
                <p className="text-2xl font-700 text-amber-700">{shipper.rating}</p>
                <p className="text-xs text-amber-600">Đánh giá trung bình</p>
              </div>
            </div>
          )}
        </div>

        <div className="col-span-2 space-y-4">
          {/* Performance chart */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-blue-600" />
              <h3 className="text-sm font-600 text-slate-900">Hiệu suất 7 ngày qua</h3>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={perfData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="delivered" name="Đã giao" fill="#2563EB" radius={[3, 3, 0, 0]} />
                <Bar dataKey="failed" name="Thất bại" fill="#FCA5A5" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent orders */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <Package size={16} className="text-slate-500" />
              <h3 className="text-sm font-600 text-slate-900">Đơn hàng gần đây</h3>
            </div>
            {shipperOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package size={32} className="text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Chưa có đơn hàng nào</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Mã đơn', 'Người nhận', 'Phí', 'Thanh toán', 'Trạng thái', 'Ngày'].map(h => (
                      <th key={h} className="text-left text-xs font-600 text-slate-500 pb-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shipperOrders.map(order => (
                    <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer">
                      <td className="py-2.5 text-xs font-600 text-blue-600">{order.id}</td>
                      <td className="py-2.5 text-xs text-slate-700">{order.receiver.name}</td>
                      <td className="py-2.5 text-xs font-500 text-slate-800">{order.totalFee.toLocaleString()}đ</td>
                      <td className="py-2.5"><StatusBadge status={order.paymentStatus as PaymentStatus} type="payment" /></td>
                      <td className="py-2.5"><StatusBadge status={order.status as OrderStatus} type="order" /></td>
                      <td className="py-2.5 text-xs text-slate-400">{order.createdAt.split(' ')[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
