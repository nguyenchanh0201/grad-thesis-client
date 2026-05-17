"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ImageCarousel } from "@/components/shared/image-carousel";
import { isSvgImageSource } from "@/lib/image/is-svg-image-source";
import type { EventItem } from "@/components/event/event-card";

const AUTOPLAY_DELAY = 5000;

interface HeroBannerProps {
  items: EventItem[];
}

export function HeroBanner({ items }: HeroBannerProps) {
  if (items.length === 0) return null;

  return (
    <section aria-label="Featured events" className="w-full">
      <ImageCarousel autoplayDelay={AUTOPLAY_DELAY}>
        {items.map((item) => (
          <Slide key={item.id} item={item} />
        ))}
      </ImageCarousel>
    </section>
  );
}

function Slide({ item }: { item: EventItem }) {
  const href = item.slug ? `/events/${item.slug}` : `/events/${item.id}`;
  const category = item.genre ?? item.tag;

  return (
    <div className="relative h-[calc(100dvh-var(--header-height))] w-full overflow-hidden">
      {item.image && (
        <Image
          src={item.image}
          alt={item.title}
          fill
          sizes="100vw"
          className="object-cover"
          priority
          unoptimized={isSvgImageSource(item.image)}
        />
      )}
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-14 md:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl">
          {category && (
            <Badge className="mb-3 border-0 bg-primary text-primary-foreground">
              {category}
            </Badge>
          )}
          <h2 className="mb-3 text-2xl font-bold leading-tight text-white drop-shadow md:text-4xl lg:text-5xl">
            {item.title}
          </h2>
          <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-white/80 md:text-base">
            {item.date && (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 shrink-0" />
                {item.date}
              </span>
            )}
            {item.venue && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0" />
                {item.venue}
              </span>
            )}
          </div>
          <Link
            href={href}
            className={buttonVariants({
              size: "lg",
              className: "font-semibold",
            })}
          >
            Learn More
          </Link>
        </div>
      </div>
    </div>
  );
}
