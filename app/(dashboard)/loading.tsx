export default function GlobalDashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-6 w-48 rounded bg-zinc-800" />
        <div className="h-4 w-80 rounded bg-zinc-800/60" />
      </div>

      {/* Overview Cards / Top Stats Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-zinc-900 border border-zinc-800/40" />
        ))}
      </div>

      {/* Main Content Layout Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-64 rounded-lg bg-zinc-900 border border-zinc-800/40" />
        <div className="h-64 rounded-lg bg-zinc-900 border border-zinc-800/40" />
      </div>
    </div>
  );
}
