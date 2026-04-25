import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProfile } from "@/components/auth/user-profile";
import { QueryProvider } from "@/components/providers/query-provider";

const fontSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const fontMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Graduate Thesis Ticketing",
  description: "Schema-first ticketing frontend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fontSans.variable} ${fontMono.variable} antialiased`}>
        <QueryProvider>
          <header className="border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Graduate Thesis Ticketing
                </p>
                <p className="text-xs text-muted-foreground">
                  Schema-first modular monolith
                </p>
              </div>
              <UserProfile />
            </div>
          </header>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
