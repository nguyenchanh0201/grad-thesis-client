import Image from "next/image";
import { isSvgImageSource } from "@/lib/image/is-svg-image-source";

type Props = {
  imageUrl: string | null | undefined;
  eventTitle: string;
};

export function EventBanner({ imageUrl, eventTitle }: Props) {
  if (!imageUrl) {
    return <div className="h-45 w-full rounded-t-[12px] bg-primary/20" />;
  }

  return (
    <div className="relative h-45 w-full overflow-hidden rounded-t-[12px]">
      <Image
        src={imageUrl}
        alt={eventTitle}
        fill
        className="object-cover object-center"
        priority
        unoptimized={isSvgImageSource(imageUrl)}
      />
    </div>
  );
}
