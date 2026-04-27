export default function EventDetailLoading() {
  return (
    <>
      {/* Header section */}
      <section
        className="relative w-full overflow-hidden"
        style={{ background: "#0a0a0f" }}
      >
        <div className="page-container relative z-10 py-8 md:py-12">
          <div className="flex flex-col gap-6 md:grid md:grid-cols-[2fr_3fr] md:gap-10">
            {/* Image skeleton */}
            <div className="flex flex-col gap-4">
              <div className="relative aspect-video animate-pulse overflow-hidden rounded-md bg-white/10 md:aspect-auto md:min-h-[280px] md:flex-1" />
              <div className="hidden h-12 w-full animate-pulse rounded-sm bg-white/10 md:block" />
            </div>

            {/* Info skeleton */}
            <div className="flex flex-col gap-5 pt-1">
              <div className="h-6 w-20 animate-pulse rounded-full bg-white/10" />
              <div className="h-8 w-4/5 animate-pulse rounded bg-white/10" />
              <div className="h-5 w-3/5 animate-pulse rounded bg-white/10" />

              <div className="flex items-start gap-3">
                <div className="size-5 animate-pulse rounded-full bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
                  <div className="h-3 w-32 animate-pulse rounded bg-white/10" />
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="size-5 animate-pulse rounded-full bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 animate-pulse rounded bg-white/10" />
                  <div className="h-3 w-36 animate-pulse rounded bg-white/10" />
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="size-5 animate-pulse rounded-full bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
                  <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content sections skeleton */}
      <main className="page-container pt-5 pb-20 space-y-5">
        <div className="flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-9 w-24 animate-pulse rounded-sm bg-muted"
            />
          ))}
        </div>

        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-4 animate-pulse rounded bg-muted"
              style={{ width: `${85 - i * 5}%` }}
            />
          ))}
        </div>

        {/* You might like grid */}
        <div className="pt-8 space-y-4">
          <div className="h-5 w-32 animate-pulse rounded bg-muted" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] animate-pulse rounded-sm bg-muted"
              />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
