export default function ProjectsLoading() {
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

      {/* Kanban Board Columns Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Column 1 */}
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-850">
            <div className="h-4 w-28 rounded bg-zinc-800" />
            <div className="h-4 w-6 rounded bg-zinc-800/50" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-zinc-800/40 bg-zinc-900/30 p-4 space-y-3">
                <div className="h-4 w-3/4 rounded bg-zinc-800" />
                <div className="h-3 w-1/2 rounded bg-zinc-850" />
                <div className="flex gap-2 pt-1">
                  <div className="h-4 w-12 rounded bg-zinc-800/60" />
                  <div className="h-4 w-16 rounded bg-zinc-800/40" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2 */}
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-850">
            <div className="h-4 w-32 rounded bg-zinc-800" />
            <div className="h-4 w-6 rounded bg-zinc-800/50" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 1 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-zinc-800/40 bg-zinc-900/30 p-4 space-y-3">
                <div className="h-4 w-2/3 rounded bg-zinc-800" />
                <div className="h-3 w-1/3 rounded bg-zinc-850" />
                <div className="flex gap-2 pt-1">
                  <div className="h-4 w-14 rounded bg-zinc-800/60" />
                  <div className="h-4 w-10 rounded bg-zinc-800/40" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3 */}
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-850">
            <div className="h-4 w-20 rounded bg-zinc-800" />
            <div className="h-4 w-6 rounded bg-zinc-800/50" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-zinc-800/40 bg-zinc-900/30 p-4 space-y-3">
                <div className="h-4.5 w-5/6 rounded bg-zinc-800" />
                <div className="h-3 w-1/4 rounded bg-zinc-850" />
                <div className="flex gap-2 pt-1">
                  <div className="h-4 w-12 rounded bg-zinc-800/60" />
                  <div className="h-4 w-12 rounded bg-zinc-800/40" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
