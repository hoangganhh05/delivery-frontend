import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Loader2, Monitor, Moon, Save, Sun } from "lucide-react";
import { getCurrentUserApi, updateCurrentUserSettingsApi } from "../api/deliveryApi";
import { useApp } from "../context/AppContext";
import type { UserSettings } from "../types/account";
import { useTranslation, type TranslationKey } from "../i18n/I18nProvider";

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
  const { addToast, role, user, updateCurrentUserSettings } = useApp();
  const { t } = useTranslation();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAppearance, setSavingAppearance] = useState(false);
  const appearanceSaveTimer = useRef<number | null>(null);
  const appearanceSaveQueue = useRef<Promise<void>>(Promise.resolve());
  const appearanceRevision = useRef(0);

  const load = useCallback(async () => {
    if (user?.settings) {
      setSettings(user.settings);
      setLoading(false);
      return;
    }

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
  }, [addToast, updateCurrentUserSettings, user?.settings]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => () => {
    if (appearanceSaveTimer.current !== null) {
      window.clearTimeout(appearanceSaveTimer.current);
    }
  }, []);

  const saveAll = async (next: UserSettings) => {
    setSaving(true);
    try {
      const response = await updateCurrentUserSettingsApi(next);
      if (response.httpStatus !== 200 || !response.data) throw new Error(response.message || "Không thể lưu cài đặt.");
      setSettings(response.data);
      updateCurrentUserSettings(response.data);
    } catch (error) {
      addToast({ type: "error", title: "Không thể lưu cài đặt", message: error instanceof Error ? error.message : "Vui lòng thử lại." });
    } finally {
      setSaving(false);
    }
  };

  const changeAppearance = (changes: Partial<Pick<UserSettings, "theme" | "accentColor">>) => {
    const next = { ...settings, ...changes };
    if (next.theme === settings.theme && next.accentColor === settings.accentColor) return;

    setSettings(next);
    updateCurrentUserSettings(next);
    const revision = appearanceRevision.current + 1;
    appearanceRevision.current = revision;
    setSavingAppearance(true);

    if (appearanceSaveTimer.current !== null) {
      window.clearTimeout(appearanceSaveTimer.current);
    }

    appearanceSaveTimer.current = window.setTimeout(() => {
      appearanceSaveTimer.current = null;
      appearanceSaveQueue.current = appearanceSaveQueue.current
        .catch(() => undefined)
        .then(async () => {
          try {
            const response = await updateCurrentUserSettingsApi(next);
            if (response.httpStatus !== 200 || !response.data) {
              throw new Error(response.message || "Không thể đồng bộ giao diện.");
            }
          } catch (error) {
            if (revision === appearanceRevision.current) {
              addToast({
                type: "warning",
                title: "Giao diện đã áp dụng trên thiết bị này",
                message: error instanceof Error ? `${error.message} Bạn có thể thử đổi lại sau để đồng bộ tài khoản.` : "Chưa thể đồng bộ tài khoản. Bạn có thể thử đổi lại sau.",
              });
            }
          } finally {
            if (revision === appearanceRevision.current) setSavingAppearance(false);
          }
        });
    }, 350);
  };

  const notificationEvents = role === "Shipper"
    ? [
        { key: "newOrderNotifications" as const, labelKey: "settings.newOrder.shipper" as TranslationKey },
        { key: "statusChangeNotifications" as const, labelKey: "settings.statusChanged" as TranslationKey },
        { key: "deliveryCompleteNotifications" as const, labelKey: "settings.deliveryDone" as TranslationKey },
        { key: "shipperAssignmentNotifications" as const, labelKey: "settings.moreAssigned" as TranslationKey },
      ]
    : role === "Customer"
      ? [
          { key: "newOrderNotifications" as const, labelKey: "settings.newOrder.customer" as TranslationKey },
          { key: "statusChangeNotifications" as const, labelKey: "settings.statusChanged" as TranslationKey },
          { key: "paymentSuccessNotifications" as const, labelKey: "settings.paymentSuccess" as TranslationKey },
          { key: "deliveryCompleteNotifications" as const, labelKey: "settings.delivered" as TranslationKey },
          { key: "shipperAssignmentNotifications" as const, labelKey: "settings.shipperAssigned" as TranslationKey },
          { key: "serviceAlertNotifications" as const, labelKey: "settings.importantGiaotin" as TranslationKey },
        ]
      : [
          { key: "newOrderNotifications" as const, labelKey: "settings.newOrder.admin" as TranslationKey },
          { key: "statusChangeNotifications" as const, labelKey: "settings.statusChanged" as TranslationKey },
          { key: "paymentSuccessNotifications" as const, labelKey: "settings.paymentSuccess" as TranslationKey },
          { key: "deliveryCompleteNotifications" as const, labelKey: "settings.delivered" as TranslationKey },
          { key: "shipperAssignmentNotifications" as const, labelKey: "settings.assigned" as TranslationKey },
          { key: "serviceAlertNotifications" as const, labelKey: "settings.important" as TranslationKey },
        ];

  if (loading) {
    return <div role="status" className="flex min-h-56 items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white text-sm text-slate-500"><Loader2 size={18} className="animate-spin text-blue-600" />{t("settings.loading")}</div>;
  }

  return (
    <section className="w-full max-w-6xl space-y-5">
      <div>
        <h2 className="text-lg font-700 text-slate-900">{t("settings.title")}</h2>
        <p className="mt-1 text-xs text-slate-500">{t("settings.description")}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2"><Bell size={17} className="text-blue-600" /><h3 className="text-sm font-700 text-slate-900">{t("settings.channels")}</h3></div>
          <div className="mt-3 divide-y divide-slate-50">
            {[
              { key: "emailNotifications" as const, label: "Email", descriptionKey: "settings.emailDescription" as TranslationKey },
              { key: "smsNotifications" as const, label: "SMS", descriptionKey: "settings.smsDescription" as TranslationKey },
              { key: "pushNotifications" as const, labelKey: "settings.push" as TranslationKey, descriptionKey: "settings.pushDescription" as TranslationKey },
            ].map(({ key, label, labelKey, descriptionKey }) => (
              <div key={key} className="flex items-center justify-between gap-4 py-3">
                <div><p className="text-xs font-600 text-slate-800">{labelKey ? t(labelKey) : label}</p><p className="mt-0.5 text-[11px] text-slate-400">{t(descriptionKey)}</p></div>
                <PreferenceSwitch checked={settings[key]} disabled={saving} label={labelKey ? t(labelKey) : label} onChange={(value) => setSettings((current) => ({ ...current, [key]: value }))} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-700 text-slate-900">{t("settings.contents")}</h3>
          <div className="mt-3 divide-y divide-slate-50">
            {notificationEvents.map(({ key, labelKey }) => (
              <div key={key} className="flex items-center justify-between gap-4 py-2.5">
                <p className="text-xs font-600 text-slate-700">{t(labelKey)}</p>
                <PreferenceSwitch checked={settings[key]} disabled={saving} label={t(labelKey)} onChange={(value) => setSettings((current) => ({ ...current, [key]: value }))} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-700 text-slate-900">{t("settings.interfaceLanguage")}</h3>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-600 text-slate-700">{t("settings.interface")}</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "LIGHT" as const, labelKey: "settings.light" as TranslationKey, icon: Sun },
                { id: "DARK" as const, labelKey: "settings.dark" as TranslationKey, icon: Moon },
                { id: "SYSTEM" as const, labelKey: "settings.system" as TranslationKey, icon: Monitor },
              ].map(({ id, labelKey, icon: Icon }) => (
                <button key={id} type="button" aria-label={t(labelKey)} aria-pressed={settings.theme === id} onClick={() => changeAppearance({ theme: id })} className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border-2 text-xs font-600 transition-colors ${settings.theme === id ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>
                  <Icon size={17} />{t(labelKey)}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">{savingAppearance ? t("settings.appliedSyncing") : t("settings.appliedNow")}</p>
          </div>
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-600 text-slate-700">{t("settings.accent")}</p>
              <div className="flex flex-wrap gap-2">
                {ACCENT_COLORS.map((color) => <button key={color} type="button" aria-label={`Chọn màu ${color}`} aria-pressed={settings.accentColor === color} onClick={() => changeAppearance({ accentColor: color })} className={`h-9 w-9 rounded-full border-2 ${settings.accentColor === color ? "scale-110 border-slate-500" : "border-transparent"}`} style={{ backgroundColor: color }} />)}
              </div>
            </div>
            <div>
              <label htmlFor="preferred-language" className="mb-2 block text-xs font-600 text-slate-700">{t("settings.language")}</label>
              <select id="preferred-language" disabled={saving} value={settings.language} onChange={(event) => { const next = { ...settings, language: event.target.value as UserSettings["language"] }; setSettings(next); updateCurrentUserSettings(next); }} className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800">
                <option value="vi">{t("settings.vi")}</option><option value="en">{t("settings.en")}</option>
              </select>
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">{t("settings.saveHint")}</p>
          <button type="button" disabled={saving} onClick={() => void saveAll(settings)} style={{ backgroundColor: settings.accentColor }} className="flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-xs font-600 text-white disabled:opacity-60">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {t("common.saveChanges")}
          </button>
        </div>
      </div>
    </section>
  );
}
