import type { OrderStatus } from "../types/domain";

export function mapBackendStatusToUI(status?: string): OrderStatus {
  switch ((status || "").toUpperCase()) {
    case "CREATED":
    case "PENDING":
      return "Pending";
    case "PAID":
    case "ASSIGNED":
      return "Confirmed";
    case "PICKED_UP":
      return "Picking";
    case "IN_TRANSIT":
    case "SHIPPING":
      return "Shipping";
    case "DELIVERED":
    case "DONE":
    case "COMPLETED":
      return "Delivered";
    case "FAILED":
    case "CANCELLED":
      return "Cancelled";
    default:
      return "Pending";
  }
}

export function paymentStatusFromOrder(status?: string) {
  const normalized = (status || "").toUpperCase();
  if (["PAID", "DELIVERED", "DONE", "COMPLETED"].includes(normalized)) return "Paid" as const;
  if (["FAILED", "CANCELLED"].includes(normalized)) return "Failed" as const;
  return "Pending" as const;
}
