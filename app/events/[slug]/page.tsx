import type { Metadata } from "next";
import { stripHtml } from "@/lib/html";
import { buildEventJsonLd, buildBreadcrumbJsonLd } from "@/lib/seo";
import { mockEventDetail, mockEvents } from "@/lib/mock/events";
import type { EventDetail } from "@/schemas/event";
import { EventDetailHeader } from "@/components/event/detail/event-detail-header";
import { EventDetailSections } from "@/components/event/detail/event-detail-sections";
import { EventListing } from "@/components/event/event-listing";

export const revalidate = 60;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ticketgo.vn";
type Props = { params: Promise<{ slug: string }> };

async function fetchEventDetail(_slug: string): Promise<EventDetail> {
  return mockEventDetail;
}

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await fetchEventDetail(slug);

  const description =
    event.subtitle ?? stripHtml(event.description).slice(0, 155);
  const image = event.images[0];
  const url = `${SITE_URL}/events/${event.slug}`;

  return {
    title: `${event.title} | ${event.venue.city} | TicketGo`,
    description,
    keywords: event.tags,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      title: event.title,
      description,
      images: [{ url: image, width: 1200, height: 630 }],
      url,
      siteName: "TicketGo",
      locale: "vi_VN",
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description,
      images: [image],
    },
    other: {
      "event:start_time": event.dates[0].startTime,
      "event:end_time":
        event.dates.at(-1)?.endTime ?? event.dates.at(-1)?.startTime ?? "",
      "event:location": `${event.venue.name}, ${event.venue.city}`,
    },
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const event = await fetchEventDetail(slug);

  return (
    <>
      <link rel="preload" as="image" href={event.images[0]} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: buildEventJsonLd(event) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: buildBreadcrumbJsonLd(event) }}
      />

      <main className="page-container pt-5 pb-20 space-y-5">
        <EventDetailHeader event={event} />
        <EventDetailSections event={event} />
        <EventListing
          variant="grid"
          label="You Might Like"
          labelBorder="bottom"
          items={mockEvents}
          maxItems={8}
        />
      </main>
    </>
  );
}
