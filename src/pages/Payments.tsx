import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Clock, DollarSign, ReceiptText, RefreshCw, Search, TrendingUp } from "lucide-react";
import { confirmOrderPaymentApi, getPaymentsApi, type PaymentRecord } from "../api/deliveryApi";
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
  VCB_QR: "Chuyển khoản ngân hàng",
  VNPAY: "VNPay",
})[method];

const formatCurrency = (amount: number) => `${Number(amount || 0).toLocaleString("vi-VN")}đ`;

export default function Payments() {
  const { addToast, hasPermission } = useApp();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [confirming, setConfirming] = useState(false);

  const confirmTransfer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPayment || !paymentReference.trim()) return;
    try {
      setConfirming(true);
      const response = await confirmOrderPaymentApi(selectedPayment.orderId, paymentReference.trim());
      setPayments(current => current.map(payment => payment.orderId === selectedPayment.orderId ? response.data : payment));
      setSelectedPayment(null);
      setPaymentReference("");
      addToast({ type: "success", title: "Đã xác nhận giao dịch", message: "Đơn hàng đã được ghi nhận sau khi đối soát." });
    } catch (error: any) {
      addToast({ type: "error", title: "Không thể xác nhận thanh toán", message: error.message });
    } finally {
      setConfirming(false);
    }
  };

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
    pending: payments.filter(payment => payment.status === "PENDING" && payment.method !== "COD").length,
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

      {selectedPayment && (
        <form onSubmit={confirmTransfer} className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4" aria-label="Xác nhận chuyển khoản đã đối soát">
          <h3 className="text-sm font-700 text-amber-950">Đối soát chuyển khoản {selectedPayment.trackingNumber}</h3>
          <p className="text-xs leading-5 text-amber-900">Chỉ xác nhận sau khi kiểm tra sao kê và thấy đúng số tiền {formatCurrency(selectedPayment.amount)}, đúng nội dung chuyển khoản. Không dùng ảnh chụp hoặc lời báo của khách làm bằng chứng duy nhất.</p>
          <label className="block text-xs font-600 text-slate-700">
            Mã giao dịch từ sao kê
            <input value={paymentReference} onChange={event => setPaymentReference(event.target.value)} required maxLength={100}
              className="mt-1 block h-10 w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500" placeholder="Nhập mã giao dịch thực tế" />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={confirming || !paymentReference.trim()} className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-600 text-white disabled:opacity-50">
              {confirming ? "Đang xác nhận..." : "Đã đối soát, xác nhận thanh toán"}
            </button>
            <button type="button" onClick={() => { setSelectedPayment(null); setPaymentReference(""); }} disabled={confirming}
              className="h-9 rounded-lg border border-slate-300 bg-white px-4 text-xs text-slate-700">Hủy</button>
          </div>
        </form>
      )}

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
                    {["Mã vận đơn", "Khách hàng", "Số tiền", "Phương thức", "Tham chiếu", "Ngày thanh toán", "Trạng thái", ...(hasPermission("MANAGE_PAYMENTS") ? ["Đối soát"] : [])].map(label => (
                      <th key={label} className="px-4 py-3 text-left text-xs font-600 text-slate-500">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody><SkeletonTableRows columns={hasPermission("MANAGE_PAYMENTS") ? 8 : 7} rows={5} /></tbody>
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
                    {["Mã vận đơn", "Khách hàng", "Số tiền", "Phương thức", "Tham chiếu", "Ngày thanh toán", "Trạng thái", ...(hasPermission("MANAGE_PAYMENTS") ? ["Đối soát"] : [])].map(label => (
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
                      {hasPermission("MANAGE_PAYMENTS") && <td className="px-4 py-3">
                        {payment.method === "VCB_QR" && payment.status === "PENDING" && (
                          <button type="button" onClick={() => { setSelectedPayment(payment); setPaymentReference(""); }}
                            className="whitespace-nowrap rounded-lg border border-blue-200 px-2 py-1 text-xs font-600 text-blue-700 hover:bg-blue-50">Xác nhận</button>
                        )}
                      </td>}
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
                  {hasPermission("MANAGE_PAYMENTS") && payment.method === "VCB_QR" && payment.status === "PENDING" && (
                    <button type="button" onClick={() => { setSelectedPayment(payment); setPaymentReference(""); }}
                      className="mt-3 rounded-lg border border-blue-200 px-3 py-2 text-xs font-600 text-blue-700">Đối soát chuyển khoản</button>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
