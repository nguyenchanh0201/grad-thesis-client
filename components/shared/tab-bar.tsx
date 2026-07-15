"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
}

export interface TabBarProps {
  tabs?: TabItem[];
  selected?: string;
  onChange?: (id: string) => void;
  className?: string;
  autoScroll?: boolean;
}

export default function TabBar({
  tabs = [],
  selected,
  onChange,
  autoScroll = true,
  className = "",
}: TabBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  const [internalSelected, setInternalSelected] = useState<string | undefined>(
    tabs[0]?.id,
  );
  const activeId = selected !== undefined ? selected : internalSelected;

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  };

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [tabs]);

  useEffect(() => {
    if (autoScroll && activeId && activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "nearest",
        block: "nearest",
      });
    }
  }, [activeId, autoScroll]);

  const handleTabClick = (id: string) => {
    if (selected === undefined) setInternalSelected(id);
    onChange?.(id);
  };

  const scrollBy = (offset: number) => {
    scrollRef.current?.scrollBy({ left: offset, behavior: "smooth" });
  };

  return (
    <div
      className={`w-full h-11 lg:h-12 bg-background border-b border-border relative ${className}`}
    >
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 hidden lg:flex pointer-events-none z-10 w-24">
          <div className="w-10 bg-background flex items-center justify-center pointer-events-auto">
            <Button
              variant="outline"
              className="w-full h-full flex items-center justify-center text-muted-foreground hover:text-foreground text-lg cursor-pointer transition-colors duration-150"
              onClick={() => scrollBy(-200)}
              aria-label="Scroll left"
            >
              &#8249;
            </Button>
          </div>
          <div className="w-14 bg-linear-to-r from-background to-transparent" />
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className="flex overflow-x-auto scroll-smooth h-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {tabs.map((tab) => {
          const isActive = activeId === tab.id;
          return (
            <Button
              variant="ghost"
              key={tab.id}
              ref={isActive ? activeTabRef : null}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                "inline-flex items-center whitespace-nowrap h-full relative cursor-pointer px-4 sm:px-6 text-sm sm:text-base transition-colors duration-150",
                isActive
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground font-normal hover:text-foreground",
              )}
            >
              {tab.icon && <span className="mr-2">{tab.icon}</span>}
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
              )}
            </Button>
          );
        })}
      </div>

      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 hidden lg:flex pointer-events-none z-10 w-24 justify-end">
          <div className="w-14 bg-linear-to-r from-transparent to-background" />
          <div className="w-10 bg-background flex items-center justify-center pointer-events-auto">
            <Button
              variant="outline"
              className="w-full h-full flex items-center justify-center text-muted-foreground hover:text-foreground text-lg cursor-pointer transition-colors duration-150"
              onClick={() => scrollBy(200)}
              aria-label="Scroll right"
            >
              &#8250;
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
