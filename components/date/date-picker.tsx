import {
  autoFormatDateInput,
  fmtDate,
  monthStart,
  parseDate,
  shiftMonth,
} from "@/lib/date";
import { CalendarMonth } from "./calendar-month";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

export function DatePicker({
  initStart,
  initEnd,
  onApply,
  onClose,
  isMobile = false,
}: {
  initStart: Date | null;
  initEnd: Date | null;
  onApply: (s: Date | null, e: Date | null) => void;
  onClose: () => void;
  isMobile?: boolean;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [start, setStart] = useState<Date | null>(initStart);
  const [end, setEnd] = useState<Date | null>(initEnd);
  const [hover, setHover] = useState<Date | null>(null);
  const [leftMonth, setLeftMonth] = useState(
    initStart ? monthStart(initStart) : monthStart(today),
  );
  const [startInput, setStartInput] = useState(
    initStart ? fmtDate(initStart) : "",
  );
  const [endInput, setEndInput] = useState(initEnd ? fmtDate(initEnd) : "");

  const effEnd = end ?? (start && hover ? hover : null);
  const [rs, re] =
    start && effEnd && effEnd < start ? [effEnd, start] : [start, effEnd];

  function handleDayClick(day: Date) {
    if (!start || end) {
      setStart(day);
      setEnd(null);
      setStartInput(fmtDate(day));
      setEndInput("");
    } else {
      const [s, e] = day < start ? [day, start] : [start, day];
      setStart(s);
      setEnd(e);
      setStartInput(fmtDate(s));
      setEndInput(fmtDate(e));
    }
  }

  function handleReset() {
    setStart(null);
    setEnd(null);
    setStartInput("");
    setEndInput("");
  }

  const inputClass =
    "h-8 w-full rounded-sm border border-border bg-transparent px-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors";

  const calendarProps = {
    today,
    rs,
    re,
    onDayClick: handleDayClick,
    onHover: setHover,
  };

  return (
    <div className="rounded-sm border border-border bg-background p-4 shadow-lg">
      {/* Date inputs */}
      <div className={cn("mb-4 flex gap-3", isMobile && "flex-col")}>
        <div className="flex-1">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Start date
          </label>
          <input
            type="text"
            placeholder="MM/DD/YYYY"
            value={startInput}
            onChange={(e) => {
              const formatted = autoFormatDateInput(e.target.value);
              setStartInput(formatted);
              const d = parseDate(formatted);
              if (d) {
                setStart(d);
                setLeftMonth(monthStart(d));
              }
            }}
            className={inputClass}
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            End date
          </label>
          <input
            type="text"
            placeholder="MM/DD/YYYY"
            value={endInput}
            onChange={(e) => {
              const formatted = autoFormatDateInput(e.target.value);
              setEndInput(formatted);
              const d = parseDate(formatted);
              if (d) setEnd(d);
            }}
            className={inputClass}
          />
        </div>
      </div>

      {/* Calendars */}
      <div className="flex gap-6">
        <CalendarMonth
          {...calendarProps}
          month={leftMonth}
          onPrev={() => setLeftMonth(shiftMonth(leftMonth, -1))}
          onNext={
            isMobile ? () => setLeftMonth(shiftMonth(leftMonth, 1)) : undefined
          }
        />
        {!isMobile && (
          <CalendarMonth
            {...calendarProps}
            month={shiftMonth(leftMonth, 1)}
            onNext={() => setLeftMonth(shiftMonth(leftMonth, 1))}
          />
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <button
          type="button"
          onClick={handleReset}
          className="text-sm font-medium text-primary hover:underline"
        >
          Reset
        </button>
        <div className="flex gap-2">
          <Button variant="outline" size="lg" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="lg"
            onClick={() => {
              onApply(start, end);
              onClose();
            }}
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
