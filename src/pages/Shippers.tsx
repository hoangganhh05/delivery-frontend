import { useEffect, useState } from "react";
import { Eye, Phone, RefreshCw, Search, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import { EmptyState, SkeletonList, SkeletonTableRows } from "../components/Skeleton";
import { getShippersApi } from "../api/deliveryApi";
import { useApp } from "../context/AppContext";

export default function Shippers() {
  const navigate = useNavigate();
  const { addToast } = useApp();
  const [shippersList, setShippersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");

  const fetchShippers = async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const res = await getShippersApi();
      setShippersList(Array.isArray(res?.data) ? res.data : []);
    } catch (err: any) {
      setLoadError(true);
      addToast({ type: "error", title: "Không thể tải nhân viên giao hàng", message: err.message || "Vui lòng thử lại." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchShippers();
  }, []);

  const filtered = shippersList.filter(shipper => {
    const name = shipper.fullName || shipper.username || "";
    const phone = shipper.phoneNumber || "";
    const keyword = search.trim().toLowerCase();
    return !keyword || name.toLowerCase().includes(keyword) || phone.includes(keyword) || (shipper.username || "").toLowerCase().includes(keyword);
  });

  const statusFor = (shipper: any) => (shipper.status || "ACTIVE") === "ACTIVE" ? "Available" : "Offline";

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-700 text-slate-900">Nhân viên giao hàng</h2>
          <p className="mt-0.5 text-xs text-slate-500">{shippersList.length} nhân viên giao hàng</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchShippers()}
          className="flex h-9 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 hover:bg-slate-50 sm:self-auto"
          aria-label="Tải lại danh sách nhân viên giao hàng"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" /> Tải lại
        </button>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="relative w-full max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            placeholder="Tìm tên hoặc số điện thoại..."
            value={search}
            onChange={event => setSearch(event.target.value)}
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:bg-white"
            aria-label="Tìm nhân viên giao hàng"
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
                    {["Mã / Tên đăng nhập", "Họ và tên", "Số điện thoại", "Email", "Trạng thái", "Thao tác"].map(label => (
                      <th key={label} className="px-4 py-3 text-left text-xs font-600 text-slate-500">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody><SkeletonTableRows columns={6} rows={5} /></tbody>
              </table>
            </div>
            <SkeletonList items={4} className="p-3 md:hidden" />
          </>
        ) : loadError && shippersList.length === 0 ? (
          <EmptyState
            title="Không thể tải danh sách nhân viên"
            description="Kiểm tra kết nối mạng rồi thử tải lại danh sách."
            action={<button type="button" onClick={() => void fetchShippers()} className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-600 text-white hover:bg-blue-700">Thử lại</button>}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Truck size={22} strokeWidth={1.7} aria-hidden="true" />}
            title={search.trim() ? "Không tìm thấy nhân viên phù hợp" : "Chưa có nhân viên giao hàng"}
            description={search.trim() ? "Thử dùng tên, tên đăng nhập hoặc số điện thoại khác." : "Nhân viên giao hàng sẽ xuất hiện ở đây khi được thêm vào hệ thống."}
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["Mã / Tên đăng nhập", "Họ và tên", "Số điện thoại", "Email", "Trạng thái", "Thao tác"].map(label => (
                      <th key={label} className="px-4 py-3 text-left text-xs font-600 text-slate-500">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(shipper => (
                    <tr
                      key={shipper.id}
                      onClick={() => navigate(`/shippers/${shipper.id}`)}
                      className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 text-xs font-700 text-blue-600">#{shipper.id} · @{shipper.username}</td>
                      <td className="px-4 py-3 text-xs font-600 text-slate-900">{shipper.fullName || shipper.username}</td>
                      <td className="px-4 py-3 text-xs text-slate-700">
                        <div className="flex items-center gap-1.5"><Phone size={12} className="text-slate-400" aria-hidden="true" />{shipper.phoneNumber || "Chưa cập nhật"}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{shipper.email || "Chưa cập nhật"}</td>
                      <td className="px-4 py-3"><StatusBadge status={statusFor(shipper)} type="shipper" /></td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={event => { event.stopPropagation(); navigate(`/shippers/${shipper.id}`); }}
                          className="flex h-7 items-center gap-1 rounded-lg bg-blue-50 px-3 text-xs font-500 text-blue-600 hover:bg-blue-100"
                        >
                          <Eye size={13} aria-hidden="true" /> Xem đơn hàng
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-3 md:hidden">
              {filtered.map(shipper => (
                <article key={shipper.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-700 text-blue-600">#{shipper.id} · @{shipper.username}</p>
                      <h3 className="mt-1 truncate text-sm font-700 text-slate-900">{shipper.fullName || shipper.username}</h3>
                    </div>
                    <StatusBadge status={statusFor(shipper)} type="shipper" />
                  </div>
                  <dl className="mt-4 space-y-3 border-t border-slate-100 pt-3 text-xs">
                    <div><dt className="text-slate-400">Số điện thoại</dt><dd className="mt-0.5 flex items-center gap-1.5 font-500 text-slate-700"><Phone size={12} className="text-slate-400" aria-hidden="true" />{shipper.phoneNumber || "Chưa cập nhật"}</dd></div>
                    <div><dt className="text-slate-400">Email</dt><dd className="mt-0.5 break-all font-500 text-slate-700">{shipper.email || "Chưa cập nhật"}</dd></div>
                  </dl>
                  <button
                    type="button"
                    onClick={() => navigate(`/shippers/${shipper.id}`)}
                    className="mt-4 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-600 text-blue-700 hover:bg-blue-100"
                  >
                    <Eye size={14} aria-hidden="true" /> Xem đơn hàng được giao
                  </button>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
