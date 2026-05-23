"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LabelBlock } from "@/components/event/label-block";
import { useMyTickets, useMyVouchers } from "@/hooks/use-tickets";
import { AvailableVoucher } from "@/schemas/reservation";
import { BackendTicket, BackendTicketStatus } from "@/schemas/ticket";
import { TicketCard } from "./ticket-card";
import { VoucherCard } from "./voucher-card";
import { VoucherDetailDialog } from "./voucher-detail-dialog";

type TabId = "upcoming" | "past" | "vouchers";

const TABS = [
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
  { id: "vouchers", label: "Vouchers" },
] as const;

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

export function TicketAndVoucher() {
  const [activeTab, setActiveTab] = useState<TabId>("upcoming");
  const [selectedVoucher, setSelectedVoucher] =
    useState<AvailableVoucher | null>(null);

  const { data, isLoading, isError } = useMyTickets();
  const {
    data: vouchersResult,
    isLoading: isVouchersLoading,
    isError: isVouchersError,
  } = useMyVouchers(1, 100);

  const { upcoming, past } = useMemo(() => {
    const all = data?.data ?? [];
    return {
      upcoming: all.filter(isUpcoming),
      past: all.filter((ticket) => !isUpcoming(ticket)),
    };
  }, [data]);

  const vouchers = vouchersResult?.data ?? [];
  const tickets = activeTab === "upcoming" ? upcoming : past;

  return (
    <main className="page-container py-10">
      <div className="space-y-6">
        <div>
          <LabelBlock label="TICKETS & VOUCHERS" labelBorder="bottom" />
          <p className="mt-2 text-sm text-muted-foreground">
            {upcoming.length} upcoming | {past.length} past | {vouchers.length}{" "}
            vouchers
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabId)}
        >
          <div className="overflow-x-auto overflow-y-hidden border-b [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsList className="h-auto min-w-full justify-start rounded-none bg-transparent p-0">
              {TABS.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="relative flex-none rounded-none bg-transparent px-4 py-3 text-sm text-muted-foreground transition-colors duration-200 after:pointer-events-none after:absolute after:right-3 after:bottom-0 after:left-3 after:h-0.5 after:bg-foreground after:opacity-0 after:transition-opacity after:duration-200 data-[state=active]:bg-transparent data-[state=active]:text-foreground [&[data-state=active]::after]:opacity-100 sm:text-base"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent
            value="upcoming"
            className="pt-3 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-1 data-[state=active]:duration-200"
          >
            {isLoading ? (
              <TicketSkeletonList />
            ) : isError ? (
              <ErrorState message="Failed to load tickets. Please try again." />
            ) : tickets.length === 0 ? (
              <EmptyTicketState tab="upcoming" />
            ) : (
              <div className="flex flex-col gap-4 pb-12">
                {tickets.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="past"
            className="pt-3 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-1 data-[state=active]:duration-200"
          >
            {isLoading ? (
              <TicketSkeletonList />
            ) : isError ? (
              <ErrorState message="Failed to load tickets. Please try again." />
            ) : tickets.length === 0 ? (
              <EmptyTicketState tab="past" />
            ) : (
              <div className="flex flex-col gap-4 pb-12">
                {tickets.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="vouchers"
            className="pt-3 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-1 data-[state=active]:duration-200"
          >
            {isVouchersLoading ? (
              <VoucherSkeletonList />
            ) : isVouchersError ? (
              <ErrorState message="Failed to load vouchers. Please try again." />
            ) : vouchers.length === 0 ? (
              <EmptyVoucherState />
            ) : (
              <div className="flex flex-col gap-4 pb-12">
                {vouchers.map((voucher) => (
                  <VoucherCard
                    key={voucher.code}
                    voucher={voucher}
                    onOpenDetails={setSelectedVoucher}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <VoucherDetailDialog
        open={selectedVoucher !== null}
        voucher={selectedVoucher}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedVoucher(null);
          }
        }}
      />
    </main>
  );
}

function TicketSkeletonList() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((index) => (
        <div
          key={index}
          className="h-40 animate-pulse rounded-sm bg-muted sm:h-32"
        />
      ))}
    </div>
  );
}

function VoucherSkeletonList() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((index) => (
        <div key={index} className="h-48 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return <p className="text-sm text-destructive">{message}</p>;
}

function EmptyTicketState({ tab }: { tab: "upcoming" | "past" }) {
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

function EmptyVoucherState() {
  return (
    <div className="flex flex-col items-center gap-2 py-20 text-center">
      <p className="font-semibold text-foreground">No vouchers available</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Vouchers you own and can use will appear here.
      </p>
    </div>
  );
}
