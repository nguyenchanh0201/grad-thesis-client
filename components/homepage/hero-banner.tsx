"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";
import { CalendarDays, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

interface FeaturedEvent {
  id: string;
  title: string;
  category: string;
  date: string;
  venue: string;
  imageUrl: string;
  href: string;
}

const FEATURED_EVENTS: FeaturedEvent[] = [
  {
    id: "1",
    title: "Coldplay: Music Of The Spheres World Tour",
    category: "Concert",
    date: "Sat, Aug 2 · 7:00 PM",
    venue: "My Dinh National Stadium, Hanoi",
    imageUrl:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1400&q=80",
    href: "/events/1",
  },
  {
    id: "2",
    title: "UEFA Champions League Final 2026",
    category: "Sports",
    date: "Sat, May 30 · 8:00 PM",
    venue: "Allianz Arena, Munich",
    imageUrl:
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1400&q=80",
    href: "/events/2",
  },
  {
    id: "3",
    title: "The Weeknd: Hurry Up Tomorrow Tour",
    category: "Concert",
    date: "Fri, Sep 19 · 9:00 PM",
    venue: "Nha Thi Dau Nguyen Du, Ho Chi Minh City",
    imageUrl:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1400&q=80",
    href: "/events/3",
  },
  {
    id: "4",
    title: "F1 Vietnam Grand Prix 2026",
    category: "Motorsport",
    date: "Sun, Apr 5 · 2:00 PM",
    venue: "Hanoi Street Circuit, Hanoi",
    imageUrl:
      "https://images.unsplash.com/photo-1541889413457-4aec9b418977?w=1400&q=80",
    href: "/events/4",
  },
  {
    id: "5",
    title: "Cirque du Soleil: ALEGRÍA",
    category: "Theater",
    date: "Thu, Oct 9 · 7:30 PM",
    venue: "Saigon Exhibition Center, Ho Chi Minh City",
    imageUrl:
      "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=1400&q=80",
    href: "/events/5",
  },
];

const AUTOPLAY_DELAY = 5000;

export function HeroBanner() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const plugin = React.useRef(
    Autoplay({ delay: AUTOPLAY_DELAY, stopOnInteraction: true }),
  );

  React.useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  return (
    <section aria-label="Featured events" className="w-full">
      <Carousel
        setApi={setApi}
        plugins={[plugin.current]}
        opts={{ loop: true, align: "start" }}
        className="w-full"
      >
        <CarouselContent className="ml-0">
          {FEATURED_EVENTS.map((event) => (
            <CarouselItem key={event.id} className="pl-0">
              <Slide event={event} />
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Prev / Next */}
        <NavButton
          direction="prev"
          onClick={() => api?.scrollPrev()}
          aria-label="Previous slide"
        />
        <NavButton
          direction="next"
          onClick={() => api?.scrollNext()}
          aria-label="Next slide"
        />

        {/* Dot indicators */}
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
          {FEATURED_EVENTS.map((_, i) => (
            <button
              key={i}
              onClick={() => api?.scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === current
                  ? "w-6 bg-white"
                  : "w-1.5 bg-white/50 hover:bg-white/75",
              )}
            />
          ))}
        </div>
      </Carousel>
    </section>
  );
}

function Slide({ event }: { event: FeaturedEvent }) {
  return (
    <div className="relative h-[calc(100dvh-var(--header-height))] w-full overflow-hidden">
      <Image
        src={event.imageUrl}
        alt={event.title}
        fill
        sizes="100vw"
        className="object-cover"
        priority
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-14 md:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <Badge className="mb-3 border-0 bg-primary text-primary-foreground">
            {event.category}
          </Badge>
          <h2 className="mb-3 text-2xl font-bold leading-tight text-white drop-shadow md:text-4xl lg:text-5xl">
            {event.title}
          </h2>
          <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-white/80 md:text-base">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 shrink-0" />
              {event.date}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0" />
              {event.venue}
            </span>
          </div>
          <Link
            href={event.href}
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

function NavButton({
  direction,
  onClick,
  ...props
}: {
  direction: "prev" | "next";
  onClick: () => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const isPrev = direction === "prev";
  return (
    <button
      onClick={onClick}
      className={cn(
        "absolute top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-black/40 p-2.5 text-white backdrop-blur-sm transition hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-white md:flex",
        isPrev ? "left-4 lg:left-6" : "right-4 lg:right-6",
      )}
      {...props}
    >
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d={isPrev ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
        />
      </svg>
    </button>
  );
}
