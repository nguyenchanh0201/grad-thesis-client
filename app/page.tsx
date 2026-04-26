"use client";

import { HeroBanner } from "@/components/homepage/hero-banner";
import EventListing from "@/components/event/event-listing";
import { mockEvents } from "@/lib/mock/events";
import CategoryTabBar from "@/components/homepage/category-tab";
import { MessagesSquare } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button.variants";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <main>
      <HeroBanner />

      <div className="page-container space-y-16 py-12">
        <CategoryTabBar />

        {/* Horizontal — trending row */}
        <EventListing
          variant="horizontal"
          label="TRENDING NOW"
          labelBorder="top"
          items={mockEvents}
          maxItems={10}
          onViewMore={() => {}}
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
