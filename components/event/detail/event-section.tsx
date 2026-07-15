import { ReactNode } from "react";

const SCROLL_MT = "scroll-mt-[6.25rem] lg:scroll-mt-[6.5rem]";

interface EventSectionProps {
  id: string;
  title: string;
  children: ReactNode;
}

export function EventSection({ id, title, children }: EventSectionProps) {
  return (
    <section id={id} aria-label={title} className={SCROLL_MT}>
      <h2 className="mb-6 text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}
