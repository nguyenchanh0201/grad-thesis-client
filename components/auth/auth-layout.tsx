"use client";

import { LangSelector } from "../homepage/lang-selector";
import { Logo } from "../shared/logo";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden auth-bg-gradient">
      <div
        className="pointer-events-none absolute inset-0 auth-tile-pattern"
        aria-hidden="true"
      />

      {/* Navbar */}
      <header className="relative z-20">
        <nav className="flex items-center justify-between px-6 py-4 sm:px-8">
          <Logo />
          <LangSelector />
        </nav>
      </header>

      {/* Content */}
      <main className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        {children}
      </main>
    </div>
  );
}
