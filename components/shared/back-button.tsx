import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  backHref?: string | null;
  className?: string;
  title?: string;
  onBack?: () => void;
};

export function BackButton({ backHref, className, title, onBack }: Props) {
  const router = useRouter();

  function handleClick() {
    if (onBack) {
      onBack();
      return;
    }

    if (backHref) {
      router.push(backHref);
      return;
    }

    router.back();
  }

  return (
    <Button
      variant="link"
      onClick={handleClick}
      aria-label={title}
      className={cn(
        "flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground",
        className,
      )}
    >
      <ArrowLeft className="size-4" />
      <span className="hidden sm:inline">Back</span>
    </Button>
  );
}
