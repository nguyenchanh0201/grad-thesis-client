import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { LanguageProvider } from "@/components/providers/language-provider";
import { getLanguageCookie } from "@/lib/cookies/language";

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
            {children}
          </LanguageProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
