export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
      <div className="h-3 bg-slate-100 rounded w-1/2 mb-2" />
      <div className="h-3 bg-slate-100 rounded w-2/3 mb-4" />
      <div className="flex gap-2">
        <div className="h-6 bg-slate-200 rounded w-16" />
        <div className="h-6 bg-slate-200 rounded w-20" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0"
        >
          <div className="h-3 bg-slate-200 rounded w-1/4" />
          <div className="h-3 bg-slate-100 rounded w-1/6" />
          <div className="h-3 bg-slate-100 rounded w-1/6" />
          <div className="h-5 bg-slate-200 rounded w-16 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-6 bg-slate-200 rounded w-48" />
        <div className="h-9 bg-slate-200 rounded w-28" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <SkeletonTable />
      </div>
    </div>
  );
}
