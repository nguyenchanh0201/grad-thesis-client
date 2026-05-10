import Image from "next/image";
import { Mail, Phone, Globe, Facebook, Instagram } from "lucide-react";
import type { EventOrganizer } from "@/schemas/event";
import { EventSection } from "./event-section";

interface Props {
  organizer: EventOrganizer;
}

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function ContactLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  const isExternal = href.startsWith("http");
  return (
    <a
      href={href}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
    >
      <Icon className="size-3.5 shrink-0" />
      <span className="hidden sm:inline max-w-45 truncate">{label}</span>
    </a>
  );
}

export function OrganizerSection({ organizer }: Props) {
  const { contactInfo } = organizer;
  const hasContact =
    contactInfo &&
    (contactInfo.email ||
      contactInfo.phone ||
      contactInfo.website ||
      contactInfo.facebook ||
      contactInfo.instagram);

  return (
    <EventSection id="organizer" title="Organizer">
      <div className="rounded-xl border border-border p-5">
        <div className="flex items-start gap-5">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/20">
            <Image
              src={organizer.avatarUrl}
              alt={organizer.displayName}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <p className="text-lg font-bold leading-tight tracking-tight">
              {organizer.displayName}
            </p>
            {organizer.bio && (
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {organizer.bio}
              </p>
            )}
          </div>
        </div>

        {hasContact && (
          <div className="mt-4 border-t border-border pt-4">
            <div className="flex flex-wrap gap-2">
              {contactInfo.email && (
                <ContactLink
                  href={`mailto:${contactInfo.email}`}
                  icon={Mail}
                  label={contactInfo.email}
                />
              )}
              {contactInfo.phone && (
                <ContactLink
                  href={`tel:${contactInfo.phone}`}
                  icon={Phone}
                  label={contactInfo.phone}
                />
              )}
              {contactInfo.website && (
                <ContactLink
                  href={contactInfo.website}
                  icon={Globe}
                  label={getHostname(contactInfo.website)}
                />
              )}
              {contactInfo.facebook && (
                <ContactLink
                  href={contactInfo.facebook}
                  icon={Facebook}
                  label="Facebook"
                />
              )}
              {contactInfo.instagram && (
                <ContactLink
                  href={contactInfo.instagram}
                  icon={Instagram}
                  label="Instagram"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </EventSection>
  );
}
