"use client";

import { useLanguage, SUPPORTED_LANGUAGES } from "@/lib/lang";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { FlagIcon } from "@/components/icons/flags";

export function LangSelector() {
  const { language, changeLanguage } = useLanguage();

  return (
    <div className="flex items-center">
      <Select
        value={language.code}
        onValueChange={(code) => {
          const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
          if (lang) changeLanguage(lang);
        }}
      >
        <SelectTrigger
          className={cn(
            "border-0 bg-transparent px-2 shadow-none gap-2",
            "focus-visible:ring-0 focus-visible:border-0",
            "[&[aria-expanded=true]_svg:last-child]:rotate-180 [&_svg:last-child]:transition-transform",
          )}
        >
          <FlagIcon code={language.code} className="shrink-0" />
          <span className="hidden lg:inline text-sm font-medium text-foreground">
            {language.label}
          </span>
        </SelectTrigger>

        <SelectContent align="end" alignItemWithTrigger={false} sideOffset={6}>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code} className="py-3 pl-3">
              <FlagIcon code={lang.code} className="shrink-0" />
              {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
