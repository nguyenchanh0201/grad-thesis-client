export default function ResultLoading() {
  return (
    <div className="page-container flex min-h-[60vh] items-center justify-center py-10 animate-pulse">
      <div className="mx-auto w-full max-w-md space-y-5 text-center">
        <div className="mx-auto size-20 rounded-full bg-muted" />
        <div className="mx-auto h-7 w-40 rounded bg-muted" />
        <div className="mx-auto h-4 w-56 rounded bg-muted" />
        <div className="h-10 w-40 mx-auto rounded-sm bg-muted" />
      </div>
    </div>
  );
}
