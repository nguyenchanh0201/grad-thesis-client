export default function TicketsLoading() {
  return (
    <div className="page-container py-10 animate-pulse">
      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="size-7 rounded-full bg-muted" />
            <div className="h-3 w-16 rounded bg-muted" />
            {i < 2 && <div className="h-px w-8 bg-muted" />}
          </div>
        ))}
      </div>

      {/* Event header */}
      <div className="mb-6 flex gap-4">
        <div className="h-20 w-16 shrink-0 rounded-sm bg-muted" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-5 w-2/3 rounded bg-muted" />
          <div className="h-3 w-1/2 rounded bg-muted" />
          <div className="h-3 w-1/3 rounded bg-muted" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Ticket tiers */}
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-sm border bg-card p-4"
            >
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-3 w-20 rounded bg-muted" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-16 rounded bg-muted" />
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-full bg-muted" />
                  <div className="h-5 w-6 rounded bg-muted" />
                  <div className="size-8 rounded-full bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="rounded-sm border bg-card p-5 space-y-4 h-fit">
          <div className="h-4 w-28 rounded bg-muted" />
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="h-3 w-16 rounded bg-muted" />
              </div>
            ))}
          </div>
          <div className="h-px bg-muted" />
          <div className="flex justify-between">
            <div className="h-4 w-12 rounded bg-muted" />
            <div className="h-4 w-20 rounded bg-muted" />
          </div>
          <div className="h-11 w-full rounded-sm bg-muted" />
        </div>
      </div>
    </div>
  );
}
