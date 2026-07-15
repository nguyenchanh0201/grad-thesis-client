"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import React, { UIEvent, useMemo, useState, useDeferredValue } from "react";

import { cn } from "@/lib/utils";

import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
  CommandGroup,
} from "@/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Button } from "@/components/ui/button";

type Country = {
  code: string;
  name: string;
  flag: string;
};

type Props = {
  value?: string;
  onChange: (value: string) => void;
  countries: Country[];
  placeholder?: string;
};

const INCREMENT_COUNTRIES_DISPLAYED = 30;

export function CountryCodeSelect({
  value,
  onChange,
  countries,
  placeholder = "Code",
}: Props) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);

  const [displayLimit, setDisplayLimit] = useState(
    INCREMENT_COUNTRIES_DISPLAYED,
  );

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setSearchQuery("");
      setDisplayLimit(INCREMENT_COUNTRIES_DISPLAYED);
    }
  };

  const selected = useMemo(
    () => countries.find((c) => c.code === value),
    [countries, value],
  );

  const filteredCountries = useMemo(() => {
    if (!deferredQuery) return countries;

    const lower = deferredQuery.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.code.toLowerCase().includes(lower),
    );
  }, [countries, deferredQuery]);

  const displayedCountries = useMemo(
    () => filteredCountries.slice(0, displayLimit),
    [filteredCountries, displayLimit],
  );

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 50) {
      setDisplayLimit((prev) =>
        Math.min(
          prev + INCREMENT_COUNTRIES_DISPLAYED,
          filteredCountries.length,
        ),
      );
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-9 justify-between"
        >
          {selected ? (
            <span className="flex items-center gap-1 truncate">
              <span>{selected.flag}</span>
              <span>{selected.code}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}

          <ChevronsUpDown className="ml-1 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="
          w-[--radix-popover-trigger-width]
          min-w-30
          max-w-50
          p-0
        "
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search..."
            className="h-9"
            value={searchQuery}
            onValueChange={(value) => {
              setSearchQuery(value);
              setDisplayLimit(INCREMENT_COUNTRIES_DISPLAYED);
            }}
          />

          <CommandList
            className="max-h-56 overflow-y-auto"
            onScroll={handleScroll}
          >
            {displayedCountries.length === 0 ? (
              <CommandEmpty>No results found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {displayedCountries.map((c) => (
                  <CommandItem
                    key={`${c.name}-${c.code}`}
                    value={`${c.name} ${c.code}`}
                    onSelect={() => {
                      onChange(c.code);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <span className="mr-2">{c.flag}</span>
                    <span className="truncate">{c.code}</span>

                    <Check
                      className={cn(
                        "ml-auto",
                        value === c.code ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
