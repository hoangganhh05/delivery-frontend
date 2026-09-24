import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, ChevronLeft, ChevronRight, Eye, X, XCircle, RefreshCw } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { LoadingState } from '../components/Skeleton';
import { mapBackendStatusToUI } from '../utils/status';
import { useApp } from '../context/AppContext';
import { cancelOrderApi, searchOrdersApi } from '../api/deliveryApi';

const statusOptions = [
  { label: 'Tất cả', value: '' },
  { label: 'Chờ xử lý', value: 'CREATED' },
  { label: 'Đã xác nhận', value: 'ASSIGNED' },
  { label: 'Đang lấy hàng', value: 'PICKED_UP' },
  { label: 'Đang giao', value: 'IN_TRANSIT' },
  { label: 'Đã giao', value: 'DELIVERED' },
  { label: 'Chưa giao được', value: 'FAILED' },
  { label: 'Đã hủy', value: 'CANCELLED' },
];

const ORDER_FILTERS_STORAGE_KEY = 'giaotin.orders.filters.v1';
const AUTO_REFRESH_INTERVAL_MS = 60_000;

type SavedOrderFilters = {
  search?: string;
  status?: string;
};

function getSavedOrderFilters(): SavedOrderFilters {
  try {
    const raw = window.localStorage.getItem(ORDER_FILTERS_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as SavedOrderFilters;
    return {
      search: typeof parsed.search === 'string' ? parsed.search : '',
      status: statusOptions.some((option) => option.value === parsed.status) ? parsed.status : '',
    };
  } catch {
    return {};
  }
}

export default function Orders() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { openConfirm, addToast } = useApp();
  const queryKeyword = searchParams.get('keyword') || '';
  const savedFilters = useRef(getSavedOrderFilters()).current;
  const initialQueryKeyword = useRef(queryKeyword).current;
  const initialSearch = queryKeyword || savedFilters.search || '';
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch.trim());
  const [statusFilter, setStatusFilter] = useState(savedFilters.status || '');
  const [selected, setSelected] = useState<string[]>([]);
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const requestIdRef = useRef(0);
  const fetchingRef = useRef(false);

  const fetchOrders = useCallback(async ({ background = false }: { background?: boolean } = {}) => {
    if (background && fetchingRef.current) return;

    const requestId = ++requestIdRef.current;
    fetchingRef.current = true;
    try {
      if (!background) setLoading(true);
      const res = await searchOrdersApi({
        keyword: debouncedSearch || undefined,
        status: statusFilter || undefined,
        page,
        size: 10,
      });

      if (requestId !== requestIdRef.current) return;

      if (res && res.data) {
        setOrdersList(res.data.items || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalElements(res.data.totalElements || 0);
        setLastUpdated(new Date());
      }
    } catch (err: any) {
      if (requestId === requestIdRef.current && !background) {
        addToast({
          type: 'error',
          title: 'Lỗi tải danh sách đơn hàng',
          message: err.message || 'Không thể tải danh sách đơn hàng'
        });
      }
    } finally {
      if (requestId === requestIdRef.current) {
        fetchingRef.current = false;
        if (!background) setLoading(false);
      }
    }
  }, [addToast, debouncedSearch, page, statusFilter]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    try {
      window.localStorage.setItem(ORDER_FILTERS_STORAGE_KEY, JSON.stringify({
        search: search.trim(),
        status: statusFilter,
      } satisfies SavedOrderFilters));
    } catch {
      // Không chặn người dùng nếu trình duyệt không cho phép lưu cài đặt cục bộ.
    }
  }, [search, statusFilter]);

  useEffect(() => {
    if (queryKeyword === initialQueryKeyword) return;
    setSearch(queryKeyword);
    setDebouncedSearch(queryKeyword.trim());
    setPage(0);
  }, [initialQueryKeyword, queryKeyword]);

  useEffect(() => {
    setSelected((current) => current.filter((tracking) =>
      ordersList.some((order) => (order.trackingNumber || String(order.id)) === tracking),
    ));
  }, [ordersList]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        void fetchOrders({ background: true });
      }
    };

    const intervalId = window.setInterval(refreshWhenVisible, AUTO_REFRESH_INTERVAL_MS);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [fetchOrders]);

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatusFilter('');
    setPage(0);
  };

  const hasActiveFilters = Boolean(search.trim() || statusFilter);
  const isApplyingSearch = search.trim() !== debouncedSearch;

  const handleCancel = (trackingNumber: string) => {
    openConfirm({
      title: 'Hủy đơn hàng',
      message: `Bạn có chắc chắn muốn hủy đơn hàng ${trackingNumber}? Hành động này không thể hoàn tác.`,
      confirmLabel: 'Hủy đơn',
      danger: true,
      onConfirm: async () => {
        try {
          await cancelOrderApi(trackingNumber);
          addToast({ type: 'success', title: 'Đã hủy đơn', message: `Đơn hàng ${trackingNumber} đã được hủy.` });
          await fetchOrders();
        } catch (err: any) {
          addToast({ type: 'error', title: 'Không thể hủy đơn', message: err.message || 'Yêu cầu hủy đơn chưa được chấp nhận' });
        }
      },
    });
  };

  const toggleSelect = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(selected.length === ordersList.length ? [] : ordersList.map(o => o.trackingNumber || String(o.id)));

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-700 text-slate-900">Quản lý Đơn hàng</h2>
          <p className="text-xs text-slate-500 mt-0.5">{totalElements} đơn hàng</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="hidden lg:inline text-[11px] text-slate-400" title={lastUpdated ? `Cập nhật lúc ${lastUpdated.toLocaleTimeString('vi-VN')}` : undefined}>
            {lastUpdated ? `Cập nhật ${lastUpdated.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : 'Chưa có dữ liệu'}
          </span>
          <button onClick={() => void fetchOrders()} className="flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Tải lại
          </button>
          <button
            onClick={() => navigate('/customer')}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-blue-600 text-sm text-white font-500 hover:bg-blue-700"
          >
            <Plus size={14} /> Tạo đơn hàng mới
          </button>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-0 sm:min-w-[240px] w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm mã vận đơn, tên/sđt người gửi, người nhận..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="w-full h-9 pl-9 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:bg-white placeholder-slate-400 text-slate-700"
            />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="h-9 px-3 rounded-lg text-xs font-500 text-slate-600 hover:bg-slate-100"
            >
              Xóa bộ lọc
            </button>
          )}

          {/* Status quick filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1">
            {statusOptions.map(s => (
              <button
                key={s.value}
                onClick={() => { setStatusFilter(s.value); setPage(0); }}
                className={`h-8 px-3 rounded-lg text-xs font-500 transition-colors
                  ${statusFilter === s.value ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 text-[11px] text-slate-400" aria-live="polite">
          {isApplyingSearch
            ? 'Đang áp dụng từ khóa tìm kiếm...'
            : 'Từ khóa và trạng thái lọc được ghi nhớ trên thiết bị này. Danh sách tự cập nhật khi trang đang mở.'}
        </p>
      </div>

      {/* Selected actions */}
      {selected.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3">
          <span className="text-sm text-blue-700 font-500">Đã chọn {selected.length} đơn</span>
          <button onClick={() => navigate('/dispatch')} className="h-8 px-3 rounded-lg bg-blue-600 text-white text-xs font-500 hover:bg-blue-700">Phân công người giao</button>
          <button onClick={() => setSelected([])} className="ml-auto text-blue-500 hover:text-blue-700">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="w-12 py-3 pl-4">
                <input type="checkbox" checked={selected.length === ordersList.length && ordersList.length > 0}
                  onChange={toggleAll} className="w-4 h-4 rounded border-slate-300 accent-blue-600" />
              </th>
              {['Mã vận đơn', 'Người gửi', 'Người nhận', 'Cước phí', 'Thu hộ COD', 'Trạng thái', 'Thao tác'].map(h => (
                <th key={h} className="text-left text-xs font-600 text-slate-500 py-3 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8}><LoadingState label="Đang tải đơn hàng..." /></td>
              </tr>
            ) : ordersList.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <div className="text-slate-300 mb-2 flex justify-center">
                    <Search size={40} strokeWidth={1} />
                  </div>
                  <p className="text-sm font-500 text-slate-500">Không tìm thấy đơn hàng nào</p>
                  <p className="text-xs text-slate-400 mt-1">Thử thay đổi từ khóa hoặc bộ lọc trạng thái</p>
                </td>
              </tr>
            ) : ordersList.map((order) => {
              const tracking = order.trackingNumber || `VT${order.id}`;
              const isSel = selected.includes(tracking);
              return (
                <tr key={order.id || tracking} className={`border-b border-slate-50 hover:bg-slate-50 cursor-pointer ${isSel ? 'bg-blue-50' : ''}`}>
                  <td className="py-3 pl-4">
                    <input type="checkbox" checked={isSel} onChange={() => toggleSelect(tracking)}
                      onClick={e => e.stopPropagation()} className="w-4 h-4 rounded border-slate-300 accent-blue-600" />
                  </td>
                  <td className="py-3 pr-4" onClick={() => navigate(`/orders/${tracking}`)}>
                    <p className="text-xs font-700 text-blue-600">{tracking}</p>
                    <p className="text-[10px] text-slate-400">Mã đơn: #{order.id}</p>
                  </td>
                  <td className="py-3 pr-4" onClick={() => navigate(`/orders/${tracking}`)}>
                    <p className="text-xs font-500 text-slate-800">{order.senderName || 'Chưa cập nhật'}</p>
                    <p className="text-xs text-slate-400">{order.senderPhone}</p>
                  </td>
                  <td className="py-3 pr-4" onClick={() => navigate(`/orders/${tracking}`)}>
                    <p className="text-xs font-500 text-slate-800">{order.receiverName || 'Chưa cập nhật'}</p>
                    <p className="text-xs text-slate-400">{order.receiverPhone}</p>
                  </td>
                  <td className="py-3 pr-4 text-xs font-600 text-slate-800" onClick={() => navigate(`/orders/${tracking}`)}>
                    {(order.totalFee != null ? order.totalFee : order.shippingFee || 0).toLocaleString()}đ
                  </td>
                  <td className="py-3 pr-4 text-xs font-500 text-slate-700" onClick={() => navigate(`/orders/${tracking}`)}>
                    {order.codAmount ? `${order.codAmount.toLocaleString()}đ` : '0đ'}
                  </td>
                  <td className="py-3 pr-4" onClick={() => navigate(`/orders/${tracking}`)}>
                    <StatusBadge status={mapBackendStatusToUI(order.status)} type="order" />
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/orders/${tracking}`); }}
                        className="w-7 h-7 rounded-lg hover:bg-blue-50 hover:text-blue-600 text-slate-400 flex items-center justify-center" title="Xem chi tiết">
                        <Eye size={14} />
                      </button>
                      {['CREATED', 'PENDING'].includes((order.status || '').toUpperCase()) && (
                        <button onClick={(e) => { e.stopPropagation(); handleCancel(tracking); }}
                          className="w-7 h-7 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center" title="Hủy đơn">
                          <XCircle size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Trang {page + 1} / {totalPages} (Tổng cộng {totalElements} đơn)
          </p>
          <div className="flex items-center gap-1">
            <button disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}
              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 disabled:opacity-40 hover:bg-slate-50">
              <ChevronLeft size={14} />
            </button>
            <span className="px-3 text-xs font-600 text-slate-700">{page + 1}</span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 disabled:opacity-40 hover:bg-slate-50">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
