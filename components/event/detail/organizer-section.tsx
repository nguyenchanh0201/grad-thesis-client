import Image from "next/image";
import type { EventOrganizer } from "@/schemas/event";
import { EventSection } from "./event-section";

interface Props {
  organizer: EventOrganizer;
}

export function OrganizerSection({ organizer }: Props) {
  return (
    <EventSection id="organizer" title="Organizer">
      <div className="flex items-center gap-4">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-full">
          <Image
            src={organizer.avatarUrl}
            alt={organizer.displayName}
            fill
            className="object-cover"
          />
        </div>
        <div>
          <p className="font-semibold">{organizer.displayName}</p>
          {organizer.bio && <p className="mt-1 text-sm">{organizer.bio}</p>}
        </div>
      </div>
    </EventSection>
  );
}
