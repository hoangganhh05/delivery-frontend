import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Package, Map, Bell, User, Phone, MapPin, Navigation, Camera, CheckCircle2, Clock, Truck, ChevronRight, RefreshCw } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import type { OrderStatus } from '../data/mockData';
import { searchOrdersApi, updateShipmentStatusApi } from '../api/deliveryApi';
import { useApp } from '../context/AppContext';

function mapBackendStatusToUI(status: string): OrderStatus {
  switch (status?.toUpperCase()) {
    case 'CREATED': return 'Pending';
    case 'ASSIGNED': return 'Confirmed';
    case 'PICKED_UP': return 'Picking';
    case 'IN_TRANSIT': return 'Shipping';
    case 'DELIVERED': return 'Delivered';
    case 'CANCELLED': return 'Cancelled';
    default: return 'Pending';
  }
}

export default function ShipperMobile() {
  const navigate = useNavigate();
  const { user, addToast } = useApp();
  const [activeTab, setActiveTab] = useState('home');
  const [shipperOrders, setShipperOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchShipperOrders = async () => {
    try {
      setLoading(true);
      const res = await searchOrdersApi({ page: 0, size: 20 });
      if (res && res.data && res.data.items) {
        setShipperOrders(res.data.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipperOrders();
  }, []);

  const handleUpdateStatus = async (orderId: number | string, newStatus: string, note: string) => {
    try {
      setUpdating(true);
      const res = await updateShipmentStatusApi(orderId, {
        status: newStatus,
        note: note || `Shipper cập nhật trạng thái sang ${newStatus}`,
      });
      if (res) {
        addToast({
          type: 'success',
          title: 'Cập nhật trạng thái thành công!',
          message: `Đơn #${orderId} đã chuyển sang ${newStatus}`
        });
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
        fetchShipperOrders();
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Cập nhật thất bại',
        message: err.message || 'Không thể cập nhật trạng thái đơn hàng'
      });
    } finally {
      setUpdating(false);
    }
  };

  const tabs = [
    { id: 'home', icon: Home, label: 'Trang chủ' },
    { id: 'orders', icon: Package, label: 'Đơn hàng' },
    { id: 'map', icon: Map, label: 'Bản đồ' },
    { id: 'profile', icon: User, label: 'Hồ sơ' },
  ];

  if (selectedOrder) {
    const rawStatus = (selectedOrder.status || 'CREATED').toUpperCase();
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col max-w-sm mx-auto">
        <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center">
            <ArrowLeft size={15} className="text-slate-500" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-700 text-slate-900">{selectedOrder.trackingNumber}</p>
            <p className="text-xs text-slate-400">Mã đơn: #{selectedOrder.id}</p>
          </div>
          <StatusBadge status={mapBackendStatusToUI(rawStatus)} type="order" />
        </div>

        {/* Map Header */}
        <div className="h-44 bg-blue-600 text-white p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-blue-200 uppercase font-600">Điểm giao nhận</p>
              <p className="text-base font-700">{selectedOrder.receiverName}</p>
            </div>
            <button className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl text-xs font-600 flex items-center gap-1">
              <Navigation size={13} /> Dẫn đường
            </button>
          </div>
          <p className="text-xs text-blue-100 flex items-center gap-1">
            <MapPin size={13} /> {selectedOrder.receiverAddress || 'Chưa cập nhật địa chỉ'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
          {/* Receiver info */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-2">
            <p className="text-xs font-600 text-slate-500 uppercase">Thông tin người nhận</p>
            <p className="text-sm font-700 text-slate-900">{selectedOrder.receiverName}</p>
            <p className="text-xs text-slate-600 flex items-center gap-1.5">
              <Phone size={12} className="text-slate-400" /> SĐT: {selectedOrder.receiverPhone}
            </p>
            <div className="flex gap-2 mt-2">
              <a href={`tel:${selectedOrder.receiverPhone}`} className="flex-1 h-9 rounded-xl bg-green-600 text-white text-xs font-600 flex items-center justify-center gap-1.5">
                <Phone size={13} /> Gọi ngay
              </a>
            </div>
          </div>

          {/* Package & COD */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs font-600 text-slate-500 uppercase mb-2">Chi tiết cước & Thu hộ</p>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between"><span>Cước phí</span><span className="font-600">{(selectedOrder.totalFee || 0).toLocaleString()}đ</span></div>
              <div className="flex justify-between"><span>Thu hộ COD</span><span className="font-700 text-green-600">{(selectedOrder.codAmount || 0).toLocaleString()}đ</span></div>
            </div>
          </div>

          {/* Status update actions */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-2">
            <p className="text-xs font-600 text-slate-500 uppercase mb-2">Cập nhật trạng thái trực tiếp</p>

            {rawStatus === 'DELIVERED' ? (
              <div className="text-center py-4">
                <CheckCircle2 size={36} className="text-green-500 mx-auto mb-1" />
                <p className="text-sm font-700 text-green-700">Đã giao thành công!</p>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  disabled={updating}
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'IN_TRANSIT', 'Shipper đang trên đường giao hàng')}
                  className="w-full h-11 rounded-xl bg-blue-600 text-white text-xs font-600 flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
                >
                  <Truck size={15} /> Đang giao (IN_TRANSIT)
                </button>
                <button
                  disabled={updating}
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'DELIVERED', 'Shipper đã giao thành công')}
                  className="w-full h-11 rounded-xl bg-green-600 text-white text-xs font-600 flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle2 size={15} /> Giao thành công (DELIVERED)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-sm mx-auto">
      {/* Mobile header */}
      <div className="bg-white border-b border-slate-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-xs text-slate-400 flex items-center gap-1 hover:text-slate-600">
            <ArrowLeft size={12} /> Admin
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
              <Truck size={12} className="text-white" />
            </div>
            <span className="text-sm font-700 text-slate-900">Shipper App</span>
          </div>
          <button onClick={fetchShipperOrders} className="p-1 text-slate-500 hover:text-blue-600">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'home' && (
          <div className="p-4 space-y-4">
            {/* Profile banner */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-lg font-700">
                  {(user?.fullName || user?.username || 'SH').charAt(0)}
                </div>
                <div>
                  <p className="text-base font-700">{user?.fullName || user?.username || 'Shipper Nguyễn Văn Giao'}</p>
                  <p className="text-blue-200 text-xs">Tài khoản Shipper Viettel</p>
                </div>
              </div>
            </div>

            {/* Orders assigned */}
            <div>
              <p className="text-sm font-700 text-slate-900 mb-2">Đơn hàng trong hệ thống</p>
              <div className="space-y-2">
                {loading ? (
                  <div className="py-8 text-center text-xs text-slate-400">Đang tải danh sách đơn hàng...</div>
                ) : shipperOrders.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">Không có đơn hàng nào</div>
                ) : (
                  shipperOrders.map(order => (
                    <button key={order.id} onClick={() => setSelectedOrder(order)}
                      className="w-full bg-white rounded-xl border border-slate-100 shadow-sm p-3.5 text-left hover:border-blue-200 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-700 text-blue-600">{order.trackingNumber}</p>
                        <StatusBadge status={mapBackendStatusToUI(order.status)} type="order" />
                      </div>
                      <p className="text-xs font-600 text-slate-800">Người nhận: {order.receiverName}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{order.receiverAddress}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                        <span className="text-xs text-green-600 font-600">COD: {(order.codAmount || 0).toLocaleString()}đ</span>
                        <ChevronRight size={14} className="text-slate-400" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="p-4 space-y-3">
            <p className="text-base font-700 text-slate-900">Danh sách tất cả đơn hàng</p>
            {shipperOrders.map(order => (
              <button key={order.id} onClick={() => setSelectedOrder(order)}
                className="w-full bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-left">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-700 text-blue-600">{order.trackingNumber}</p>
                  <StatusBadge status={mapBackendStatusToUI(order.status)} type="order" />
                </div>
                <p className="text-xs text-slate-600">Nhận: {order.receiverName} ({order.receiverAddress})</p>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="p-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
              <h3 className="text-base font-700 text-slate-900">{user?.fullName || user?.username || 'Shipper'}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Role: SHIPPER</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white border-t border-slate-100 px-4 py-3 z-20">
        <div className="flex justify-around">
          {tabs.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center gap-0.5 ${activeTab === id ? 'text-blue-600' : 'text-slate-400'}`}>
              <Icon size={20} />
              <span className="text-[10px] font-500">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
