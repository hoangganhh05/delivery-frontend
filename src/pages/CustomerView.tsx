import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, Search, Bell, ChevronRight, Plus, Clock, CheckCircle2, Truck, Tag, ExternalLink } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import type { OrderStatus } from '../data/mockData';
import { createOrderApi, calculateVoucherApi, searchOrdersApi, createPaymentApi, trackOrderApi } from '../api/deliveryApi';
import { useApp } from '../context/AppContext';

const createSteps = ['Người gửi', 'Người nhận', 'Kiện hàng', 'Dịch vụ', 'Voucher', 'Thanh toán', 'Xác nhận'];
type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;

function mapBackendStatusToUI(status: string): OrderStatus {
  switch (status?.toUpperCase()) {
    case 'CREATED': return 'Pending';
    case 'ASSIGNED': return 'Confirmed';
    case 'PICKED_UP': return 'Picking';
    case 'IN_TRANSIT': return 'Shipping';
    case 'DELIVERED': return 'Delivered';
    case 'CANCELLED': return 'Cancelled';
    default: return 'Pending';
  }
}

export default function CustomerView() {
  const navigate = useNavigate();
  const { user, addToast } = useApp();
  const [tab, setTab] = useState<'home' | 'orders' | 'create' | 'tracking'>('home');
  const [createStep, setCreateStep] = useState<Step>(0);
  const [trackInput, setTrackInput] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);

  // Form State
  const [senderName, setSenderName] = useState('Khách hàng ' + (user?.fullName || 'Hoàng Anh'));
  const [senderPhone, setSenderPhone] = useState('0966666666');
  const [senderAddress, setSenderAddress] = useState('123 Nguyễn Huệ, Quận 1, TP.HCM');

  const [receiverName, setReceiverName] = useState('Nguyễn Văn B');
  const [receiverPhone, setReceiverPhone] = useState('0912345678');
  const [receiverAddress, setReceiverAddress] = useState('45 Lê Lợi, Quận 3, TP.HCM');

  const [itemName, setItemName] = useState('Áo sơ mi nam Viettel');
  const [weightGram, setWeightGram] = useState(500);
  const [declaredValue, setDeclaredValue] = useState(250000);
  const [codAmount, setCodAmount] = useState(0);

  const [selectedService, setSelectedService] = useState({ name: 'Tiêu chuẩn', fee: 30000 });
  const [voucherCode, setVoucherCode] = useState('');
  const [discountFee, setDiscountFee] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('VNPay');

  const [createdOrderRes, setCreatedOrderRes] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [vnpayUrl, setVnpayUrl] = useState('');

  const fetchCustomerOrders = async () => {
    try {
      const res = await searchOrdersApi({ page: 0, size: 10 });
      if (res && res.data && res.data.items) {
        setCustomerOrders(res.data.items);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCustomerOrders();
  }, []);

  const handleApplyVoucher = async (codeToApply?: string) => {
    const code = codeToApply || voucherCode;
    if (!code.trim()) return;
    try {
      const res = await calculateVoucherApi({
        voucherCode: code.trim().toUpperCase(),
        orderAmount: Math.max(1, Number(declaredValue)),
        shippingFee: selectedService.fee,
      });
      if (res && res.data != null) {
        setDiscountFee(Number(res.data));
        setVoucherCode(code.trim().toUpperCase());
        addToast({ type: 'success', title: 'Áp dụng Voucher', message: `Giảm ${(Number(res.data)).toLocaleString()}đ cước phí` });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi Voucher', message: err.message || 'Voucher không hợp lệ' });
    }
  };

  const handleCreateOrder = async () => {
    try {
      setSubmitting(true);
      const payload = {
        senderName,
        senderPhone,
        senderAddress,
        receiverName,
        receiverPhone,
        receiverAddress,
        weightGram: Number(weightGram),
        shippingFee: selectedService.fee,
        voucherCode: voucherCode || null,
        codAmount: Number(codAmount),
        items: [
          {
            itemName: itemName || 'Kiện hàng',
            quantity: 1,
            declaredValue: Number(declaredValue),
            weightGram: Number(weightGram),
          }
        ]
      };

      const res = await createOrderApi(payload);
      if (res && res.data) {
        setCreatedOrderRes(res.data);
        setCreateStep(6);
        addToast({ type: 'success', title: 'Tạo đơn thành công!', message: `Mã vận đơn: ${res.data.trackingNumber}` });
        fetchCustomerOrders();

        // If VNPay chosen, generate payment link
        if (paymentMethod === 'VNPay' && res.data.id) {
          try {
            const payRes = await createPaymentApi(res.data.id);
            if (payRes && payRes.data) {
              setVnpayUrl(payRes.data.paymentUrl);
            }
          } catch (e) {
            console.error('VNPay error:', e);
          }
        }
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Tạo đơn thất bại', message: err.message || 'Không thể tạo đơn hàng' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrackSearch = async () => {
    if (!trackInput.trim()) return;
    try {
      setTrackingLoading(true);
      const res = await trackOrderApi(trackInput.trim());
      if (res && res.data) {
        setTrackedOrder(res.data);
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Tra cứu thất bại', message: err.message || 'Không tìm thấy thông tin vận đơn' });
    } finally {
      setTrackingLoading(false);
    }
  };

  if (tab === 'create') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-3">
          <button onClick={() => { setTab('home'); setCreateStep(0); }}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
            <ArrowLeft size={15} />
          </button>
          <h2 className="text-base font-700 text-slate-900">Tạo đơn hàng trực tuyến</h2>
        </div>

        {/* Progress steps */}
        <div className="bg-white border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-1 overflow-x-auto">
            {createSteps.map((step, idx) => (
              <div key={step} className="flex items-center gap-1 flex-shrink-0">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-500
                  ${idx === createStep ? 'bg-blue-600 text-white' : idx < createStep ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-700 bg-white/30">
                    {idx < createStep ? '✓' : idx + 1}
                  </span>
                  {step}
                </div>
                {idx < createSteps.length - 1 && <ChevronRight size={12} className="text-slate-300" />}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-base font-700 text-slate-900 mb-5">
              {createStep === 0 && 'Bước 1: Thông tin người gửi'}
              {createStep === 1 && 'Bước 2: Thông tin người nhận'}
              {createStep === 2 && 'Bước 3: Thông tin hàng hóa'}
              {createStep === 3 && 'Bước 4: Chọn dịch vụ giao hàng'}
              {createStep === 4 && 'Bước 5: Mã giảm giá / Voucher'}
              {createStep === 5 && 'Bước 6: Phương thức thanh toán'}
              {createStep === 6 && 'Bước 7: Kết quả tạo đơn'}
            </h3>

            {createStep === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-600 text-slate-700 mb-1">Tên người gửi</label>
                  <input type="text" value={senderName} onChange={e => setSenderName(e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-600 text-slate-700 mb-1">Số điện thoại</label>
                  <input type="text" value={senderPhone} onChange={e => setSenderPhone(e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-600 text-slate-700 mb-1">Địa chỉ lấy hàng</label>
                  <input type="text" value={senderAddress} onChange={e => setSenderAddress(e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white" />
                </div>
              </div>
            )}

            {createStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-600 text-slate-700 mb-1">Tên người nhận</label>
                  <input type="text" value={receiverName} onChange={e => setReceiverName(e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-600 text-slate-700 mb-1">Số điện thoại người nhận</label>
                  <input type="text" value={receiverPhone} onChange={e => setReceiverPhone(e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-600 text-slate-700 mb-1">Địa chỉ giao hàng</label>
                  <input type="text" value={receiverAddress} onChange={e => setReceiverAddress(e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white" />
                </div>
              </div>
            )}

            {createStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-600 text-slate-700 mb-1">Tên mặt hàng</label>
                  <input type="text" value={itemName} onChange={e => setItemName(e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-600 text-slate-700 mb-1">Trọng lượng (gram)</label>
                  <input type="number" value={weightGram} onChange={e => setWeightGram(Number(e.target.value))}
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-600 text-slate-700 mb-1">Giá trị hàng (khai giá - VNĐ)</label>
                  <input type="number" value={declaredValue} onChange={e => setDeclaredValue(Number(e.target.value))}
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-600 text-slate-700 mb-1">Tiền thu hộ COD (VNĐ)</label>
                  <input type="number" value={codAmount} onChange={e => setCodAmount(Number(e.target.value))}
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white" />
                </div>
              </div>
            )}

            {createStep === 3 && (
              <div className="space-y-3">
                {[
                  { id: 'std', name: 'Tiêu chuẩn', fee: 30000, desc: 'Giao trong 1-2 ngày' },
                  { id: 'exp', name: 'Hỏa tốc', fee: 50000, desc: 'Giao nhanh trong 24h' },
                ].map(srv => (
                  <label key={srv.id} onClick={() => setSelectedService(srv)} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer ${selectedService.name === srv.name ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}>
                    <div>
                      <p className="text-sm font-600 text-slate-900">{srv.name}</p>
                      <p className="text-xs text-slate-500">{srv.desc}</p>
                    </div>
                    <p className="text-sm font-700 text-blue-600">{srv.fee.toLocaleString()}đ</p>
                  </label>
                ))}
              </div>
            )}

            {createStep === 4 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-600 text-slate-700 mb-1.5">Mã ưu đãi</label>
                  <div className="flex gap-2">
                    <input type="text" value={voucherCode} onChange={e => setVoucherCode(e.target.value)}
                      placeholder="VD: VIETTEL50, FREESHIP..."
                      className="flex-1 h-10 px-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 uppercase" />
                    <button onClick={() => handleApplyVoucher()} className="h-10 px-4 rounded-xl bg-blue-600 text-sm text-white font-500">Áp dụng</button>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { code: 'VIETTEL50', desc: 'Giảm 50% · Đơn tối thiểu 100.000đ' },
                    { code: 'FREESHIP', desc: 'Miễn phí giao hàng · Đơn tối thiểu 50.000đ' },
                    { code: 'VIETTEL20', desc: 'Giảm 20% · Đơn tối thiểu 50.000đ' }
                  ].map(v => (
                    <div key={v.code} className="flex items-center justify-between p-3 rounded-xl border border-dashed border-blue-200 bg-blue-50">
                      <div>
                        <p className="text-sm font-700 text-blue-700 font-mono">{v.code}</p>
                        <p className="text-xs text-blue-600">{v.desc}</p>
                      </div>
                      <button onClick={() => handleApplyVoucher(v.code)} className="text-xs text-blue-600 font-600 hover:underline">Áp dụng</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {createStep === 5 && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Cước phí vận chuyển:</span>
                    <span>{selectedService.fee.toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between text-xs text-green-600 font-500">
                    <span>Voucher giảm giá:</span>
                    <span>-{discountFee.toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between text-sm font-700 text-slate-900 pt-2 border-t">
                    <span>Tổng cần thanh toán:</span>
                    <span className="text-blue-600">{Math.max(0, selectedService.fee - discountFee).toLocaleString()}đ</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer ${paymentMethod === 'VNPay' ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}>
                    <input type="radio" name="pay" checked={paymentMethod === 'VNPay'} onChange={() => setPaymentMethod('VNPay')} className="accent-blue-600" />
                    <div>
                      <p className="text-sm font-600 text-slate-900">VNPay Online (Sandbox)</p>
                      <p className="text-xs text-slate-400">Thanh toán trực tuyến an toàn</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer ${paymentMethod === 'COD' ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}>
                    <input type="radio" name="pay" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} className="accent-blue-600" />
                    <div>
                      <p className="text-sm font-600 text-slate-900">Thanh toán COD</p>
                      <p className="text-xs text-slate-400">Thanh toán khi nhận hàng</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {createStep === 6 && createdOrderRes && (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-2xl mx-auto flex items-center justify-center">
                  <CheckCircle2 size={32} className="text-green-500" />
                </div>
                <h3 className="text-lg font-700 text-slate-900">Tạo đơn hàng thành công!</h3>
                <p className="text-sm text-slate-500">Mã vận đơn (Tracking): <span className="font-700 text-blue-600">{createdOrderRes.trackingNumber}</span></p>
                <p className="text-xs text-slate-400">ID Đơn hàng: #{createdOrderRes.id}</p>

                {vnpayUrl && (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-2">
                    <p className="text-xs text-blue-800 font-600">Đơn hàng sẵn sàng thanh toán VNPay Sandbox:</p>
                    <a href={vnpayUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-600 hover:bg-blue-700">
                      Thanh toán ngay qua VNPay <ExternalLink size={14} />
                    </a>
                  </div>
                )}

                <div className="flex gap-3 justify-center mt-4">
                  <button onClick={() => { setTab('orders'); setCreateStep(0); }}
                    className="h-10 px-5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
                    Danh sách đơn hàng
                  </button>
                  <button onClick={() => { setTab('tracking'); setTrackInput(createdOrderRes.trackingNumber); setCreateStep(0); }}
                    className="h-10 px-5 rounded-xl bg-blue-600 text-sm text-white font-500 hover:bg-blue-700">
                    Theo dõi lộ trình
                  </button>
                </div>
              </div>
            )}

            {createStep < 6 && (
              <div className="flex gap-3 mt-6 pt-5 border-t border-slate-100">
                {createStep > 0 && (
                  <button onClick={() => setCreateStep((createStep - 1) as Step)}
                    className="h-10 px-5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
                    Quay lại
                  </button>
                )}
                {createStep < 5 ? (
                  <button onClick={() => setCreateStep((createStep + 1) as Step)}
                    className="flex-1 h-10 rounded-xl bg-blue-600 text-sm text-white font-600 hover:bg-blue-700">
                    Tiếp theo
                  </button>
                ) : (
                  <button onClick={handleCreateOrder} disabled={submitting}
                    className="flex-1 h-10 rounded-xl bg-blue-600 text-sm text-white font-600 hover:bg-blue-700 disabled:opacity-50">
                    {submitting ? 'Đang tạo đơn hàng...' : 'Xác nhận tạo đơn hàng'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Customer header */}
      <div className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/')} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600">
              <ArrowLeft size={12} /> Về Admin Dashboard
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Truck size={14} className="text-white" />
            </div>
            <span className="font-700 text-sm text-slate-900">DeliveryMS Client</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
              <span className="text-xs font-700 text-white">KH</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-5">
        {/* Welcome */}
        {tab === 'home' && (
          <>
            <div>
              <p className="text-xs text-slate-500">Xin chào,</p>
              <h2 className="text-xl font-700 text-slate-900">{user?.fullName || 'Khách hàng Hoàng Anh'} 👋</h2>
            </div>

            {/* Track bar */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
              <p className="text-sm font-500 mb-3 opacity-90">Tra cứu nhanh lộ trình đơn hàng</p>
              <div className="flex gap-2">
                <input type="text" value={trackInput} onChange={e => setTrackInput(e.target.value)}
                  placeholder="Nhập mã vận đơn (VD: VT...)"
                  className="flex-1 h-10 px-3 text-sm bg-white/20 border border-white/30 rounded-xl outline-none placeholder-white/60 text-white" />
                <button onClick={() => { setTab('tracking'); handleTrackSearch(); }}
                  className="h-10 px-4 rounded-xl bg-white text-blue-700 text-sm font-600">
                  Tra cứu
                </button>
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Tạo đơn mới', icon: Plus, color: 'text-blue-600', bg: 'bg-blue-50', action: () => setTab('create') },
                { label: 'Tra cứu vận đơn', icon: MapPin, color: 'text-violet-600', bg: 'bg-violet-50', action: () => setTab('tracking') },
                { label: 'Danh sách đơn', icon: Package, color: 'text-green-600', bg: 'bg-green-50', action: () => setTab('orders') },
              ].map(({ label, icon: Icon, color, bg, action }) => (
                <button key={label} onClick={action}
                  className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex flex-col items-center gap-2 hover:shadow-md transition-shadow">
                  <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                    <Icon size={18} className={color} />
                  </div>
                  <span className="text-xs font-500 text-slate-700">{label}</span>
                </button>
              ))}
            </div>

            {/* Recent orders */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-700 text-slate-900">Đơn hàng mới tạo</h3>
                <button onClick={() => setTab('orders')} className="text-xs text-blue-600 font-500">Xem tất cả</button>
              </div>
              <div className="space-y-3">
                {customerOrders.slice(0, 3).map((order) => (
                  <div key={order.id || order.trackingNumber} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-xs font-700 text-blue-600">{order.trackingNumber || `DH${order.id}`}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Người nhận: {order.receiverName}</p>
                      </div>
                      <StatusBadge status={mapBackendStatusToUI(order.status)} type="order" />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Phí: {(order.totalFee || order.shippingFee || 0).toLocaleString()}đ</span>
                      <button onClick={() => navigate(`/orders/${order.trackingNumber}`)} className="text-blue-600 font-500">
                        Chi tiết
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-700 text-slate-900">Đơn hàng của tôi</h2>
              <button onClick={() => setTab('create')}
                className="flex items-center gap-2 h-9 px-4 rounded-lg bg-blue-600 text-sm text-white font-500">
                <Plus size={14} /> Tạo đơn mới
              </button>
            </div>
            <div className="space-y-3">
              {customerOrders.map(order => (
                <div key={order.id || order.trackingNumber} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-700 text-blue-600">{order.trackingNumber}</p>
                      <p className="text-xs text-slate-400 mt-0.5">ID: #{order.id}</p>
                    </div>
                    <StatusBadge status={mapBackendStatusToUI(order.status)} type="order" />
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5"><Package size={11} className="text-slate-400" /> Gửi: {order.senderName} ({order.senderPhone})</div>
                    <div className="flex items-center gap-1.5"><MapPin size={11} className="text-slate-400" /> Nhận: {order.receiverName} ({order.receiverAddress})</div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-xs font-700 text-slate-900">Cước phí: {(order.totalFee || 0).toLocaleString()}đ</p>
                    <button onClick={() => navigate(`/orders/${order.trackingNumber}`)} className="h-7 px-3 rounded-lg border border-blue-200 text-xs text-blue-600 font-500 hover:bg-blue-50">
                      Xem hành trình
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'tracking' && (
          <div className="space-y-4">
            <h2 className="text-base font-700 text-slate-900">Tra cứu hành trình vận đơn</h2>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={trackInput} onChange={e => setTrackInput(e.target.value)}
                    placeholder="Nhập mã vận đơn public (VD: VT...)"
                    className="w-full h-10 pl-9 pr-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 placeholder-slate-400" />
                </div>
                <button onClick={handleTrackSearch} disabled={trackingLoading} className="h-10 px-4 rounded-xl bg-blue-600 text-sm text-white font-600">
                  {trackingLoading ? 'Đang tìm...' : 'Tra cứu'}
                </button>
              </div>
            </div>

            {trackedOrder && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="text-base font-700 text-blue-600">{trackedOrder.trackingNumber}</h3>
                    <p className="text-xs text-slate-500">Mã đơn: #{trackedOrder.orderId}</p>
                  </div>
                  <StatusBadge status={mapBackendStatusToUI(trackedOrder.status)} type="order" />
                </div>
                <div className="text-xs space-y-1 text-slate-600">
                  <p>• Người gửi: <span className="font-600">{trackedOrder.senderName}</span></p>
                  <p>• Người nhận: <span className="font-600">{trackedOrder.receiverName}</span></p>
                  {trackedOrder.shipperName && <p>• Shipper: <span className="font-600">{trackedOrder.shipperName} ({trackedOrder.shipperPhone})</span></p>}
                </div>
                {trackedOrder.histories && trackedOrder.histories.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <p className="text-xs font-700 text-slate-700">Lịch sử trạng thái:</p>
                    {trackedOrder.histories.map((h: any, i: number) => (
                      <div key={i} className="text-xs border-l-2 border-blue-500 pl-3 py-1">
                        <p className="font-600 text-slate-800">{h.status}</p>
                        <p className="text-slate-500">{h.note}</p>
                        <p className="text-[10px] text-slate-400">{h.createdAt || h.timestamp}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 max-w-3xl mx-auto z-20">
        <div className="flex justify-around">
          {[
            { id: 'home', icon: Package, label: 'Trang chủ' },
            { id: 'create', icon: Plus, label: 'Tạo đơn' },
            { id: 'orders', icon: Clock, label: 'Đơn hàng' },
            { id: 'tracking', icon: MapPin, label: 'Tracking' },
          ].map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setTab(id as any)}
              className={`flex flex-col items-center gap-1 ${tab === id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <Icon size={20} />
              <span className="text-[10px] font-500">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
