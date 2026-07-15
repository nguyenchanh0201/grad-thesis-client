export default function MyTicketsLoading() {
  return (
    <main className="page-container py-10">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="h-5 w-28 animate-pulse rounded bg-muted" />
          <div className="h-3 w-40 animate-pulse rounded bg-muted" />
        </div>

        {/* Tab bar */}
        <div className="flex gap-3">
          <div className="h-9 w-24 animate-pulse rounded-sm bg-muted" />
          <div className="h-9 w-20 animate-pulse rounded-sm bg-muted" />
        </div>

        {/* Ticket cards */}
        <div className="flex flex-col gap-4 pb-12">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex h-28 gap-4 overflow-hidden rounded-sm border bg-card p-4 animate-pulse"
            >
              <div className="h-full w-20 shrink-0 rounded-sm bg-muted" />
              <div className="flex flex-1 flex-col justify-between py-1">
                <div className="space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3 w-24 rounded bg-muted" />
                  <div className="h-6 w-16 rounded-full bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
