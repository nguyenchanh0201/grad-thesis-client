import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChipProps {
  label: string;
  active?: boolean;
  onDismiss?: () => void;
  onClick?: () => void;
  className?: string;
}

export function Chip({
  label,
  active,
  onDismiss,
  onClick,
  className,
}: ChipProps) {
  const base = cn(
    "inline-flex items-center gap-1 rounded-full border text-sm font-medium transition-colors cursor-pointer",
    onDismiss ? "pl-4 pr-3 py-1.5" : "px-4 py-1.5",
    active
      ? "border-foreground bg-foreground text-background"
      : "border-border bg-transparent text-foreground hover:border-foreground/50",
    className,
  );

  const dismissButton = onDismiss && (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onDismiss();
      }}
      aria-label={`Remove ${label}`}
      className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
    >
      <X className="size-3.5" />
    </button>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={base}>
        {label}
        {dismissButton}
      </button>
    );
  }

  return (
    <span className={base}>
      {label}
      {dismissButton}
    </span>
  );
}
