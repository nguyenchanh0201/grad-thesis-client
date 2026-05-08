"use client";

import { HeroBanner } from "@/components/homepage/hero-banner";
import TabBar, { TabItem } from "@/components/shared/tab-bar";
import { MessagesSquare } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button.variants";
import { cn } from "@/lib/utils";
import { EventListing } from "@/components/event/event-listing";
import { useEvents } from "@/hooks/use-events";
import { useCategories } from "@/hooks/use-taxonomy";
import { eventToEventItem } from "@/lib/event/adapters";
import { EventStatus } from "@/schemas/event";
import type { EventItem } from "@/components/event/event-card";

const ALL_TAB: TabItem = { id: "all", label: "All" };

export default function Home() {
  const { data: eventsResult, isLoading: eventsLoading } = useEvents({
    page: 1,
    status: EventStatus.ON_SALE,
    limit: 20,
  });

  const { data: categoriesResult } = useCategories();

  const events: EventItem[] = eventsResult?.data?.map(eventToEventItem) ?? [];

  const categoryTabs: TabItem[] = [
    ALL_TAB,
    ...(categoriesResult?.data
      ?.filter((c) => c.isActive !== false)
      .map((c) => ({ id: c.slug ?? c.id, label: c.name })) ?? []),
  ];

  const featuredEvents = events.filter((e) => e.isFeatured);
  const trendingEvents = events.slice(0, 10);
  const upcomingEvents = events.slice(0, 8);
  const isLoading = eventsLoading;

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </main>
    );
  }

  return (
    <main>
      <HeroBanner />

      <div className="page-container space-y-16 py-12">
        <TabBar autoScroll={false} tabs={categoryTabs} className="mb-12" />

        <EventListing
          variant="horizontal"
          label="TRENDING NOW"
          labelBorder="top"
          items={trendingEvents}
          maxItems={10}
          onViewMore={() => {}}
        />

        <EventListing
          variant="grid"
          label="UPCOMING EVENTS"
          labelBorder="bottom"
          items={upcomingEvents}
          maxItems={8}
          onViewMore={() => {}}
        />

        {featuredEvents.length > 0 && (
          <EventListing
            variant="vertical"
            label="FEATURED"
            labelBorder="left"
            items={featuredEvents}
            maxItems={5}
            onViewMore={() => {}}
          />
        )}
      </div>

      <Link
        href="/feedback"
        className={cn(
          buttonVariants({ variant: "default", size: "xs" }),
          "fixed bottom-4 right-0 z-50 h-auto rounded-l-sm rounded-r-none px-4 py-1.5 gap-1.5",
        )}
      >
        <MessagesSquare />
        Feedback
      </Link>
    </main>
  );
}
