import { EventSection } from "./event-section";

interface Props {
  description: string;
  termsAndConditions: string;
}

export function AboutSection({ description, termsAndConditions }: Props) {
  return (
    <EventSection id="about" title="About">
      <div
        className="[&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-2 [&_p]:text-sm [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mt-2"
        dangerouslySetInnerHTML={{ __html: description }}
      />

      <div
        className="mt-8 border-t pt-6 [&_p]:text-sm [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mt-2"
        dangerouslySetInnerHTML={{ __html: termsAndConditions }}
      />
    </EventSection>
  );
}
