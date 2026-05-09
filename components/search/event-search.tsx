"use client";

import { Suspense, memo, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  MapPin,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getLocations, slugToVenueCity } from "@/lib/locations/vi-cities";
import { fmtShort, localDateToIso, localDateToEndOfDayIso } from "@/lib/date";
import { DatePicker } from "@/components/date/date-picker";
import { useEvents } from "@/hooks/use-events";
import { eventToEventItem } from "@/lib/event/adapters";
import { EventStatus } from "@/schemas/event";
import { EventListing } from "@/components/event/event-listing";

const FIELD_BASE =
  "!h-auto w-full rounded-none border-0 flex-col items-start justify-start gap-0.5 whitespace-normal hover:bg-muted focus-visible:ring-0 focus-visible:border-0 [&>svg:last-child]:hidden";

// Static — computed once at module load, never rebuilt on re-render
const LOCATION_GROUPS = getLocations();
const ALL_LOCATIONS = LOCATION_GROUPS.flatMap((g) => g.locations);

const LocationContent = memo(function LocationContent() {
  return (
    <SelectContent align="start" position="popper">
      {LOCATION_GROUPS.map((group) => (
        <SelectGroup key={group.label}>
          <SelectLabel className="text-[10px] font-semibold uppercase tracking-wider">
            {group.label}
          </SelectLabel>
          {group.locations.map((loc) => (
            <SelectItem key={loc.value} value={loc.value}>
              {loc.label}
            </SelectItem>
          ))}
        </SelectGroup>
      ))}
    </SelectContent>
  );
});

function EventSearchInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [location, setLocation] = useState(
    () => searchParams.get("venue") ?? "",
  );
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const v = searchParams.get("dateFrom");
    return v ? new Date(v) : null;
  });
  const [endDate, setEndDate] = useState<Date | null>(() => {
    const v = searchParams.get("dateTo");
    return v ? new Date(v) : null;
  });
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Immediate input state (no delay) + debounced value for API
  const [inputValue, setInputValue] = useState(
    () => searchParams.get("q") ?? "",
  );
  const [debouncedQuery, setDebouncedQuery] = useState(inputValue);
  const [showDropdown, setShowDropdown] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const datesDesktopRef = useRef<HTMLDivElement>(null);
  const datesMobileRef = useRef<HTMLDivElement>(null);

  // Debounce the query by 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(inputValue.trim()), 300);
    return () => clearTimeout(t);
  }, [inputValue]);

  // Close dropdown and date picker on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      const t = e.target as Node;
      if (!containerRef.current?.contains(t)) {
        setShowDropdown(false);
        setDatePickerOpen(false);
      }
      if (
        datePickerOpen &&
        !datesDesktopRef.current?.contains(t) &&
        !datesMobileRef.current?.contains(t)
      ) {
        setDatePickerOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [datePickerOpen]);

  // Dropdown search — only fires when query is ≥2 chars
  const searchEnabled = debouncedQuery.length >= 2;
  const { data: dropdownResult, isLoading: dropdownLoading } = useEvents(
    {
      q: debouncedQuery,
      venueCity: location ? slugToVenueCity(location) : undefined,
      eventDateFrom: startDate ? localDateToIso(startDate) : undefined,
      eventDateTo: startDate
        ? localDateToEndOfDayIso(endDate ?? startDate)
        : undefined,
      status: EventStatus.ON_SALE,
      limit: 8,
    },
    searchEnabled,
  );
  const dropdownItems = useMemo(
    () => dropdownResult?.data?.map(eventToEventItem).slice(0, 8) ?? [],
    [dropdownResult],
  );
  const dropdownTotal = dropdownResult?.meta?.totalItems ?? 0;
  const showResults = showDropdown && searchEnabled;

  function handleSearch() {
    const params = new URLSearchParams();
    const q = inputValue.trim();
    if (q) params.set("q", q);
    if (location) params.set("venue", location);
    if (startDate) {
      params.set("dateFrom", localDateToIso(startDate));
      params.set("dateTo", localDateToEndOfDayIso(endDate ?? startDate));
    }
    setShowDropdown(false);
    router.push(`/events?${params.toString()}`);
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSearch();
    if (e.key === "Escape") setShowDropdown(false);
  }

  const dateLabel = startDate
    ? endDate
      ? `${fmtShort(startDate)} - ${fmtShort(endDate)}`
      : fmtShort(startDate)
    : null;

  const selectedLocationLabel = useMemo(
    () => ALL_LOCATIONS.find((l) => l.value === location)?.label ?? null,
    [location],
  );

  // Only label + value — chevron/clear rendered as sibling Button outside the trigger
  const datesTrigger = (placeholder: string) => (
    <>
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Calendar className="size-3 shrink-0" />
        Dates
      </span>
      <span
        className={cn(
          "truncate text-sm",
          dateLabel ? "font-medium text-foreground" : "text-muted-foreground",
        )}
      >
        {dateLabel ?? placeholder}
      </span>
    </>
  );

  const datesAdornment = dateLabel ? (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Clear dates"
      onClick={() => {
        setStartDate(null);
        setEndDate(null);
      }}
      className="absolute right-2 top-1/2 -translate-y-1/2"
    >
      <X />
    </Button>
  ) : (
    <ChevronDown
      className={cn(
        "pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-transform duration-200",
        datePickerOpen && "rotate-180",
      )}
    />
  );

  const pickerProps = {
    initStart: startDate,
    initEnd: endDate,
    onApply: (s: Date | null, e: Date | null) => {
      setStartDate(s);
      setEndDate(e);
    },
    onClose: () => setDatePickerOpen(false),
  };

  const viewAllHref = `/events?q=${encodeURIComponent(debouncedQuery)}`;

  const dropdown = showResults ? (
    <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-background shadow-xl">
      {dropdownLoading && dropdownItems.length === 0 ? (
        <div className="flex items-center justify-center py-6">
          <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : dropdownItems.length === 0 ? (
        <p className="px-4 py-5 text-sm text-muted-foreground">
          No results for &ldquo;{debouncedQuery}&rdquo;
        </p>
      ) : (
        <>
          <div className="px-4 py-3" onClick={() => setShowDropdown(false)}>
            <EventListing
              variant="vertical"
              items={dropdownItems}
              maxItems={dropdownItems.length}
            />
          </div>
          <Link
            href={viewAllHref}
            onClick={() => setShowDropdown(false)}
            className="flex items-center justify-between border-t border-border px-4 py-3 text-sm font-medium text-primary hover:bg-muted transition-colors"
          >
            <span>View all results for &ldquo;{debouncedQuery}&rdquo;</span>
            <ChevronRight className="size-4 shrink-0" />
          </Link>
        </>
      )}
    </div>
  ) : null;

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-4xl px-4">
      {/* Desktop */}
      <div className="hidden items-stretch rounded-sm border border-border bg-background md:flex">
        {/* Location */}
        <div className="relative flex-1">
          <Select value={location} onValueChange={(v) => setLocation(v ?? "")}>
            <SelectTrigger
              className={cn(
                FIELD_BASE,
                "w-full px-5 py-3.5",
                selectedLocationLabel && "pr-10",
              )}
            >
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <MapPin className="size-3 shrink-0" />
                Location
              </span>
              <span
                className={cn(
                  "truncate text-sm",
                  selectedLocationLabel
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {selectedLocationLabel ?? "Select location"}
              </span>
            </SelectTrigger>
            <LocationContent />
          </Select>
          {selectedLocationLabel && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Clear location"
              onClick={() => setLocation("")}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2"
            >
              <X />
            </Button>
          )}
        </div>

        <div className="my-3 w-px bg-border" />

        {/* Dates */}
        <div ref={datesDesktopRef} className="relative flex-1">
          <button
            type="button"
            onClick={() => setDatePickerOpen((v) => !v)}
            className="flex h-full w-full flex-col gap-0.5 px-5 py-3.5 pr-10 text-left outline-none transition-colors hover:bg-muted"
          >
            {datesTrigger("Select dates")}
          </button>
          {datesAdornment}
          {datePickerOpen && (
            <div className="absolute top-full left-0 z-60 mt-2">
              <DatePicker {...pickerProps} />
            </div>
          )}
        </div>

        <div className="my-3 w-px bg-border" />

        {/* Search input */}
        <div className="flex flex-[1.5] items-stretch">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 px-5 py-3.5">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Search className="size-3 shrink-0" />
              Search
            </span>
            <input
              type="text"
              placeholder="Event name, artists..."
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => inputValue.length >= 2 && setShowDropdown(true)}
              onKeyDown={onInputKeyDown}
              className="bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex items-center pr-1.5">
            <Button
              onClick={handleSearch}
              className="h-[calc(100%-12px)] rounded-sm px-6"
            >
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="flex flex-col gap-2 md:hidden">
        <div className="flex gap-2">
          {/* Location */}
          <div className="relative flex-1">
            <Select
              value={location}
              onValueChange={(v) => setLocation(v ?? "")}
            >
              <SelectTrigger
                className={cn(
                  FIELD_BASE,
                  "w-full rounded-sm border border-border p-3",
                  selectedLocationLabel && "pr-8",
                )}
              >
                <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <MapPin className="size-3 shrink-0" />
                  Location
                </span>
                <span
                  className={cn(
                    "truncate text-sm",
                    selectedLocationLabel
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {selectedLocationLabel ?? "Location"}
                </span>
              </SelectTrigger>
              <LocationContent />
            </Select>
            {selectedLocationLabel && (
              <button
                type="button"
                aria-label="Clear location"
                onClick={() => setLocation("")}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Dates */}
          <div ref={datesMobileRef} className="relative flex-1">
            <button
              type="button"
              onClick={() => setDatePickerOpen((v) => !v)}
              className="flex w-full flex-col gap-0.5 rounded-sm border border-border p-3 pr-10 text-left outline-none transition-colors hover:bg-muted"
            >
              {datesTrigger("Dates")}
            </button>
            {datesAdornment}
            {datePickerOpen && (
              <div className="absolute top-full right-0 z-60 mt-1">
                <DatePicker {...pickerProps} isMobile />
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 rounded-sm border border-border bg-background p-3">
          <input
            type="text"
            placeholder="Search for events, artists, ..."
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => inputValue.length >= 2 && setShowDropdown(true)}
            onKeyDown={onInputKeyDown}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={handleSearch}
            className="shrink-0 rounded-sm p-5"
          >
            <Search />
          </Button>
        </div>
      </div>

      {dropdown}
    </div>
  );
}

export function EventSearch() {
  return (
    <Suspense>
      <EventSearchInner />
    </Suspense>
  );
}
