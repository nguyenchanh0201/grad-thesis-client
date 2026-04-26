"use client";

import React, { useRef, useState, useEffect } from "react";
import { Button } from "../ui/button";

export interface CategoryItem {
  id: string;
  label: string;
  icon?: string;
}

export interface CategoryTabBarProps {
  categories?: CategoryItem[];
  selected?: string;
  onChange?: (id: string) => void;
  className?: string;
}

const defaultCategories: CategoryItem[] = [
  { id: "all", label: "All" },
  { id: "live-music", label: "Live Music" },
  { id: "fan-meeting", label: "Fan Meeting" },
  { id: "merchandise", label: "Merchandise" },
  { id: "stage-art", label: "Stage & Art" },
  { id: "sports", label: "Sports" },
  { id: "conferences", label: "Conferences & Community" },
  { id: "courses", label: "Courses" },
];

export default function CategoryTabBar({
  categories = defaultCategories,
  selected,
  onChange,
  className = "",
}: CategoryTabBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  const [internalSelected, setInternalSelected] = useState<string | undefined>(
    categories?.[0]?.id,
  );
  const activeId = selected !== undefined ? selected : internalSelected;

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [categories]);

  useEffect(() => {
    if (activeId && activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "nearest",
        block: "nearest",
      });
    }
  }, [activeId]);

  const handleScroll = () => {
    updateScrollState();
  };

  const scrollBy = (offset: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <div
      className={`w-full h-11 lg:h-12 mb-12 bg-background border-b border-border relative ${className}`}
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

      {/* Scrollable Track */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto scroll-smooth h-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {categories.map((cat) => {
          const isActive = activeId === cat.id;
          return (
            <Button
              variant="ghost"
              key={cat.id}
              ref={isActive ? activeTabRef : null}
              onClick={() => {
                if (selected === undefined) {
                  setInternalSelected(cat.id);
                }
                onChange?.(cat.id);
              }}
              className={`
                inline-flex items-center whitespace-nowrap h-full relative cursor-pointer
                px-4 sm:px-6 
                text-sm sm:text-base
                transition-colors duration-150
                ${
                  isActive
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground font-normal hover:text-foreground"
                }
              `}
            >
              {cat.icon && <span className="mr-2">{cat.icon}</span>}
              {cat.label}

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
