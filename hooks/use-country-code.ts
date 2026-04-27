"use client";

import { useQuery } from "@tanstack/react-query";

type RawCountry = {
  name: { common: string };
  cca2: string;
  idd: { root: string; suffixes?: string[] };
};

export type CountryCode = {
  code: string;
  name: string;
  flag: string;
};

const FALLBACK_CODES: CountryCode[] = [
  { code: "+84", name: "Vietnam", flag: "🇻🇳" },
  { code: "+1", name: "United States", flag: "🇺🇸" },
  { code: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "+65", name: "Singapore", flag: "🇸🇬" },
  { code: "+81", name: "Japan", flag: "🇯🇵" },
  { code: "+82", name: "South Korea", flag: "🇰🇷" },
  { code: "+86", name: "China", flag: "🇨🇳" },
  { code: "+61", name: "Australia", flag: "🇦🇺" },
  { code: "+33", name: "France", flag: "🇫🇷" },
  { code: "+49", name: "Germany", flag: "🇩🇪" },
];

function toFlag(cca2: string): string {
  return [...cca2.toUpperCase()]
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join("");
}

async function fetchCountryCodes(): Promise<CountryCode[]> {
  const res = await fetch(
    "https://restcountries.com/v3.1/all?fields=name,idd,cca2",
    { next: { revalidate: 86400 } }, // cache 24h in Next.js
  );
  if (!res.ok) throw new Error(`REST Countries responded with ${res.status}`);

  const data: RawCountry[] = await res.json();

  return data
    .flatMap((c) => {
      if (!c.idd?.root || !c.idd.suffixes?.length) return [];
      // Countries with multiple suffixes (e.g. +1-204, +1-212…) share root "+1"
      // Deduplicate by keeping only the root-level entry for readability
      const suffix = c.idd.suffixes.length === 1 ? c.idd.suffixes[0] : "";
      return [
        {
          code: `${c.idd.root}${suffix}`,
          name: c.name.common,
          flag: toFlag(c.cca2),
        },
      ];
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function useCountryCodes() {
  return useQuery({
    queryKey: ["country-codes"],
    queryFn: fetchCountryCodes,
    staleTime: Infinity,
    gcTime: Infinity,
    placeholderData: FALLBACK_CODES,
    retry: 1,
  });
}
