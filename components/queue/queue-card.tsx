import Image from "next/image";

type Props = {
  children: React.ReactNode;
  backgroundImageUrl?: string | null;
};

export function QueueCard({ children, backgroundImageUrl }: Props) {
  return (
    <div className="relative flex min-h-[calc(100vh-var(--header-height))] items-center justify-center px-4 py-10">
      {backgroundImageUrl ? (
        <>
          <Image
            src={backgroundImageUrl}
            alt=""
            fill
            className="object-cover object-center"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        </>
      ) : (
        <div className="absolute inset-0 bg-foreground/80" />
      )}

      <div className="relative z-10 w-full max-w-155 overflow-hidden rounded-[12px] bg-card shadow-2xl ring-1 ring-foreground/10">
        {children}
      </div>
    </div>
  );
}
