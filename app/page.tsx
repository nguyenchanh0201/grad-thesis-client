"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { EventPagedListResultSchema, type Event } from "@/schemas/event";

export default function Home() {
  const {
    data: events,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["events"],
    queryFn: async (): Promise<Event[]> => {
      const response = await apiClient.get("/catalog/events");
      const parsed = EventPagedListResultSchema.parse(response);

      return parsed.data;
    },
    enabled: typeof window !== "undefined",
  });

  if (isLoading)
    return <div className="p-8 text-center">Loading events...</div>;

  if (isError)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Unable to load events right now.
      </div>
    );

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Upcoming Events</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events?.map((event: Event) => (
          <Card key={event.id}>
            <CardHeader>
              <CardTitle>{event.eventName}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-4">
                {new Date(event.eventDate).toLocaleDateString()}
              </p>
              <Link href={`/events/${event.id}`}>
                <Button className="w-full">View Event</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
