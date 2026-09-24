const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Quản trị viên",
  STAFF: "Nhân viên quản lý",
  SHIPPER: "Nhân viên giao hàng",
  CUSTOMER: "Khách hàng",
};

export function getRoleLabel(role?: string): string {
  const normalized = (role || "").trim().toUpperCase();
  return ROLE_LABELS[normalized] || role || "Tài khoản";
}
