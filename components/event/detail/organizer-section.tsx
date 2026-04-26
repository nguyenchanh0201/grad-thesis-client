import Image from "next/image";
import type { EventOrganizer } from "@/schemas/event";
import { EventSection } from "./event-section";

interface Props {
  organizer: EventOrganizer;
}

export function OrganizerSection({ organizer }: Props) {
  return (
    <EventSection id="organizer" title="Organizer">
      <div className="flex items-start gap-4">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-full">
          <Image
            src={organizer.logo}
            alt={organizer.name}
            fill
            className="object-cover"
          />
        </div>
        <div>
          <p className="font-semibold">{organizer.name}</p>
          <p className="text-sm text-muted-foreground">
            {organizer.followerCount.toLocaleString()} followers
          </p>
          <p className="mt-3 text-sm">{organizer.description}</p>
        </div>
      </div>
    </EventSection>
  );
}
