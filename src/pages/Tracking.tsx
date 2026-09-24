import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Package, Truck, MapPin, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { trackOrderApi } from '../api/deliveryApi';
import { getOrderStatusLabel } from '../utils/status';

const RECENT_TRACKING_STORAGE_KEY = 'giaotin.tracking.recent.v1';
const TRACKING_REFRESH_INTERVAL_MS = 60_000;

function getRecentTrackingNumbers(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_TRACKING_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string').slice(0, 5)
      : [];
  } catch {
    return [];
  }
}

export default function Tracking() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [activeTrackingNumber, setActiveTrackingNumber] = useState('');
  const [recentTrackingNumbers, setRecentTrackingNumbers] = useState<string[]>(getRecentTrackingNumbers);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const requestIdRef = useRef(0);

  const track = useCallback(async (trackingNumber: string, background = false) => {
    const normalizedTrackingNumber = trackingNumber.trim();
    if (!normalizedTrackingNumber) return;

    const requestId = ++requestIdRef.current;
    try {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
        setRefreshing(false);
        setNotFound(false);
      }

      const res = await trackOrderApi(normalizedTrackingNumber);
      if (requestId !== requestIdRef.current) return;

      if (res && res.data) {
        setResult(res.data);
        setInput(res.data.trackingNumber || normalizedTrackingNumber);
        setActiveTrackingNumber(res.data.trackingNumber || normalizedTrackingNumber);
        setNotFound(false);
        setLastUpdated(new Date());
        setRecentTrackingNumbers((current) => [
          normalizedTrackingNumber,
          ...current.filter((item) => item.toLowerCase() !== normalizedTrackingNumber.toLowerCase()),
        ].slice(0, 5));
      } else {
        if (!background) {
          setResult(null);
          setActiveTrackingNumber('');
          setNotFound(true);
        }
      }
    } catch (err) {
      if (requestId === requestIdRef.current && !background) {
        setResult(null);
        setActiveTrackingNumber('');
        setNotFound(true);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        if (background) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    }
  }, []);

  const handleTrack = () => {
    void track(input);
  };

  useEffect(() => {
    try {
      window.localStorage.setItem(RECENT_TRACKING_STORAGE_KEY, JSON.stringify(recentTrackingNumbers));
    } catch {
      // Không chặn tra cứu nếu trình duyệt không cho phép lưu danh sách gần đây.
    }
  }, [recentTrackingNumbers]);

  useEffect(() => {
    if (!activeTrackingNumber) return;

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        void track(activeTrackingNumber, true);
      }
    };

    const intervalId = window.setInterval(refreshWhenVisible, TRACKING_REFRESH_INTERVAL_MS);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [activeTrackingNumber, track]);

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-3">
          <MapPin size={20} className="text-white" />
        </div>
        <h2 className="text-xl font-700 text-slate-900">Tra cứu vận đơn</h2>
        <p className="text-sm text-slate-500 mt-1">Nhập mã vận đơn để xem trạng thái và hành trình giao hàng</p>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <label className="block text-xs font-600 text-slate-700 mb-2">Mã vận đơn</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleTrack()}
              placeholder="VD: VT12345678, VT..."
              className="w-full h-11 pl-10 pr-4 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white placeholder-slate-400 font-mono"
            />
          </div>
          <button
            onClick={handleTrack}
            disabled={loading || !input.trim()}
            className="h-11 px-6 rounded-xl bg-blue-600 text-sm text-white font-600 hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Search size={14} />
            {loading ? 'Đang tra cứu...' : 'Tra cứu'}
          </button>
        </div>
        {recentTrackingNumbers.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400">Tra cứu gần đây:</span>
            {recentTrackingNumbers.map((trackingNumber) => (
              <button
                key={trackingNumber}
                type="button"
                onClick={() => {
                  setInput(trackingNumber);
                  void track(trackingNumber);
                }}
                className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-600 hover:bg-blue-50 hover:text-blue-700"
              >
                {trackingNumber}
              </button>
            ))}
          </div>
        )}
      </div>

      {notFound && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
          <AlertCircle size={32} className="text-red-400 mx-auto mb-2" />
          <p className="text-sm font-600 text-red-700">Không tìm thấy mã vận đơn</p>
          <p className="text-xs text-red-500 mt-1">Không tìm thấy mã vận đơn "{input}"</p>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Current status */}
          <div className="rounded-2xl border p-5 bg-blue-50 border-blue-200">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
                  <Truck size={22} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-500">Mã vận đơn: {result.trackingNumber}</p>
                  <p className="text-base font-700 text-blue-700">{getOrderStatusLabel(result.currentStatus)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Mã đơn hàng</p>
                <p className="text-sm font-700 text-slate-800">#{result.orderId}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-blue-200 pt-3">
              <p className="text-[11px] text-slate-500" aria-live="polite">
                {lastUpdated
                  ? `Cập nhật lúc ${lastUpdated.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}. Tự cập nhật mỗi phút khi trang đang mở.`
                  : 'Tự cập nhật mỗi phút khi trang đang mở.'}
              </p>
              <button
                type="button"
                onClick={() => void track(activeTrackingNumber || result.trackingNumber, true)}
                disabled={refreshing || loading}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 text-xs font-600 text-blue-700 hover:bg-blue-100 disabled:opacity-60"
              >
                <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'Đang cập nhật' : 'Cập nhật'}
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <p className="text-xs font-600 text-slate-500 uppercase tracking-wide mb-2">Thông tin giao hàng</p>
              <div className="space-y-1.5 text-xs text-slate-700">
                <p>• Từ: <span className="font-600">{result.senderName}</span></p>
                <p>• Đến: <span className="font-600">{result.receiverName}</span></p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <p className="text-xs font-600 text-slate-500 uppercase tracking-wide mb-2">Người giao hàng</p>
              <div className="space-y-1 text-xs text-slate-700">
                <p className="font-600">{result.shipperName || 'Chưa phân công'}</p>
                <p className="text-slate-500">{result.shipperPhone || ''}</p>
              </div>
            </div>
          </div>

          {/* Histories */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-600 text-slate-900 mb-4">Nhật ký trạng thái vận chuyển</h3>
            {result.history && result.history.length > 0 ? (
              <div className="space-y-4 border-l-2 border-blue-500 pl-4">
                {result.history.map((item: any, idx: number) => (
                  <div key={idx} className="space-y-0.5">
                    <p className="text-xs font-700 text-slate-900">{getOrderStatusLabel(item.status)}</p>
                    <p className="text-xs text-slate-600">{item.note || 'Cập nhật lộ trình'}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock size={10} /> {item.createdAt || item.timestamp}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Chưa có nhật ký di chuyển</p>
            )}
          </div>
        </div>
      )}

      {!result && !notFound && (
        <div className="text-center py-12">
          <Package size={48} className="text-slate-200 mx-auto mb-3" strokeWidth={1} />
          <p className="text-sm text-slate-400">Nhập mã vận đơn để bắt đầu tra cứu</p>
        </div>
      )}
    </div>
  );
}
