"use client";

import { ReactNode, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Image from "next/image";

export interface EventItem {
  id: string;
  image: string;
  genre?: string;
  title: string;
  date?: string;
  venue?: string;
  price?: string;
  tag?: string;
}

interface EventCardProps {
  item: EventItem;
  variant: "horizontal" | "grid" | "vertical";
  className?: string;
}

export function EventCard({ item, variant, className }: EventCardProps) {
  const [imgError, setImgError] = useState(false);

  if (variant === "horizontal") {
    return (
      <div className={cn("w-80 shrink-0 cursor-pointer", className)}>
        <div className="relative w-full aspect-3/2 overflow-hidden rounded-xl bg-muted">
          {imgError ? (
            <div className="h-full w-full bg-muted" />
          ) : (
            <FilledImage event={item} onError={() => setImgError(true)} />
          )}
        </div>
        {item.genre && (
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {item.genre}
          </p>
        )}
        <p className="mt-1 line-clamp-2 text-base font-bold leading-snug text-foreground">
          {item.title}
        </p>
      </div>
    );
  }

  if (variant === "grid") {
    return (
      <div className={cn("group cursor-pointer", className)}>
        <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-muted">
          {imgError ? (
            <div className="h-full w-full bg-muted" />
          ) : (
            <FilledImage event={item} onError={() => setImgError(true)} />
          )}
          {item.tag && (
            <Badge className="absolute left-2 top-2 text-xs">{item.tag}</Badge>
          )}
        </div>
        <div className="mt-2 space-y-1">
          {(item.genre || item.date) && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {item.genre && <span className="uppercase">{item.genre}</span>}
              {item.genre && item.date && <span>·</span>}
              {item.date && <span>{item.date}</span>}
            </div>
          )}
          <p className="line-clamp-2 text-base font-bold leading-snug text-foreground">
            {item.title}
          </p>
          {(item.venue || item.price) && (
            <div className="flex items-center justify-between text-xs">
              {item.venue && (
                <span className="truncate text-muted-foreground">
                  {item.venue}
                </span>
              )}
              {item.price && (
                <span className="ml-2 shrink-0 font-semibold text-foreground">
                  {item.price}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vertical
  return (
    <div className={cn("flex cursor-pointer flex-row gap-3", className)}>
      <div className="w-1/3 shrink-0 aspect-3/2 overflow-hidden rounded-lg bg-muted">
        {imgError ? (
          <div className="h-full w-full bg-muted" />
        ) : (
          <FilledImage event={item} onError={() => setImgError(true)} />
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        {(item.tag || item.genre) && (
          <Badge variant="secondary" className="mb-0.5 w-fit text-xs">
            {item.tag ?? item.genre}
          </Badge>
        )}
        <p className="line-clamp-2 text-base font-bold leading-snug text-foreground">
          {item.title}
        </p>
        {(item.date || item.venue) && (
          <p className="truncate text-xs text-muted-foreground">
            {[item.date, item.venue].filter(Boolean).join(" · ")}
          </p>
        )}
        {item.price && (
          <p className="text-sm font-semibold text-foreground">{item.price}</p>
        )}
      </div>
    </div>
  );
}

function FilledImage({
  event,
  onError,
}: {
  event: EventItem;
  onError: () => void;
}) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-sm bg-muted">
      <Image
        fill
        src={event.image}
        alt={event.title}
        aria-label={event.title}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
