import Image from "next/image";
import type { Performer } from "@/schemas/event";
import { EventSection } from "./event-section";

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80";

interface Props {
  performers: Performer[];
}

export function PerformersSection({ performers }: Props) {
  if (!performers || performers.length === 0) return null;

  return (
    <EventSection id="performers" title="Guests & Performers">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {performers.map((performer) => (
          <div
            key={performer.id.toString()}
            className="flex items-center gap-4"
          >
            <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-muted">
              <Image
                src={performer.avatarUrl || PLACEHOLDER_IMG}
                alt={performer.name}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="font-semibold leading-tight">{performer.name}</p>
              <p className="text-sm text-primary font-medium">
                {performer.role}
              </p>
              {performer.bio && (
                <p className="mt-1 text-sm line-clamp-2 text-muted-foreground">
                  {performer.bio}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </EventSection>
  );
}
