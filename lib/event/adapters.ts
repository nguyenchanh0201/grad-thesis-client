import type { Event } from "@/schemas/event";
import type { EventDetail } from "@/schemas/event";
import type { EventItem } from "@/components/event/event-card";
import { fmtIsoDate } from "@/lib/date";

export function eventToEventDetail(event: Event): EventDetail {
  const images = [
    event.featuredImageUrl,
    ...(event.eventImageUrls ?? []),
  ].filter((u): u is string => !!u);

  const lowestPrice =
    event.ticketTypes && event.ticketTypes.length > 0
      ? Math.min(...event.ticketTypes.map((t) => t.price))
      : undefined;

  return {
    id: event.id ?? event.slug,
    slug: event.slug,
    title: event.eventName,
    summary: event.summary ?? undefined,
    description: event.desc ?? "",
    descAttachmentUrl: event.descAttachmentUrl ?? undefined,
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
      latitude: event.venue?.latitude ?? undefined,
      longitude: event.venue?.longitude ?? undefined,
    },
    organizer: {
      id: event.organizer?.id ?? "0",
      displayName: event.organizer?.displayName ?? "Organizer",
      avatarUrl: event.organizer?.avatarUrl ?? undefined,
      bio: event.organizer?.bio ?? "",
      contactInfo: event.organizer?.contactInfo ?? undefined,
    },
    seatMapImage:
      event.seatMap?.previewImageUrl ?? event.featuredImageUrl ?? images[0],
    hasSeatMapPreview: !!event.seatMap?.previewImageUrl,
    socialLinks: event.socialLinks ?? undefined,
    termsAndConditions: event.termsAndConditions ?? "",
    relatedEvents: [],
    lowestPrice,
    tags: event.tags?.map((t) => t.name),
    performers: event.performers ?? [],
  };
}

export function eventToEventItem(event: Event): EventItem {
  const image = event.featuredImageUrl ?? event.eventImageUrls?.[0];

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
