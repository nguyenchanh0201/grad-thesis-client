"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { Language } from "@/lib/lang/languages";
import { DEFAULT_LANGUAGE, LANGUAGE_COOKIE } from "@/core/constants";

interface LanguageContextValue {
  language: Language;
  changeLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: DEFAULT_LANGUAGE,
  changeLanguage: () => {},
});

export function LanguageProvider({
  initialLanguage,
  children,
}: {
  initialLanguage: Language;
  children: React.ReactNode;
}) {
  const [language, setLanguage] = useState(initialLanguage);

  const changeLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    document.cookie = `${LANGUAGE_COOKIE}=${lang.code};path=/;max-age=31536000;SameSite=Lax`;
    // When i18n is added: trigger router locale change here
  }, []);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
