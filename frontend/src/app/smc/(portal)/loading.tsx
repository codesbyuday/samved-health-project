export default function SMCPortalLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 rounded-lg bg-muted/80"></div>
          <div className="h-4 w-96 rounded-lg bg-muted/60"></div>
        </div>
        <div className="h-10 w-32 rounded-lg bg-muted/80"></div>
      </div>

      {/* Filter / Search Bar Skeleton */}
      <div className="surface grid gap-4 p-5 md:grid-cols-3">
        <div className="h-10 rounded-lg bg-muted/60"></div>
        <div className="h-10 rounded-lg bg-muted/60"></div>
        <div className="h-10 rounded-lg bg-muted/60"></div>
      </div>

      {/* Stat Cards Grid Skeleton */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="surface p-5 space-y-3">
            <div className="h-4 w-24 rounded bg-muted/70"></div>
            <div className="h-8 w-16 rounded bg-muted/90"></div>
            <div className="h-3 w-32 rounded bg-muted/50"></div>
          </div>
        ))}
      </div>

      {/* Main Content / Table Skeleton */}
      <div className="surface p-6 space-y-4">
        <div className="h-6 w-48 rounded bg-muted/80"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 w-full rounded-lg bg-muted/40"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
