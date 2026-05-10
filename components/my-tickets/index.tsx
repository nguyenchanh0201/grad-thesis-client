"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import TabBar from "@/components/shared/tab-bar";
import { LabelBlock } from "@/components/event/label-block";
import { useMyTickets } from "@/hooks/use-tickets";
import { BackendTicket, BackendTicketStatus } from "@/schemas/ticket";
import { TicketCard } from "./ticket-card";

type TAB_ID = "upcoming" | "past" | string;

const TABS = [
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
];

function isUpcoming(ticket: BackendTicket): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(ticket.event.eventDate);
  return (
    eventDate >= today &&
    ticket.status !== BackendTicketStatus.CANCELLED &&
    ticket.status !== BackendTicketStatus.USED
  );
}

export function MyTickets() {
  const [activeTab, setActiveTab] = useState<TAB_ID>("upcoming");
  const { data, isLoading, isError } = useMyTickets();

  const { upcoming, past } = useMemo(() => {
    const all = data?.data ?? [];
    return {
      upcoming: all.filter(isUpcoming),
      past: all.filter((t) => !isUpcoming(t)),
    };
  }, [data]);

  const tickets = activeTab === "upcoming" ? upcoming : past;

  if (isLoading) {
    return (
      <main className="page-container py-10">
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-sm bg-muted sm:h-32"
            />
          ))}
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="page-container py-10">
        <p className="text-sm text-destructive">
          Failed to load tickets. Please try again.
        </p>
      </main>
    );
  }

  return (
    <main className="page-container py-10">
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <LabelBlock label="MY TICKETS" labelBorder="bottom" />
          <p className="mt-2 text-sm text-muted-foreground">
            {upcoming.length} upcoming · {past.length} past
          </p>
        </div>

        {/* Tabs */}
        <TabBar
          tabs={TABS}
          selected={activeTab}
          onChange={setActiveTab}
          autoScroll={false}
        />

        {/* List or empty state */}
        {tickets.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <div className="flex flex-col gap-4 pb-12">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function EmptyState({ tab }: { tab: string }) {
  return (
    <div className="flex flex-col items-center gap-5 py-20 text-center">
      <div className="space-y-1">
        <p className="font-semibold text-foreground">
          {tab === "upcoming" ? "No upcoming tickets" : "No past tickets"}
        </p>
        <p className="max-w-xs text-sm text-muted-foreground">
          {tab === "upcoming"
            ? "You don't have any upcoming events. Browse to find your next show."
            : "Tickets for events you've attended will appear here."}
        </p>
      </div>
      {tab === "upcoming" && (
        <Button asChild>
          <Link href="/">Browse Events</Link>
        </Button>
      )}
    </div>
  );
}
