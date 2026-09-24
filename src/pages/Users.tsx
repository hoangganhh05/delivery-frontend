import { useEffect, useRef, useState } from "react";
import { RefreshCw, Search, Shield, UsersRound } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import { EmptyState, SkeletonList, SkeletonTableRows } from "../components/Skeleton";
import { getUsersApi, updateUserRoleApi, type ApiRole } from "../api/deliveryApi";
import { useApp } from "../context/AppContext";

const roleOptions = [
  { value: "Admin", label: "Quản trị viên" },
  { value: "Staff", label: "Nhân viên quản lý" },
  { value: "Shipper", label: "Nhân viên giao hàng" },
  { value: "Customer", label: "Khách hàng" },
];

export default function Users() {
  const { addToast, openConfirm } = useApp();
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");
  const [roleChangeId, setRoleChangeId] = useState<number | null>(null);
  const [lastRoleChange, setLastRoleChange] = useState<{ id: number; name: string; previousRole: string; nextRole: string } | null>(null);
  const undoTimeoutRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (undoTimeoutRef.current !== null) window.clearTimeout(undoTimeoutRef.current);
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const res = await getUsersApi();
      if (res && Array.isArray(res.data)) {
        setUsersList(res.data.map((user: any) => ({
          ...user,
          phone: user.phoneNumber || "Chưa cập nhật",
          role: user.role ? user.role.charAt(0) + user.role.slice(1).toLowerCase() : "Customer",
          status: user.status === "ACTIVE" ? "Active" : user.status === "BLOCKED" ? "Suspended" : "Inactive",
        })));
      } else {
        setUsersList([]);
      }
    } catch (err: any) {
      setLoadError(true);
      addToast({ type: "error", title: "Không thể tải người dùng", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  const offerRoleUndo = (change: { id: number; name: string; previousRole: string; nextRole: string }) => {
    if (undoTimeoutRef.current !== null) window.clearTimeout(undoTimeoutRef.current);
    setLastRoleChange(change);
    undoTimeoutRef.current = window.setTimeout(() => setLastRoleChange(null), 10000);
  };

  const changeRole = async (id: number, role: string, previousRole: string, name: string, offerUndo = true) => {
    try {
      setRoleChangeId(id);
      const response = await updateUserRoleApi(id, role.toUpperCase() as ApiRole);
      const updated = response.data;
      setUsersList(current => current.map(user => user.id === id ? {
        ...user,
        role: updated?.role ? updated.role.charAt(0) + updated.role.slice(1).toLowerCase() : role,
      } : user));
      if (offerUndo) {
        offerRoleUndo({ id, name, previousRole, nextRole: role });
        addToast({ type: "success", title: "Đã cập nhật vai trò", message: "Bạn có thể hoàn tác trong 10 giây." });
      } else {
        addToast({ type: "success", title: "Đã hoàn tác thay đổi vai trò" });
      }
    } catch (error: any) {
      addToast({ type: "error", title: "Không thể đổi vai trò", message: error.message });
    } finally {
      setRoleChangeId(null);
    }
  };

  const requestRoleChange = (user: any, nextRole: string) => {
    if (nextRole === user.role) return;
    const nextRoleLabel = roleOptions.find(option => option.value === nextRole)?.label || nextRole;
    const currentRoleLabel = roleOptions.find(option => option.value === user.role)?.label || user.role;
    const name = user.fullName || user.username;
    openConfirm({
      title: "Thay đổi vai trò người dùng",
      message: `Đổi ${name} từ ${currentRoleLabel} sang ${nextRoleLabel}? Quyền truy cập mới sẽ có hiệu lực ngay sau khi xác nhận.`,
      confirmLabel: "Xác nhận thay đổi",
      danger: nextRole === "Admin" || user.role === "Admin",
      onConfirm: () => { void changeRole(user.id, nextRole, user.role, name); },
    });
  };

  const undoRoleChange = () => {
    if (!lastRoleChange) return;
    const change = lastRoleChange;
    if (undoTimeoutRef.current !== null) window.clearTimeout(undoTimeoutRef.current);
    setLastRoleChange(null);
    void changeRole(change.id, change.previousRole, change.nextRole, change.name, false);
  };

  const filtered = usersList.filter(user => {
    const fullName = user.fullName || user.username || "";
    const keyword = search.trim().toLowerCase();
    return !keyword || fullName.toLowerCase().includes(keyword) || (user.username || "").toLowerCase().includes(keyword);
  });

  const emptyDescription = search.trim()
    ? "Thử đổi từ khóa tìm kiếm hoặc xóa bộ lọc để xem tất cả tài khoản."
    : "Tài khoản mới sẽ xuất hiện ở đây sau khi được tạo.";

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-700 text-slate-900">Quản lý tài khoản &amp; người dùng</h2>
          <p className="mt-0.5 text-xs text-slate-500">Danh sách thành viên và quyền truy cập</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchUsers()}
          className="flex h-9 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 hover:bg-slate-50 sm:self-auto"
          aria-label="Tải lại danh sách người dùng"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" /> Tải lại
        </button>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="relative w-full max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            placeholder="Tìm tên hoặc tên đăng nhập..."
            value={search}
            onChange={event => setSearch(event.target.value)}
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:bg-white"
            aria-label="Tìm người dùng"
          />
        </div>
      </div>

      {lastRoleChange && (
        <div role="status" className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <span>Đã đổi vai trò của <strong>{lastRoleChange.name}</strong>. Bạn có thể hoàn tác trong 10 giây.</span>
          <button type="button" onClick={undoRoleChange} disabled={roleChangeId !== null} className="h-8 rounded-lg border border-amber-300 bg-white px-3 text-xs font-700 text-amber-800 hover:bg-amber-100 disabled:opacity-60">
            Hoàn tác
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm" aria-busy={loading}>
        {loading ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[780px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["Mã / Tên đăng nhập", "Họ và tên", "Số điện thoại", "Email", "Vai trò", "Trạng thái"].map(label => (
                      <th key={label} className="px-4 py-3 text-left text-xs font-600 text-slate-500">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody><SkeletonTableRows columns={6} rows={6} /></tbody>
              </table>
            </div>
            <SkeletonList items={4} className="p-3 md:hidden" />
          </>
        ) : loadError && usersList.length === 0 ? (
          <EmptyState
            title="Không thể tải danh sách tài khoản"
            description="Kiểm tra kết nối mạng rồi thử tải lại danh sách."
            action={<button type="button" onClick={() => void fetchUsers()} className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-600 text-white hover:bg-blue-700">Thử lại</button>}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<UsersRound size={22} strokeWidth={1.7} aria-hidden="true" />}
            title={search.trim() ? "Không tìm thấy tài khoản phù hợp" : "Chưa có tài khoản nào"}
            description={emptyDescription}
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[780px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["Mã / Tên đăng nhập", "Họ và tên", "Số điện thoại", "Email", "Vai trò", "Trạng thái"].map(label => (
                      <th key={label} className="px-4 py-3 text-left text-xs font-600 text-slate-500">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(user => (
                    <tr key={user.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs font-700 text-blue-600">#{user.id} · @{user.username}</td>
                      <td className="px-4 py-3 text-xs font-600 text-slate-900">{user.fullName || user.username}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{user.phone}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{user.email || "Chưa cập nhật"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-blue-700">
                          <Shield size={11} aria-hidden="true" />
                          <select
                            value={user.role}
                            disabled={roleChangeId === user.id}
                            onChange={event => {
                              const nextRole = event.target.value;
                              event.currentTarget.value = user.role;
                              requestRoleChange(user, nextRole);
                            }}
                            className="h-8 rounded-lg border-0 bg-blue-50 px-2 text-xs font-600 disabled:opacity-60"
                            aria-label={`Vai trò của ${user.fullName || user.username}`}
                          >
                            {roleOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={user.status} type="user" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-3 md:hidden">
              {filtered.map(user => (
                <article key={user.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-700 text-blue-600">#{user.id} · @{user.username}</p>
                      <h3 className="mt-1 truncate text-sm font-700 text-slate-900">{user.fullName || user.username}</h3>
                    </div>
                    <StatusBadge status={user.status} type="user" />
                  </div>
                  <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 text-xs">
                    <div><dt className="text-slate-400">Số điện thoại</dt><dd className="mt-0.5 font-500 text-slate-700">{user.phone}</dd></div>
                    <div><dt className="text-slate-400">Email</dt><dd className="mt-0.5 break-all font-500 text-slate-700">{user.email || "Chưa cập nhật"}</dd></div>
                  </dl>
                  <label className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs font-600 text-slate-600">
                    <Shield size={13} className="text-blue-600" aria-hidden="true" />
                    Vai trò
                    <select
                      value={user.role}
                      disabled={roleChangeId === user.id}
                      onChange={event => {
                        const nextRole = event.target.value;
                        event.currentTarget.value = user.role;
                        requestRoleChange(user, nextRole);
                      }}
                      className="ml-auto h-8 max-w-[160px] rounded-lg border border-blue-100 bg-blue-50 px-2 text-xs font-600 text-blue-700 disabled:opacity-60"
                      aria-label={`Vai trò của ${user.fullName || user.username}`}
                    >
                      {roleOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
