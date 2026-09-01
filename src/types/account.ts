export type Gender = "MALE" | "FEMALE" | "OTHER";
export type ThemePreference = "LIGHT" | "DARK" | "SYSTEM";
export type LanguagePreference = "vi" | "en";

export interface UserAddress {
  id: number;
  label: string;
  recipientName: string;
  phoneNumber: string;
  addressLine: string;
  ward: string | null;
  district: string | null;
  province: string | null;
  postalCode: string | null;
  defaultAddress: boolean;
}

export interface UserSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  newOrderNotifications: boolean;
  statusChangeNotifications: boolean;
  paymentSuccessNotifications: boolean;
  deliveryCompleteNotifications: boolean;
  shipperAssignmentNotifications: boolean;
  serviceAlertNotifications: boolean;
  language: LanguagePreference;
  theme: ThemePreference;
  accentColor: string;
}

export interface UserMe {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string | null;
  gender: Gender | null;
  avatarUrl: string | null;
  role: string;
  status: string;
  addresses: UserAddress[];
  settings: UserSettings;
}

export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber: string;
  email: string;
  dateOfBirth: string | null;
  gender: Gender | null;
  avatarUrl: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordChangeResponse {
  changed: boolean;
  changedAt: string;
}

export interface UserAddressRequest {
  label: string;
  recipientName: string;
  phoneNumber: string;
  addressLine: string;
  ward?: string | null;
  district?: string | null;
  province?: string | null;
  postalCode?: string | null;
  defaultAddress?: boolean;
}

export type UpdateUserSettingsRequest = UserSettings;
