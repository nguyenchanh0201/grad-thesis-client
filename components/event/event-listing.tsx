"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { EventCard } from "./event-card";
import type { EventItem } from "./event-card";

interface EventListingProps {
  variant: "grid" | "horizontal" | "vertical";
  items: EventItem[];
  maxItems?: number;
  label?: string;
  labelPosition?: "top" | "bottom" | "left" | "right";
  labelBorder?: "top" | "bottom" | "left" | "right" | "none";
  labelAlign?: "left" | "right";
  onViewMore?: () => void;
  viewMoreLabel?: string;
  loadingMore?: boolean;
  className?: string;
  cardClassName?: string;
}

const DEFAULT_MAX: Record<EventListingProps["variant"], number> = {
  grid: 8,
  horizontal: 5,
  vertical: 6,
};

const CARD_WIDTH = 320;
const CARD_GAP = 20;

function LabelBlock({
  label,
  labelBorder = "bottom",
  labelAlign = "left",
  vertical = false,
}: {
  label: string;
  labelBorder?: EventListingProps["labelBorder"];
  labelAlign?: EventListingProps["labelAlign"];
  vertical?: boolean;
}) {
  const textCls = cn(
    "text-lg font-bold uppercase tracking-widest text-foreground select-none",
    vertical && "[writing-mode:vertical-rl] rotate-180",
  );
  const alignCls = labelAlign === "right" && !vertical ? "ml-auto" : "";
  const accentCls = "w-8 border-t-[3px] border-foreground";

  if (labelBorder === "top") {
    return (
      <div className={alignCls}>
        <div className={cn(accentCls, "mb-1")} />
        <span className={textCls}>{label}</span>
      </div>
    );
  }
  if (labelBorder === "bottom") {
    return (
      <div className={alignCls}>
        <span className={textCls}>{label}</span>
        <div className={cn(accentCls, "mt-1")} />
      </div>
    );
  }
  if (labelBorder === "left") {
    return (
      <div className={cn("border-l-[3px] border-foreground pl-2.5", alignCls)}>
        <span className={textCls}>{label}</span>
      </div>
    );
  }
  if (labelBorder === "right") {
    return (
      <div className={cn("border-r-[3px] border-foreground pr-2.5", alignCls)}>
        <span className={textCls}>{label}</span>
      </div>
    );
  }
  return (
    <div className={alignCls}>
      <span className={textCls}>{label}</span>
    </div>
  );
}

function ArrowBtn({
  direction,
  onClick,
  disabled,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Previous" : "Next"}
      className="flex h-9 w-9 items-center justify-center rounded border border-border transition-colors hover:border-foreground/50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {direction === "prev" ? (
        <ChevronLeft className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
    </button>
  );
}

function ViewMoreBtn({
  label,
  loading,
  onClick,
}: {
  label: string;
  loading?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl border border-border px-7 py-2.5 text-sm text-foreground transition-colors hover:border-foreground/50 disabled:pointer-events-none disabled:opacity-60"
    >
      {loading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
      ) : (
        <>
          {label}
          <ArrowUpRight className="h-4 w-4" />
        </>
      )}
    </button>
  );
}

export default function EventListing({
  variant,
  items,
  maxItems,
  label,
  labelPosition = "top",
  labelBorder = "bottom",
  labelAlign = "left",
  onViewMore,
  viewMoreLabel = "View more",
  loadingMore,
  className,
  cardClassName,
}: EventListingProps) {
  const resolvedMax = maxItems ?? DEFAULT_MAX[variant];
  const displayedItems = items.slice(0, resolvedMax);
  const maxIndex = Math.max(0, displayedItems.length - 1);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragDelta, setDragDelta] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const step = CARD_WIDTH + CARD_GAP;

  function prev() {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }
  function next() {
    setCurrentIndex((i) => Math.min(maxIndex, i + 1));
  }
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.touches[0].clientX - touchStartX.current;
    const maxRight = Math.min(step, currentIndex * step);
    const maxLeft = Math.min(step, (maxIndex - currentIndex) * step);
    setDragDelta(Math.max(-maxLeft, Math.min(maxRight, delta)));
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    setDragDelta(0);
    if (Math.abs(delta) >= 30) {
      if (delta < 0) next();
      else prev();
    }
  }

  const isLR = labelPosition === "left" || labelPosition === "right";

  const headerRow = label ? (
    <div className="flex items-center justify-between">
      <LabelBlock
        label={label}
        labelBorder={labelBorder}
        labelAlign={labelAlign}
      />
      {variant === "horizontal" && (
        <div className="flex gap-2">
          <ArrowBtn
            direction="prev"
            onClick={prev}
            disabled={currentIndex === 0}
          />
          <ArrowBtn
            direction="next"
            onClick={next}
            disabled={currentIndex === maxIndex}
          />
        </div>
      )}
    </div>
  ) : null;

  let itemList: React.ReactNode;

  if (variant === "horizontal") {
    itemList = (
      <div className="relative overflow-hidden">
        <div
          className="flex gap-5"
          style={{
            transform: `translateX(${-(currentIndex * step) + dragDelta}px)`,
            transition:
              dragDelta !== 0
                ? "none"
                : "transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {displayedItems.map((item) => (
            <EventCard
              key={item.id}
              item={item}
              variant="horizontal"
              className={cardClassName}
            />
          ))}
        </div>
      </div>
    );
  } else if (variant === "grid") {
    itemList = (
      <>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayedItems.map((item) => (
            <EventCard
              key={item.id}
              item={item}
              variant="grid"
              className={cardClassName}
            />
          ))}
        </div>
        {onViewMore && (
          <div className="mt-6 flex justify-center">
            <ViewMoreBtn
              label={viewMoreLabel}
              loading={loadingMore}
              onClick={onViewMore}
            />
          </div>
        )}
      </>
    );
  } else {
    itemList = (
      <>
        <div className="flex flex-col gap-5">
          {displayedItems.map((item) => (
            <EventCard
              key={item.id}
              item={item}
              variant="vertical"
              className={cardClassName}
            />
          ))}
        </div>
        {onViewMore && (
          <div className="mt-6 flex justify-center">
            <ViewMoreBtn
              label={viewMoreLabel}
              loading={loadingMore}
              onClick={onViewMore}
            />
          </div>
        )}
      </>
    );
  }

  if (!label) {
    return <section className={cn("w-full", className)}>{itemList}</section>;
  }

  // Left / right
  if (isLR) {
    return (
      <section
        className={cn(
          "flex w-full gap-6",
          labelPosition === "right" && "flex-row-reverse",
          className,
        )}
      >
        <div className="flex-shrink-0 self-start pt-2">
          <LabelBlock
            label={label}
            labelBorder={labelBorder}
            labelAlign={labelAlign}
            vertical
          />
        </div>
        <div className="min-w-0 flex-1">
          {variant === "horizontal" && (
            <div className="mb-3 flex justify-end gap-2">
              <ArrowBtn
                direction="prev"
                onClick={prev}
                disabled={currentIndex === 0}
              />
              <ArrowBtn
                direction="next"
                onClick={next}
                disabled={currentIndex === maxIndex}
              />
            </div>
          )}
          {itemList}
        </div>
      </section>
    );
  }

  // Top / bottom
  return (
    <section className={cn("flex w-full flex-col gap-4", className)}>
      {labelPosition === "top" && headerRow}
      {itemList}
      {labelPosition === "bottom" && headerRow}
    </section>
  );
}

export type { EventItem, EventListingProps };
