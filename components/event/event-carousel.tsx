"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { EventCard } from "./event-card";
import type { EventItem } from "./event-card";
import { ViewMoreBtn } from "../shared/view-more-btn";
import type { EventListingProps } from "./event-listing";
import { LabelBlock } from "./label-block";

const CARD_WIDTH = 320;
const CARD_GAP = 20;

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
    <Button
      variant="outline"
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
    </Button>
  );
}

type EventCarouselProps = Pick<
  EventListingProps,
  | "items"
  | "maxItems"
  | "label"
  | "labelPosition"
  | "labelBorder"
  | "labelAlign"
  | "onViewMore"
  | "viewMoreLabel"
  | "loadingMore"
  | "className"
  | "cardClassName"
>;

export function EventCarousel({
  items,
  maxItems = 5,
  label,
  labelPosition = "top",
  labelBorder = "bottom",
  labelAlign = "left",
  onViewMore,
  viewMoreLabel = "View more",
  loadingMore,
  className,
  cardClassName,
}: EventCarouselProps) {
  const displayedItems = items.slice(0, maxItems);
  const maxIndex = Math.max(0, displayedItems.length - 1);
  const step = CARD_WIDTH + CARD_GAP;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragDelta, setDragDelta] = useState(0);
  const touchStartX = useRef<number | null>(null);

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

  const arrows = (
    <div className="flex gap-2">
      <ArrowBtn direction="prev" onClick={prev} disabled={currentIndex === 0} />
      <ArrowBtn
        direction="next"
        onClick={next}
        disabled={currentIndex === maxIndex}
      />
    </div>
  );

  const track = (
    <>
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

  if (isLR) {
    return (
      <section
        className={cn(
          "flex w-full gap-6",
          labelPosition === "right" && "flex-row-reverse",
          className,
        )}
      >
        {label && (
          <div className="shrink-0 self-start pt-2">
            <LabelBlock
              label={label}
              labelBorder={labelBorder}
              labelAlign={labelAlign}
              vertical
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex justify-end gap-2">{arrows}</div>
          {track}
        </div>
      </section>
    );
  }

  return (
    <section className={cn("flex w-full flex-col gap-4", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <LabelBlock
            label={label}
            labelBorder={labelBorder}
            labelAlign={labelAlign}
          />
          {arrows}
        </div>
      )}
      {track}
    </section>
  );
}
