import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Package, Truck, CheckCircle2, Clock, AlertCircle, UserCheck, Printer } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import type { OrderStatus } from '../types/domain';
import { mapBackendStatusToUI } from '../utils/status';
import { getOrderByTrackingApi, trackOrderApi } from '../api/deliveryApi';

const statusSteps = [
  { key: 'CREATED', label: 'Đã tạo đơn', icon: Clock },
  { key: 'ASSIGNED', label: 'Đã phân công', icon: CheckCircle2 },
  { key: 'PICKED_UP', label: 'Đã lấy hàng', icon: Package },
  { key: 'IN_TRANSIT', label: 'Đang giao hàng', icon: Truck },
  { key: 'DELIVERED', label: 'Đã giao hàng', icon: CheckCircle2 },
];

const statusOrder: Record<string, number> = {
  CREATED: 0, ASSIGNED: 1, PICKED_UP: 2, IN_TRANSIT: 3, DELIVERED: 4, CANCELLED: -1
};

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [trackingInfo, setTrackingInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDetail() {
      if (!id) return;
      try {
        setLoading(true);
        const [orderRes, trackRes] = await Promise.all([
          getOrderByTrackingApi(id).catch(() => null),
          trackOrderApi(id).catch(() => null),
        ]);

        if (orderRes && orderRes.data) {
          setOrder(orderRes.data);
        } else if (trackRes && trackRes.data) {
          setOrder(trackRes.data);
        }
        if (trackRes && trackRes.data) {
          setTrackingInfo(trackRes.data);
        }
      } catch (err) {
        console.error('Error fetching order detail:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-400">
        Đang tải thông tin chi tiết đơn hàng...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-base font-600 text-slate-700">Không tìm thấy đơn hàng với mã: {id}</p>
        <button onClick={() => navigate('/orders')} className="px-4 py-2 bg-blue-600 text-white text-xs font-500 rounded-lg">
          Quay lại danh sách đơn hàng
        </button>
      </div>
    );
  }

  const rawStatus = (order.status || order.currentStatus || 'CREATED').toUpperCase();
  const currentStep = statusOrder[rawStatus] ?? 0;

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Breadcrumb + Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/orders')} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
            <ArrowLeft size={15} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-700 text-slate-900">Mã vận đơn: {order.trackingNumber || id}</h2>
              <StatusBadge status={mapBackendStatusToUI(rawStatus)} type="order" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">ID Đơn: #{order.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="flex items-center gap-2 h-9 px-4 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50">
            <Printer size={14} /> In phiếu giao hàng
          </button>
          {rawStatus === 'CREATED' && (
            <button onClick={() => navigate('/dispatch')} className="flex items-center gap-2 h-9 px-4 rounded-lg bg-blue-600 text-sm text-white font-500 hover:bg-blue-700">
              <UserCheck size={14} /> Phân công shipper
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left column — main info */}
        <div className="xl:col-span-2 space-y-4 min-w-0">
          {/* Status Timeline */}
          {rawStatus !== 'CANCELLED' && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-sm font-600 text-slate-900 mb-5">Tiến trình vận đơn</h3>
              <div className="flex items-start">
                {statusSteps.map((step, idx) => {
                  const done = idx <= currentStep;
                  const active = idx === currentStep;
                  return (
                    <div key={step.key} className="flex-1 flex flex-col items-center relative">
                      {idx < statusSteps.length - 1 && (
                        <div className={`absolute top-5 left-1/2 w-full h-0.5 ${done && idx < currentStep ? 'bg-blue-500' : 'bg-slate-200'}`} />
                      )}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 relative border-2
                        ${active ? 'bg-blue-600 border-blue-600' : done ? 'bg-blue-50 border-blue-300' : 'bg-slate-50 border-slate-200'}`}>
                        <step.icon size={16} className={active ? 'text-white' : done ? 'text-blue-500' : 'text-slate-300'} />
                      </div>
                      <p className={`text-xs font-500 mt-2 text-center ${active ? 'text-blue-700' : done ? 'text-slate-600' : 'text-slate-300'}`}>
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {rawStatus === 'CANCELLED' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-600 text-red-700">Đơn hàng đã bị hủy</p>
                <p className="text-xs text-red-500 mt-0.5">Không thể tiếp tục giao nhận đơn này</p>
              </div>
            </div>
          )}

          {/* Sender & Receiver */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <p className="text-xs font-600 text-slate-500 uppercase tracking-wide mb-3">📦 Người gửi</p>
              <p className="text-sm font-600 text-slate-900">{order.senderName || 'N/A'}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Phone size={12} className="text-slate-400" />
                <p className="text-xs text-slate-600">{order.senderPhone || 'N/A'}</p>
              </div>
              <div className="flex items-start gap-1.5 mt-1">
                <MapPin size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-600 leading-relaxed">{order.senderAddress || 'Chưa cập nhật'}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <p className="text-xs font-600 text-slate-500 uppercase tracking-wide mb-3">📍 Người nhận</p>
              <p className="text-sm font-600 text-slate-900">{order.receiverName || 'N/A'}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Phone size={12} className="text-slate-400" />
                <p className="text-xs text-slate-600">{order.receiverPhone || 'N/A'}</p>
              </div>
              <div className="flex items-start gap-1.5 mt-1">
                <MapPin size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-600 leading-relaxed">{order.receiverAddress || 'Chưa cập nhật'}</p>
              </div>
            </div>
          </div>

          {/* Package & Items info */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs font-600 text-slate-500 uppercase tracking-wide mb-3">📦 Danh sách hàng hóa & Thông số</p>
            {order.items && order.items.length > 0 ? (
              <div className="space-y-2 mb-4">
                {order.items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg text-xs">
                    <span className="font-600 text-slate-800">{item.itemName} x{item.quantity}</span>
                    <span className="text-slate-600">Khai giá: {(item.declaredValue || 0).toLocaleString()}đ</span>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-500 mb-1">Khối lượng (gram)</p>
                <p className="text-sm font-600 text-slate-900">{order.weightGram || 500}g</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Thu hộ (COD)</p>
                <p className="text-sm font-600 text-amber-600">{(order.codAmount || 0).toLocaleString()}đ</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Cước vận chuyển</p>
                <p className="text-sm font-600 text-slate-900">{(order.shippingFee || 0).toLocaleString()}đ</p>
              </div>
            </div>
          </div>

          {/* Tracking History Timeline */}
          {trackingInfo && trackingInfo.history && trackingInfo.history.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <p className="text-xs font-600 text-slate-500 uppercase tracking-wide mb-4">🕐 Nhật ký hành trình vận đơn</p>
              <div className="space-y-4">
                {trackingInfo.history.map((h: any, idx: number) => (
                  <div key={idx} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <Clock size={14} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-600 text-slate-800">{h.status}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{h.note || 'Cập nhật lộ trình giao hàng'}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{h.createdAt || h.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column — payment & shipper */}
        <div className="space-y-4">
          {/* Payment */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-600 text-slate-500 uppercase tracking-wide">💳 Chi phí & Tạm tính</p>
            </div>
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Cước vận chuyển</span>
                <span className="font-500 text-slate-800">{(order.shippingFee || 0).toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Chiết khấu Voucher</span>
                <span className="font-500 text-green-600">-{(order.discountFee || 0).toLocaleString()}đ</span>
              </div>
              {order.codAmount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Tiền thu hộ (COD)</span>
                  <span className="font-500 text-amber-600">{(order.codAmount).toLocaleString()}đ</span>
                </div>
              )}
              <div className="border-t border-slate-100 pt-2 flex justify-between text-sm">
                <span className="font-600 text-slate-900">Tổng thanh toán</span>
                <span className="font-700 text-blue-600">{(order.totalFee || 0).toLocaleString()}đ</span>
              </div>
            </div>
          </div>

          {/* Shipper Info */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs font-600 text-slate-500 uppercase tracking-wide mb-3">🚚 Shipper phụ trách</p>
            {trackingInfo && trackingInfo.shipperName ? (
              <div className="space-y-2">
                <p className="text-sm font-600 text-slate-900">{trackingInfo.shipperName}</p>
                <p className="text-xs text-slate-600">SĐT: {trackingInfo.shipperPhone || 'N/A'}</p>
              </div>
            ) : (
              <div className="text-center py-4">
                <Truck size={28} className="text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Chưa có thông tin shipper phụ trách</p>
                <button onClick={() => navigate('/dispatch')} className="mt-3 h-8 px-4 rounded-lg bg-blue-600 text-white text-xs font-500 hover:bg-blue-700">
                  Điều phối shipper
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
