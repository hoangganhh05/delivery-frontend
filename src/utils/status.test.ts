import { describe, expect, it } from "vitest";

import { getOrderStatusLabel, mapBackendStatusToUI, paymentStatusFromOrder } from "./status";

describe("order status mapping", () => {
  it.each([
    ["CREATED", "Pending"],
    ["ASSIGNED", "Confirmed"],
    ["PICKED_UP", "Picking"],
    ["IN_TRANSIT", "Shipping"],
    ["DELIVERED", "Delivered"],
    ["FAILED", "Failed"],
    ["CANCELLED", "Cancelled"],
  ])("maps %s to %s", (backendStatus, uiStatus) => {
    expect(mapBackendStatusToUI(backendStatus)).toBe(uiStatus);
  });

  it("uses safe defaults for unknown values", () => {
    expect(mapBackendStatusToUI("UNKNOWN")).toBe("Pending");
    expect(getOrderStatusLabel("UNKNOWN")).toBe("Chờ xử lý");
  });

  it("derives payment state from terminal order states", () => {
    expect(paymentStatusFromOrder("DELIVERED")).toBe("Paid");
    expect(paymentStatusFromOrder("CANCELLED")).toBe("Failed");
    expect(paymentStatusFromOrder("IN_TRANSIT")).toBe("Pending");
  });
});
