import { useEffect, useState } from 'react';
import { Plus, Tag, Copy, X, Check, RefreshCw } from 'lucide-react';
import { createVoucherApi, getVouchersApi } from '../api/deliveryApi';
import { useApp } from '../context/AppContext';

export default function Vouchers() {
  const { addToast } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(20);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState(50000);
  const [minOrderAmount, setMinOrderAmount] = useState(100000);
  const [usageLimit, setUsageLimit] = useState(100);
  const [submitting, setSubmitting] = useState(false);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await getVouchersApi();
      setVouchers(Array.isArray(res?.data) ? res.data : []);
    } catch (err: any) {
      addToast({ type: 'error', title: 'Không thể tải voucher', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

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
        await fetchVouchers();
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Tạo thất bại', message: err.message || 'Không thể tạo voucher' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-700 text-slate-900">Quản lý voucher khuyến mãi</h2>
          <p className="text-xs text-slate-500 mt-0.5">Tạo và quản lý các mã ưu đãi dành cho khách hàng</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={fetchVouchers} className="flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-600">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Tải lại
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 h-9 px-4 rounded-lg bg-blue-600 text-sm text-white font-500 hover:bg-blue-700">
            <Plus size={14} /> Tạo Voucher Mới
          </button>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {!loading && vouchers.length === 0 && (
          <div className="sm:col-span-2 xl:col-span-3 rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center text-sm text-slate-400">
            Chưa có voucher nào
          </div>
        )}
        {vouchers.map((v) => (
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
                  {v.usageLimit === 0 || (v.endDate && new Date(v.endDate) < new Date()) ? 'Đã hết hạn' : 'Đang áp dụng'}
                </span>
              </div>

              <div className="mb-3">
                <p className="text-2xl font-700 text-blue-700">{v.discountPercent}%</p>
                <p className="text-xs text-slate-400">Giảm phí giao hàng · Đơn tối thiểu {Number(v.minOrderAmount || 0).toLocaleString()}đ</p>
                <p className="text-[11px] text-slate-400 mt-1">Còn {v.usageLimit ?? 'không giới hạn'} lượt</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-700 text-slate-900">Tạo voucher mới</h3>
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
