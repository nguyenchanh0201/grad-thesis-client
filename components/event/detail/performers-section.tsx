import Link from "next/link";
import Image from "next/image";
import type { Performer } from "@/schemas/event";
import { EventSection } from "./event-section";
import { isSvgImageSource } from "@/lib/image/is-svg-image-source";

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
          <Link
            href={`/performer/${performer.id}`}
            key={performer.id.toString()}
            className="group flex items-center gap-4 rounded-xl border border-transparent p-3 transition-colors hover:bg-muted/50 hover:border-border"
          >
            <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-transparent transition-all group-hover:ring-primary/20">
              <Image
                src={performer.avatarUrl || PLACEHOLDER_IMG}
                alt={performer.name}
                fill
                className="object-cover"
                unoptimized={isSvgImageSource(performer.avatarUrl)}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold leading-tight truncate transition-colors group-hover:text-primary">
                  {performer.name}
                </p>
              </div>
              <p className="text-sm text-primary font-medium truncate">
                {performer.role}
              </p>
              {performer.bio && (
                <p className="mt-1 text-sm line-clamp-2 text-muted-foreground">
                  {performer.bio}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </EventSection>
  );
}
