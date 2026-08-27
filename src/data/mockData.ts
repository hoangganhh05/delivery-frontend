export type OrderStatus = 'Pending' | 'Confirmed' | 'Picking' | 'Shipping' | 'Delivered' | 'Cancelled';
export type PaymentStatus = 'Paid' | 'Pending' | 'Failed' | 'Refunded';
export type ShipperStatus = 'Available' | 'Delivering' | 'Offline';
export type UserRole = 'Admin' | 'Staff' | 'Shipper' | 'Customer';
export type UserStatus = 'Active' | 'Inactive' | 'Suspended';

export interface Order {
  id: string;
  trackingNumber: string;
  sender: { name: string; phone: string; address: string };
  receiver: { name: string; phone: string; address: string };
  shipper: string | null;
  shipperId: string | null;
  totalFee: number;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  status: OrderStatus;
  createdAt: string;
  estimatedDelivery: string;
  weight: number;
  dimensions: string;
  cod: number;
  notes: string;
}

export interface Shipper {
  id: string;
  avatar: string;
  name: string;
  phone: string;
  email: string;
  vehicle: string;
  currentOrders: number;
  completedOrders: number;
  rating: number;
  status: ShipperStatus;
  revenue: number;
  successRate: number;
  joinedDate: string;
  zone: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdDate: string;
  lastLogin: string;
  avatar: string;
}

export interface Payment {
  id: string;
  orderId: string;
  customer: string;
  amount: number;
  method: string;
  status: PaymentStatus;
  createdAt: string;
}

export interface Voucher {
  id: string;
  code: string;
  discount: number;
  type: 'Percentage' | 'Fixed';
  minOrder: number;
  used: number;
  limit: number;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Expired' | 'Disabled';
}

// Emptied mock data arrays — real data is fetched from Spring Boot backend API
export const orders: Order[] = [];
export const shippers: Shipper[] = [];
export const users: User[] = [];
export const payments: Payment[] = [];
export const vouchers: Voucher[] = [];
export const orderAnalyticsData: any[] = [];
export const orderStatusData: any[] = [];
export const revenueData: any[] = [];
export const notifications: any[] = [];
