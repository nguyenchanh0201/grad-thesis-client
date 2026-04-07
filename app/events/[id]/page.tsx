type EventDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Event Detail</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Event ID: <span className="font-mono">{id}</span>
      </p>
    </main>
  );
}
