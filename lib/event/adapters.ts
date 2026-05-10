import type { Event } from "@/schemas/event";
import type { EventDetail } from "@/schemas/event";
import type { EventItem } from "@/components/event/event-card";
import { fmtIsoDate } from "@/lib/date";

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80";

export function eventToEventDetail(event: Event): EventDetail {
  const images = [
    event.featuredImageUrl,
    ...(event.eventImageUrls ?? []),
  ].filter((u): u is string => !!u);
  if (images.length === 0) images.push(PLACEHOLDER_IMG);

  const lowestPrice =
    event.ticketTypes && event.ticketTypes.length > 0
      ? Math.min(...event.ticketTypes.map((t) => t.price))
      : undefined;

  return {
    id: event.id ?? event.slug,
    slug: event.slug,
    title: event.eventName,
    description: event.desc ?? "",
    images,
    status: event.status,
    dates: [
      {
        date: event.eventDate.slice(0, 10),
        label: "Show Date",
        startTime: event.eventDate,
      },
    ],
    venue: {
      name: event.venue?.venueName ?? "",
      address: event.venue?.address ?? event.venue?.city ?? "",
      city: event.venue?.city ?? "",
    },
    organizer: {
      id: event.organizer?.id ?? "0",
      displayName: event.organizer?.displayName ?? "Organizer",
      avatarUrl: event.organizer?.avatarUrl ?? PLACEHOLDER_IMG,
      bio: event.organizer?.bio ?? "",
    },
    socialLinks: event.socialLinks ?? undefined,
    termsAndConditions: "",
    relatedEvents: [],
    lowestPrice,
    tags: event.tags?.map((t) => t.name),
    performers: event.performers ?? [],
  };
}

export function eventToEventItem(event: Event): EventItem {
  const image =
    event.featuredImageUrl ?? event.eventImageUrls?.[0] ?? PLACEHOLDER_IMG;

  const lowestPrice =
    event.ticketTypes && event.ticketTypes.length > 0
      ? Math.min(...event.ticketTypes.map((t) => t.price))
      : undefined;

  return {
    id: event.id ?? event.slug,
    slug: event.slug,
    image,
    title: event.eventName,
    date: fmtIsoDate(event.eventDate),
    venue: event.venue
      ? `${event.venue.venueName}, ${event.venue.city}`
      : undefined,
    price:
      lowestPrice !== undefined
        ? `From ${(lowestPrice / 100).toLocaleString("vi-VN")} ₫`
        : undefined,
    tag: event.isFeatured ? "FEATURED" : undefined,
    isFeatured: event.isFeatured ?? undefined,
  };
}
