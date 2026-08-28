import type { OrderStatus, PaymentStatus, ShipperStatus, UserStatus } from '../types/domain';

const orderStatusConfig: Record<OrderStatus, { bg: string; text: string; dot: string }> = {
  Pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  Confirmed: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500' },
  Picking: { bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500' },
  Shipping: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  Delivered: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  Cancelled: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

const paymentStatusConfig: Record<PaymentStatus, { bg: string; text: string; dot: string }> = {
  Paid: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  Pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  Failed: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  Refunded: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' },
};

const shipperStatusConfig: Record<ShipperStatus, { bg: string; text: string; dot: string }> = {
  Available: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  Delivering: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  Offline: { bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-400' },
};

const userStatusConfig: Record<UserStatus, { bg: string; text: string; dot: string }> = {
  Active: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  Inactive: { bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-400' },
  Suspended: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

interface Props {
  status: OrderStatus | PaymentStatus | ShipperStatus | UserStatus;
  type: 'order' | 'payment' | 'shipper' | 'user';
}

export default function StatusBadge({ status, type }: Props) {
  let config;
  if (type === 'order') config = orderStatusConfig[status as OrderStatus];
  else if (type === 'payment') config = paymentStatusConfig[status as PaymentStatus];
  else if (type === 'shipper') config = shipperStatusConfig[status as ShipperStatus];
  else config = userStatusConfig[status as UserStatus];

  const label: Record<string, string> = {
    Pending: 'Chờ xử lý', Confirmed: 'Đã xác nhận', Picking: 'Đang lấy hàng',
    Shipping: 'Đang giao', Delivered: 'Đã giao', Cancelled: 'Đã hủy',
    Paid: 'Đã thanh toán', Failed: 'Thất bại', Refunded: 'Hoàn tiền',
    Available: 'Sẵn sàng', Delivering: 'Đang giao', Offline: 'Offline',
    Active: 'Hoạt động', Inactive: 'Không hoạt động', Suspended: 'Tạm khóa',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {label[status] || status}
    </span>
  );
}
