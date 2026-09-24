import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { BRAND_NAME, BRAND_TITLE } from "../config/brand";

const pageTitles: Record<string, string> = {
  "/login": "Đăng nhập",
  "/": "Tổng quan",
  "/orders": "Đơn hàng",
  "/dispatch": "Phân công giao hàng",
  "/tracking": "Tra cứu vận đơn",
  "/shippers": "Nhân viên giao hàng",
  "/users": "Người dùng",
  "/permissions": "Phân quyền",
  "/payments": "Thanh toán",
  "/vouchers": "Mã giảm giá",
  "/notifications": "Thông báo",
  "/reports": "Báo cáo giao hàng",
  "/settings": "Cài đặt",
  "/account": "Tài khoản của tôi",
  "/customer": "Trang khách hàng",
  "/shipper-mobile": "Đơn giao của tôi",
};

export default function DocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const match = Object.entries(pageTitles)
      .sort(([a], [b]) => b.length - a.length)
      .find(([path]) => path === "/" ? pathname === "/" : pathname.startsWith(path));
    document.title = match ? `${match[1]} | ${BRAND_NAME}` : BRAND_TITLE;
  }, [pathname]);

  return null;
}
