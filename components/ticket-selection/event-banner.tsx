type Props = {
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
};

export function EventBanner({ eventTitle, eventDate, eventLocation }: Props) {
  const text = `${eventTitle}  •  ${eventDate}  •  ${eventLocation}`;

  return (
    <div
      className="overflow-hidden border-b border-border bg-foreground py-2"
      aria-label="Event info"
    >
      <div className="animate-marquee flex whitespace-nowrap">
        {[0, 1].map((i) => (
          <span
            key={i}
            aria-hidden={i === 1}
            className="mr-16 text-sm font-medium text-background/90"
          >
            {text}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 28s linear infinite;
        }
      `}</style>
    </div>
  );
}
