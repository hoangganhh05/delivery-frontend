import { useCallback, useEffect, useState } from "react";
import { Bell, Loader2, Monitor, Moon, Save, Sun } from "lucide-react";
import { getCurrentUserApi, updateCurrentUserSettingsApi } from "../api/deliveryApi";
import { useApp } from "../context/AppContext";
import type { UserSettings } from "../types/account";

const DEFAULT_SETTINGS: UserSettings = {
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  newOrderNotifications: true,
  statusChangeNotifications: true,
  paymentSuccessNotifications: true,
  deliveryCompleteNotifications: true,
  shipperAssignmentNotifications: false,
  serviceAlertNotifications: true,
  language: "vi",
  theme: "LIGHT",
  accentColor: "#2563EB",
};

const ACCENT_COLORS = ["#2563EB", "#0F766E", "#7C3AED", "#059669", "#E11D48", "#D97706", "#0891B2"];

function PreferenceSwitch({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${checked ? "bg-blue-600" : "bg-slate-200"}`}
    >
      <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

export default function PreferencesSettings() {
  const { addToast, role, updateCurrentUserSettings } = useApp();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAppearance, setSavingAppearance] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getCurrentUserApi();
      if (response.httpStatus !== 200 || !response.data?.settings) {
        throw new Error(response.message || "Không thể tải tùy chọn tài khoản.");
      }
      setSettings(response.data.settings);
      updateCurrentUserSettings(response.data.settings);
    } catch (error) {
      addToast({ type: "error", title: "Không thể tải cài đặt", message: error instanceof Error ? error.message : "Vui lòng thử lại." });
    } finally {
      setLoading(false);
    }
  }, [addToast, updateCurrentUserSettings]);

  useEffect(() => { void load(); }, [load]);

  const saveAll = async (next: UserSettings, appearanceOnly = false) => {
    if (appearanceOnly) setSavingAppearance(true);
    else setSaving(true);
    try {
      const response = await updateCurrentUserSettingsApi(next);
      if (response.httpStatus !== 200 || !response.data) throw new Error(response.message || "Không thể lưu cài đặt.");
      setSettings(response.data);
      updateCurrentUserSettings(response.data);
    } catch (error) {
      addToast({ type: "error", title: "Không thể lưu cài đặt", message: error instanceof Error ? error.message : "Vui lòng thử lại." });
      void load();
    } finally {
      setSaving(false);
      setSavingAppearance(false);
    }
  };

  const changeAppearance = (changes: Partial<Pick<UserSettings, "theme" | "accentColor">>) => {
    const next = { ...settings, ...changes };
    setSettings(next);
    updateCurrentUserSettings(next);
    void saveAll(next, true);
  };

  const notificationEvents = role === "Shipper"
    ? [
        { key: "newOrderNotifications" as const, label: "Khi có đơn mới giao cho tôi" },
        { key: "statusChangeNotifications" as const, label: "Khi trạng thái đơn thay đổi" },
        { key: "deliveryCompleteNotifications" as const, label: "Khi đã giao xong" },
        { key: "shipperAssignmentNotifications" as const, label: "Khi được giao thêm đơn" },
      ]
    : role === "Customer"
      ? [
          { key: "newOrderNotifications" as const, label: "Khi tạo đơn thành công" },
          { key: "statusChangeNotifications" as const, label: "Khi trạng thái đơn thay đổi" },
          { key: "paymentSuccessNotifications" as const, label: "Khi thanh toán thành công" },
          { key: "deliveryCompleteNotifications" as const, label: "Khi đơn đã giao" },
          { key: "shipperAssignmentNotifications" as const, label: "Khi có nhân viên giao hàng" },
          { key: "serviceAlertNotifications" as const, label: "Thông báo quan trọng từ GiaoTín" },
        ]
      : [
          { key: "newOrderNotifications" as const, label: "Khi có đơn hàng mới" },
          { key: "statusChangeNotifications" as const, label: "Khi trạng thái đơn thay đổi" },
          { key: "paymentSuccessNotifications" as const, label: "Khi thanh toán thành công" },
          { key: "deliveryCompleteNotifications" as const, label: "Khi đơn đã giao" },
          { key: "shipperAssignmentNotifications" as const, label: "Khi đã phân công người giao" },
          { key: "serviceAlertNotifications" as const, label: "Thông báo quan trọng" },
        ];

  if (loading) {
    return <div role="status" className="flex min-h-56 items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white text-sm text-slate-500"><Loader2 size={18} className="animate-spin text-blue-600" />Đang tải cài đặt...</div>;
  }

  return (
    <section className="w-full max-w-6xl space-y-5">
      <div>
        <h2 className="text-lg font-700 text-slate-900">Cài đặt</h2>
        <p className="mt-1 text-xs text-slate-500">Tùy chỉnh giao diện và cách nhận thông báo của bạn.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2"><Bell size={17} className="text-blue-600" /><h3 className="text-sm font-700 text-slate-900">Kênh nhận thông báo</h3></div>
          <div className="mt-3 divide-y divide-slate-50">
            {[
              { key: "emailNotifications" as const, label: "Email", description: "Nhận thông báo qua email tài khoản" },
              { key: "smsNotifications" as const, label: "SMS", description: "Nhận tin nhắn qua số điện thoại" },
              { key: "pushNotifications" as const, label: "Thông báo trên thiết bị", description: "Hiện thông báo trên trình duyệt" },
            ].map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between gap-4 py-3">
                <div><p className="text-xs font-600 text-slate-800">{label}</p><p className="mt-0.5 text-[11px] text-slate-400">{description}</p></div>
                <PreferenceSwitch checked={settings[key]} disabled={saving} label={label} onChange={(value) => setSettings((current) => ({ ...current, [key]: value }))} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-700 text-slate-900">Nội dung muốn nhận</h3>
          <div className="mt-3 divide-y divide-slate-50">
            {notificationEvents.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between gap-4 py-2.5">
                <p className="text-xs font-600 text-slate-700">{label}</p>
                <PreferenceSwitch checked={settings[key]} disabled={saving} label={label} onChange={(value) => setSettings((current) => ({ ...current, [key]: value }))} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-700 text-slate-900">Giao diện và ngôn ngữ</h3>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-600 text-slate-700">Giao diện</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "LIGHT" as const, label: "Sáng", icon: Sun },
                { id: "DARK" as const, label: "Tối", icon: Moon },
                { id: "SYSTEM" as const, label: "Theo thiết bị", icon: Monitor },
              ].map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" disabled={savingAppearance} aria-pressed={settings.theme === id} onClick={() => changeAppearance({ theme: id })} className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border-2 text-xs font-600 transition-colors disabled:opacity-60 ${settings.theme === id ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>
                  <Icon size={17} />{label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">{savingAppearance ? "Đang lưu giao diện..." : "Giao diện được áp dụng ngay và tự lưu."}</p>
          </div>
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-600 text-slate-700">Màu chủ đạo</p>
              <div className="flex flex-wrap gap-2">
                {ACCENT_COLORS.map((color) => <button key={color} type="button" disabled={savingAppearance} aria-label={`Chọn màu ${color}`} aria-pressed={settings.accentColor === color} onClick={() => changeAppearance({ accentColor: color })} className={`h-9 w-9 rounded-full border-2 disabled:opacity-50 ${settings.accentColor === color ? "scale-110 border-slate-500" : "border-transparent"}`} style={{ backgroundColor: color }} />)}
              </div>
            </div>
            <div>
              <label htmlFor="preferred-language" className="mb-2 block text-xs font-600 text-slate-700">Ngôn ngữ</label>
              <select id="preferred-language" disabled={saving} value={settings.language} onChange={(event) => setSettings((current) => ({ ...current, language: event.target.value as UserSettings["language"] }))} className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800">
                <option value="vi">Tiếng Việt</option><option value="en">English</option>
              </select>
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">Thông báo và ngôn ngữ được lưu khi bạn bấm lưu.</p>
          <button type="button" disabled={saving} onClick={() => void saveAll(settings)} style={{ backgroundColor: settings.accentColor }} className="flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-xs font-600 text-white disabled:opacity-60">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Lưu thay đổi
          </button>
        </div>
      </div>
    </section>
  );
}
