import { ArrowRight } from "lucide-react";
import { Button } from "../ui/button";

interface ViewMoreBtnProps {
  label: string;
  loading?: boolean;
  onClick: () => void;
}

export function ViewMoreBtn({ label, loading, onClick }: ViewMoreBtnProps) {
  return (
    <Button
      variant="link"
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl border border-border px-7 py-2.5 text-sm text-foreground transition-colors hover:border-foreground/50 disabled:pointer-events-none disabled:opacity-60"
    >
      {loading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
      ) : (
        <>
          {label}
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </Button>
  );
}
