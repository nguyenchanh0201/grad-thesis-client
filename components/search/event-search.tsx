"use client";

import { useEffect, useRef, useState } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
} from "lucide-react";

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
import { getLocations } from "@/lib/locations/vi-cities";
import { fmtShort } from "@/lib/date";
import { DatePicker } from "@/components/date/date-picker";

const FIELD_BASE =
  "!h-auto w-full rounded-none border-0 flex-col items-start justify-start gap-0.5 whitespace-normal hover:bg-muted focus-visible:ring-0 focus-visible:border-0 [&>svg:last-child]:hidden";

export function EventSearch() {
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [query, setQuery] = useState("");

  const locationGroups = getLocations();
  const selectedLocationLabel =
    locationGroups.flatMap((g) => g.locations).find((l) => l.value === location)
      ?.label ?? null;
  const datesDesktopRef = useRef<HTMLDivElement>(null);
  const datesMobileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!datePickerOpen) return;
    function onOutside(e: MouseEvent) {
      const t = e.target as Node;
      if (
        !datesDesktopRef.current?.contains(t) &&
        !datesMobileRef.current?.contains(t)
      ) {
        setDatePickerOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [datePickerOpen]);

  function handleSearch() {
    // TODO: wire up router with search params
  }

  const dateLabel = startDate
    ? endDate
      ? `${fmtShort(startDate)} – ${fmtShort(endDate)}`
      : fmtShort(startDate)
    : null;

  const locationContent = (
    <SelectContent align="start" alignItemWithTrigger={false}>
      {locationGroups.map((group) => (
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

  const datesTrigger = (placeholder: string) => (
    <>
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Calendar className="size-3 shrink-0" />
        Dates
      </span>
      <span className="flex w-full items-center justify-between text-sm">
        <span
          className={cn(
            "truncate",
            dateLabel ? "font-medium text-foreground" : "text-muted-foreground",
          )}
        >
          {dateLabel ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            "ml-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            datePickerOpen && "rotate-180",
          )}
        />
      </span>
    </>
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

  return (
    <div className="mx-auto w-full max-w-4xl px-4">
      {/* Desktop */}
      <div className="hidden items-stretch rounded-sm border border-border bg-background shadow-md sm:flex">
        {/* Location */}
        <Select value={location} onValueChange={(v) => setLocation(v ?? "")}>
          <SelectTrigger className={cn(FIELD_BASE, "flex-1 px-5 py-3.5")}>
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
          {locationContent}
        </Select>

        <div className="my-3 w-px bg-border" />

        {/* Dates */}
        <div ref={datesDesktopRef} className="relative flex-1">
          <button
            type="button"
            onClick={() => setDatePickerOpen((v) => !v)}
            className="flex h-full w-full flex-col gap-0.5 px-5 py-3.5 text-left outline-none transition-colors hover:bg-muted"
          >
            {datesTrigger("Select dates")}
          </button>
          {datePickerOpen && (
            <div className="absolute top-full left-0 z-50 mt-2">
              <DatePicker {...pickerProps} />
            </div>
          )}
        </div>

        <div className="my-3 w-px bg-border" />

        {/* Search */}
        <div className="flex flex-[1.5] items-stretch">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 px-5 py-3.5">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Search className="size-3 shrink-0" />
              Search
            </span>
            <input
              type="text"
              placeholder="Event name, artists..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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
      <div className="flex flex-col gap-2 sm:hidden">
        <div className="flex gap-2">
          {/* Location */}
          <Select value={location} onValueChange={(v) => setLocation(v ?? "")}>
            <SelectTrigger
              className={cn(
                FIELD_BASE,
                "flex-1 rounded-sm border border-border p-3",
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
            {locationContent}
          </Select>

          {/* Dates */}
          <div ref={datesMobileRef} className="relative flex-1">
            <button
              type="button"
              onClick={() => setDatePickerOpen((v) => !v)}
              className="flex w-full flex-col gap-0.5 rounded-sm border border-border p-3 text-left outline-none transition-colors hover:bg-muted"
            >
              {datesTrigger("Dates")}
            </button>
            {datePickerOpen && (
              <div className="absolute top-full right-0 z-50 mt-1">
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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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
    </div>
  );
}
