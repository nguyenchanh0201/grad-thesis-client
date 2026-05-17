"use client";

import { useEffect, useState, useMemo } from "react";
import TabBar, { TabItem } from "@/components/shared/tab-bar";
import { Button } from "@/components/ui/button";
import type { EventDetail } from "@/schemas/event";
import { AboutSection } from "./about-section";
import { ScheduleSection } from "./schedule-section";
import { OrganizerSection } from "./organizer-section";
import { PerformersSection } from "./performers-section";
import { LocationSection } from "./location-section";
import { useAuthStore } from "@/lib/store/auth.store";
import { useRouter } from "next/navigation";
import { setQueueIntent } from "@/lib/booking/queue-intent";

interface Props {
  event: EventDetail;
}

export function EventDetailSections({ event }: Props) {
  const router = useRouter();

  const tabs = useMemo(() => {
    const items: TabItem[] = [
      { id: "about", label: "About" },
      { id: "schedule", label: "Schedule" },
    ];
    if (event.performers && event.performers.length > 0) {
      items.push({ id: "performers", label: "Performers" });
    }
    items.push({ id: "location", label: "Location" });
    items.push({ id: "organizer", label: "Organizer" });
    return items;
  }, [event.performers]);

  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isLoggedIn = !!user;

  const handleBuy = () => {
    setQueueIntent(event.slug);
    router.push(`/buy/${event.slug}/queue?intent=1`);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveTab(entry.target.id);
        });
      },
      { rootMargin: "-100px 0px -80% 0px", threshold: 0 },
    );

    tabs.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [tabs]);

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
            onClick={handleBuy}
            className="px-10 py-5 hidden shrink-0 md:flex"
          >
            {isInitialized && !isLoggedIn
              ? "Login required to buy tickets"
              : "Buy Tickets"}
          </Button>
        </div>
        <TabBar tabs={tabs} selected={activeTab} onChange={handleTabChange} />
      </div>

      <AboutSection
        summary={event.summary}
        description={event.description}
        descAttachmentUrl={event.descAttachmentUrl}
        termsAndConditions={event.termsAndConditions}
      />
      <ScheduleSection dates={event.dates} seatMapImage={event.seatMapImage} />
      {event.performers && event.performers.length > 0 && (
        <PerformersSection performers={event.performers} />
      )}
      <LocationSection venue={event.venue} />
      <OrganizerSection organizer={event.organizer} />
    </>
  );
}
