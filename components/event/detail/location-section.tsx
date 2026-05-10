import { MapPin } from "lucide-react";
import type { EventVenueDetail } from "@/schemas/event";
import { EventSection } from "./event-section";

interface Props {
  venue: EventVenueDetail;
}

export function LocationSection({ venue }: Props) {
  const mapQuery =
    venue.latitude && venue.longitude
      ? `${venue.latitude},${venue.longitude}`
      : `${venue.address}, ${venue.city}`;

  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <EventSection id="location" title="Location">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5">
            <MapPin className="size-6" />
          </div>
          <div>
            <h3 className="font-semibold text-card-foreground text-lg">
              {venue.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {venue.address}
              <br />
              {venue.city}
            </p>
          </div>
        </div>

        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border shadow-sm bg-muted/20">
          <iframe
            title={`Map showing location of ${venue.name}`}
            src={mapSrc}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0"
          />
        </div>
      </div>
    </EventSection>
  );
}
