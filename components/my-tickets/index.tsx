"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import TabBar from "@/components/shared/tab-bar";
import { LabelBlock } from "@/components/event/label-block";
import { mockTickets } from "@/lib/mock/tickets";
import { TicketCard } from "./ticket-card";
import type { MyTicket } from "@/schemas/ticket";

const TABS = [
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
];

function isUpcoming(ticket: MyTicket): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(ticket.event.eventDate);
  return (
    eventDate >= today &&
    ticket.status !== "cancelled" &&
    ticket.status !== "used"
  );
}

export function MyTickets() {
  const [activeTab, setActiveTab] = useState("upcoming");

  const { upcoming, past } = useMemo(() => {
    const upcoming = mockTickets.filter(isUpcoming);
    const past = mockTickets.filter((t) => !isUpcoming(t));
    return { upcoming, past };
  }, []);

  const tickets = activeTab === "upcoming" ? upcoming : past;

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
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Ticket className="h-8 w-8 text-muted-foreground" />
      </div>
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
