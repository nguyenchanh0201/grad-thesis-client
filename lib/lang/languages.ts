export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "EN", name: "English" },
  { code: "vi", label: "VI", name: "Tiếng Việt" },
] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];
export type LanguageCode = Language["code"];
