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
  const [report, setReport] = useState<OperationsReport | null>(null); const [loading, setLoading] = useState(false);
  const load = async () => { try { setLoading(true); setReport((await getOperationsReportApi({ from, to })).data); }
    catch (error: any) { addToast({ type: "error", title: "Không thể tải báo cáo", message: error.message }); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const download = async () => { try { const blob = await exportOrdersReportApi({ from, to }); const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `bao-cao-${from}-${to}.csv`; anchor.click(); URL.revokeObjectURL(url);
    } catch (error: any) { addToast({ type: "error", title: "Xuất báo cáo thất bại", message: error.message }); } };
  const stats = report || { from, to, totalOrders: 0, deliveredOrders: 0, failedOrders: 0, revenue: 0, statusDistribution: {}, timeline: [] };
  const statusData = Object.entries(stats.statusDistribution).map(([status, orders]) => ({ status, orders }));
  return <div className="p-4 sm:p-6 space-y-6">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-3"><div><h2 className="text-lg font-700 text-slate-900">Báo cáo giao hàng</h2><p className="text-xs text-slate-500">Xem đơn hàng và doanh thu theo thời gian đã chọn</p></div>
      <div className="flex flex-wrap gap-2 items-end"><label className="text-xs text-slate-500">Từ ngày<input type="date" value={from} onChange={e => setFrom(e.target.value)} className="block h-9 border rounded-lg px-2 mt-1" /></label>
        <label className="text-xs text-slate-500">Đến ngày<input type="date" value={to} onChange={e => setTo(e.target.value)} className="block h-9 border rounded-lg px-2 mt-1" /></label>
        <button onClick={load} disabled={loading} className="h-9 px-4 rounded-lg bg-blue-600 text-white text-xs">{loading ? "Đang tải..." : "Áp dụng"}</button>
        <button onClick={download} className="h-9 px-3 rounded-lg border bg-white text-xs flex items-center gap-1"><Download size={14} /> CSV</button></div></div>
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
