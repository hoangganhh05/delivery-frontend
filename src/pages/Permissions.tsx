import { useEffect, useState } from "react";
import { Check, Loader2, Shield, X } from "lucide-react";
import { getPermissionMatrixApi, updatePermissionMatrixApi, type ApiRole, type PermissionMatrix } from "../api/deliveryApi";
import { useApp } from "../context/AppContext";

const labels: Record<ApiRole, string> = { ADMIN: "Quản trị viên", STAFF: "Nhân viên quản lý", SHIPPER: "Nhân viên giao hàng", CUSTOMER: "Khách hàng" };
const colors: Record<ApiRole, string> = {
  ADMIN: "text-red-600 bg-red-50", STAFF: "text-blue-600 bg-blue-50",
  SHIPPER: "text-violet-600 bg-violet-50", CUSTOMER: "text-green-600 bg-green-50",
};

export default function Permissions() {
  const { addToast } = useApp();
  const [matrix, setMatrix] = useState<PermissionMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPermissionMatrixApi().then(res => setMatrix(res.data))
      .catch((error: Error) => addToast({ type: "error", title: "Không thể tải phân quyền", message: error.message }))
      .finally(() => setLoading(false));
  }, [addToast]);

  const toggle = (code: string, role: ApiRole) => {
    if (role === "ADMIN") return;
    setMatrix(current => current ? ({ ...current, permissions: current.permissions.map(permission =>
      permission.code === code ? { ...permission, roles: { ...permission.roles, [role]: !permission.roles[role] } } : permission) }) : current);
  };

  const save = async () => {
    if (!matrix) return;
    try {
      setSaving(true);
      const values = matrix.permissions.flatMap(permission => matrix.roles.map(role => ({
        code: permission.code, role, allowed: permission.roles[role],
      })));
      const response = await updatePermissionMatrixApi(values);
      setMatrix(response.data);
      addToast({ type: "success", title: "Đã lưu phân quyền", message: "Quyền truy cập đã được cập nhật." });
    } catch (error: any) {
      addToast({ type: "error", title: "Lưu phân quyền thất bại", message: error.message });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="p-10 flex justify-center text-slate-400"><Loader2 className="animate-spin" /></div>;
  if (!matrix) return <div className="p-6 text-sm text-red-600">Không tải được danh sách quyền.</div>;
  const groups = Array.from(new Set(matrix.permissions.map(permission => permission.group)));

  return <div className="p-4 sm:p-6 space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="text-lg font-700 text-slate-900">Quyền truy cập</h2>
        <p className="text-xs text-slate-500 mt-0.5">Chọn chức năng từng loại tài khoản được phép sử dụng</p></div>
      <button onClick={save} disabled={saving} className="flex items-center gap-2 h-9 px-4 rounded-lg bg-blue-600 text-sm text-white font-500 disabled:opacity-60">
        {saving && <Loader2 size={14} className="animate-spin" />} Lưu thay đổi
      </button>
    </div>
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {matrix.roles.map(role => <div key={role} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[role]}`}><Shield size={18} /></div>
        <p className="text-sm font-700 text-slate-900">{labels[role]}</p>
      </div>)}
    </div>
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
      <div className="grid grid-cols-[1fr_repeat(4,_120px)] border-b border-slate-100 bg-slate-50">
        <div className="py-3 px-4 text-xs font-600 text-slate-500">Quyền</div>
        {matrix.roles.map(role => <div key={role} className="py-3 text-center text-xs font-600">{labels[role]}</div>)}
      </div>
      {groups.map(group => <div key={group}>
        <div className="px-4 py-2.5 bg-slate-50 border-y border-slate-100 text-xs font-700 text-slate-600 uppercase">{group}</div>
        {matrix.permissions.filter(permission => permission.group === group).map(permission => <div key={permission.code} className="grid grid-cols-[1fr_repeat(4,_120px)] border-b border-slate-50">
          <div className="py-3 px-4 text-sm text-slate-700">{permission.label}</div>
          {matrix.roles.map(role => { const allowed = permission.roles[role]; return <div key={role} className="py-3 flex justify-center">
            <button onClick={() => toggle(permission.code, role)} disabled={role === "ADMIN"}
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${allowed ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-300"}`}>
              {allowed ? <Check size={13} /> : <X size={13} />}
            </button></div>; })}
        </div>)}
      </div>)}
    </div>
  </div>;
}
