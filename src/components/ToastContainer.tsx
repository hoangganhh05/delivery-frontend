import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const configs = {
  success: { icon: CheckCircle2, bg: 'bg-white', border: 'border-green-200', iconColor: 'text-green-500', bar: 'bg-green-500' },
  error:   { icon: XCircle,      bg: 'bg-white', border: 'border-red-200',   iconColor: 'text-red-500',   bar: 'bg-red-500'   },
  warning: { icon: AlertTriangle,bg: 'bg-white', border: 'border-amber-200', iconColor: 'text-amber-500', bar: 'bg-amber-500' },
  info:    { icon: Info,         bg: 'bg-white', border: 'border-blue-200',  iconColor: 'text-blue-500',  bar: 'bg-blue-500'  },
};

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => {
        const cfg = configs[toast.type];
        const Icon = cfg.icon;
        return (
          <div
            key={toast.id}
            className={`${cfg.bg} ${cfg.border} border rounded-xl shadow-xl flex items-start gap-3 p-4 min-w-72 max-w-sm pointer-events-auto
              animate-in slide-in-from-right-4 fade-in duration-200`}
          >
            <div className={`w-5 h-5 flex-shrink-0 mt-0.5 ${cfg.iconColor}`}>
              <Icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-600 text-slate-900">{toast.title}</p>
              {toast.message && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{toast.message}</p>}
            </div>
            <button onClick={() => removeToast(toast.id)}
              className="w-5 h-5 flex-shrink-0 text-slate-300 hover:text-slate-500 flex items-center justify-center">
              <X size={14} />
            </button>
            {/* Progress bar */}
            <div className={`absolute bottom-0 left-0 h-0.5 ${cfg.bar} rounded-b-xl animate-shrink`} style={{ width: '100%' }} />
          </div>
        );
      })}
    </div>
  );
}
