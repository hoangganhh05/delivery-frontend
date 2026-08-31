import axiosClient from "./axiosClient";

export interface ApiResponse<T = any> {
  code: string;
  message: string;
  data: T;
}

export interface VoucherCalculationResponse {
  code: string;
  orderAmount: number;
  shippingFee: number | null;
  discountAmount: number;
  finalAmount: number;
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
  calculateVoucherApi,
  createVoucherApi,
  getVouchersApi,
  trackOrderApi,
  getNotificationsApi,
  getUnreadNotificationCountApi,
  markNotificationAsReadApi,
  markAllNotificationsAsReadApi,
};
