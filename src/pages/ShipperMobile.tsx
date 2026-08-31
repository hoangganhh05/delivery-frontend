import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Package, Map, User, Phone, MapPin, Navigation, CheckCircle2, Truck, ChevronRight, RefreshCw, LogOut } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { mapBackendStatusToUI } from '../utils/status';
import { searchOrdersApi, updateShipmentStatusApi } from '../api/deliveryApi';
import { useApp } from '../context/AppContext';

export default function ShipperMobile() {
  const navigate = useNavigate();
  const { user, addToast, logout } = useApp();
  const [activeTab, setActiveTab] = useState('home');
  const [shipperOrders, setShipperOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [failureReason, setFailureReason] = useState('');

  const openDirections = (address?: string) => {
    if (!address) {
      addToast({ type: 'warning', title: 'Chưa có địa chỉ giao hàng' });
      return;
    }
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank', 'noopener,noreferrer');
  };

  const fetchShipperOrders = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const res = await searchOrdersApi({ page: 0, size: 20 });
      if (res && res.data && res.data.items) {
        setShipperOrders(res.data.items);
      }
    } catch (err: any) {
      console.error(err);
      setLoadError(err.message || 'Không thể tải danh sách đơn hàng');
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

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const deliveredOrders = shipperOrders.filter(order => (order.status || '').toUpperCase() === 'DELIVERED').length;
  const activeOrders = shipperOrders.length - deliveredOrders;

  if (selectedOrder) {
    const rawStatus = (selectedOrder.status || 'CREATED').toUpperCase();
    return (
      <div className="min-h-dvh bg-slate-50 flex flex-col max-w-5xl mx-auto">
        <div className="sticky top-0 z-20 bg-white border-b border-slate-100 px-4 sm:px-6 py-3 flex items-center gap-3">
          <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center">
            <ArrowLeft size={15} className="text-slate-500" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-700 text-slate-900">{selectedOrder.trackingNumber}</p>
            <p className="text-xs text-slate-400">Mã đơn: #{selectedOrder.id}</p>
          </div>
          <StatusBadge status={mapBackendStatusToUI(rawStatus)} type="order" />
          <button onClick={handleLogout} title="Đăng xuất" className="hidden sm:flex h-9 px-3 rounded-xl border border-red-200 text-red-600 text-xs font-600 items-center gap-1.5 hover:bg-red-50">
            <LogOut size={14} /> Đăng xuất
          </button>
        </div>

        {/* Map Header */}
        <div className="h-44 sm:h-52 bg-blue-600 text-white p-4 sm:p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-blue-200 uppercase font-600">Điểm giao nhận</p>
              <p className="text-base font-700">{selectedOrder.receiverName}</p>
            </div>
            <button onClick={() => openDirections(selectedOrder.receiverAddress)} className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl text-xs font-600 flex items-center gap-1">
              <Navigation size={13} /> Dẫn đường
            </button>
          </div>
          <p className="text-xs text-blue-100 flex items-center gap-1">
            <MapPin size={13} /> {selectedOrder.receiverAddress || 'Chưa cập nhật địa chỉ'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 pb-24 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0 sm:items-start">
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
            ) : rawStatus === 'ASSIGNED' ? (
                <button
                  disabled={updating}
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'PICKED_UP', 'Shipper đã nhận kiện hàng')}
                  className="w-full h-11 rounded-xl bg-blue-600 text-white text-xs font-600 flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
                >
                  <Package size={15} /> Xác nhận đã lấy hàng
                </button>
            ) : rawStatus === 'PICKED_UP' ? (
                <button
                  disabled={updating}
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'IN_TRANSIT', 'Shipper đang trên đường giao hàng')}
                  className="w-full h-11 rounded-xl bg-blue-600 text-white text-xs font-600 flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
                >
                  <Truck size={15} /> Bắt đầu giao hàng
                </button>
            ) : rawStatus === 'IN_TRANSIT' || rawStatus === 'SHIPPING' ? (
                <div className="space-y-2">
                  <button disabled={updating} onClick={() => handleUpdateStatus(selectedOrder.id, 'DELIVERED', 'Shipper đã giao thành công')} className="w-full h-11 rounded-xl bg-green-600 text-white text-xs font-600 flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50"><CheckCircle2 size={15} /> {updating ? 'Đang cập nhật...' : 'Xác nhận giao thành công'}</button>
                  <textarea value={failureReason} onChange={e => setFailureReason(e.target.value)} placeholder="Lý do giao thất bại (bắt buộc)" className="w-full min-h-20 p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs outline-none focus:border-red-300" />
                  <button disabled={updating || !failureReason.trim()} onClick={() => handleUpdateStatus(selectedOrder.id, 'FAILED', failureReason.trim())} className="w-full h-10 rounded-xl border border-red-200 text-red-600 text-xs font-600 hover:bg-red-50 disabled:opacity-40">Báo giao thất bại</button>
                </div>
            ) : (
              <p className="py-3 text-center text-xs text-slate-400">Chưa có thao tác phù hợp với trạng thái hiện tại.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col">
      {/* Responsive header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-100 px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm shadow-blue-200">
              <Truck size={12} className="text-white" />
            </div>
            <div>
              <span className="text-sm font-700 text-slate-900 block leading-tight">DeliveryMS</span>
              <span className="text-[10px] text-slate-400">Cổng Shipper</span>
            </div>
          </div>
          <nav className="hidden lg:flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            {tabs.map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setActiveTab(id)} className={`h-9 px-3 rounded-lg text-xs font-600 flex items-center gap-1.5 transition-colors ${activeTab === id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={fetchShipperOrders} title="Làm mới đơn hàng" className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-200">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={handleLogout} className="h-9 px-3 rounded-xl border border-red-200 text-red-600 text-xs font-600 flex items-center gap-1.5 hover:bg-red-50">
              <LogOut size={14} /> <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full max-w-6xl mx-auto overflow-y-auto pb-20 lg:pb-8">
        {activeTab === 'home' && (
          <div className="p-4 sm:p-6 space-y-4">
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

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { label: 'Được giao', value: shipperOrders.length, tone: 'bg-blue-50 text-blue-700' },
                { label: 'Đang xử lý', value: activeOrders, tone: 'bg-amber-50 text-amber-700' },
                { label: 'Hoàn thành', value: deliveredOrders, tone: 'bg-emerald-50 text-emerald-700' },
              ].map(item => (
                <div key={item.label} className={`${item.tone} rounded-xl p-3 sm:p-4`}>
                  <p className="text-lg sm:text-2xl font-700">{loading ? '–' : item.value}</p>
                  <p className="text-[10px] sm:text-xs opacity-80">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Orders assigned */}
            <div>
              <p className="text-sm font-700 text-slate-900 mb-2">Đơn hàng của bạn</p>
              <div className="grid gap-3 md:grid-cols-2">
                {loading ? (
                  <div className="md:col-span-2 py-10 text-center text-xs text-slate-400">Đang tải danh sách đơn hàng...</div>
                ) : loadError ? (
                  <div className="md:col-span-2 py-10 text-center bg-white rounded-xl border border-red-100">
                    <p className="text-sm text-red-600">{loadError}</p>
                    <button onClick={fetchShipperOrders} className="mt-2 text-xs text-blue-600 font-600">Thử lại</button>
                  </div>
                ) : shipperOrders.length === 0 ? (
                  <div className="md:col-span-2 py-10 text-center text-xs text-slate-400">Không có đơn hàng nào được phân công</div>
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
          <div className="p-4 sm:p-6 space-y-3">
            <p className="text-base font-700 text-slate-900">Danh sách tất cả đơn hàng</p>
            <div className="grid gap-3 md:grid-cols-2">
            {loading ? (
              <div className="md:col-span-2 py-12 text-center text-xs text-slate-400">Đang tải danh sách đơn hàng...</div>
            ) : loadError ? (
              <div className="md:col-span-2 py-12 text-center text-sm text-red-600">{loadError}</div>
            ) : shipperOrders.length === 0 ? (
              <div className="md:col-span-2 py-12 text-center text-xs text-slate-400">Không có đơn hàng nào được phân công</div>
            ) : shipperOrders.map(order => (
              <button key={order.id} onClick={() => setSelectedOrder(order)}
                className="w-full bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-left hover:border-blue-200">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-700 text-blue-600">{order.trackingNumber}</p>
                  <StatusBadge status={mapBackendStatusToUI(order.status)} type="order" />
                </div>
                <p className="text-xs text-slate-600">Nhận: {order.receiverName} ({order.receiverAddress})</p>
              </button>
            ))}
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="p-4 sm:p-6 space-y-3">
            <div>
              <p className="text-base font-700 text-slate-900">Điểm giao hàng</p>
              <p className="text-xs text-slate-400 mt-0.5">Chọn một địa chỉ để mở chỉ đường</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
            {loading ? (
              <div className="md:col-span-2 py-10 text-center text-xs text-slate-400">Đang tải điểm giao hàng...</div>
            ) : loadError ? (
              <div className="md:col-span-2 py-10 text-center text-sm text-red-600">{loadError}</div>
            ) : shipperOrders.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">Chưa có điểm giao hàng được phân công</div>
            ) : shipperOrders.map(order => (
              <button
                key={order.id}
                onClick={() => openDirections(order.receiverAddress)}
                className="w-full bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-left hover:border-blue-200"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <MapPin size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-700 text-blue-600">{order.trackingNumber}</p>
                    <p className="text-sm font-600 text-slate-800 mt-1">{order.receiverName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{order.receiverAddress || 'Chưa cập nhật địa chỉ'}</p>
                  </div>
                  <Navigation size={15} className="text-slate-400 flex-shrink-0" />
                </div>
              </button>
            ))}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="p-4 sm:p-6 space-y-4 max-w-2xl">
            <h2 className="text-base font-700 text-slate-900">Hồ sơ Shipper</h2>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-lg font-700">
                  {(user?.fullName || user?.username || 'S').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-700 text-slate-900">{user?.fullName || user?.username || 'Shipper'}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">@{user?.username || 'shipper'}</p>
                </div>
              </div>
              <div className="py-4 flex items-center justify-between text-sm">
                <span className="text-slate-500">Trạng thái tài khoản</span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-600">Đang hoạt động</span>
              </div>
              <button onClick={handleLogout} className="w-full h-11 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-600 flex items-center justify-center gap-2 hover:bg-red-100">
                <LogOut size={16} /> Đăng xuất khỏi tài khoản
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="fixed lg:hidden bottom-0 left-0 right-0 w-full bg-white border-t border-slate-100 px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] z-20">
        <div className="flex justify-around">
          {tabs.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`min-w-16 min-h-11 flex flex-col items-center justify-center gap-0.5 ${activeTab === id ? 'text-blue-600' : 'text-slate-400'}`}>
              <Icon size={20} />
              <span className="text-[10px] font-500">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
