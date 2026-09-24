import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, DollarSign, Package, TrendingUp, Truck } from "lucide-react";
import { exportOrdersReportApi, getOperationsReportApi, type OperationsReport } from "../api/deliveryApi";
import { useApp } from "../context/AppContext";

const iso = (date: Date) => date.toISOString().slice(0, 10);
export default function Reports() {
  const { addToast } = useApp();
  const today = new Date(); const monthAgo = new Date(); monthAgo.setDate(today.getDate() - 29);
  const [from, setFrom] = useState(iso(monthAgo)); const [to, setTo] = useState(iso(today));
  const [report, setReport] = useState<OperationsReport | null>(null); const [loading, setLoading] = useState(false); const [exporting, setExporting] = useState(false);
  const load = async () => {
    if (from > to) { addToast({ type: "warning", title: "Khoảng ngày chưa hợp lệ", message: "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc." }); return; }
    try { setLoading(true); setReport((await getOperationsReportApi({ from, to })).data); }
    catch (error: any) { addToast({ type: "error", title: "Không thể tải báo cáo", message: error.message }); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const download = async () => { if (from > to) { addToast({ type: "warning", title: "Khoảng ngày chưa hợp lệ", message: "Hãy chọn lại khoảng thời gian trước khi xuất." }); return; }
    try { setExporting(true); const source = await exportOrdersReportApi({ from, to }); const csv = await source.text(); const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `bao-cao-${from}-${to}.csv`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
      addToast({ type: "success", title: "Đã xuất báo cáo", message: "Tệp CSV dùng tốt với Microsoft Excel và Google Sheets." });
    } catch (error: any) { addToast({ type: "error", title: "Xuất báo cáo thất bại", message: error.message }); } finally { setExporting(false); } };
  const printReport = () => {
    const popup = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
    if (!popup) { addToast({ type: "warning", title: "Trình duyệt đã chặn cửa sổ in", message: "Hãy cho phép cửa sổ bật lên rồi thử lại." }); return; }
    const rows = [
      ["Tổng đơn hàng", stats.totalOrders.toLocaleString()], ["Giao thành công", stats.deliveredOrders.toLocaleString()],
      ["Đơn chưa giao được", stats.failedOrders.toLocaleString()], ["Doanh thu đã thu", `${Number(stats.revenue).toLocaleString("vi-VN")}đ`],
    ].map(([label, value]) => `<tr><th>${label}</th><td>${value}</td></tr>`).join("");
    popup.document.write(`<!doctype html><html lang="vi"><head><title>Báo cáo ${from} - ${to}</title><style>body{font-family:Arial,sans-serif;color:#172033;padding:32px}h1{margin:0 0 6px}p{color:#64748b}table{border-collapse:collapse;width:100%;margin-top:28px}th,td{border:1px solid #cbd5e1;padding:12px;text-align:left}th{background:#f1f5f9;width:55%}</style></head><body><h1>Báo cáo giao hàng</h1><p>Từ ${from} đến ${to}</p><table>${rows}</table><script>window.onload=()=>window.print();<\/script></body></html>`);
    popup.document.close();
  };
  const stats = report || { from, to, totalOrders: 0, deliveredOrders: 0, failedOrders: 0, revenue: 0, statusDistribution: {}, timeline: [] };
  const statusData = Object.entries(stats.statusDistribution).map(([status, orders]) => ({ status, orders }));
  return <div className="p-4 sm:p-6 space-y-6">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-3"><div><h2 className="text-lg font-700 text-slate-900">Báo cáo giao hàng</h2><p className="text-xs text-slate-500">Xem đơn hàng và doanh thu theo thời gian đã chọn</p></div>
      <div className="flex flex-wrap gap-2 items-end"><label className="text-xs text-slate-500">Từ ngày<input type="date" value={from} onChange={e => setFrom(e.target.value)} className="block h-9 border rounded-lg px-2 mt-1" /></label>
        <label className="text-xs text-slate-500">Đến ngày<input type="date" value={to} onChange={e => setTo(e.target.value)} className="block h-9 border rounded-lg px-2 mt-1" /></label>
        <button onClick={() => void load()} disabled={loading} className="h-9 px-4 rounded-lg bg-blue-600 text-white text-xs disabled:opacity-60">{loading ? "Đang tải..." : "Áp dụng"}</button>
        <button onClick={() => void download()} disabled={exporting} className="h-9 px-3 rounded-lg border bg-white text-xs flex items-center gap-1 disabled:opacity-60"><Download size={14} /> {exporting ? "Đang xuất..." : "Excel (CSV)"}</button>
        <button onClick={printReport} className="h-9 px-3 rounded-lg border bg-white text-xs">In / PDF</button></div></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">{[
      { label: "Tổng đơn hàng", value: stats.totalOrders.toLocaleString(), icon: Package },
      { label: "Đơn giao thành công", value: stats.deliveredOrders.toLocaleString(), icon: Truck },
      { label: "Doanh thu đã thu", value: `${Number(stats.revenue).toLocaleString("vi-VN")}đ`, icon: DollarSign },
      { label: "Tỷ lệ hoàn thành", value: stats.totalOrders ? `${(stats.deliveredOrders / stats.totalOrders * 100).toFixed(1)}%` : "0%", icon: TrendingUp },
    ].map(({ label, value, icon: Icon }) => <div key={label} className="bg-white rounded-xl p-4 shadow-sm border"><Icon size={17} className="text-blue-600 mb-3" /><p className="text-xl font-700">{value}</p><p className="text-xs text-slate-600">{label}</p></div>)}</div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5"><div className="bg-white rounded-xl p-5 border"><h3 className="text-sm font-600 mb-4">Doanh thu theo ngày</h3><ResponsiveContainer width="100%" height={220}><AreaChart data={stats.timeline}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Area dataKey="revenue" name="Doanh thu" stroke="#2563EB" fill="#DBEAFE" /></AreaChart></ResponsiveContainer></div>
      <div className="bg-white rounded-xl p-5 border"><h3 className="text-sm font-600 mb-4">Phân bổ trạng thái</h3><ResponsiveContainer width="100%" height={220}><BarChart data={statusData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="status" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="orders" name="Đơn hàng" fill="#2563EB" /></BarChart></ResponsiveContainer></div></div>
  </div>;
}
