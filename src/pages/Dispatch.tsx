import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Navigation, Package, MapPin, RefreshCw, Search } from 'lucide-react';
import { searchOrdersApi, getShippersApi, assignShipperApi } from '../api/deliveryApi';
import { useApp } from '../context/AppContext';
import { LoadingState } from '../components/Skeleton';

const DISPATCH_REFRESH_INTERVAL_MS = 60_000;

export default function Dispatch() {
  const { addToast } = useApp();
  const [unassignedOrders, setUnassignedOrders] = useState<any[]>([]);
  const [shippersList, setShippersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedShipper, setSelectedShipper] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [shipperFilter, setShipperFilter] = useState('Tất cả');
  const [orderQuery, setOrderQuery] = useState('');
  const [shipperQuery, setShipperQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const requestIdRef = useRef(0);
  const fetchingRef = useRef(false);

  const fetchData = useCallback(async ({ background = false }: { background?: boolean } = {}) => {
    if (background && fetchingRef.current) return;

    const requestId = ++requestIdRef.current;
    fetchingRef.current = true;
    try {
      if (!background) setLoading(true);
      const [createdOrdersRes, paidOrdersRes, shippersRes] = await Promise.all([
        searchOrdersApi({ status: 'CREATED', page: 0, size: 50 }).catch(() => null),
        searchOrdersApi({ status: 'PAID', page: 0, size: 50 }).catch(() => null),
        getShippersApi().catch(() => null),
      ]);

      if (requestId !== requestIdRef.current) return;

      const createdOrders = createdOrdersRes?.data?.items || [];
      const paidOrders = paidOrdersRes?.data?.items || [];
      setUnassignedOrders([...createdOrders, ...paidOrders].sort((a, b) => Number(b.id) - Number(a.id)));
      if (shippersRes && shippersRes.data) {
        setShippersList(shippersRes.data);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      if (requestId === requestIdRef.current) {
        fetchingRef.current = false;
        if (!background) setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    setSelectedOrder((current: any | null) => current && unassignedOrders.some((order) => order.id === current.id) ? current : null);
  }, [unassignedOrders]);

  useEffect(() => {
    setSelectedShipper((current: any | null) => current && shippersList.some((shipper) => shipper.id === current.id) ? current : null);
  }, [shippersList]);

  useEffect(() => {
    if (selectedOrder || submitting) return;

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        void fetchData({ background: true });
      }
    };

    const intervalId = window.setInterval(refreshWhenVisible, DISPATCH_REFRESH_INTERVAL_MS);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [fetchData, selectedOrder, submitting]);

  const handleAssign = async () => {
    if (!selectedOrder || !selectedShipper) return;
    try {
      setSubmitting(true);
      const res = await assignShipperApi({
        orderId: selectedOrder.id,
        shipperId: selectedShipper.id,
        note: 'Phân công bởi quản trị viên',
      });

      if (res) {
        addToast({
          type: 'success',
          title: 'Phân công thành công!',
          message: `Đã phân công đơn ${selectedOrder.trackingNumber || selectedOrder.id} cho ${selectedShipper.fullName || selectedShipper.username}`
        });
        setSelectedOrder(null);
        setSelectedShipper(null);
        await fetchData();
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Phân công thất bại',
        message: err.message || 'Không thể phân công đơn hàng'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectOrder = (order: any) => {
    if (selectedOrder?.id === order.id) {
      setSelectedOrder(null);
      setSelectedShipper(null);
      return;
    }

    setSelectedOrder(order);
    setSelectedShipper(null);
  };

  const handleSelectShipper = (shipper: any) => {
    if (!selectedOrder) {
      addToast({
        type: 'warning',
        title: 'Chọn đơn hàng trước',
        message: 'Hãy chọn một đơn hàng chờ phân công ở cột bên trái, rồi chọn người giao trong danh sách này.',
      });
      return;
    }

    setSelectedShipper((current: any | null) => current?.id === shipper.id ? null : shipper);
  };

  const filteredUnassignedOrders = useMemo(() => {
    const query = orderQuery.trim().toLowerCase();
    if (!query) return unassignedOrders;

    return unassignedOrders.filter((order) => [
      order.trackingNumber,
      order.id,
      order.senderName,
      order.senderPhone,
      order.receiverName,
      order.receiverPhone,
      order.receiverAddress,
    ].some((value) => String(value || '').toLowerCase().includes(query)));
  }, [orderQuery, unassignedOrders]);

  const filteredShippers = useMemo(() => {
    const query = shipperQuery.trim().toLowerCase();
    return shippersList.filter((shipper) => {
      const matchesStatus = shipperFilter === 'Tất cả'
        || (shipper.status || 'ACTIVE').toUpperCase() === shipperFilter.toUpperCase();
      const matchesQuery = !query || [
        shipper.fullName,
        shipper.username,
        shipper.phoneNumber,
        shipper.email,
      ].some((value) => String(value || '').toLowerCase().includes(query));

      return matchesStatus && matchesQuery;
    });
  }, [shipperFilter, shipperQuery, shippersList]);

  return (
    <div className="p-4 sm:p-6 min-h-full space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-700 text-slate-900">Phân công giao hàng</h2>
          <p className="text-xs text-slate-500 mt-0.5">{unassignedOrders.length} đơn chưa có người giao · {shippersList.length} nhân viên giao hàng</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden lg:inline text-[11px] text-slate-400" title={lastUpdated ? `Cập nhật lúc ${lastUpdated.toLocaleTimeString('vi-VN')}` : undefined}>
            {lastUpdated ? `Cập nhật ${lastUpdated.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : 'Chưa có dữ liệu'}
          </span>
          <button onClick={() => void fetchData()} className="flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Tải lại dữ liệu
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 lg:h-[calc(100vh-200px)]">
        {/* Left Panel — Order list */}
        <div className="w-full lg:w-80 flex flex-col gap-3 flex-shrink-0">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-600 text-slate-900">Đơn hàng chờ phân công</h3>
              <p className="text-xs text-slate-400 mt-0.5">{filteredUnassignedOrders.length}/{unassignedOrders.length} đơn đang chờ phân công</p>
              <div className="relative mt-3">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={orderQuery}
                  onChange={(event) => setOrderQuery(event.target.value)}
                  placeholder="Tìm mã đơn, người gửi/nhận"
                  className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:bg-white"
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-3 space-y-2">
              {loading ? (
                <LoadingState label="Đang tải đơn hàng..." compact />
              ) : filteredUnassignedOrders.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  {unassignedOrders.length === 0 ? 'Không có đơn hàng nào chờ phân công' : 'Không tìm thấy đơn hàng phù hợp'}
                </div>
              ) : filteredUnassignedOrders.map((order) => {
                const isSelected = selectedOrder?.id === order.id;
                return (
                  <div
                    key={order.id}
                    onClick={() => handleSelectOrder(order)}
                    className={`rounded-xl border p-3.5 cursor-pointer transition-all
                      ${isSelected ? 'bg-blue-50 border-blue-400 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-xs font-700 text-blue-600">{order.trackingNumber || `DH${order.id}`}</p>
                        <p className="text-[10px] text-slate-400">Mã đơn: #{order.id}</p>
                      </div>
                      <span className="text-[10px] font-600 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        Cần phân công
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        <Package size={11} className="text-slate-400" />
                        Gửi: {order.senderName || 'Chưa cập nhật'}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <MapPin size={11} className="text-slate-400" />
                        Nhận: {order.receiverName} ({order.receiverAddress?.split(',')[0]})
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected assignment summary — the actual shipper selection happens in the large list. */}
          {selectedOrder && (
            <div className="bg-white rounded-xl border border-blue-300 shadow-md">
              <div className="p-4 border-b border-slate-100 bg-blue-50/50">
                <h3 className="text-sm font-600 text-blue-900">Phân công cho đơn đã chọn</h3>
                <p className="text-xs text-blue-700 font-mono mt-0.5">Vận đơn: {selectedOrder.trackingNumber}</p>
              </div>
              <div className="p-3">
                {selectedShipper ? (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-700 text-white">{(selectedShipper.fullName || selectedShipper.username).charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-700 text-slate-800 truncate">{selectedShipper.fullName || selectedShipper.username}</p>
                        <p className="text-[10px] text-slate-500">Đã chọn từ danh sách bên phải</p>
                      </div>
                      <button type="button" onClick={() => setSelectedShipper(null)} className="text-[11px] font-600 text-blue-700 hover:text-blue-800">Bỏ chọn</button>
                    </div>
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
                    Chọn một nhân viên trong danh sách lớn bên phải.
                  </p>
                )}
              </div>
              <div className="p-3 border-t border-slate-100">
                <button
                  onClick={handleAssign}
                  disabled={!selectedShipper || submitting}
                  className="w-full h-9 rounded-lg bg-blue-600 text-white text-xs font-600 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Navigation size={14} />
                  {submitting ? 'Đang phân công...' : 'Xác nhận phân công đơn hàng'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel — primary shipper selection list */}
        <div className="flex-1 min-h-[420px] bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden relative flex flex-col">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div className="min-w-0">
              <h3 className="text-sm font-700 text-slate-900">Danh sách nhân viên giao hàng</h3>
              <p className="text-xs text-slate-500">
                {selectedOrder
                  ? `Chọn người giao cho ${selectedOrder.trackingNumber || `đơn #${selectedOrder.id}`}`
                  : 'Chọn một đơn hàng ở cột bên trái trước khi chọn người giao'}
              </p>
            </div>
          </div>
          <div className="border-b border-slate-100 bg-white p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={shipperQuery}
                  onChange={(event) => setShipperQuery(event.target.value)}
                  placeholder="Tìm tên, tài khoản hoặc số điện thoại"
                  className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:bg-white"
                />
              </div>
              <div className="flex items-center gap-1 overflow-x-auto">
                {[
                  { label: 'Tất cả', value: 'Tất cả' },
                  { label: 'Đang hoạt động', value: 'ACTIVE' },
                  { label: 'Đang nghỉ', value: 'INACTIVE' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setShipperFilter(option.value)}
                    className={`h-8 shrink-0 rounded-lg px-2.5 text-[11px] font-600 ${shipperFilter === option.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredShippers.map(shipper => {
                const isSelected = selectedShipper?.id === shipper.id;
                return (
                <button
                  key={shipper.id}
                  type="button"
                  aria-pressed={isSelected}
                  aria-disabled={!selectedOrder}
                  onClick={() => handleSelectShipper(shipper)}
                  className={`w-full p-4 border rounded-xl text-left shadow-sm space-y-2 transition-all
                    ${isSelected
                      ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-200 shadow-md'
                      : selectedOrder
                        ? 'bg-white border-slate-100 hover:border-blue-300 hover:-translate-y-0.5'
                        : 'bg-white border-slate-100 opacity-70 cursor-not-allowed'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-700 text-sm">
                      {(shipper.fullName || shipper.username).charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-700 text-slate-900">{shipper.fullName || shipper.username}</p>
                      <p className="text-xs text-slate-500">Mã nhân viên: #{shipper.id} · @{shipper.username}</p>
                    </div>
                    {isSelected && <CheckCircle2 size={20} className="text-blue-600 flex-shrink-0" aria-label="Đã chọn" />}
                  </div>
                  <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-50">
                    <p>• SĐT: <span className="font-600 text-slate-800">{shipper.phoneNumber || 'Chưa cập nhật'}</span></p>
                    <p>• Email: <span className="text-slate-500">{shipper.email || 'Chưa cập nhật'}</span></p>
                    <p>• Trạng thái: <span className="font-600 text-green-600">{(shipper.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'Đang hoạt động' : 'Đang nghỉ'}</span></p>
                  </div>
                </button>
                );
              })}
              {!loading && filteredShippers.length === 0 && (
                <div className="col-span-full py-12 text-center text-sm text-slate-400">Không tìm thấy nhân viên giao hàng phù hợp</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
