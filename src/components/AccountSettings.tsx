import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import {
  changePasswordApi,
  createUserAddressApi,
  deleteUserAddressApi,
  getCurrentUserApi,
  setDefaultUserAddressApi,
  updateCurrentUserProfileApi,
  updateCurrentUserSettingsApi,
  updateUserAddressApi,
} from "../api/deliveryApi";
import { useApp } from "../context/AppContext";
import type {
  ChangePasswordRequest,
  Gender,
  UpdateProfileRequest,
  UserAddress,
  UserAddressRequest,
  UserSettings,
} from "../types/account";
import { applyUserPreferences } from "../utils/userPreferences";

type AccountSection = "profile" | "addresses" | "security" | "preferences";

interface AccountSettingsProps {
  embedded?: boolean;
}

const sections = [
  { id: "profile" as const, label: "Thông tin cá nhân", icon: UserRound },
  { id: "addresses" as const, label: "Sổ địa chỉ", icon: MapPin },
  { id: "security" as const, label: "Mật khẩu", icon: KeyRound },
  { id: "preferences" as const, label: "Tùy chọn", icon: Bell },
];

const INITIAL_SETTINGS: UserSettings = {
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

const EMPTY_ADDRESS: UserAddressRequest = {
  label: "",
  recipientName: "",
  phoneNumber: "",
  addressLine: "",
  ward: "",
  district: "",
  province: "",
  postalCode: "",
  defaultAddress: false,
};

const EMPTY_PASSWORD: ChangePasswordRequest = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const inputClass =
  "w-full h-10 px-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white disabled:opacity-60";

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${
        checked ? "bg-blue-600" : "bg-slate-200"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-600 text-slate-700">{children}</label>;
}

function normalizeAddress(address: UserAddress): UserAddressRequest {
  return {
    label: address.label,
    recipientName: address.recipientName,
    phoneNumber: address.phoneNumber,
    addressLine: address.addressLine,
    ward: address.ward ?? "",
    district: address.district ?? "",
    province: address.province ?? "",
    postalCode: address.postalCode ?? "",
    defaultAddress: address.defaultAddress,
  };
}

function cleanAddress(address: UserAddressRequest): UserAddressRequest {
  const optional = (value?: string | null) => value?.trim() || null;
  return {
    label: address.label.trim(),
    recipientName: address.recipientName.trim(),
    phoneNumber: address.phoneNumber.trim(),
    addressLine: address.addressLine.trim(),
    ward: optional(address.ward),
    district: optional(address.district),
    province: optional(address.province),
    postalCode: optional(address.postalCode),
    defaultAddress: Boolean(address.defaultAddress),
  };
}

function getYesterdayIsoDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, "0");
  const day = String(yesterday.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function AccountSettings({ embedded = false }: AccountSettingsProps) {
  const navigate = useNavigate();
  const {
    addToast,
    openConfirm,
    updateCurrentUser,
    updateCurrentUserSettings,
    logout,
  } = useApp();
  const [section, setSection] = useState<AccountSection>("profile");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [profile, setProfile] = useState<UpdateProfileRequest>({
    fullName: "",
    phoneNumber: "",
    email: "",
    dateOfBirth: null,
    gender: null,
    avatarUrl: null,
  });
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [settings, setSettings] = useState<UserSettings>(INITIAL_SETTINGS);
  const [password, setPassword] = useState<ChangePasswordRequest>(EMPTY_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [addressDraft, setAddressDraft] = useState<UserAddressRequest>(EMPTY_ADDRESS);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addressEditorOpen, setAddressEditorOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [addressActionId, setAddressActionId] = useState<number | null>(null);

  const loadAccount = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await getCurrentUserApi();
      if (response.httpStatus !== 200 || !response.data) {
        throw new Error(response.message || "Không thể tải thông tin tài khoản");
      }

      const account = response.data;
      if (!account.settings) {
        throw new Error("Backend chưa trả về cấu hình user_settings");
      }
      const accountSettings = account.settings;
      setUsername(account.username);
      setRole(account.role);
      setProfile({
        fullName: account.fullName ?? "",
        phoneNumber: account.phoneNumber ?? "",
        email: account.email ?? "",
        dateOfBirth: account.dateOfBirth ?? null,
        gender: account.gender ?? null,
        avatarUrl: account.avatarUrl ?? null,
      });
      setAddresses(account.addresses ?? []);
      setSettings(accountSettings);
      updateCurrentUser(account);
      applyUserPreferences(accountSettings);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Không thể tải thông tin tài khoản");
    } finally {
      setLoading(false);
    }
  }, [updateCurrentUser]);

  useEffect(() => {
    void loadAccount();
  }, [loadAccount]);

  const sortedAddresses = useMemo(
    () => [...addresses].sort((a, b) => Number(b.defaultAddress) - Number(a.defaultAddress)),
    [addresses],
  );

  const saveProfile = async () => {
    if (!profile.fullName.trim() || !profile.email.trim() || !profile.phoneNumber.trim()) {
      addToast({
        type: "warning",
        title: "Thiếu thông tin",
        message: "Họ tên, email và số điện thoại không được để trống.",
      });
      return;
    }

    setSavingProfile(true);
    try {
      const payload: UpdateProfileRequest = {
        fullName: profile.fullName.trim(),
        email: profile.email.trim(),
        phoneNumber: profile.phoneNumber.trim(),
        dateOfBirth: profile.dateOfBirth || null,
        gender: profile.gender || null,
        avatarUrl: profile.avatarUrl?.trim() || null,
      };
      const response = await updateCurrentUserProfileApi(payload);
      if (response.httpStatus === 200 && response.data) {
        const account = response.data;
        setProfile({
          fullName: account.fullName ?? "",
          phoneNumber: account.phoneNumber ?? "",
          email: account.email ?? "",
          dateOfBirth: account.dateOfBirth ?? null,
          gender: account.gender ?? null,
          avatarUrl: account.avatarUrl ?? null,
        });
        updateCurrentUser(account);
        addToast({
          type: "success",
          title: "Đã lưu hồ sơ",
          message: "Thông tin mới đã được cập nhật vào tài khoản.",
        });
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Không thể cập nhật hồ sơ",
        message: error instanceof Error ? error.message : "Vui lòng thử lại.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const openNewAddress = () => {
    setEditingAddressId(null);
    setAddressDraft({
      ...EMPTY_ADDRESS,
      recipientName: profile.fullName,
      phoneNumber: profile.phoneNumber,
      defaultAddress: addresses.length === 0,
    });
    setAddressEditorOpen(true);
  };

  const openEditAddress = (address: UserAddress) => {
    setEditingAddressId(address.id);
    setAddressDraft(normalizeAddress(address));
    setAddressEditorOpen(true);
  };

  const closeAddressEditor = () => {
    setAddressEditorOpen(false);
    setEditingAddressId(null);
    setAddressDraft(EMPTY_ADDRESS);
  };

  const saveAddress = async () => {
    if (
      !addressDraft.label.trim() ||
      !addressDraft.recipientName.trim() ||
      !addressDraft.phoneNumber.trim() ||
      !addressDraft.addressLine.trim()
    ) {
      addToast({
        type: "warning",
        title: "Thiếu thông tin địa chỉ",
        message: "Vui lòng nhập nhãn, người nhận, số điện thoại và địa chỉ chi tiết.",
      });
      return;
    }

    setSavingAddress(true);
    try {
      const payload = cleanAddress(addressDraft);
      const response = editingAddressId
        ? await updateUserAddressApi(editingAddressId, payload)
        : await createUserAddressApi(payload);

      if (response.httpStatus === 200 && response.data) {
        const saved = response.data;
        setAddresses((current) => {
          const withoutSaved = current.filter((item) => item.id !== saved.id);
          const normalized = saved.defaultAddress
            ? withoutSaved.map((item) => ({ ...item, defaultAddress: false }))
            : withoutSaved;
          return [saved, ...normalized];
        });
        closeAddressEditor();
        addToast({
          type: "success",
          title: editingAddressId ? "Đã cập nhật địa chỉ" : "Đã thêm địa chỉ",
          message: "Sổ địa chỉ đã được đồng bộ với tài khoản.",
        });
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Không thể lưu địa chỉ",
        message: error instanceof Error ? error.message : "Vui lòng thử lại.",
      });
    } finally {
      setSavingAddress(false);
    }
  };

  const makeDefaultAddress = async (id: number) => {
    if (addressActionId !== null) return;
    setAddressActionId(id);
    try {
      const response = await setDefaultUserAddressApi(id);
      if (response.httpStatus === 200 && response.data) {
        setAddresses((current) =>
          current.map((item) => ({
            ...item,
            defaultAddress: item.id === response.data.id,
          })),
        );
        addToast({
          type: "success",
          title: "Đã đặt địa chỉ mặc định",
          message: response.data.label,
        });
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Không thể đặt mặc định",
        message: error instanceof Error ? error.message : "Vui lòng thử lại.",
      });
    } finally {
      setAddressActionId(null);
    }
  };

  const requestDeleteAddress = (address: UserAddress) => {
    if (addressActionId !== null) return;
    openConfirm({
      title: "Xóa địa chỉ",
      message: `Bạn có chắc muốn xóa địa chỉ “${address.label}” không?`,
      confirmLabel: "Xóa địa chỉ",
      danger: true,
      onConfirm: () => {
        void (async () => {
          setAddressActionId(address.id);
          try {
            const deleted = await deleteUserAddressApi(address.id);
            if (deleted.httpStatus === 200 && deleted.data) {
              setAddresses(deleted.data);
              addToast({
                type: "success",
                title: "Đã xóa địa chỉ",
                message: "Danh sách mới đã được cập nhật từ hệ thống.",
              });
            }
          } catch (error) {
            addToast({
              type: "error",
              title: "Không thể xóa địa chỉ",
              message: error instanceof Error ? error.message : "Vui lòng thử lại.",
            });
          } finally {
            setAddressActionId(null);
          }
        })();
      },
    });
  };

  const savePassword = async () => {
    if (!password.currentPassword || !password.newPassword || !password.confirmPassword) {
      addToast({ type: "warning", title: "Vui lòng nhập đủ ba trường mật khẩu" });
      return;
    }
    if (password.newPassword.length < 8) {
      addToast({ type: "warning", title: "Mật khẩu mới phải có ít nhất 8 ký tự" });
      return;
    }
    if (
      new TextEncoder().encode(password.currentPassword).length > 72 ||
      new TextEncoder().encode(password.newPassword).length > 72
    ) {
      addToast({ type: "warning", title: "Mật khẩu không được vượt quá 72 byte UTF-8" });
      return;
    }
    if (password.newPassword !== password.confirmPassword) {
      addToast({ type: "warning", title: "Xác nhận mật khẩu chưa khớp" });
      return;
    }

    setSavingPassword(true);
    try {
      const response = await changePasswordApi(password);
      if (response.httpStatus === 200 && response.data?.changed) {
        setPassword(EMPTY_PASSWORD);
        addToast({
          type: "success",
          title: "Đổi mật khẩu thành công",
          message: "Vui lòng đăng nhập lại bằng mật khẩu mới.",
        });
        logout();
        navigate("/login", { replace: true });
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Không thể đổi mật khẩu",
        message: error instanceof Error ? error.message : "Vui lòng kiểm tra mật khẩu hiện tại.",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const response = await updateCurrentUserSettingsApi(settings);
      if (response.httpStatus === 200 && response.data) {
        setSettings(response.data);
        updateCurrentUserSettings(response.data);
        addToast({
          type: "success",
          title: "Đã lưu tùy chọn",
          message: "Cấu hình đã được đồng bộ với tài khoản của bạn.",
        });
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Không thể lưu tùy chọn",
        message: error instanceof Error ? error.message : "Vui lòng thử lại.",
      });
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-56 items-center justify-center rounded-2xl border border-slate-100 bg-white">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-blue-600" size={24} />
          <p className="mt-2 text-xs text-slate-500">Đang tải cài đặt từ hệ thống...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-red-100 bg-white p-6 text-center">
        <p className="text-sm font-600 text-red-600">{loadError}</p>
        <button
          type="button"
          onClick={() => void loadAccount()}
          className="mt-3 flex h-9 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-600 text-white"
        >
          <RefreshCw size={14} /> Thử lại
        </button>
      </div>
    );
  }

  return (
    <section data-account-settings className={embedded ? "w-full" : "w-full max-w-6xl"}>
      {!embedded && (
        <div className="mb-5">
          <h2 className="text-lg font-700 text-slate-900">Cài đặt tài khoản</h2>
          <p className="mt-1 text-xs text-slate-500">
            Hồ sơ, địa chỉ và tùy chọn dưới đây được lưu trực tiếp theo tài khoản đăng nhập.
          </p>
        </div>
      )}

      <div className="mb-5 overflow-x-auto">
        <nav className="flex min-w-max gap-1 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-sm">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSection(id)}
              className={`flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-600 sm:px-4 ${
                section === id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </nav>
      </div>

      {section === "profile" && (
        <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-blue-50 text-3xl font-700 text-blue-700">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Ảnh đại diện" className="h-full w-full object-cover" />
              ) : (
                (profile.fullName || username || "U").charAt(0).toUpperCase()
              )}
            </div>
            <p className="mt-4 text-center text-sm font-700 text-slate-900">
              {profile.fullName || username}
            </p>
            <p className="mt-0.5 text-center text-xs text-slate-400">@{username}</p>
            <div className="mt-3 flex justify-center">
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-700 text-blue-700">
                {role}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Họ và tên</FieldLabel>
                <input
                  value={profile.fullName}
                  maxLength={100}
                  onChange={(event) => setProfile((current) => ({ ...current, fullName: event.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <FieldLabel>Số điện thoại</FieldLabel>
                <input
                  type="tel"
                  inputMode="tel"
                  value={profile.phoneNumber}
                  maxLength={20}
                  pattern="[0-9+(). -]{8,20}"
                  onChange={(event) => setProfile((current) => ({ ...current, phoneNumber: event.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <FieldLabel>Email</FieldLabel>
                <input
                  type="email"
                  value={profile.email}
                  maxLength={100}
                  onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <FieldLabel>Ngày sinh</FieldLabel>
                <input
                  type="date"
                  max={getYesterdayIsoDate()}
                  value={profile.dateOfBirth ?? ""}
                  onChange={(event) => setProfile((current) => ({ ...current, dateOfBirth: event.target.value || null }))}
                  className={inputClass}
                />
              </div>
              <div>
                <FieldLabel>Giới tính</FieldLabel>
                <select
                  value={profile.gender ?? ""}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      gender: (event.target.value || null) as Gender | null,
                    }))
                  }
                  className={inputClass}
                >
                  <option value="">Chưa chọn</option>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>
              <div>
                <FieldLabel>Đường dẫn ảnh đại diện</FieldLabel>
                <input
                  type="url"
                  value={profile.avatarUrl ?? ""}
                  maxLength={1024}
                  placeholder="https://..."
                  onChange={(event) => setProfile((current) => ({ ...current, avatarUrl: event.target.value || null }))}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                disabled={savingProfile}
                onClick={() => void saveProfile()}
                className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {savingProfile ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Lưu thông tin
              </button>
            </div>
          </div>
        </div>
      )}

      {section === "addresses" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-700 text-slate-900">Sổ địa chỉ của bạn</h3>
              <p className="mt-0.5 text-xs text-slate-500">{addresses.length} địa chỉ đang được lưu trong hệ thống</p>
            </div>
            <button
              type="button"
              onClick={openNewAddress}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-600 text-white"
            >
              <Plus size={15} /> Thêm địa chỉ
            </button>
          </div>

          {addressEditorOpen && (
            <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-700 text-slate-900">
                  {editingAddressId ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}
                </h3>
                <button type="button" onClick={closeAddressEditor} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                  <X size={16} />
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Nhãn địa chỉ</FieldLabel>
                  <input value={addressDraft.label} maxLength={50} placeholder="Nhà riêng, Công ty..." onChange={(event) => setAddressDraft((current) => ({ ...current, label: event.target.value }))} className={inputClass} />
                </div>
                <div>
                  <FieldLabel>Người nhận</FieldLabel>
                  <input value={addressDraft.recipientName} maxLength={100} onChange={(event) => setAddressDraft((current) => ({ ...current, recipientName: event.target.value }))} className={inputClass} />
                </div>
                <div>
                  <FieldLabel>Số điện thoại</FieldLabel>
                  <input type="tel" inputMode="tel" maxLength={20} pattern="[0-9+(). -]{8,20}" value={addressDraft.phoneNumber} onChange={(event) => setAddressDraft((current) => ({ ...current, phoneNumber: event.target.value }))} className={inputClass} />
                </div>
                <div>
                  <FieldLabel>Địa chỉ chi tiết</FieldLabel>
                  <input value={addressDraft.addressLine} maxLength={255} placeholder="Số nhà, tên đường" onChange={(event) => setAddressDraft((current) => ({ ...current, addressLine: event.target.value }))} className={inputClass} />
                </div>
                <div>
                  <FieldLabel>Phường / Xã</FieldLabel>
                  <input value={addressDraft.ward ?? ""} maxLength={100} onChange={(event) => setAddressDraft((current) => ({ ...current, ward: event.target.value }))} className={inputClass} />
                </div>
                <div>
                  <FieldLabel>Quận / Huyện</FieldLabel>
                  <input value={addressDraft.district ?? ""} maxLength={100} onChange={(event) => setAddressDraft((current) => ({ ...current, district: event.target.value }))} className={inputClass} />
                </div>
                <div>
                  <FieldLabel>Tỉnh / Thành phố</FieldLabel>
                  <input value={addressDraft.province ?? ""} maxLength={100} onChange={(event) => setAddressDraft((current) => ({ ...current, province: event.target.value }))} className={inputClass} />
                </div>
                <div>
                  <FieldLabel>Mã bưu chính</FieldLabel>
                  <input value={addressDraft.postalCode ?? ""} maxLength={20} onChange={(event) => setAddressDraft((current) => ({ ...current, postalCode: event.target.value }))} className={inputClass} />
                </div>
              </div>
              <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs font-600 text-slate-700">
                <input type="checkbox" checked={Boolean(addressDraft.defaultAddress)} onChange={(event) => setAddressDraft((current) => ({ ...current, defaultAddress: event.target.checked }))} className="h-4 w-4 rounded border-slate-300 accent-blue-600" />
                Đặt làm địa chỉ mặc định
              </label>
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={closeAddressEditor} className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-600 text-slate-600">Hủy</button>
                <button type="button" disabled={savingAddress} onClick={() => void saveAddress()} className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-600 text-white disabled:opacity-60">
                  {savingAddress ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Lưu địa chỉ
                </button>
              </div>
            </div>
          )}

          {sortedAddresses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-12 text-center">
              <MapPin size={30} className="mx-auto text-slate-300" />
              <p className="mt-2 text-sm font-600 text-slate-700">Bạn chưa có địa chỉ nào</p>
              <p className="mt-1 text-xs text-slate-400">Thêm địa chỉ để sử dụng lại khi tạo đơn.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {sortedAddresses.map((address) => (
                <article key={address.id} className={`rounded-2xl border bg-white p-4 shadow-sm ${address.defaultAddress ? "border-blue-200" : "border-slate-100"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${address.defaultAddress ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                      <MapPin size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-700 text-slate-900">{address.label}</h4>
                        {address.defaultAddress && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-700 text-blue-700">Mặc định</span>}
                      </div>
                      <p className="mt-2 text-xs font-600 text-slate-700">{address.recipientName} · {address.phoneNumber}</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">
                        {[address.addressLine, address.ward, address.district, address.province].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-50 pt-3">
                    {!address.defaultAddress && (
                      <button type="button" disabled={addressActionId !== null} onClick={() => void makeDefaultAddress(address.id)} className="flex h-8 items-center gap-1.5 rounded-lg bg-blue-50 px-3 text-[11px] font-600 text-blue-700 disabled:opacity-50">
                        {addressActionId === address.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Đặt mặc định
                      </button>
                    )}
                    <button type="button" disabled={addressActionId !== null} onClick={() => openEditAddress(address)} className="ml-auto flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[11px] font-600 text-slate-600 disabled:opacity-50">
                      <Pencil size={12} /> Sửa
                    </button>
                    <button type="button" disabled={addressActionId !== null} onClick={() => requestDeleteAddress(address)} className="flex h-8 items-center gap-1.5 rounded-lg border border-red-100 px-3 text-[11px] font-600 text-red-600 disabled:opacity-50">
                      <Trash2 size={12} /> Xóa
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {section === "security" && (
        <div className="max-w-2xl rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><ShieldCheck size={19} /></div>
            <div>
              <h3 className="text-sm font-700 text-slate-900">Đổi mật khẩu</h3>
              <p className="mt-1 text-xs text-slate-500">Mật khẩu hiện tại sẽ được kiểm tra trước khi lưu mật khẩu mới.</p>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {[
              { key: "currentPassword" as const, label: "Mật khẩu hiện tại", placeholder: "Nhập mật khẩu đang sử dụng" },
              { key: "newPassword" as const, label: "Mật khẩu mới", placeholder: "Từ 8 đến 72 ký tự" },
              { key: "confirmPassword" as const, label: "Xác nhận mật khẩu mới", placeholder: "Nhập lại mật khẩu mới" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <FieldLabel>{label}</FieldLabel>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} autoComplete={key === "currentPassword" ? "current-password" : "new-password"} value={password[key]} placeholder={placeholder} onChange={(event) => setPassword((current) => ({ ...current, [key]: event.target.value }))} className={`${inputClass} pr-11`} />
                  <button type="button" aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setShowPassword((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" disabled={savingPassword} onClick={() => void savePassword()} className="mt-5 flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-600 text-white disabled:opacity-60">
            {savingPassword ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />} Cập nhật mật khẩu
          </button>
        </div>
      )}

      {section === "preferences" && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-700 text-slate-900">Kênh nhận thông báo</h3>
              <div className="mt-3 divide-y divide-slate-50">
                {[
                  { key: "emailNotifications" as const, label: "Email", description: "Nhận thông báo qua email tài khoản" },
                  { key: "smsNotifications" as const, label: "SMS", description: "Nhận tin nhắn qua số điện thoại" },
                  { key: "pushNotifications" as const, label: "Push notification", description: "Thông báo trên trình duyệt" },
                ].map(({ key, label, description }) => (
                  <div key={key} className="flex items-center justify-between gap-4 py-3">
                    <div><p className="text-xs font-600 text-slate-800">{label}</p><p className="mt-0.5 text-[11px] text-slate-400">{description}</p></div>
                    <Toggle disabled={savingSettings} checked={settings[key]} onChange={(value) => setSettings((current) => ({ ...current, [key]: value }))} />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-700 text-slate-900">Loại sự kiện</h3>
              <div className="mt-3 divide-y divide-slate-50">
                {[
                  { key: "newOrderNotifications" as const, label: "Đơn hàng mới" },
                  { key: "statusChangeNotifications" as const, label: "Thay đổi trạng thái" },
                  { key: "paymentSuccessNotifications" as const, label: "Thanh toán thành công" },
                  { key: "deliveryCompleteNotifications" as const, label: "Giao hàng hoàn tất" },
                  { key: "shipperAssignmentNotifications" as const, label: "Phân công shipper" },
                  { key: "serviceAlertNotifications" as const, label: "Cảnh báo dịch vụ" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between gap-4 py-2.5">
                    <p className="text-xs font-600 text-slate-700">{label}</p>
                    <Toggle disabled={savingSettings} checked={settings[key]} onChange={(value) => setSettings((current) => ({ ...current, [key]: value }))} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <FieldLabel>Ngôn ngữ</FieldLabel>
                <select disabled={savingSettings} value={settings.language} onChange={(event) => setSettings((current) => ({ ...current, language: event.target.value as UserSettings["language"] }))} className={inputClass}>
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div>
                <FieldLabel>Màu chủ đạo</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {["#2563EB", "#7C3AED", "#059669", "#DC2626", "#D97706", "#0891B2"].map((color) => (
                    <button key={color} type="button" disabled={savingSettings} aria-label={`Chọn màu ${color}`} onClick={() => setSettings((current) => ({ ...current, accentColor: color }))} className={`h-9 w-9 rounded-full border-2 disabled:opacity-50 ${settings.accentColor === color ? "scale-110 border-slate-500" : "border-transparent"}`} style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5">
              <FieldLabel>Giao diện</FieldLabel>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  { id: "LIGHT" as const, label: "Sáng", preview: "bg-white" },
                  { id: "DARK" as const, label: "Tối", preview: "bg-slate-900" },
                  { id: "SYSTEM" as const, label: "Theo thiết bị", preview: "bg-gradient-to-r from-white to-slate-900" },
                ].map(({ id, label, preview }) => (
                  <button key={id} type="button" disabled={savingSettings} onClick={() => setSettings((current) => ({ ...current, theme: id }))} className={`rounded-xl border-2 p-3 text-left disabled:opacity-50 ${settings.theme === id ? "border-blue-500 bg-blue-50" : "border-slate-100 bg-slate-50"}`}>
                    <span className={`mb-2 block h-10 rounded-lg border border-slate-200 ${preview}`} />
                    <span className="text-xs font-600 text-slate-700">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button type="button" disabled={savingSettings} onClick={() => void saveSettings()} style={{ backgroundColor: settings.accentColor }} className="flex h-10 items-center gap-2 rounded-xl px-5 text-xs font-600 text-white disabled:opacity-60">
                {savingSettings ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Lưu tùy chọn
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
