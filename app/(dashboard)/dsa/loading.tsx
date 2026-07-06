export default function DsaLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-32 rounded bg-zinc-800" />
          <div className="h-4 w-64 rounded bg-zinc-800/60" />
        </div>
        <div className="h-9 w-24 rounded bg-zinc-800" />
      </div>

      {/* Tabs Skeleton */}
      <div className="flex border-b border-zinc-900 pb-px gap-6">
        <div className="h-8 w-24 border-b-2 border-transparent bg-zinc-850 rounded-t" />
        <div className="h-8 w-28 border-b-2 border-transparent bg-zinc-850 rounded-t" />
      </div>

      {/* Search and Filters Toolbar Skeleton */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 h-9 rounded bg-zinc-900 border border-zinc-800/40" />
        <div className="h-9 w-32 rounded bg-zinc-900 border border-zinc-800/40" />
        <div className="h-9 w-32 rounded bg-zinc-900 border border-zinc-800/40" />
      </div>

      {/* Table Skeleton */}
      <div className="rounded-lg border border-zinc-800/40 bg-zinc-900/10 overflow-hidden">
        <div className="h-10 bg-zinc-900/50 border-b border-zinc-800/40" />
        <div className="divide-y divide-zinc-850">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded bg-zinc-800" />
                <div className="h-4 w-64 rounded bg-zinc-800/80" />
              </div>
              <div className="flex items-center gap-6">
                <div className="h-4 w-20 rounded bg-zinc-800/60" />
                <div className="h-4.5 w-16 rounded bg-zinc-800" />
                <div className="h-4 w-6 rounded bg-zinc-800/40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
