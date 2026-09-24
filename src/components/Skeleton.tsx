import type { ReactNode } from "react";
import { Inbox, LoaderCircle } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

interface LoadingStateProps {
  label?: string;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <section
      className={`flex min-h-48 flex-col items-center justify-center px-5 py-10 text-center ${className}`}
      aria-live="polite"
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        {icon || <Inbox size={22} strokeWidth={1.7} aria-hidden="true" />}
      </div>
      <h3 className="text-sm font-700 text-slate-700">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </section>
  );
}

export function LoadingState({ label = "Đang tải dữ liệu...", className = "", compact = false }: LoadingStateProps) {
  return (
    <div className={`flex items-center justify-center gap-2 px-4 text-xs text-slate-500 ${compact ? "py-4" : "min-h-40 py-8"} ${className}`} role="status">
      <LoaderCircle size={17} className="animate-spin text-blue-600" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 bg-slate-100 rounded-lg" />
        <div className="w-12 h-4 bg-slate-100 rounded" />
      </div>
      <div className="w-24 h-7 bg-slate-100 rounded mb-2" />
      <div className="w-32 h-3 bg-slate-100 rounded mb-1" />
      <div className="w-20 h-3 bg-slate-100 rounded" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr className="border-b border-slate-50">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <td key={i} className="py-3 px-4">
          <div className="h-3 bg-slate-100 rounded animate-pulse" style={{ width: `${40 + (i * 13) % 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTableRows({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-slate-50 last:border-0" aria-hidden="true">
          {Array.from({ length: columns }, (_, columnIndex) => (
            <td key={columnIndex} className="px-4 py-3.5">
              <div
                className="h-3 animate-pulse rounded bg-slate-100"
                style={{ width: `${Math.max(42, 86 - ((rowIndex + columnIndex * 11) % 38))}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function SkeletonList({ items = 3, className = "" }: { items?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`} aria-label="Đang tải dữ liệu" role="status">
      {Array.from({ length: items }, (_, index) => (
        <div key={index} className="animate-pulse rounded-xl border border-slate-100 bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-2/5 rounded bg-slate-100" />
              <div className="h-4 w-3/5 rounded bg-slate-100" />
            </div>
            <div className="h-6 w-20 rounded-full bg-slate-100" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="h-8 rounded bg-slate-50" />
            <div className="h-8 rounded bg-slate-50" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonText({ w = 'w-full', h = 'h-4' }: { w?: string; h?: string }) {
  return <div className={`${w} ${h} bg-slate-100 rounded animate-pulse`} />;
}

export function SkeletonDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="bg-white rounded-xl p-5 border border-slate-100 animate-pulse h-64 lg:col-span-2">
          <div className="w-32 h-4 bg-slate-100 rounded mb-4" />
          <div className="w-full h-44 bg-slate-50 rounded-lg" />
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-100 animate-pulse h-64">
          <div className="w-24 h-4 bg-slate-100 rounded mb-4" />
          <div className="w-32 h-32 bg-slate-50 rounded-full mx-auto" />
        </div>
      </div>
    </div>
  );
}
