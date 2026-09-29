// Skeleton shown while the analytics queries run on first load.
export default function AnalyticsLoading() {
  const block = "bg-black/[0.05] rounded-2xl animate-pulse";
  return (
    <div className="w-full space-y-8" aria-busy="true" aria-label="Loading analytics">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-40 bg-black/[0.06] rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-black/[0.04] rounded animate-pulse" />
        </div>
        <div className="h-9 w-44 bg-black/[0.05] rounded-lg animate-pulse" />
      </div>
      <div className={`h-28 ${block}`} />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className={`h-40 ${block}`} />
        ))}
      </div>
      <div className={`h-96 ${block}`} />
    </div>
  );
}
