import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { LanguageProvider } from "@/components/providers/language-provider";
import { Header } from "@/components/homepage/header";
import { Footer } from "@/components/homepage/footer";
import { getLanguageCookie } from "@/lib/cookies/language";
import Link from "next/link";

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
  title: "TicketGo",
  description: "Browse and book tickets for events near you",
};

const socialLinks = [
  {
    platform: "facebook",
    href: "https://facebook.com",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    platform: "x",
    href: "https://x.com",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    platform: "youtube",
    href: "https://youtube.com",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    platform: "instagram",
    href: "https://instagram.com",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
];

const linkGroups = [
  {
    heading: "Helpful Links",
    links: [
      { label: "Help / FAQ", href: "/help" },
      { label: "Sell Tickets", href: "/sell" },
      { label: "My Account", href: "/account" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  {
    heading: "Discover",
    links: [
      { label: "Browse Events", href: "/events" },
      { label: "Venues", href: "/venues" },
      { label: "Artists", href: "/artists" },
      { label: "Cities", href: "/cities" },
    ],
  },
  {
    heading: "About Us",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Careers", href: "/careers" },
      { label: "Press", href: "/press" },
      { label: "Partnerships", href: "/partners" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "Terms of Use", href: "/terms" },
      { label: "Accessibility", href: "/accessibility" },
    ],
  },
];

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialLanguage = await getLanguageCookie();

  return (
    <html lang={initialLanguage.code}>
      <body className={`${fontSans.variable} ${fontMono.variable} antialiased`}>
        <QueryProvider>
          <LanguageProvider initialLanguage={initialLanguage}>
            <Header />
            {children}
            <Footer
              socialLinks={socialLinks}
              linkGroups={linkGroups}
              legalText={
                <>
                  By continuing past this page, you agree to our{" "}
                  <Link href="/terms">Terms of Use</Link>.
                </>
              }
              copyrightText="© 1999–2026 TicketGo. All rights reserved."
              bottomLinks={[
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Cookie Policy", href: "/cookies" },
                { label: "Terms of Use", href: "/terms" },
                { label: "Accessibility", href: "/accessibility" },
              ]}
              feedbackUrl="/feedback"
            />
          </LanguageProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
