import type { OrderStatus } from "../types/domain";

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  Pending: "Chờ xử lý",
  Confirmed: "Đã xác nhận",
  Picking: "Đang lấy hàng",
  Shipping: "Đang giao",
  Delivered: "Đã giao",
  Failed: "Chưa giao được",
  Cancelled: "Đã hủy",
};

export function mapBackendStatusToUI(status?: string): OrderStatus {
  switch ((status || "").toUpperCase()) {
    case "CREATED":
    case "PENDING":
      return "Pending";
    case "PAID":
    case "ASSIGNED":
    case "CONFIRMED":
      return "Confirmed";
    case "PICKED_UP":
    case "PICKING":
      return "Picking";
    case "IN_TRANSIT":
    case "SHIPPING":
      return "Shipping";
    case "DELIVERED":
    case "DONE":
    case "COMPLETED":
      return "Delivered";
    case "FAILED":
      return "Failed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return "Pending";
  }
}

export function getOrderStatusLabel(status?: string): string {
  return ORDER_STATUS_LABELS[mapBackendStatusToUI(status)];
}

export function paymentStatusFromOrder(status?: string) {
  const normalized = (status || "").toUpperCase();
  if (["PAID", "DELIVERED", "DONE", "COMPLETED"].includes(normalized)) return "Paid" as const;
  if (["FAILED", "CANCELLED"].includes(normalized)) return "Failed" as const;
  return "Pending" as const;
}
