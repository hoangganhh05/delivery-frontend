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

export function SkeletonText({ w = 'w-full', h = 'h-4' }: { w?: string; h?: string }) {
  return <div className={`${w} ${h} bg-slate-100 rounded animate-pulse`} />;
}

export function SkeletonDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl p-5 border border-slate-100 animate-pulse h-64">
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
