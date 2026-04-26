"use client";

import { useEffect, useState } from "react";
import TabBar, { TabItem } from "@/components/shared/tab-bar";
import { Button } from "@/components/ui/button";
import type { EventDetail } from "@/schemas/event";
import { AboutSection } from "./about-section";
import { ScheduleSection } from "./schedule-section";
import { OrganizerSection } from "./organizer-section";

const SECTION_TABS: TabItem[] = [
  { id: "about", label: "About" },
  { id: "schedule", label: "Schedule" },
  { id: "organizer", label: "Organizer" },
];

interface Props {
  event: EventDetail;
  isLoggedIn?: boolean;
  onCTAClick?: () => void;
}

export function EventDetailSections({
  event,
  isLoggedIn = false,
  onCTAClick,
}: Props) {
  const [activeTab, setActiveTab] = useState(SECTION_TABS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveTab(entry.target.id);
        });
      },
      { rootMargin: "-100px 0px -80% 0px", threshold: 0 },
    );

    SECTION_TABS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <div className="sticky top-0 z-30 bg-background">
        <div className="page-container flex h-14 items-center justify-between gap-4 border-b border-border">
          <p className="truncate text-sm font-semibold">{event.title}</p>
          <Button
            variant="default"
            onClick={onCTAClick}
            className="px-10 py-5 hidden shrink-0 md:flex"
          >
            {isLoggedIn ? "Buy Tickets" : "Log in to buy"}
          </Button>
        </div>
        <TabBar
          tabs={SECTION_TABS}
          selected={activeTab}
          onChange={handleTabChange}
        />
      </div>

      <AboutSection
        description={event.description}
        timeVenueNotes={event.timeVenueNotes}
        termsAndConditions={event.termsAndConditions}
      />
      <ScheduleSection dates={event.dates} seatMapImage={event.seatMapImage} />
      <OrganizerSection organizer={event.organizer} />
    </>
  );
}
