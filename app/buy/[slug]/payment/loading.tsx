export default function PaymentLoading() {
  return (
    <div className="page-container py-10 animate-pulse">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Title */}
        <div className="h-6 w-36 rounded bg-muted" />

        {/* Payment method selector */}
        <div className="rounded-sm border bg-card p-5 space-y-4">
          <div className="h-4 w-40 rounded bg-muted" />
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-sm border bg-muted" />
            ))}
          </div>
        </div>

        {/* Card details */}
        <div className="rounded-sm border bg-card p-5 space-y-4">
          <div className="h-4 w-28 rounded bg-muted" />
          <div className="space-y-3">
            <div className="h-10 w-full rounded-md bg-muted" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-10 rounded-md bg-muted" />
              <div className="h-10 rounded-md bg-muted" />
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="rounded-sm border bg-card p-5 space-y-3">
          <div className="h-4 w-28 rounded bg-muted" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-3 w-32 rounded bg-muted" />
              <div className="h-3 w-16 rounded bg-muted" />
            </div>
          ))}
          <div className="h-px bg-muted" />
          <div className="flex justify-between">
            <div className="h-4 w-12 rounded bg-muted" />
            <div className="h-4 w-20 rounded bg-muted" />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <div className="h-10 w-24 rounded-sm bg-muted" />
          <div className="h-10 w-36 rounded-sm bg-muted" />
        </div>
      </div>
    </div>
  );
}
