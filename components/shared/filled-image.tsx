import Image from "next/image";
import { EventItem } from "../event/event-card";
import { isSvgImageSource } from "@/lib/image/is-svg-image-source";

function eventColor(title: string): string {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) | 0;
  return `hsl(${(h >>> 0) % 360}, 40%, 30%)`;
}

export function FilledImage({
  event,
  onError,
}: {
  event: EventItem;
  onError: () => void;
}) {
  if (!event.image) {
    return (
      <div
        className="relative aspect-square overflow-hidden rounded-sm"
        style={{ backgroundColor: eventColor(event.title) }}
      />
    );
  }

  return (
    <div className="relative aspect-square overflow-hidden rounded-sm bg-muted">
      <Image
        fill
        src={event.image}
        alt={event.title}
        aria-label={event.title}
        className="h-full w-full object-cover"
        onError={onError}
        unoptimized={isSvgImageSource(event.image)}
      />
    </div>
  );
}
