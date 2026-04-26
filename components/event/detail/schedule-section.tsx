import Image from "next/image";
import { fmtIsoTime } from "@/lib/date";
import type { EventDate } from "@/schemas/event";
import { EventSection } from "./event-section";

interface Props {
  dates: EventDate[];
  seatMapImage?: string;
}

export function ScheduleSection({ dates, seatMapImage }: Props) {
  return (
    <EventSection id="schedule" title="Schedule">
      <ul className="space-y-3">
        {dates.map((d) => (
          <li
            key={d.date}
            className="flex items-baseline gap-4 border-b pb-3 last:border-0 last:pb-0"
          >
            <span className="text-sm font-semibold">{d.label}</span>
            <span className="text-sm text-muted-foreground">
              {fmtIsoTime(d.startTime)}
              {d.endTime ? ` – ${fmtIsoTime(d.endTime)}` : ""}
            </span>
          </li>
        ))}
      </ul>
      {seatMapImage && (
        <div className="relative mt-8 aspect-video overflow-hidden rounded-md">
          <Image
            src={seatMapImage}
            alt="Seat map"
            fill
            className="object-cover"
          />
        </div>
      )}
    </EventSection>
  );
}
