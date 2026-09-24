import axiosClient from "./axiosClient";
import type {
  ChangePasswordRequest,
  PasswordChangeResponse,
  UpdateProfileRequest,
  UpdateUserSettingsRequest,
  UserAddress,
  UserAddressRequest,
  UserMe,
  UserSettings,
} from "../types/account";

export interface ApiResponse<T = any> {
  code: string;
  message: string;
  data: T;
  httpStatus: number;
}

export interface VoucherCalculationResponse {
  code: string;
  orderAmount: number;
  shippingFee: number | null;
  discountAmount: number;
  finalAmount: number;
}

export type ApiRole = "ADMIN" | "STAFF" | "SHIPPER" | "CUSTOMER";
export interface PermissionRow { code: string; group: string; label: string; roles: Record<ApiRole, boolean>; }
export interface PermissionMatrix { roles: ApiRole[]; permissions: PermissionRow[]; }
export interface CurrentPermissions { role: ApiRole; permissions: string[]; }
export interface PaymentRecord {
  orderId: number; trackingNumber: string; customerName: string; amount: number;
  method: "COD" | "VCB_QR" | "VNPAY"; status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  paidAt?: string; reference?: string; createdAt: string;
}
export interface QrPaymentInfo {
  orderId: number; bankId: string; accountNumber: string; accountName: string;
  amount: number; transferContent: string;
}
export interface OperationsReport {
  from: string; to: string; totalOrders: number; deliveredOrders: number; failedOrders: number;
  revenue: number; statusDistribution: Record<string, number>;
  timeline: Array<{ date: string; orders: number; revenue: number }>;
}

// Authentication
export const loginApi = (data: any): Promise<ApiResponse> => {
  return axiosClient.post("/auth/login", data);
};

export const registerApi = (data: any): Promise<ApiResponse> => {
  return axiosClient.post("/auth/register", data);
};

// Dashboard & Statistics
export const getDashboardStatsApi = (): Promise<ApiResponse> => {
  return axiosClient.get("/dashboard/stats");
};

// Orders
export const createOrderApi = (data: any): Promise<ApiResponse> => {
  return axiosClient.post("/orders", data);
};

export const searchOrdersApi = (params?: {
  status?: string;
  keyword?: string;
  page?: number;
  size?: number;
}): Promise<ApiResponse> => {
  return axiosClient.get("/orders", { params });
};

export const getOrderByTrackingApi = (
  trackingNumber: string,
): Promise<ApiResponse> => {
  return axiosClient.get(`/orders/${trackingNumber}`);
};

export const cancelOrderApi = (trackingNumber: string): Promise<ApiResponse> => {
  return axiosClient.put(`/orders/${trackingNumber}/cancel`);
};

// Shipments & Shipper Assignment
export const assignShipperApi = (data: {
  orderId: number | string;
  shipperId: number | string;
  note?: string;
}): Promise<ApiResponse> => {
  return axiosClient.post("/shipments/assign", data);
};

export const updateShipmentStatusApi = (
  orderId: number | string,
  data: { status: string; note?: string; proofImageUrl?: string },
): Promise<ApiResponse> => {
  return axiosClient.put(`/shipments/orders/${orderId}/status`, data);
};

// Shippers Management
export const getShippersApi = (): Promise<ApiResponse> => {
  return axiosClient.get("/shippers");
};

export const getShipperApi = (id: number | string): Promise<ApiResponse> => {
  return axiosClient.get(`/shippers/${id}`);
};

export const getShipperOrdersApi = (id: number | string): Promise<ApiResponse> => {
  return axiosClient.get(`/shippers/${id}/orders`);
};

// Users Management
export const getUsersApi = (): Promise<ApiResponse> => {
  return axiosClient.get("/users");
};

export const updateUserRoleApi = (id: number, role: ApiRole): Promise<ApiResponse> =>
  axiosClient.put(`/users/${id}/role`, { role });

// Permission matrix
export const getMyPermissionsApi = (): Promise<ApiResponse<CurrentPermissions>> =>
  axiosClient.get("/permissions/me");
export const getPermissionMatrixApi = (): Promise<ApiResponse<PermissionMatrix>> =>
  axiosClient.get("/permissions");
export const updatePermissionMatrixApi = (permissions: Array<{ code: string; role: ApiRole; allowed: boolean }>): Promise<ApiResponse<PermissionMatrix>> =>
  axiosClient.put("/permissions", { permissions });

// Payments
export const getPaymentsApi = (): Promise<ApiResponse<PaymentRecord[]>> => axiosClient.get("/payment");
export const getOrderPaymentApi = (orderId: number): Promise<ApiResponse<PaymentRecord>> =>
  axiosClient.get(`/payment/orders/${orderId}`);
export const getOrderQrPaymentApi = (orderId: number): Promise<ApiResponse<QrPaymentInfo>> =>
  axiosClient.get(`/payment/orders/${orderId}/qr`);
export const confirmOrderPaymentApi = (orderId: number, reference?: string): Promise<ApiResponse<PaymentRecord>> =>
  axiosClient.put(`/payment/orders/${orderId}/confirm`, { reference });

// Reports
export const getOperationsReportApi = (params?: { from?: string; to?: string }): Promise<ApiResponse<OperationsReport>> =>
  axiosClient.get("/reports/operations", { params });
export const exportOrdersReportApi = (params?: { from?: string; to?: string }): Promise<Blob> =>
  axiosClient.get("/reports/orders.csv", { params, responseType: "blob" }) as unknown as Promise<Blob>;

export const getCurrentUserApi = (): Promise<ApiResponse<UserMe>> => {
  return axiosClient.get("/users/me");
};

export const updateCurrentUserProfileApi = (
  data: UpdateProfileRequest,
): Promise<ApiResponse<UserMe>> => {
  return axiosClient.put("/users/profile", data);
};

export const uploadCurrentUserAvatarApi = (file: File): Promise<ApiResponse<UserMe>> => {
  const formData = new FormData();
  formData.append("file", file);
  return axiosClient.post("/users/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const removeCurrentUserAvatarApi = (): Promise<ApiResponse<UserMe>> => {
  return axiosClient.delete("/users/avatar");
};

export const changePasswordApi = (
  data: ChangePasswordRequest,
): Promise<ApiResponse<PasswordChangeResponse>> => {
  return axiosClient.put("/users/change-password", data);
};

export const getUserAddressesApi = (): Promise<ApiResponse<UserAddress[]>> => {
  return axiosClient.get("/users/addresses");
};

export const createUserAddressApi = (
  data: UserAddressRequest,
): Promise<ApiResponse<UserAddress>> => {
  return axiosClient.post("/users/addresses", data);
};

export const updateUserAddressApi = (
  id: number,
  data: UserAddressRequest,
): Promise<ApiResponse<UserAddress>> => {
  return axiosClient.put(`/users/addresses/${id}`, data);
};

export const deleteUserAddressApi = (
  id: number,
): Promise<ApiResponse<UserAddress[]>> => {
  return axiosClient.delete(`/users/addresses/${id}`);
};

export const setDefaultUserAddressApi = (
  id: number,
): Promise<ApiResponse<UserAddress>> => {
  return axiosClient.put(`/users/addresses/${id}/default`);
};

export const updateCurrentUserSettingsApi = (
  data: UpdateUserSettingsRequest,
): Promise<ApiResponse<UserSettings>> => {
  return axiosClient.put("/users/settings", data);
};

// Vouchers
export const calculateVoucherApi = (data: {
  voucherCode: string;
  orderAmount: number;
  shippingFee?: number;
}): Promise<ApiResponse<VoucherCalculationResponse>> => {
  return axiosClient.post("/vouchers/calculate", data);
};

export const createVoucherApi = (data: any): Promise<ApiResponse> => {
  return axiosClient.post("/vouchers", data);
};

export const getVouchersApi = (): Promise<ApiResponse> => {
  return axiosClient.get("/vouchers");
};

export const getActiveVouchersApi = (): Promise<ApiResponse> => {
  return axiosClient.get("/vouchers/active");
};

// Tracking
export const trackOrderApi = (trackingNumber: string): Promise<ApiResponse> => {
  return axiosClient.get(`/tracking/${trackingNumber}`);
};

// Notifications
export const getNotificationsApi = (): Promise<ApiResponse> => {
  return axiosClient.get("/notifications");
};

export const getUnreadNotificationCountApi = (): Promise<ApiResponse> => {
  return axiosClient.get("/notifications/unread-count");
};

export const markNotificationAsReadApi = (
  id: number | string,
): Promise<ApiResponse> => {
  return axiosClient.put(`/notifications/${id}/read`);
};

export const markAllNotificationsAsReadApi = (): Promise<ApiResponse> => {
  return axiosClient.put("/notifications/read-all");
};

export default {
  loginApi,
  registerApi,
  getDashboardStatsApi,
  createOrderApi,
  searchOrdersApi,
  getOrderByTrackingApi,
  cancelOrderApi,
  assignShipperApi,
  updateShipmentStatusApi,
  getShippersApi,
  getShipperApi,
  getShipperOrdersApi,
  getUsersApi,
  updateUserRoleApi,
  getMyPermissionsApi,
  getPermissionMatrixApi,
  updatePermissionMatrixApi,
  getPaymentsApi,
  getOrderPaymentApi,
  getOrderQrPaymentApi,
  confirmOrderPaymentApi,
  getOperationsReportApi,
  exportOrdersReportApi,
  getCurrentUserApi,
  updateCurrentUserProfileApi,
  changePasswordApi,
  getUserAddressesApi,
  createUserAddressApi,
  updateUserAddressApi,
  deleteUserAddressApi,
  setDefaultUserAddressApi,
  updateCurrentUserSettingsApi,
  calculateVoucherApi,
  createVoucherApi,
  getVouchersApi,
  getActiveVouchersApi,
  trackOrderApi,
  getNotificationsApi,
  getUnreadNotificationCountApi,
  markNotificationAsReadApi,
  markAllNotificationsAsReadApi,
};
