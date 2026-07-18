import type { EventDetail } from "@/schemas/event";
import { stripHtml } from "@/lib/html/strip";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ticketgo.vn";

export function buildEventJsonLd(event: EventDetail): string {
  const firstDate = event.dates[0];
  const lastDate = event.dates.at(-1)!;

  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: stripHtml(event.description).slice(0, 500),
    image: event.images.slice(0, 2),
    startDate: firstDate.startTime,
    endDate: lastDate.endTime ?? lastDate.startTime,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.venue.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: event.venue.address,
        addressLocality: event.venue.city,
        addressCountry: "VN",
      },
    },
    organizer: {
      "@type": "Organization",
      name: event.organizer.displayName,
      url: `${SITE_URL}/organizers/${event.organizer.id}`,
    },
    ...(event.lowestPrice != null && {
      offers: {
        "@type": "Offer",
        url: `${SITE_URL}/events/${event.slug}`,
        priceCurrency: "VND",
        price: event.lowestPrice,
        availability: "https://schema.org/InStock",
        validFrom: firstDate.startTime,
      },
    }),
    ...(event.performerName && {
      performer: {
        "@type": "PerformingGroup",
        name: event.performerName,
      },
    }),
  });
}

interface BreadcrumbOptions {
  category?: string;
  categorySlug?: string;
}

export function buildBreadcrumbJsonLd(
  event: EventDetail,
  options: BreadcrumbOptions = {},
): string {
  type ListItem = { position: number; name: string; item?: string };

  const items: ListItem[] = [
    { position: 1, name: "Home", item: SITE_URL },
    { position: 2, name: "Events", item: `${SITE_URL}/events` },
  ];

  if (options.category && options.categorySlug) {
    items.push({
      position: 3,
      name: options.category,
      item: `${SITE_URL}/events?category=${options.categorySlug}`,
    });
    items.push({ position: 4, name: event.title });
  } else {
    items.push({ position: 3, name: event.title });
  }

  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(({ position, name, item }) => ({
      "@type": "ListItem",
      position,
      name,
      ...(item && { item }),
    })),
  });
}
