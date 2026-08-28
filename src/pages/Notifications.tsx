import { useState, useEffect } from 'react';
import { Bell, Package, CheckCheck, Circle, RefreshCw } from 'lucide-react';
import { getNotificationsApi, markNotificationAsReadApi, markAllNotificationsAsReadApi } from '../api/deliveryApi';
import { useApp } from '../context/AppContext';

export default function Notifications() {
  const { addToast } = useApp();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const res = await getNotificationsApi();
      if (res && res.data) {
        setNotifs(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsReadApi();
      addToast({ type: 'success', title: 'Thành công', message: 'Đã đánh dấu tất cả thông báo là đã đọc' });
      fetchNotifs();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi', message: err.message || 'Không thể đánh dấu đã đọc' });
    }
  };

  const handleMarkRead = async (id: number | string) => {
    try {
      await markNotificationAsReadApi(id);
      fetchNotifs();
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifs.filter(n => !n.isRead && !n.read).length;

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-700 text-slate-900">Thông báo</h2>
          {unreadCount > 0 && (
            <span className="w-6 h-6 bg-red-500 text-white text-xs font-700 rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchNotifs} className="flex items-center gap-2 h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-50">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Tải lại
          </button>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="flex items-center gap-2 h-8 px-3 rounded-lg text-sm text-blue-600 hover:bg-blue-50 font-500">
              <CheckCheck size={14} /> Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>
      </div>

      {/* Notification list */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm divide-y divide-slate-50">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Đang tải thông báo...</div>
        ) : notifs.length === 0 ? (
          <div className="py-16 text-center">
            <Bell size={40} className="text-slate-200 mx-auto mb-3" strokeWidth={1} />
            <p className="text-sm font-500 text-slate-500">Bạn chưa có thông báo nào</p>
          </div>
        ) : notifs.map((notif) => {
          const isRead = notif.isRead || notif.read;
          return (
            <div
              key={notif.id}
              onClick={() => !isRead && handleMarkRead(notif.id)}
              className={`flex gap-4 p-4 cursor-pointer hover:bg-slate-50 transition-colors ${!isRead ? 'bg-blue-50/30' : ''}`}
            >
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Package size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-600 ${!isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                    {notif.title || 'Thông báo mới'}
                  </p>
                  <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">{notif.createdAt || notif.time || ''}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{notif.message || notif.content}</p>
              </div>
              {!isRead && (
                <div className="flex items-center flex-shrink-0">
                  <Circle size={8} className="text-blue-500 fill-blue-500" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
