"use client";

import { useState, useEffect } from "react";
import {
  SUPPORTED_LANGUAGES,
  Language,
  LanguageCode,
} from "../lib/lang/languages";
import { DEFAULT_LANGUAGE, STORAGE_KEY } from "@/core/constants";

export function useLanguage() {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
    const found = SUPPORTED_LANGUAGES.find((l) => l.code === stored);
    return found ?? DEFAULT_LANGUAGE;
  });

  function changeLanguage(lang: Language) {
    setLanguage(lang);
    localStorage.setItem(STORAGE_KEY, lang.code);
    // When i18n is added: trigger router locale change here
  }

  return { language, changeLanguage };
}
