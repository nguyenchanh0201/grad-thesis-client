import Image from "next/image";

function getInitials(text: string): string {
  if (!text || text === "") return "U";
  return text.slice(0, 2).toUpperCase();
}

interface Props {
  email: string;
  name?: string | null;
  imageUrl?: string | null;
  size?: number;
  className?: string;
}

export function UserProfilePicture({
  email,
  name,
  imageUrl,
  size = 64,
  className = "",
}: Props) {
  return (
    <div
      className={`relative shrink-0 rounded-full overflow-hidden bg-primary/15 ${className}`}
      style={{ width: size, height: size }}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name || email}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center text-primary font-semibold select-none"
          style={{ fontSize: size * 0.3125 }}
        >
          {getInitials(name ?? email)}
        </span>
      )}
    </div>
  );
}
