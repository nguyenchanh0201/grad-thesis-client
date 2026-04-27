export default function HomeLoading() {
  return (
    <main>
      {/* Hero banner skeleton */}
      <div className="relative h-dvh w-full animate-pulse bg-muted" />

      <div className="page-container space-y-16 py-12">
        {/* Tab bar skeleton */}
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="h-9 w-24 shrink-0 animate-pulse rounded-sm bg-muted"
            />
          ))}
        </div>

        {/* Horizontal listing skeleton */}
        <EventListingSkeleton label count={5} variant="horizontal" />

        {/* Grid listing skeleton */}
        <EventListingSkeleton label count={8} variant="grid" />

        {/* Vertical listing skeleton */}
        <EventListingSkeleton label count={4} variant="vertical" />
      </div>
    </main>
  );
}

function EventListingSkeleton({
  label,
  count,
  variant,
}: {
  label?: boolean;
  count: number;
  variant: "horizontal" | "grid" | "vertical";
}) {
  return (
    <div className="space-y-4">
      {label && <div className="h-5 w-40 animate-pulse rounded bg-muted" />}
      <div
        className={
          variant === "grid"
            ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
            : variant === "horizontal"
              ? "flex gap-4 overflow-hidden"
              : "flex flex-col gap-4"
        }
      >
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={
              variant === "horizontal"
                ? "h-48 w-36 shrink-0 animate-pulse rounded-sm bg-muted"
                : variant === "grid"
                  ? "aspect-[3/4] animate-pulse rounded-sm bg-muted"
                  : "flex h-24 gap-3"
            }
          >
            {variant === "vertical" && (
              <>
                <div className="h-24 w-20 shrink-0 animate-pulse rounded-sm bg-muted" />
                <div className="flex flex-1 flex-col gap-2 py-1">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
