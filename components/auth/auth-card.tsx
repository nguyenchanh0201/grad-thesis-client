import { cn } from "@/lib/utils";

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "w-full max-w-140 rounded-2xl bg-background",
        "px-6 py-8 sm:px-10 sm:py-12",
        "shadow-[0_8px_32px_rgba(0,0,0,0.08)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
