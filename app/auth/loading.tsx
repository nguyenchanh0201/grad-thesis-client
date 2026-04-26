export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 auth-bg-gradient">
      <div className="w-full max-w-140 rounded-2xl bg-background px-6 py-8 sm:px-10 sm:py-12 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="h-7 w-32 animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-52 animate-pulse rounded bg-muted" />
          </div>
          <div className="space-y-3">
            <div className="h-12.5 w-full animate-pulse rounded-[10px] bg-muted" />
            <div className="h-12.5 w-full animate-pulse rounded-[10px] bg-muted" />
          </div>
          <div className="h-13 w-full animate-pulse rounded-[10px] bg-muted" />
        </div>
      </div>
    </div>
  );
}
