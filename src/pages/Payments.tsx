import { useEffect, useMemo, useState } from "react";
import { Clock, DollarSign, ReceiptText, RefreshCw, Search, TrendingUp } from "lucide-react";
import { getPaymentsApi, type PaymentRecord } from "../api/deliveryApi";
import StatusBadge from "../components/StatusBadge";
import { EmptyState, SkeletonList, SkeletonTableRows } from "../components/Skeleton";
import { useApp } from "../context/AppContext";

const paymentStatus = (status: PaymentRecord["status"]): "Paid" | "Pending" | "Failed" | "Refunded" => {
  if (status === "PAID") return "Paid";
  if (status === "FAILED") return "Failed";
  if (status === "REFUNDED") return "Refunded";
  return "Pending";
};

const methodLabel = (method: PaymentRecord["method"]) => ({
  COD: "COD",
  VCB_QR: "QR Vietcombank",
  VNPAY: "VNPay",
})[method];

const formatCurrency = (amount: number) => `${Number(amount || 0).toLocaleString("vi-VN")}đ`;

export default function Payments() {
  const { addToast } = useApp();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setLoadError(false);
      setPayments((await getPaymentsApi()).data || []);
    } catch (error: any) {
      setLoadError(true);
      addToast({ type: "error", title: "Không thể tải thanh toán", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = payments.filter(payment => !search.trim() || `${payment.trackingNumber} ${payment.customerName}`.toLowerCase().includes(search.trim().toLowerCase()));
  const stats = useMemo(() => ({
    revenue: payments.filter(payment => payment.status === "PAID").reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    paid: payments.filter(payment => payment.status === "PAID").length,
    pending: payments.filter(payment => payment.status === "PENDING").length,
  }), [payments]);

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-700 text-slate-900">Thanh toán và doanh thu</h2>
          <p className="mt-0.5 text-xs text-slate-500">Theo dõi các khoản thanh toán của đơn hàng</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="flex h-9 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 hover:bg-slate-50 sm:self-auto"
          aria-label="Tải lại dữ liệu thanh toán"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" /> Tải lại
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Doanh thu đã thu", value: loading ? "—" : formatCurrency(stats.revenue), icon: DollarSign, color: "text-blue-600" },
          { label: "Giao dịch thành công", value: loading ? "—" : stats.paid.toLocaleString("vi-VN"), icon: TrendingUp, color: "text-green-600" },
          { label: "Đang chờ thanh toán", value: loading ? "—" : stats.pending.toLocaleString("vi-VN"), icon: Clock, color: "text-amber-600" },
        ].map(item => (
          <div key={item.label} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <item.icon size={18} className={`${item.color} mb-3`} aria-hidden="true" />
            <p className="text-xl font-700 text-slate-900">{item.value}</p>
            <p className="text-xs text-slate-600">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="relative w-full max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            type="search"
            placeholder="Tìm mã vận đơn, khách hàng..."
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:bg-white"
            aria-label="Tìm thanh toán"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm" aria-busy={loading}>
        {loading ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["Mã vận đơn", "Khách hàng", "Số tiền", "Phương thức", "Tham chiếu", "Ngày thanh toán", "Trạng thái"].map(label => (
                      <th key={label} className="px-4 py-3 text-left text-xs font-600 text-slate-500">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody><SkeletonTableRows columns={7} rows={5} /></tbody>
              </table>
            </div>
            <SkeletonList items={4} className="p-3 md:hidden" />
          </>
        ) : loadError && payments.length === 0 ? (
          <EmptyState
            title="Không thể tải giao dịch thanh toán"
            description="Kiểm tra kết nối mạng rồi thử tải lại dữ liệu."
            action={<button type="button" onClick={() => void load()} className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-600 text-white hover:bg-blue-700">Thử lại</button>}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<ReceiptText size={22} strokeWidth={1.7} aria-hidden="true" />}
            title={search.trim() ? "Không tìm thấy giao dịch phù hợp" : "Chưa có giao dịch thanh toán"}
            description={search.trim() ? "Thử đổi mã vận đơn hoặc tên khách hàng để tìm lại." : "Các giao dịch phát sinh từ đơn hàng sẽ xuất hiện ở đây."}
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["Mã vận đơn", "Khách hàng", "Số tiền", "Phương thức", "Tham chiếu", "Ngày thanh toán", "Trạng thái"].map(label => (
                      <th key={label} className="px-4 py-3 text-left text-xs font-600 text-slate-500">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(payment => (
                    <tr key={`${payment.orderId}-${payment.reference || payment.trackingNumber}`} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs font-700 text-blue-600">{payment.trackingNumber}</td>
                      <td className="px-4 py-3 text-xs text-slate-700">{payment.customerName}</td>
                      <td className="px-4 py-3 text-xs font-700 text-slate-900">{formatCurrency(payment.amount)}</td>
                      <td className="px-4 py-3 text-xs text-slate-700">{methodLabel(payment.method)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{payment.reference || "—"}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{payment.paidAt ? new Date(payment.paidAt).toLocaleString("vi-VN") : "—"}</td>
                      <td className="px-4 py-3"><StatusBadge status={paymentStatus(payment.status)} type="payment" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-3 md:hidden">
              {filtered.map(payment => (
                <article key={`${payment.orderId}-${payment.reference || payment.trackingNumber}`} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-700 text-blue-600">{payment.trackingNumber}</p>
                      <h3 className="mt-1 truncate text-sm font-700 text-slate-900">{payment.customerName}</h3>
                    </div>
                    <StatusBadge status={paymentStatus(payment.status)} type="payment" />
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-3 text-xs">
                    <div><dt className="text-slate-400">Số tiền</dt><dd className="mt-0.5 font-700 text-slate-900">{formatCurrency(payment.amount)}</dd></div>
                    <div><dt className="text-slate-400">Phương thức</dt><dd className="mt-0.5 font-500 text-slate-700">{methodLabel(payment.method)}</dd></div>
                    <div><dt className="text-slate-400">Ngày thanh toán</dt><dd className="mt-0.5 font-500 text-slate-700">{payment.paidAt ? new Date(payment.paidAt).toLocaleString("vi-VN") : "Chưa thanh toán"}</dd></div>
                    <div><dt className="text-slate-400">Tham chiếu</dt><dd className="mt-0.5 break-all font-500 text-slate-700">{payment.reference || "—"}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
