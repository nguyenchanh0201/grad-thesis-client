"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

export interface ImageCarouselProps {
  children: React.ReactNode;
  autoplayDelay?: number;
  className?: string;
  itemClassName?: string;
}

export function ImageCarousel({
  children,
  autoplayDelay = 5000,
  className,
  itemClassName = "pl-0",
}: ImageCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([]);

  const plugin = React.useRef(
    Autoplay({ delay: autoplayDelay, stopOnInteraction: true }),
  );

  React.useEffect(() => {
    if (!api) return;
    setScrollSnaps(api.scrollSnapList());
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => setCurrent(api.selectedScrollSnap()));
    api.on("reInit", () => {
      setScrollSnaps(api.scrollSnapList());
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <Carousel
      setApi={setApi}
      plugins={[plugin.current]}
      opts={{ loop: true, align: "start" }}
      className={cn("w-full", className)}
    >
      <CarouselContent className="ml-0">
        {React.Children.map(children, (child, index) => {
          if (React.isValidElement(child)) {
            return (
              <CarouselItem key={child.key ?? index} className={itemClassName}>
                {child}
              </CarouselItem>
            );
          }
          return null;
        })}
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
      {scrollSnaps.length > 0 && (
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
          {scrollSnaps.map((_, i) => (
            <button
              type="button"
              key={i}
              onClick={() => api?.scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-white cursor-pointer",
                i === current
                  ? "w-6 bg-white"
                  : "w-1.5 bg-white/50 hover:bg-white/75",
              )}
            />
          ))}
        </div>
      )}
    </Carousel>
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
      type="button"
      onClick={onClick}
      className={cn(
        "absolute top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full cursor-pointer bg-black/40 p-2.5 text-white backdrop-blur-sm transition hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-white md:flex",
        isPrev ? "left-4 lg:left-6" : "right-4 lg:right-6",
      )}
      {...props}
    >
      {isPrev ? (
        <ChevronLeft className="h-5 w-5" />
      ) : (
        <ChevronRight className="h-5 w-5" />
      )}
    </button>
  );
}
