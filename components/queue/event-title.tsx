type Props = { title: string };

export function EventTitle({ title }: Props) {
  return (
    <h1 className="mt-3 mb-5 line-clamp-3 text-[22px] font-semibold leading-snug text-foreground">
      {title}
    </h1>
  );
}
