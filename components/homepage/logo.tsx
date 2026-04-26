import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="shrink-0 text-2xl font-bold leading-none">
      <span style={{ color: "#FF2D78" }}>C</span>
      <span style={{ color: "#1a3fcc" }}>Ticket</span>
    </Link>
  );
}
