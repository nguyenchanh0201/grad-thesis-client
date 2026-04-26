import Link from "next/link";

interface AuthFooterLinkProps {
  text: string;
  linkLabel: string;
  href: string;
}

export function AuthFooterLink({ text, linkLabel, href }: AuthFooterLinkProps) {
  return (
    <p className="text-center text-sm text-muted-foreground">
      {text}{" "}
      <Link
        href={href}
        className="font-semibold text-primary hover:underline underline-offset-4"
      >
        {linkLabel}
      </Link>
    </p>
  );
}
