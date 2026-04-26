"use client";

import { useState } from "react";
import { Menu, Search } from "lucide-react";
import { NavAuthBar } from "./nav-auth-bar";
import { Logo } from "./logo";
import { EventSearch } from "../search/event-search";

export function Header() {
  const [, setMenuOpen] = useState(false);

  return (
    <header className="w-full border-b border-border bg-background">
      <div className="hidden h-16 items-center gap-4 px-6 md:flex">
        <Logo />

        <div className="flex flex-1 items-center justify-center">
          <EventSearch />
        </div>

        <div className="shrink-0">
          <NavAuthBar />
        </div>
      </div>

      <div className="md:hidden">
        <div className="flex h-14 items-center px-4">
          <Logo />
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Open menu"
            className="ml-auto border-0 bg-transparent p-0 text-foreground"
          >
            <Menu size={24} />
          </button>
        </div>

        <div className="px-4 pb-3">
          <EventSearch />
        </div>
      </div>
    </header>
  );
}
