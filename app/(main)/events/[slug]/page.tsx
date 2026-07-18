import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { stripHtml } from "@/lib/html/strip";
import { isAppError } from "@/core/error";
import { buildEventJsonLd, buildBreadcrumbJsonLd } from "@/lib/seo";
import { getEventBySlug } from "@/services/event.service";
import { eventToEventDetail } from "@/lib/event/adapters";
import { EventDetailView } from "@/components/event/detail/event-detail-view";

export const dynamic = "force-dynamic";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ticketgo.vn";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const result = await getEventBySlug(slug);
    const event = eventToEventDetail(result.data);

    const description = stripHtml(event.description).slice(0, 155);
    const image = event.images[0];
    const url = `${SITE_URL}/events/${event.slug}`;

    return {
      title: `${event.title} - TicketGo`,
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
    };
  } catch {
    return { title: "Event | TicketGo" };
  }
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;

  let result;
  try {
    result = await getEventBySlug(slug);
  } catch (error) {
    if (isAppError(error) && error.status === 404) {
      notFound();
    }

    throw error;
  }

  const event = result.data;
  const detail = eventToEventDetail(event);

  return (
    <>
      <link rel="preload" as="image" href={detail.images[0]} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: buildEventJsonLd(detail) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: buildBreadcrumbJsonLd(detail) }}
      />

      <main className="page-container pt-5 pb-20 space-y-5">
        <EventDetailView event={event} detail={detail} />
      </main>
    </>
  );
}
