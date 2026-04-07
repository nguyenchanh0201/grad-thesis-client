export function LoadingShell() {
  return (
    <div
      data-agent-type="state-display"
      data-entity-type="loading-shell"
      data-state-keys="loading"
      className="space-y-4 rounded-2xl border border-border/60 bg-background/80 p-4"
    >
      <div className="h-8 w-40 animate-pulse rounded bg-muted" />
      <div className="h-4 w-full animate-pulse rounded bg-muted" />
      <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
    </div>
  );
}
