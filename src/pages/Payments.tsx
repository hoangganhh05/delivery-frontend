import { useEffect, useMemo, useState } from "react";
import { Clock, DollarSign, RefreshCw, Search, TrendingUp } from "lucide-react";
import { getPaymentsApi, type PaymentRecord } from "../api/deliveryApi";
import StatusBadge from "../components/StatusBadge";
import { useApp } from "../context/AppContext";

export default function Payments() {
  const { addToast } = useApp();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const load = async () => {
    try { setLoading(true); setPayments((await getPaymentsApi()).data || []); }
    catch (error: any) { addToast({ type: "error", title: "Không thể tải thanh toán", message: error.message }); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const filtered = payments.filter(payment => !search || `${payment.trackingNumber} ${payment.customerName}`.toLowerCase().includes(search.toLowerCase()));
  const stats = useMemo(() => ({
    revenue: payments.filter(p => p.status === "PAID").reduce((sum, p) => sum + Number(p.amount || 0), 0),
    paid: payments.filter(p => p.status === "PAID").length,
    pending: payments.filter(p => p.status === "PENDING").length,
  }), [payments]);
  const methodLabel = (method: PaymentRecord["method"]) => ({ COD: "COD", VCB_QR: "QR Vietcombank", VNPAY: "VNPay" })[method];

  return <div className="p-4 sm:p-6 space-y-5">
    <div className="flex justify-between gap-3"><div><h2 className="text-lg font-700 text-slate-900">Thanh toán và doanh thu</h2>
      <p className="text-xs text-slate-500 mt-0.5">Theo dõi các khoản thanh toán của đơn hàng</p></div>
      <button onClick={load} className="flex items-center gap-2 h-9 px-3 rounded-lg border bg-white text-xs"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Tải lại</button>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[{ label: "Doanh thu đã thu", value: `${stats.revenue.toLocaleString("vi-VN")}đ`, icon: DollarSign, color: "text-blue-600" },
        { label: "Giao dịch thành công", value: stats.paid, icon: TrendingUp, color: "text-green-600" },
        { label: "Đang chờ thanh toán", value: stats.pending, icon: Clock, color: "text-amber-600" }].map(item => <div key={item.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <item.icon size={18} className={`${item.color} mb-3`} /><p className="text-xl font-700">{item.value}</p><p className="text-xs text-slate-600">{item.label}</p>
        </div>)}
    </div>
    <div className="bg-white rounded-xl border p-4"><div className="relative max-w-xs"><Search size={14} className="absolute left-3 top-3 text-slate-400" />
      <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm mã vận đơn, khách hàng..." className="w-full h-9 pl-9 pr-3 text-sm bg-slate-50 border rounded-lg" /></div></div>
    <div className="bg-white rounded-xl border overflow-x-auto"><table className="w-full min-w-[760px]"><thead><tr className="bg-slate-50 border-b">
      {["Mã vận đơn", "Khách hàng", "Số tiền", "Phương thức", "Tham chiếu", "Ngày thanh toán", "Trạng thái"].map(label => <th key={label} className="text-left text-xs text-slate-500 py-3 px-4">{label}</th>)}
    </tr></thead><tbody>{loading ? <tr><td colSpan={7} className="text-center py-12 text-sm text-slate-400">Đang tải...</td></tr> : filtered.map(payment => <tr key={payment.orderId} className="border-b border-slate-50">
      <td className="py-3 px-4 text-xs font-700 text-blue-600">{payment.trackingNumber}</td><td className="py-3 px-4 text-xs">{payment.customerName}</td>
      <td className="py-3 px-4 text-xs font-700">{Number(payment.amount).toLocaleString("vi-VN")}đ</td><td className="py-3 px-4 text-xs">{methodLabel(payment.method)}</td>
      <td className="py-3 px-4 text-xs text-slate-500">{payment.reference || "—"}</td><td className="py-3 px-4 text-xs">{payment.paidAt ? new Date(payment.paidAt).toLocaleString("vi-VN") : "—"}</td>
      <td className="py-3 px-4"><StatusBadge status={payment.status === "PAID" ? "Paid" : payment.status === "FAILED" ? "Failed" : "Pending"} type="payment" /></td>
    </tr>)}</tbody></table></div>
  </div>;
}
