"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  Ticket,
  Facebook,
  Globe,
  Instagram,
  Twitter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDisplayPrice } from "@/lib/strings/money";
import { fmtIsoDate, fmtIsoTime } from "@/lib/date";
import { DEFAULT_CURRENCY } from "@/core/constants";
import { EventStatus } from "@/schemas/event";
import type { EventDetail } from "@/schemas/event";
import { useAuthStore } from "@/lib/store/auth.store";
import { isSvgImageSource } from "@/lib/image/is-svg-image-source";
import { ImageCarousel } from "@/components/shared/image-carousel";

function eventBgColor(title: string): string {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) | 0;
  return `hsl(${(h >>> 0) % 360}, 40%, 30%)`;
}

interface EventDetailHeaderProps {
  event: EventDetail;
  ctaLabel?: string;
  onCTAClick?: () => void;
}

const STATUS_BADGE: Partial<
  Record<
    EventStatus,
    {
      label: string;
      variant: "success" | "destructive" | "secondary" | "warning";
    }
  >
> = {
  [EventStatus.ON_SALE]: { label: "For Sale", variant: "success" },
  [EventStatus.SOLD_OUT]: { label: "Sold Out", variant: "destructive" },
  [EventStatus.CANCELLED]: { label: "Cancelled", variant: "secondary" },
  [EventStatus.DRAFT]: { label: "Draft", variant: "warning" },
};

export function EventDetailHeader({
  event,
  ctaLabel,
  onCTAClick,
}: EventDetailHeaderProps) {
  const mobileCTARef = useRef<HTMLButtonElement>(null);
  const [mobileCTAHeight, setMobileCTAHeight] = useState(0);
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isLoggedIn = !!user;

  useEffect(() => {
    const el = mobileCTARef.current;
    if (!el) return;
    const update = () => setMobileCTAHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const badge = event.status ? STATUS_BADGE[event.status] : null;
  const firstDate = event.dates[0];
  const extraDates = event.dates.length - 1;
  const buttonLabel =
    isInitialized && !isLoggedIn
      ? (ctaLabel ?? "Login required to buy tickets")
      : "Buy Tickets";
  const hasSocialLinks =
    event.socialLinks?.facebook ||
    event.socialLinks?.website ||
    event.socialLinks?.instagram ||
    event.socialLinks?.twitter;
  console.log(event.images);

  return (
    <section
      aria-label="Event overview"
      className="relative w-full overflow-hidden"
      style={{ background: "#0a0a0f" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 50%, rgba(180,120,0,0.25) 0%, transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at 80% 50%, rgba(100,60,180,0.2) 0%, transparent 60%)",
        }}
      />

      <div className="page-container relative z-10 py-8 md:py-12">
        <div className="flex flex-col gap-6 md:grid md:grid-cols-[2fr_3fr] md:gap-10">
          <div className="flex flex-col gap-4">
            <div
              className="relative aspect-video overflow-hidden rounded-md md:aspect-auto md:flex-1 md:min-h-0"
              style={
                !event.images?.length
                  ? { backgroundColor: eventBgColor(event.title) }
                  : undefined
              }
            >
              {event.images && event.images.length > 0 && (
                <ImageCarousel
                  className="h-full **:data-[slot=carousel-content]:h-full [&_[data-slot=carousel-content]>div]:h-full"
                  itemClassName="pl-0 h-full"
                >
                  {event.images.map((img, i) => (
                    <div key={i} className="relative h-full w-full">
                      <Image
                        src={img}
                        alt={`${event.title} - poster ${i + 1}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 40vw"
                        className="object-cover"
                        priority={i === 0}
                        unoptimized={isSvgImageSource(img)}
                      />
                    </div>
                  ))}
                </ImageCarousel>
              )}
            </div>
            <Button
              onClick={onCTAClick}
              className="hidden h-auto w-full py-3.5 text-base font-semibold md:flex"
            >
              {buttonLabel}
            </Button>
          </div>

          <div className="flex flex-col gap-5 pt-1">
            {badge && (
              <Badge
                variant={badge.variant}
                role="status"
                aria-label={`Ticket status: ${event.status}`}
                className="w-fit px-3.5 py-1 text-xs"
              >
                {badge.label}
              </Badge>
            )}

            <h1
              className="m-0 font-bold leading-tight text-white"
              style={{ fontSize: "clamp(20px, 3vw, 32px)" }}
            >
              {event.title}
            </h1>

            <div className="flex items-start gap-3">
              <Calendar
                size={20}
                className="mt-0.5 shrink-0 text-white"
                aria-hidden
              />
              <div>
                <time
                  dateTime={firstDate.startTime}
                  className="block text-base font-medium text-white"
                >
                  {fmtIsoDate(firstDate.startTime)}
                </time>
                <p className="mt-0.5 text-sm text-white/60">
                  From {fmtIsoTime(firstDate.startTime)}
                  {firstDate.endTime
                    ? ` - ${fmtIsoTime(firstDate.endTime)}`
                    : ""}
                </p>
                {extraDates > 0 && (
                  <Button
                    variant="link"
                    type="button"
                    className="p-0 text-sm text-primary underline-offset-2"
                  >
                    + {extraDates} more date{extraDates > 1 ? "s" : ""}
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin
                size={20}
                className="mt-0.5 shrink-0 text-white"
                aria-hidden
              />
              <address className="not-italic line-clamp-2">
                <p className="font-semibold text-white">{event.venue.name}</p>
                <p className="mt-0.5 text-sm text-white/60">
                  {event.venue.address}, {event.venue.city},
                </p>
              </address>
            </div>

            {event.lowestPrice !== undefined && (
              <div className="flex items-start gap-3">
                <Ticket
                  size={20}
                  className="mt-0.5 shrink-0 text-white"
                  aria-hidden
                />
                <div>
                  <p className="font-semibold text-white">Ticket Price</p>
                  <p
                    aria-label="Ticket price"
                    className="mt-0.5 text-sm text-white/60"
                  >
                    {formatDisplayPrice(event.lowestPrice, DEFAULT_CURRENCY)}
                  </p>
                </div>
              </div>
            )}

            {hasSocialLinks && (
              <div className="flex items-center gap-3">
                {event.socialLinks?.facebook && (
                  <a
                    href={event.socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook page"
                    className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                  >
                    <Facebook size={20} aria-hidden />
                  </a>
                )}
                {event.socialLinks?.website && (
                  <a
                    href={event.socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Official website"
                    className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                  >
                    <Globe size={20} aria-hidden />
                  </a>
                )}
                {event.socialLinks?.instagram && (
                  <a
                    href={event.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram profile"
                    className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                  >
                    <Instagram size={20} aria-hidden />
                  </a>
                )}
                {event.socialLinks?.twitter && (
                  <a
                    href={event.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Twitter profile"
                    className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                  >
                    <Twitter size={20} aria-hidden />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Button
        ref={mobileCTARef}
        onClick={onCTAClick}
        className="fixed bottom-0 left-0 right-0 z-50 w-full bg-primary text-center text-base font-semibold text-primary-foreground md:hidden py-8"
      >
        {buttonLabel}
      </Button>
    </section>
  );
}
