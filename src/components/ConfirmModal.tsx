import { AlertTriangle, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ConfirmModal() {
  const { confirm, closeConfirm } = useApp();
  if (!confirm) return null;

  const handleConfirm = () => {
    confirm.onConfirm();
    closeConfirm();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeConfirm} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-in zoom-in-95 fade-in duration-150">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${confirm.danger ? 'bg-red-50' : 'bg-amber-50'}`}>
            <AlertTriangle size={18} className={confirm.danger ? 'text-red-500' : 'text-amber-500'} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-700 text-slate-900">{confirm.title}</h3>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">{confirm.message}</p>
          </div>
          <button onClick={closeConfirm} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
            <X size={14} />
          </button>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={closeConfirm}
            className="flex-1 h-10 rounded-xl border border-slate-200 text-sm font-500 text-slate-600 hover:bg-slate-50 transition-colors">
            Hủy bỏ
          </button>
          <button onClick={handleConfirm}
            className={`flex-1 h-10 rounded-xl text-sm font-600 text-white transition-colors
              ${confirm.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {confirm.confirmLabel ?? 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}
