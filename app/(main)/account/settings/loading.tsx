export default function AccountSettingsLoading() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 animate-pulse">
      {/* Avatar + identity */}
      <div className="flex items-center gap-4 mb-8">
        <div className="size-16 shrink-0 rounded-full bg-muted" />
        <div className="space-y-2">
          <div className="h-5 w-32 rounded bg-muted" />
          <div className="h-3 w-48 rounded bg-muted" />
        </div>
      </div>

      {/* Account section */}
      <div className="mb-6 space-y-3">
        <div className="h-4 w-20 rounded bg-muted" />
        <div className="rounded-md border bg-muted/30 divide-y">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="h-3 w-12 rounded bg-muted" />
            <div className="h-3 w-40 rounded bg-muted" />
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-5 w-16 rounded-full bg-muted" />
          </div>
        </div>
        <div className="h-3 w-64 rounded bg-muted" />
      </div>

      <div className="mb-6 h-px bg-muted" />

      {/* Profile fields */}
      <div className="space-y-5">
        <div className="h-4 w-40 rounded bg-muted" />
        <div className="space-y-1.5">
          <div className="h-3 w-20 rounded bg-muted" />
          <div className="h-10 w-full rounded-md bg-muted" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3 w-28 rounded bg-muted" />
          <div className="h-10 w-full rounded-md bg-muted" />
        </div>
        <div className="flex justify-end pt-2">
          <div className="h-9 w-28 rounded-sm bg-muted" />
        </div>
      </div>
    </div>
  );
}
