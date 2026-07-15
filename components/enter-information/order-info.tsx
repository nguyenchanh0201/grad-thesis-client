import { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  title: string;
};

export function OrderInfo({ icon: Icon, title }: Props) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Icon className="size-5 shrink-0" />
      <span>{title}</span>
    </div>
  );
}
