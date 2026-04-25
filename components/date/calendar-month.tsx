import { calDays, fmtMonthYear, sameDay, WDAYS } from "@/lib/date";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function CalendarMonth({
  month,
  today,
  rs,
  re,
  onPrev,
  onNext,
  onDayClick,
  onHover,
}: {
  month: Date;
  today: Date;
  rs: Date | null;
  re: Date | null;
  onPrev?: () => void;
  onNext?: () => void;
  onDayClick: (d: Date) => void;
  onHover: (d: Date | null) => void;
}) {
  const days = calDays(month.getFullYear(), month.getMonth());
  const isSingle = rs && re && sameDay(rs, re);

  return (
    <div className="w-63 shrink-0 select-none">
      {/* Month header */}
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={onPrev}
          className={cn(
            "flex size-7 items-center justify-center rounded transition-colors hover:bg-muted",
            !onPrev && "invisible",
          )}
        >
          <ChevronLeft className="size-4 text-muted-foreground" />
        </button>
        <span className="text-sm font-semibold">{fmtMonthYear(month)}</span>
        <button
          type="button"
          onClick={onNext}
          className={cn(
            "flex size-7 items-center justify-center rounded transition-colors hover:bg-muted",
            !onNext && "invisible",
          )}
        >
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7">
        {WDAYS.map((d) => (
          <div
            key={d}
            className="flex h-8 items-center justify-center text-[11px] font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}

        {/* Day cells */}
        {days.map((day, i) => {
          if (!day) return <div key={i} className="h-9" />;

          const isPast = day < today && !sameDay(day, today);
          const isToday = sameDay(day, today);
          const isStart = rs ? sameDay(day, rs) : false;
          const isEnd = re ? sameDay(day, re) : false;
          const inRange =
            !isSingle && rs != null && re != null && day > rs && day < re;

          return (
            <div
              key={i}
              className="relative flex h-9 items-center justify-center"
            >
              {/* Range strip */}
              {inRange && (
                <span className="absolute inset-y-0.5 inset-x-0 bg-primary/10" />
              )}
              {isStart && !isSingle && re && (
                <span className="absolute inset-y-0.5 left-1/2 right-0 bg-primary/10" />
              )}
              {isEnd && !isSingle && rs && (
                <span className="absolute inset-y-0.5 left-0 right-1/2 bg-primary/10" />
              )}

              <button
                type="button"
                disabled={isPast}
                onClick={() => onDayClick(day)}
                onMouseEnter={() => onHover(day)}
                onMouseLeave={() => onHover(null)}
                className={cn(
                  "relative z-10 flex size-8 items-center justify-center rounded-full text-sm transition-colors",
                  (isStart || isEnd) && "bg-primary text-primary-foreground",
                  !isStart &&
                    !isEnd &&
                    !isPast &&
                    "hover:bg-muted cursor-pointer",
                  isPast && "cursor-not-allowed opacity-30",
                )}
              >
                {day.getDate()}
                {isToday && !isStart && !isEnd && (
                  <span className="absolute bottom-0.5 left-1/2 h-0.5 w-3 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
