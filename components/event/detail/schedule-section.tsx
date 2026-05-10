import Image from "next/image";
import { format, parseISO } from "date-fns";
import type { EventDate } from "@/schemas/event";
import { EventSection } from "./event-section";

interface Props {
  dates: EventDate[];
  seatMapImage?: string;
}

export function ScheduleSection({ dates, seatMapImage }: Props) {
  if (!dates || dates.length === 0) return null;

  return (
    <EventSection id="schedule" title="Schedule">
      <ul className="space-y-3">
        {dates.map((d, idx) => {
          const startDate = parseISO(d.startTime);
          const formattedDate = format(startDate, "EEEE, dd/MM/yyyy");
          const time = format(startDate, "HH:mm");
          const endTime = d.endTime
            ? format(parseISO(d.endTime), "HH:mm")
            : null;

          return (
            <li
              key={`${d.date}-${idx}`}
              className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 border-b border-border pb-3 last:border-0 last:pb-0"
            >
              <span className="text-sm font-semibold text-card-foreground">
                {formattedDate}
              </span>
              <span className="text-sm text-muted-foreground">
                {time} {endTime ? ` – ${endTime}` : ""}
              </span>
            </li>
          );
        })}
      </ul>

      {seatMapImage && (
        <div className="relative mt-8 aspect-[4/3] sm:aspect-video w-full overflow-hidden rounded-md border border-border bg-muted/30">
          <Image
            src={seatMapImage}
            alt="Venue Seating Map"
            fill
            className="object-contain p-2"
          />
        </div>
      )}
    </EventSection>
  );
}
