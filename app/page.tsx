"use client";

import { HeroBanner } from "@/components/homepage/hero-banner";
import EventListing from "@/components/event/event-listing";
import { mockEvents } from "@/lib/mock/events";
import CategoryTabBar from "@/components/homepage/category-tab";

export default function Home() {
  return (
    <main>
      <HeroBanner />

      <main className="page-container space-y-16 py-12">
        <CategoryTabBar />

        {/* Horizontal — trending row */}
        <EventListing
          variant="horizontal"
          label="TRENDING NOW"
          labelBorder="top"
          items={mockEvents}
          maxItems={10}
        />

        {/* Grid — all events */}
        <EventListing
          variant="grid"
          label="UPCOMING EVENTS"
          labelBorder="bottom"
          items={mockEvents}
          maxItems={8}
          onViewMore={() => {}}
        />

        {/* Vertical — featured sidebar style */}
        <EventListing
          variant="vertical"
          label="FEATURED"
          labelBorder="left"
          items={mockEvents}
          maxItems={5}
          onViewMore={() => {}}
        />
      </main>
    </main>
  );
}
