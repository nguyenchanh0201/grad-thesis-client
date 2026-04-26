"use client";

import { HeroBanner } from "@/components/homepage/hero-banner";
import { mockEvents } from "@/lib/mock/events";
import TabBar, { TabItem } from "@/components/shared/tab-bar";
import { MessagesSquare } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button.variants";
import { cn } from "@/lib/utils";
import { EventListing } from "@/components/event/event-listing";

const EVENT_CATEGORY_TABS: TabItem[] = [
  { id: "all", label: "All" },
  { id: "live-music", label: "Live Music" },
  { id: "fan-meeting", label: "Fan Meeting" },
  { id: "merchandise", label: "Merchandise" },
  { id: "stage-art", label: "Stage & Art" },
  { id: "sports", label: "Sports" },
  { id: "conferences", label: "Conferences & Community" },
  { id: "courses", label: "Courses" },
];

export default function Home() {
  return (
    <main>
      <HeroBanner />

      <div className="page-container space-y-16 py-12">
        <TabBar
          autoScroll={false}
          tabs={EVENT_CATEGORY_TABS}
          className="mb-12"
        />

        {/* Horizontal */}
        <EventListing
          variant="horizontal"
          label="TRENDING NOW"
          labelBorder="top"
          items={mockEvents}
          maxItems={10}
          onViewMore={() => {}}
        />

        {/* Grid */}
        <EventListing
          variant="grid"
          label="UPCOMING EVENTS"
          labelBorder="bottom"
          items={mockEvents}
          maxItems={8}
          onViewMore={() => {}}
        />

        {/* Vertical */}
        <EventListing
          variant="vertical"
          label="FEATURED"
          labelBorder="left"
          items={mockEvents}
          maxItems={5}
          onViewMore={() => {}}
        />
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
