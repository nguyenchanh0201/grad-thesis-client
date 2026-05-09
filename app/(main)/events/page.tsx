"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { useEvents } from "@/hooks/use-events";
import { useCategories } from "@/hooks/use-taxonomy";
import { eventToEventItem } from "@/lib/event/adapters";
import { fmtShort } from "@/lib/date";
import { getLocations, slugToVenueCity } from "@/lib/locations/vi-cities";
import { EventStatus } from "@/schemas/event";
import { EventListing } from "@/components/event/event-listing";
import { cn } from "@/lib/utils";

const ALL_LOCATIONS = getLocations().flatMap((g) => g.locations);

function venueLabel(value: string): string {
  return ALL_LOCATIONS.find((l) => l.value === value)?.label ?? value;
}

function EventsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const q = searchParams.get("q") ?? undefined;
  const venue = searchParams.get("venue") ?? undefined;
  const dateFrom = searchParams.get("dateFrom") ?? undefined;
  const dateTo = searchParams.get("dateTo") ?? undefined;
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));

  const { data: result, isLoading } = useEvents({
    q,
    categoryId,
    venueCity: venue ? slugToVenueCity(venue) : undefined,
    eventDateFrom: dateFrom,
    eventDateTo: dateTo,
    status: EventStatus.ON_SALE,
    page,
    limit: 20,
  });

  const { data: categoriesResult } = useCategories();

  const events = result?.data?.map(eventToEventItem) ?? [];
  const meta = result?.meta;
  const totalItems = meta?.totalItems ?? 0;
  const totalPages = meta?.totalPages ?? 1;
  const categories =
    categoriesResult?.data?.filter((c) => c.isActive !== false) ?? [];

  function updateParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) params.set(key, value);
      else params.delete(key);
    }
    router.push(`/events?${params.toString()}`);
  }

  function setPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/events?${params.toString()}`);
  }

  const activeFilters = [
    q ? { key: "q", label: `"${q}"` } : null,
    venue ? { key: "venue", label: venueLabel(venue) } : null,
    dateFrom
      ? { key: "dateFrom", label: `From ${fmtShort(new Date(dateFrom))}` }
      : null,
    dateTo
      ? { key: "dateTo", label: `To ${fmtShort(new Date(dateTo))}` }
      : null,
  ].filter((f): f is { key: string; label: string } => f !== null);

  return (
    <main className="page-container py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          {q ? `Results for "${q}"` : "Browse Events"}
        </h1>
        {!isLoading && (
          <p className="mt-1 text-sm text-muted-foreground">
            {totalItems.toLocaleString()} event{totalItems !== 1 ? "s" : ""}{" "}
            found
          </p>
        )}
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => updateParams({ categoryId: undefined })}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              !categoryId
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:border-foreground/50",
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateParams({ categoryId: cat.id })}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                categoryId === cat.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:border-foreground/50",
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((f) => (
            <span
              key={f.key}
              className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm"
            >
              {f.label}
              <button
                onClick={() => updateParams({ [f.key]: undefined })}
                aria-label={`Remove ${f.key} filter`}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
          {activeFilters.length > 1 && (
            <button
              onClick={() =>
                updateParams({
                  q: undefined,
                  venue: undefined,
                  dateFrom: undefined,
                  dateTo: undefined,
                })
              }
              className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground hover:border-foreground/50 hover:text-foreground transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-24">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : events.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-lg font-semibold">No events found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <EventListing variant="grid" items={events} maxItems={events.length} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="flex size-9 items-center justify-center rounded-full border border-border transition-colors hover:border-foreground/50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="flex size-9 items-center justify-center rounded-full border border-border transition-colors hover:border-foreground/50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </main>
  );
}

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </main>
      }
    >
      <EventsContent />
    </Suspense>
  );
}
