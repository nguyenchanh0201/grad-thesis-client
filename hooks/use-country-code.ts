"use client";

import countriesData from "@/lib/locations/countries.json";

export type CountryCode = {
  code: string;
  name: string;
  flag: string;
};

export function useCountryCodes() {
  return {
    data: countriesData as CountryCode[],
    isLoading: false,
    isError: false,
  };
}
