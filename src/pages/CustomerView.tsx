import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, Search, ChevronRight, Plus, Clock, CheckCircle2, Truck, Copy, Home, User, LogOut, RefreshCw } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { mapBackendStatusToUI } from '../utils/status';
import { createOrderApi, calculateVoucherApi, searchOrdersApi, trackOrderApi } from '../api/deliveryApi';
import { useApp } from '../context/AppContext';
import AccountSettings from '../components/AccountSettings';

const createSteps = ['Người gửi', 'Người nhận', 'Kiện hàng', 'Dịch vụ', 'Voucher', 'Thanh toán', 'Xác nhận'];
type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export default function CustomerView() {
  const navigate = useNavigate();
  const { user, addToast, logout } = useApp();
  const [tab, setTab] = useState<'home' | 'orders' | 'create' | 'tracking' | 'profile'>('home');
  const [createStep, setCreateStep] = useState<Step>(0);
  const [trackInput, setTrackInput] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');

  // Form State
  const [senderName, setSenderName] = useState(user?.fullName || '');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderAddress, setSenderAddress] = useState('');

  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');

  const [itemName, setItemName] = useState('');
  const [weightGram, setWeightGram] = useState(500);
  const [declaredValue, setDeclaredValue] = useState(250000);
  const [codAmount, setCodAmount] = useState(0);

  const [selectedService, setSelectedService] = useState({ name: 'Tiêu chuẩn', fee: 30000 });
  const [voucherCode, setVoucherCode] = useState('');
  const [discountFee, setDiscountFee] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('VCB_QR');

  const [createdOrderRes, setCreatedOrderRes] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [qrPayment, setQrPayment] = useState<{ amount: number; content: string; imageUrl: string } | null>(null);

  const fetchCustomerOrders = async () => {
    try {
      setOrdersLoading(true);
      setOrdersError('');
      const res = await searchOrdersApi({ page: 0, size: 10 });
      if (res && res.data && res.data.items) {
        setCustomerOrders(res.data.items);
      }
    } catch (err: any) {
      console.error(err);
      setOrdersError(err.message || 'Không thể tải danh sách đơn hàng');
    } finally {
      setOrdersLoading(false);
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
        setDiscountFee(Number(res.data.discountAmount));
        setVoucherCode(code.trim().toUpperCase());
        addToast({ type: 'success', title: 'Áp dụng Voucher', message: `Giảm ${Number(res.data.discountAmount).toLocaleString()}đ cước phí` });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi Voucher', message: err.message || 'Voucher không hợp lệ' });
    }
  };

  const validateCreateStep = (step: Step) => {
    let message = '';
    if (step === 0 && (!senderName.trim() || !senderPhone.trim() || !senderAddress.trim())) {
      message = 'Vui lòng nhập đầy đủ tên, số điện thoại và địa chỉ người gửi.';
    } else if (step === 1 && (!receiverName.trim() || !receiverPhone.trim() || !receiverAddress.trim())) {
      message = 'Vui lòng nhập đầy đủ tên, số điện thoại và địa chỉ người nhận.';
    } else if (step === 2 && (!itemName.trim() || weightGram <= 0 || declaredValue <= 0)) {
      message = 'Tên hàng, trọng lượng và giá trị khai báo phải hợp lệ.';
    }

    if (message) {
      addToast({ type: 'warning', title: 'Thiếu thông tin', message });
      return false;
    }
    return true;
  };

  const goToNextCreateStep = () => {
    if (validateCreateStep(createStep)) {
      setCreateStep((createStep + 1) as Step);
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

        if (paymentMethod === 'VCB_QR') {
          const amount = Math.max(0, Number(res.data.totalFee ?? selectedService.fee - discountFee));
          const content = `DH ${res.data.trackingNumber}`;
          const query = new URLSearchParams({
            amount: String(Math.round(amount)),
            addInfo: content,
            accountName: 'CAO HOANG ANH',
          });
          setQrPayment({
            amount,
            content,
            imageUrl: `https://img.vietqr.io/image/970436-1070980445-compact2.png?${query.toString()}`,
          });
        } else {
          setQrPayment(null);
        }
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Tạo đơn thất bại', message: err.message || 'Không thể tạo đơn hàng' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrackSearch = async (trackingNumber = trackInput) => {
    if (!trackingNumber.trim()) return;
    try {
      setTrackingLoading(true);
      setTrackedOrder(null);
      const normalizedTrackingNumber = trackingNumber.trim();
      setTrackInput(normalizedTrackingNumber);
      const res = await trackOrderApi(normalizedTrackingNumber);
      if (res && res.data) {
        setTrackedOrder(res.data);
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Tra cứu thất bại', message: err.message || 'Không tìm thấy thông tin vận đơn' });
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const openOrderTracking = (trackingNumber?: string) => {
    if (!trackingNumber) return;
    setTab('tracking');
    handleTrackSearch(trackingNumber);
  };

  const deliveredOrders = customerOrders.filter(order => (order.status || '').toUpperCase() === 'DELIVERED').length;
  const activeOrders = customerOrders.length - deliveredOrders;
  const customerTabs = [
    { id: 'home', icon: Home, label: 'Trang chủ' },
    { id: 'create', icon: Plus, label: 'Tạo đơn' },
    { id: 'orders', icon: Clock, label: 'Đơn hàng' },
    { id: 'tracking', icon: MapPin, label: 'Tra cứu' },
    { id: 'profile', icon: User, label: 'Tài khoản' },
  ] as const;

  if (tab === 'create') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-100 px-4 sm:px-6 py-4 flex items-center gap-3">
          <button onClick={() => { setTab('home'); setCreateStep(0); }}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
            <ArrowLeft size={15} />
          </button>
          <h2 className="text-base font-700 text-slate-900 flex-1">Tạo đơn hàng trực tuyến</h2>
          <button onClick={handleLogout} className="h-9 px-3 rounded-xl border border-red-200 text-red-600 text-xs font-600 flex items-center gap-1.5 hover:bg-red-50">
            <LogOut size={14} /> <span className="hidden sm:inline">Đăng xuất</span>
          </button>
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

        <div className="max-w-4xl mx-auto p-4 sm:p-6">
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
                  <input type="tel" inputMode="tel" value={senderPhone} onChange={e => setSenderPhone(e.target.value)}
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
                  <input type="tel" inputMode="tel" value={receiverPhone} onChange={e => setReceiverPhone(e.target.value)}
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
                  <input type="number" min="1" value={weightGram} onChange={e => setWeightGram(Number(e.target.value))}
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-600 text-slate-700 mb-1">Giá trị hàng (khai giá - VNĐ)</label>
                  <input type="number" min="1" value={declaredValue} onChange={e => { setDeclaredValue(Number(e.target.value)); setDiscountFee(0); }}
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-600 text-slate-700 mb-1">Tiền thu hộ COD (VNĐ)</label>
                  <input type="number" min="0" value={codAmount} onChange={e => setCodAmount(Number(e.target.value))}
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
                  <label key={srv.id} onClick={() => { setSelectedService(srv); setDiscountFee(0); }} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer ${selectedService.name === srv.name ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}>
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
                    <input type="text" value={voucherCode} onChange={e => { setVoucherCode(e.target.value); setDiscountFee(0); }}
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
                  <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer ${paymentMethod === 'VCB_QR' ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}>
                    <input type="radio" name="pay" checked={paymentMethod === 'VCB_QR'} onChange={() => setPaymentMethod('VCB_QR')} className="accent-blue-600" />
                    <div>
                      <p className="text-sm font-600 text-slate-900">Chuyển khoản QR Vietcombank</p>
                      <p className="text-xs text-slate-400">Quét QR để tự điền số tiền và nội dung đơn hàng</p>
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

                {qrPayment && (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-3">
                    <p className="text-sm text-emerald-900 font-700">Quét QR Vietcombank để thanh toán</p>
                    <img src={qrPayment.imageUrl} alt="Mã QR thanh toán Vietcombank" className="w-52 max-w-full mx-auto rounded-lg bg-white p-2" />
                    <div className="text-xs text-emerald-900 space-y-1">
                      <p>Số tiền: <span className="font-700">{qrPayment.amount.toLocaleString('vi-VN')}đ</span></p>
                      <p>Nội dung: <span className="font-700">{qrPayment.content}</span></p>
                    </div>
                    <button onClick={() => navigator.clipboard.writeText(qrPayment.content).then(() => addToast({ type: 'success', title: 'Đã sao chép', message: 'Đã sao chép nội dung chuyển khoản' }))}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-300 text-emerald-800 text-xs font-600 hover:bg-emerald-100">
                      <Copy size={14} /> Sao chép nội dung
                    </button>
                    <p className="text-xs text-emerald-700">Đơn sẽ được xác nhận sau khi hệ thống kiểm tra giao dịch.</p>
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
                  <button onClick={goToNextCreateStep}
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
    <div className="min-h-dvh bg-slate-50 pb-24 lg:pb-10">
      {/* Customer header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-100 px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm shadow-blue-200">
              <Truck size={14} className="text-white" />
            </div>
            <div>
              <span className="font-700 text-sm text-slate-900 block leading-tight">DeliveryMS</span>
              <span className="text-[10px] text-slate-400">Cổng khách hàng</span>
            </div>
          </div>
          <nav className="hidden lg:flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            {customerTabs.map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setTab(id)} className={`h-9 px-3 rounded-lg text-xs font-600 flex items-center gap-1.5 transition-colors ${tab === id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </nav>
          <button onClick={handleLogout} className="h-9 px-3 rounded-xl border border-red-200 text-red-600 text-xs font-600 flex items-center gap-1.5 hover:bg-red-50">
            <LogOut size={14} /> <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-5">
        {/* Welcome */}
        {tab === 'home' && (
          <>
            <div>
              <p className="text-xs text-slate-500">Xin chào,</p>
              <h2 className="text-xl font-700 text-slate-900">{user?.fullName || 'Khách hàng Hoàng Anh'} 👋</h2>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { label: 'Tổng đơn', value: customerOrders.length, tone: 'text-blue-700 bg-blue-50' },
                { label: 'Đang xử lý', value: activeOrders, tone: 'text-amber-700 bg-amber-50' },
                { label: 'Đã giao', value: deliveredOrders, tone: 'text-emerald-700 bg-emerald-50' },
              ].map(item => (
                <div key={item.label} className={`${item.tone} rounded-xl p-3 sm:p-4`}>
                  <p className="text-lg sm:text-2xl font-700">{ordersLoading ? '–' : item.value}</p>
                  <p className="text-[10px] sm:text-xs opacity-80">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Track bar */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
              <p className="text-sm font-500 mb-3 opacity-90">Tra cứu nhanh lộ trình đơn hàng</p>
              <div className="flex gap-2">
                <input type="text" value={trackInput} onChange={e => setTrackInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { setTab('tracking'); handleTrackSearch(); } }}
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
                {ordersLoading ? (
                  <div className="bg-white rounded-xl border border-slate-100 py-10 text-center text-xs text-slate-400">
                    <RefreshCw size={18} className="animate-spin mx-auto mb-2" /> Đang tải đơn hàng...
                  </div>
                ) : ordersError ? (
                  <div className="bg-white rounded-xl border border-red-100 py-10 text-center">
                    <p className="text-sm text-red-600">{ordersError}</p>
                    <button onClick={fetchCustomerOrders} className="text-xs text-blue-600 font-600 mt-2">Thử lại</button>
                  </div>
                ) : customerOrders.length === 0 ? (
                  <div className="bg-white rounded-xl border border-dashed border-slate-200 py-10 text-center">
                    <Package size={24} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-600 text-slate-600">Bạn chưa có đơn hàng</p>
                    <button onClick={() => setTab('create')} className="text-xs text-blue-600 font-600 mt-2">Tạo đơn đầu tiên</button>
                  </div>
                ) : customerOrders.slice(0, 3).map((order) => (
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
                      <button onClick={() => openOrderTracking(order.trackingNumber)} className="text-blue-600 font-500">
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
              {ordersLoading ? (
                <div className="py-12 text-center text-xs text-slate-400">Đang tải danh sách đơn hàng...</div>
              ) : ordersError ? (
                <div className="bg-white rounded-xl border border-red-100 py-12 text-center text-sm text-red-600">{ordersError}</div>
              ) : customerOrders.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500">Chưa có đơn hàng nào.</div>
              ) : customerOrders.map(order => (
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
                    <button onClick={() => openOrderTracking(order.trackingNumber)} className="h-7 px-3 rounded-lg border border-blue-200 text-xs text-blue-600 font-500 hover:bg-blue-50">
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
                  <input type="text" value={trackInput} onChange={e => setTrackInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleTrackSearch(); }}
                    placeholder="Nhập mã vận đơn (VD: VT...)"
                    className="w-full h-10 pl-9 pr-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 placeholder-slate-400" />
                </div>
                <button onClick={() => handleTrackSearch()} disabled={trackingLoading} className="h-10 px-4 rounded-xl bg-blue-600 text-sm text-white font-600">
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
                  <StatusBadge status={mapBackendStatusToUI(trackedOrder.currentStatus)} type="order" />
                </div>
                <div className="text-xs space-y-1 text-slate-600">
                  <p>• Người gửi: <span className="font-600">{trackedOrder.senderName}</span></p>
                  <p>• Người nhận: <span className="font-600">{trackedOrder.receiverName}</span></p>
                  {trackedOrder.shipperName && <p>• Shipper: <span className="font-600">{trackedOrder.shipperName}</span></p>}
                </div>
                {trackedOrder.history && trackedOrder.history.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <p className="text-xs font-700 text-slate-700">Lịch sử trạng thái:</p>
                    {trackedOrder.history.map((h: any, i: number) => (
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

        {tab === 'profile' && (
          <div className="w-full">
            <AccountSettings embedded />
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="fixed lg:hidden bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] z-20">
        <div className="flex justify-around">
          {customerTabs.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`min-w-14 min-h-11 flex flex-col items-center justify-center gap-0.5 ${tab === id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <Icon size={20} />
              <span className="text-[10px] font-500">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
