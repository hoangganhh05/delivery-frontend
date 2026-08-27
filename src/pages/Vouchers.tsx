import { useState } from 'react';
import { Plus, Tag, Copy, X, Check } from 'lucide-react';
import { createVoucherApi } from '../api/deliveryApi';
import { useApp } from '../context/AppContext';

const sampleVouchers = [
  { id: '1', code: 'VIETTEL50', discount: 50, type: 'Percentage', minOrder: 100000, limit: 2000, status: 'Active' },
  { id: '2', code: 'FREESHIP', discount: 100, type: 'Percentage', minOrder: 50000, limit: 1000, status: 'Active' },
  { id: '3', code: 'VIETTEL20', discount: 20, type: 'Percentage', minOrder: 50000, limit: 5000, status: 'Active' },
];

export default function Vouchers() {
  const { addToast } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(20);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState(50000);
  const [minOrderAmount, setMinOrderAmount] = useState(100000);
  const [usageLimit, setUsageLimit] = useState(100);
  const [submitting, setSubmitting] = useState(false);

  const copyCode = (c: string) => {
    navigator.clipboard.writeText(c);
    setCopiedCode(c);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateVoucher = async () => {
    if (!code.trim()) {
      addToast({ type: 'error', title: 'Lỗi', message: 'Vui lòng nhập mã voucher' });
      return;
    }
    try {
      setSubmitting(true);
      const res = await createVoucherApi({
        code: code.trim().toUpperCase(),
        discountPercent: Number(discountPercent),
        maxDiscountAmount: Number(maxDiscountAmount),
        minOrderAmount: Number(minOrderAmount),
        usageLimit: Number(usageLimit),
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      });
      if (res) {
        addToast({ type: 'success', title: 'Tạo Voucher thành công!', message: `Mã: ${code.toUpperCase()}` });
        setShowModal(false);
        setCode('');
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Tạo thất bại', message: err.message || 'Không thể tạo voucher' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-700 text-slate-900">Quản lý Voucher Khuyến Mãi (Backend)</h2>
          <p className="text-xs text-slate-500 mt-0.5">Tạo và quản lý các mã giảm giá hệ thống Spring Boot</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 h-9 px-4 rounded-lg bg-blue-600 text-sm text-white font-500 hover:bg-blue-700">
          <Plus size={14} /> Tạo Voucher Mới
        </button>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {sampleVouchers.map((v) => (
          <div key={v.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 to-blue-400" />
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Tag size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-700 text-slate-900 font-mono tracking-wide">{v.code}</p>
                      <button onClick={() => copyCode(v.code)}
                        className="w-5 h-5 rounded flex items-center justify-center text-slate-300 hover:text-blue-500">
                        {copiedCode === v.code ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
                      </button>
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-600 bg-green-50 text-green-700">
                  Đang chạy
                </span>
              </div>

              <div className="mb-3">
                <p className="text-2xl font-700 text-blue-700">{v.discount}%</p>
                <p className="text-xs text-slate-400">Giảm phí giao hàng · Đơn tối thiểu {v.minOrder.toLocaleString()}đ</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-700 text-slate-900">Tạo Voucher Mới (Backend API)</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-600 text-slate-700 mb-1.5">Mã voucher</label>
                <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="VD: VIETTEL100"
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 bg-slate-50 uppercase font-mono" />
              </div>
              <div>
                <label className="block text-xs font-600 text-slate-700 mb-1.5">Phần trăm giảm (%)</label>
                <input type="number" value={discountPercent} onChange={e => setDiscountPercent(Number(e.target.value))}
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 bg-slate-50" />
              </div>
              <div>
                <label className="block text-xs font-600 text-slate-700 mb-1.5">Giảm tối đa (VNĐ)</label>
                <input type="number" value={maxDiscountAmount} onChange={e => setMaxDiscountAmount(Number(e.target.value))}
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 bg-slate-50" />
              </div>
              <div>
                <label className="block text-xs font-600 text-slate-700 mb-1.5">Đơn hàng tối thiểu (VNĐ)</label>
                <input type="number" value={minOrderAmount} onChange={e => setMinOrderAmount(Number(e.target.value))}
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 bg-slate-50" />
              </div>
              <div>
                <label className="block text-xs font-600 text-slate-700 mb-1.5">Lượt sử dụng tối đa</label>
                <input type="number" value={usageLimit} onChange={e => setUsageLimit(Number(e.target.value))}
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 bg-slate-50" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)}
                className="flex-1 h-10 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
                Hủy
              </button>
              <button onClick={handleCreateVoucher} disabled={submitting}
                className="flex-1 h-10 rounded-xl bg-blue-600 text-sm text-white font-500 hover:bg-blue-700 disabled:opacity-50">
                {submitting ? 'Đang tạo...' : 'Tạo Voucher'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
