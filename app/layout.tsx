import type { Metadata } from "next";
import { Geist_Mono, Geist } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { LanguageProvider } from "@/components/providers/language-provider";
import { getLanguageCookie } from "@/lib/cookies/language";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

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
    <html
      lang={initialLanguage.code}
      className={cn("font-sans", geist.variable)}
    >
      <body className={`${geist.variable} ${fontMono.variable} antialiased`}>
        <QueryProvider>
          <LanguageProvider initialLanguage={initialLanguage}>
            {children}
          </LanguageProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
