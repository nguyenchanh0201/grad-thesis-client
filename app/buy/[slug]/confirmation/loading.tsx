export default function ConfirmationLoading() {
  return (
    <div className="page-container flex min-h-[60vh] items-center justify-center py-10 animate-pulse">
      <div className="mx-auto w-full max-w-md space-y-6 text-center">
        <div className="mx-auto size-20 rounded-full bg-muted" />
        <div className="mx-auto h-7 w-48 rounded bg-muted" />
        <div className="mx-auto h-4 w-64 rounded bg-muted" />

        <div className="rounded-sm border bg-card p-6 space-y-4 text-left">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-3 w-28 rounded bg-muted" />
              <div className="h-3 w-24 rounded bg-muted" />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <div className="h-10 w-full rounded-sm bg-muted" />
          <div className="h-10 w-full rounded-sm bg-muted" />
        </div>
      </div>
    </div>
  );
}
