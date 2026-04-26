import { cookies } from "next/headers";
import { SUPPORTED_LANGUAGES } from "@/lib/lang/languages";
import type { LanguageCode, Language } from "@/lib/lang/languages";
import { DEFAULT_LANGUAGE, LANGUAGE_COOKIE } from "@/core/constants";

export async function getLanguageCookie(): Promise<Language> {
  const cookieStore = await cookies();
  const stored = cookieStore.get(LANGUAGE_COOKIE)?.value as
    | LanguageCode
    | undefined;
  return SUPPORTED_LANGUAGES.find((l) => l.code === stored) ?? DEFAULT_LANGUAGE;
}
