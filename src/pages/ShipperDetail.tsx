import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mail, Package, Phone, Truck } from "lucide-react";
import { getShipperApi, getShipperOrdersApi } from "../api/deliveryApi";
import StatusBadge from "../components/StatusBadge";
import { mapBackendStatusToUI } from "../utils/status";

export default function ShipperDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shipper, setShipper] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        setLoading(true);
        const [shipperRes, ordersRes] = await Promise.all([
          getShipperApi(id),
          getShipperOrdersApi(id),
        ]);
        setShipper(shipperRes?.data || null);
        setOrders(Array.isArray(ordersRes?.data) ? ordersRes.data : []);
      } catch {
        setShipper(null);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div className="p-12 text-center text-sm text-slate-400">Đang tải hồ sơ shipper...</div>;
  if (!shipper) {
    return <div className="p-12 text-center space-y-4"><p className="text-sm text-slate-600">Không tìm thấy shipper.</p><button onClick={() => navigate("/shippers")} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">Quay lại</button></div>;
  }

  const name = shipper.fullName || shipper.username;
  const initials = name.split(" ").slice(-2).map((part: string) => part[0]).join("");
  const completed = orders.filter(order => ["DELIVERED", "DONE", "COMPLETED"].includes(order.status)).length;

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/shippers")} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500"><ArrowLeft size={15} /></button>
        <h2 className="text-base font-700 text-slate-900">Hồ sơ Shipper</h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="space-y-4 min-w-0">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl mx-auto flex items-center justify-center mb-3 text-xl font-700 text-white">{initials}</div>
            <h3 className="text-base font-700 text-slate-900">{name}</h3>
            <p className="text-xs text-slate-400 mt-1 mb-3">@{shipper.username}</p>
            <StatusBadge status={shipper.status === "ACTIVE" ? "Available" : "Offline"} type="shipper" />
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-left">
              <p className="flex items-center gap-2 text-xs text-slate-700"><Phone size={13} />{shipper.phoneNumber || "Chưa cập nhật"}</p>
              <p className="flex items-center gap-2 text-xs text-slate-700"><Mail size={13} />{shipper.email || "Chưa cập nhật"}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-100 space-y-3">
            <p className="flex justify-between text-xs"><span className="text-slate-500">Đơn đang xử lý</span><strong>{shipper.activeOrderCount || 0}</strong></p>
            <p className="flex justify-between text-xs"><span className="text-slate-500">Đơn đã hoàn thành</span><strong>{completed}</strong></p>
            <p className="flex justify-between text-xs"><span className="text-slate-500">Tổng đơn được giao</span><strong>{orders.length}</strong></p>
          </div>
        </div>

        <div className="xl:col-span-2 min-w-0 bg-white rounded-xl p-4 sm:p-5 border border-slate-100">
          <div className="flex items-center gap-2 mb-4"><Truck size={16} className="text-blue-600" /><h3 className="text-sm font-600 text-slate-900">Đơn hàng được phân công</h3></div>
          {orders.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400"><Package className="mx-auto mb-2" />Chưa có đơn hàng</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px]">
                <thead><tr className="border-b border-slate-100">{["Mã vận đơn", "Người nhận", "Cước phí", "Trạng thái"].map(label => <th key={label} className="text-left text-xs text-slate-500 pb-3">{label}</th>)}</tr></thead>
                <tbody>{orders.map(order => (
                  <tr key={order.id} onClick={() => navigate(`/orders/${order.trackingNumber}`)} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer">
                    <td className="py-3 text-xs font-600 text-blue-600">{order.trackingNumber}</td><td className="py-3 text-xs text-slate-700">{order.receiverName}</td><td className="py-3 text-xs text-slate-700">{Number(order.totalFee || 0).toLocaleString()}đ</td><td className="py-3"><StatusBadge status={mapBackendStatusToUI(order.status)} type="order" /></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
