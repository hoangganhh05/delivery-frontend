import { useState, useEffect } from 'react';
import { Navigation, Package, Clock, CheckCircle2, Truck, MapPin, RefreshCw } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import type { ShipperStatus } from '../data/mockData';
import { searchOrdersApi, getShippersApi, assignShipperApi } from '../api/deliveryApi';
import { useApp } from '../context/AppContext';

export default function Dispatch() {
  const { addToast } = useApp();
  const [unassignedOrders, setUnassignedOrders] = useState<any[]>([]);
  const [shippersList, setShippersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedShipper, setSelectedShipper] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [shipperFilter, setShipperFilter] = useState('Tất cả');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, shippersRes] = await Promise.all([
        searchOrdersApi({ status: 'CREATED', page: 0, size: 50 }).catch(() => null),
        getShippersApi().catch(() => null),
      ]);

      if (ordersRes && ordersRes.data && ordersRes.data.items) {
        setUnassignedOrders(ordersRes.data.items);
      }
      if (shippersRes && shippersRes.data) {
        setShippersList(shippersRes.data);
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

  const handleAssign = async () => {
    if (!selectedOrder || !selectedShipper) return;
    try {
      setSubmitting(true);
      const res = await assignShipperApi({
        orderId: selectedOrder.id,
        shipperId: selectedShipper.id,
        note: 'Điều phối từ trung tâm điều phối admin UI',
      });

      if (res) {
        addToast({
          type: 'success',
          title: 'Phân công thành công!',
          message: `Đã gán đơn ${selectedOrder.trackingNumber || selectedOrder.id} cho shipper ${selectedShipper.fullName || selectedShipper.username}`
        });
        setSelectedOrder(null);
        setSelectedShipper(null);
        fetchData();
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

  const filteredShippers = shippersList.filter(s =>
    shipperFilter === 'Tất cả' || (s.status || 'ACTIVE').toUpperCase() === shipperFilter.toUpperCase()
  );

  return (
    <div className="p-6 h-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-700 text-slate-900">Trung tâm điều phối giao hàng (Backend Real-time)</h2>
          <p className="text-xs text-slate-500 mt-0.5">{unassignedOrders.length} đơn hàng chưa phân công · {shippersList.length} nhân viên shipper</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Tải lại dữ liệu
          </button>
        </div>
      </div>

      <div className="flex gap-5 h-[calc(100vh-200px)]">
        {/* Left Panel — Order list */}
        <div className="w-80 flex flex-col gap-3 flex-shrink-0">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-600 text-slate-900">Đơn hàng chờ phân công (CREATED)</h3>
              <p className="text-xs text-slate-400 mt-0.5">{unassignedOrders.length} đơn đang chờ gán shipper</p>
            </div>
            <div className="overflow-y-auto flex-1 p-3 space-y-2">
              {loading ? (
                <div className="p-8 text-center text-xs text-slate-400">Đang tải đơn hàng...</div>
              ) : unassignedOrders.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">Không có đơn hàng nào chờ phân công trong CSDL</div>
              ) : unassignedOrders.map((order) => {
                const isSelected = selectedOrder?.id === order.id;
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(isSelected ? null : order)}
                    className={`rounded-xl border p-3.5 cursor-pointer transition-all
                      ${isSelected ? 'bg-blue-50 border-blue-400 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-xs font-700 text-blue-600">{order.trackingNumber || `DH${order.id}`}</p>
                        <p className="text-[10px] text-slate-400">ID: #{order.id}</p>
                      </div>
                      <span className="text-[10px] font-600 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        Cần phân công
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        <Package size={11} className="text-slate-400" />
                        Gửi: {order.senderName || 'N/A'}
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

          {/* Shipper selection */}
          {selectedOrder && (
            <div className="bg-white rounded-xl border border-blue-300 shadow-md">
              <div className="p-4 border-b border-slate-100 bg-blue-50/50">
                <h3 className="text-sm font-600 text-blue-900">Chọn Shipper nhận đơn</h3>
                <p className="text-xs text-blue-700 font-mono mt-0.5">Vận đơn: {selectedOrder.trackingNumber}</p>
              </div>
              <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
                {filteredShippers.map((shipper) => {
                  const isSelected = selectedShipper?.id === shipper.id;
                  return (
                    <div
                      key={shipper.id}
                      onClick={() => setSelectedShipper(isSelected ? null : shipper)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all
                        ${isSelected ? 'bg-blue-100 border-blue-500' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-700 text-white">{(shipper.fullName || shipper.username).charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-600 text-slate-800 truncate">{shipper.fullName || shipper.username}</p>
                          <p className="text-[10px] text-slate-400">SĐT: {shipper.phoneNumber || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
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

        {/* Right Panel — Interactive Shipper & Route Map */}
        <div className="flex-1 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden relative flex flex-col">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div>
              <h3 className="text-sm font-700 text-slate-900">Danh sách nhân viên giao hàng (Backend Shippers)</h3>
              <p className="text-xs text-slate-500">Thông tin nhân sự đội vận tải từ CSDL</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-4">
              {shippersList.map(shipper => (
                <div key={shipper.id} className="p-4 border border-slate-100 rounded-xl bg-white shadow-sm hover:border-blue-200 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-700 text-sm">
                      {(shipper.fullName || shipper.username).charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-700 text-slate-900">{shipper.fullName || shipper.username}</p>
                      <p className="text-xs text-slate-500">ID Shipper: #{shipper.id} · @{shipper.username}</p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-50">
                    <p>• SĐT: <span className="font-600 text-slate-800">{shipper.phoneNumber || 'N/A'}</span></p>
                    <p>• Email: <span className="text-slate-500">{shipper.email || 'N/A'}</span></p>
                    <p>• Trạng thái: <span className="font-600 text-green-600">{shipper.status || 'ACTIVE'}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
