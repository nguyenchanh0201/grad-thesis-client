import Image from "next/image";
import { EventItem } from "../event/event-card";

export function FilledImage({
  event,
  onError,
}: {
  event: EventItem;
  onError: () => void;
}) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-sm bg-muted">
      <Image
        fill
        src={event.image}
        alt={event.title}
        aria-label={event.title}
        className="h-full w-full object-cover"
        onError={onError}
      />
    </div>
  );
}
