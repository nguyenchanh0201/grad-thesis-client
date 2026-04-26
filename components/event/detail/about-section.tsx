import { EventSection } from "./event-section";

interface Props {
  description: string;
  timeVenueNotes: string[];
  termsAndConditions: string;
}

export function AboutSection({
  description,
  timeVenueNotes,
  termsAndConditions,
}: Props) {
  return (
    <EventSection id="about" title="About">
      <div
        className="[&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-2 [&_p]:text-sm [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mt-2"
        dangerouslySetInnerHTML={{ __html: description }}
      />
      {timeVenueNotes.length > 0 && (
        <ul className="mt-6 space-y-1.5 border-t pt-6">
          {timeVenueNotes.map((note, i) => (
            <li key={i} className="text-sm text-muted-foreground">
              {note}
            </li>
          ))}
        </ul>
      )}
      <div
        className="mt-8 border-t pt-6 [&_p]:text-sm [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mt-2"
        dangerouslySetInnerHTML={{ __html: termsAndConditions }}
      />
    </EventSection>
  );
}
