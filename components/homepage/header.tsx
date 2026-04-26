"use client";

import { useEffect, useRef } from "react";

import { Logo } from "./logo";
import { NavAuthBar } from "./nav-auth-bar";
import { EventSearch } from "../search/event-search";

export function Header() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      document.documentElement.style.setProperty(
        "--header-height",
        `${el.offsetHeight}px`,
      );
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <header ref={ref} className="w-full border-b border-border bg-background">
      <div className="flex flex-wrap items-center py-3">
        {/* Logo */}
        <div className="flex h-14 shrink-0 items-center px-4 lg:h-16 lg:px-6">
          <Logo />
        </div>

        {/* Login/Register Bar */}
        <div className="order-2 ml-auto flex h-14 items-center px-4 lg:order-3 lg:h-16 lg:px-6">
          <NavAuthBar />
        </div>

        {/* Search */}
        <div className="order-3 w-full pb-3 lg:order-2 lg:flex-1 lg:pb-0">
          <EventSearch />
        </div>
      </div>
    </header>
  );
}
