export default function GoalsLoading() {
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

      {/* Filter Toolbar Skeleton */}
      <div className="flex gap-3 pb-2 border-b border-zinc-900">
        <div className="h-8 w-32 rounded bg-zinc-800/60" />
        <div className="h-8 w-32 rounded bg-zinc-800/60" />
      </div>

      {/* Goals List/Tree Skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div 
            key={i} 
            className="h-16 rounded-lg bg-zinc-900 border border-zinc-800/40 p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded-full bg-zinc-800" />
              <div className="space-y-1.5">
                <div className="h-4.5 w-60 rounded bg-zinc-850" />
                <div className="h-3 w-28 rounded bg-zinc-850/60" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-5 w-16 rounded bg-zinc-800/80" />
              <div className="h-4 w-12 rounded bg-zinc-800/40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
