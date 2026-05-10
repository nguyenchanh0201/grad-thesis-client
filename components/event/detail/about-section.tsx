import { Download } from "lucide-react";
import { EventSection } from "./event-section";
import { ReadMore } from "./read-more";

const IMAGE_EXTS = ["jpg", "jpeg", "png", "webp", "gif", "svg"];

function getFileType(url: string): "image" | "other" {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_EXTS.includes(ext) ? "image" : "other";
}

interface Props {
  summary?: string;
  description: string;
  descAttachmentUrl?: string;
  termsAndConditions: string;
}

export function AboutSection({
  summary,
  description,
  descAttachmentUrl,
  termsAndConditions,
}: Props) {
  const fileType = descAttachmentUrl ? getFileType(descAttachmentUrl) : null;

  return (
    <EventSection id="about" title="About">
      {(summary || description) && (
        <ReadMore>
          {summary && (
            <p className="mb-4 line-clamp-none text-sm leading-relaxed text-muted-foreground">
              {summary}
            </p>
          )}
          {description && (
            <div
              className="[&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:line-clamp-none [&_p]:text-sm [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mt-2 [&_p]:line-clamp-none"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          )}
        </ReadMore>
      )}

      {descAttachmentUrl && (
        <div className={description ? "mt-6" : undefined}>
          {fileType === "image" ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={descAttachmentUrl}
                alt="Event program"
                className="h-auto w-full rounded-lg border border-border"
              />
            </>
          ) : (
            <iframe
              src={descAttachmentUrl}
              title="Event program"
              className="w-full rounded-lg border border-border"
              style={{ aspectRatio: "3/4" }}
            />
          )}
        </div>
      )}

      <div
        className="mt-8 border-t pt-6 [&_p]:text-sm [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mt-2 [&_p]:line-clamp-none"
        dangerouslySetInnerHTML={{ __html: termsAndConditions }}
      />
    </EventSection>
  );
}
