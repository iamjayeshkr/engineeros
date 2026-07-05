export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded bg-base-800" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-card bg-base-900 border border-border" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="h-40 rounded-card bg-base-900 border border-border lg:col-span-2" />
        <div className="h-40 rounded-card bg-base-900 border border-border" />
      </div>
    </div>
  );
}
