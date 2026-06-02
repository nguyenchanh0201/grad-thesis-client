"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog } from "@/components/ui/alert-dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LabelBlock } from "@/components/event/label-block";
import { fmt } from "@/lib/strings/money";
import {
  useMyReservations,
  useMyTickets,
  useMyVouchers,
} from "@/hooks/use-tickets";
import { useCancelReservation, useReservation } from "@/hooks/use-booking";
import { AvailableVoucher, Reservation } from "@/schemas/reservation";
import { BackendTicket, BackendTicketStatus } from "@/schemas/ticket";
import { TicketGroupCard } from "./ticket-group-card";
import { ReservationCard } from "./reservation-card";
import { VoucherCard } from "./voucher-card";
import { VoucherDetailDialog } from "./voucher-detail-dialog";
import { OrderDetailDialog } from "./order-detail-dialog";
import { TicketDetailDialog } from "./ticket-detail-dialog";

type TabId = "all" | "upcoming" | "past" | "vouchers";

const TABS = [
  { id: "all", label: "All" },
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

// Group tickets by event slug, preserving order of first occurrence
function groupByEvent(tickets: BackendTicket[]): BackendTicket[][] {
  const map = new Map<string, BackendTicket[]>();
  for (const ticket of tickets) {
    const key = ticket.event.slug;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ticket);
  }
  return Array.from(map.values());
}

// Group tickets by order, preserving order of first occurrence.
function groupByOrder(tickets: BackendTicket[]): BackendTicket[][] {
  const map = new Map<string, BackendTicket[]>();
  for (const ticket of tickets) {
    const key = ticket.order?.id ?? `event:${ticket.event.slug}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ticket);
  }
  return Array.from(map.values());
}

function ticketGroupMatches(group: BackendTicket[], q: string): boolean {
  return group.some(
    (t) =>
      t.event.eventName.toLowerCase().includes(q) ||
      t.code.toLowerCase().includes(q) ||
      fmt(Number(t.ticketType.price)).includes(q) ||
      String(t.ticketType.price).includes(q) ||
      (t.seat != null &&
        `row ${t.seat.row} seat ${t.seat.column}`.toLowerCase().includes(q)),
  );
}

function reservationMatches(r: Reservation, q: string): boolean {
  return (
    (r.event?.eventName ?? "").toLowerCase().includes(q) ||
    fmt(r.totalAmount).includes(q) ||
    String(r.totalAmount).includes(q)
  );
}

export function TicketAndVoucher() {
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [query, setQuery] = useState("");
  const [selectedVoucher, setSelectedVoucher] =
    useState<AvailableVoucher | null>(null);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [reservationToCancel, setReservationToCancel] =
    useState<Reservation | null>(null);
  const [selectedTicketGroup, setSelectedTicketGroup] = useState<
    BackendTicket[] | null
  >(null);

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const highlightId = searchParams.get("r");
  const openedReservationParamRef = useRef<string | null>(null);

  const { data, isLoading, isError } = useMyTickets();
  const {
    data: vouchersResult,
    isLoading: isVouchersLoading,
    isError: isVouchersError,
  } = useMyVouchers(1, 100);
  const {
    data: reservationsResult,
    isLoading: isReservationsLoading,
    isError: isReservationsError,
  } = useMyReservations();
  const {
    data: highlightedReservationResult,
    isFetching: isHighlightedReservationFetching,
  } = useReservation(highlightId ?? undefined);
  const cancelReservationMutation = useCancelReservation();

  useEffect(() => {
    if (!highlightId) {
      openedReservationParamRef.current = null;
      return;
    }
    if (isHighlightedReservationFetching) return;

    const highlightedReservation = highlightedReservationResult?.data;
    if (!highlightedReservation) return;

    const timeoutId = window.setTimeout(() => {
      setActiveTab("all");
      setSelectedReservation(highlightedReservation);

      if (openedReservationParamRef.current !== highlightId) {
        openedReservationParamRef.current = highlightId;
        const el = document.getElementById(`reservation-${highlightId}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete("r");
      const nextQuery = nextParams.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [
    highlightId,
    highlightedReservationResult?.data,
    isHighlightedReservationFetching,
    pathname,
    router,
    searchParams,
  ]);

  const { upcomingGroups, pastGroups } = useMemo(() => {
    const all = data?.data ?? [];
    const upcoming = all.filter(isUpcoming);
    const past = all.filter((t) => !isUpcoming(t));
    return {
      upcomingGroups: groupByOrder(upcoming),
      pastGroups: groupByEvent(past),
    };
  }, [data]);

  const vouchers = vouchersResult?.data ?? [];
  const reservations = reservationsResult?.data ?? [];

  const q = query.trim().toLowerCase();

  const filteredUpcoming = q
    ? upcomingGroups.filter((g) => ticketGroupMatches(g, q))
    : upcomingGroups;

  const filteredPast = q
    ? pastGroups.filter((g) => ticketGroupMatches(g, q))
    : pastGroups;

  const filteredReservations = q
    ? reservations.filter((r) => reservationMatches(r, q))
    : reservations;

  const filteredVouchers = q
    ? vouchers.filter(
        (v) =>
          v.code.toLowerCase().includes(q) ||
          (v.description ?? "").toLowerCase().includes(q),
      )
    : vouchers;

  const handleConfirmCancelReservation = async () => {
    if (!reservationToCancel) return;
    try {
      await cancelReservationMutation.mutateAsync(reservationToCancel.id);
      if (selectedReservation?.id === reservationToCancel.id) {
        setSelectedReservation(null);
      }
      setReservationToCancel(null);
    } catch {
      // Keep the dialog open so the user can retry or keep the reservation.
    }
  };

  return (
    <main className="page-container py-10">
      <div className="space-y-6">
        <div>
          <LabelBlock label="TICKETS & VOUCHERS" labelBorder="bottom" />
          <p className="mt-2 text-sm text-muted-foreground">
            {upcomingGroups.length} upcoming · {pastGroups.length} past ·{" "}
            {reservations.length} total · {vouchers.length} vouchers
          </p>
        </div>

        {/* Search */}
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>
              <Search />
            </InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            type="text"
            placeholder="Search by event name, ticket code, or price..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                aria-label="Clear search"
                onClick={() => setQuery("")}
              >
                <X />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>

        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as TabId);
            setQuery("");
          }}
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
            value="all"
            className="pt-3 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-1 data-[state=active]:duration-200"
          >
            {isReservationsLoading ? (
              <TicketSkeletonList />
            ) : isReservationsError ? (
              <ErrorState message="Failed to load reservations. Please try again." />
            ) : filteredReservations.length === 0 ? (
              <EmptyState
                message={
                  q
                    ? `No reservations matching "${query}"`
                    : "No reservations yet"
                }
                description={
                  q
                    ? undefined
                    : "All your bookings — paid, pending, and expired — will appear here."
                }
                showBrowse={!q}
              />
            ) : (
              <div className="flex flex-col gap-4 pb-12">
                {filteredReservations.map((reservation) => (
                  <ReservationCard
                    key={reservation.id}
                    reservation={reservation}
                    onOpenDetails={setSelectedReservation}
                    onCancel={setReservationToCancel}
                    isCanceling={
                      cancelReservationMutation.isPending &&
                      reservationToCancel?.id === reservation.id
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="upcoming"
            className="pt-3 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-1 data-[state=active]:duration-200"
          >
            {isLoading ? (
              <TicketSkeletonList />
            ) : isError ? (
              <ErrorState message="Failed to load tickets. Please try again." />
            ) : filteredUpcoming.length === 0 ? (
              <EmptyState
                message={
                  q
                    ? `No upcoming tickets matching "${query}"`
                    : "No upcoming tickets"
                }
                description={
                  q
                    ? undefined
                    : "You don't have any upcoming events. Browse to find your next show."
                }
                showBrowse={!q}
              />
            ) : (
              <div className="flex flex-col gap-4 pb-12">
                {filteredUpcoming.map((group) => (
                  <TicketGroupCard
                    key={group[0].order?.id ?? group[0].event.slug}
                    tickets={group}
                    onOpenDetails={setSelectedTicketGroup}
                  />
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
            ) : filteredPast.length === 0 ? (
              <EmptyState
                message={
                  q ? `No past tickets matching "${query}"` : "No past tickets"
                }
                description={
                  q
                    ? undefined
                    : "Tickets for events you've attended will appear here."
                }
                showBrowse={false}
              />
            ) : (
              <div className="flex flex-col gap-4 pb-12">
                {filteredPast.map((group) => (
                  <TicketGroupCard
                    key={group[0].event.slug}
                    tickets={group}
                    onOpenDetails={setSelectedTicketGroup}
                  />
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
            ) : filteredVouchers.length === 0 ? (
              <EmptyState
                message={
                  q
                    ? `No vouchers matching "${query}"`
                    : "No vouchers available"
                }
                description={
                  q
                    ? undefined
                    : "Vouchers you own and can use will appear here."
                }
                showBrowse={false}
              />
            ) : (
              <div className="flex flex-col gap-4 pb-12">
                {filteredVouchers.map((voucher) => (
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
          if (!open) setSelectedVoucher(null);
        }}
      />
      <OrderDetailDialog
        open={selectedReservation !== null}
        reservation={selectedReservation}
        onOpenChange={(open) => {
          if (!open) setSelectedReservation(null);
        }}
      />
      <TicketDetailDialog
        open={selectedTicketGroup !== null}
        tickets={selectedTicketGroup}
        onOpenChange={(open) => {
          if (!open) setSelectedTicketGroup(null);
        }}
      />
      <AlertDialog
        open={reservationToCancel !== null}
        onOpenChange={(open) => {
          if (!open && !cancelReservationMutation.isPending) {
            setReservationToCancel(null);
          }
        }}
        title="Cancel this reservation?"
        description="This will release your reserved tickets and void any pending payment attempt for this order."
        confirmLabel={
          cancelReservationMutation.isPending ? "Canceling..." : "Cancel order"
        }
        cancelLabel="Keep reservation"
        confirmVariant="destructive"
        onConfirm={() => void handleConfirmCancelReservation()}
      />
    </main>
  );
}

function TicketSkeletonList() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-40 animate-pulse rounded-sm bg-muted sm:h-32"
        />
      ))}
    </div>
  );
}

function VoucherSkeletonList() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return <p className="text-sm text-destructive">{message}</p>;
}

function EmptyState({
  message,
  description,
  showBrowse,
}: {
  message: string;
  description?: string;
  showBrowse: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-5 py-20 text-center">
      <div className="space-y-1">
        <p className="font-semibold text-foreground">{message}</p>
        {description && (
          <p className="max-w-xs text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {showBrowse && (
        <Button asChild>
          <Link href="/">Browse Events</Link>
        </Button>
      )}
    </div>
  );
}
