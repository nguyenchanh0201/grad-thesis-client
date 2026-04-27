import Link from "next/link";
import React from "react";

import { Separator } from "@/components/ui/separator";
import { ChevronDown } from "lucide-react";

export interface SocialLink {
  platform: "facebook" | "x" | "youtube" | "instagram" | "blog" | string;
  href: string;
  icon: React.ReactNode;
}

export interface FooterLinkGroup {
  heading: string;
  links: { label: string; href: string }[];
}

export interface FooterProps {
  brandName?: string;
  brandTagline?: string;
  socialLinks?: SocialLink[];
  linkGroups?: FooterLinkGroup[];
  appStoreUrl?: string;
  googlePlayUrl?: string;
  legalText?: React.ReactNode;
  copyrightText?: string;
  bottomLinks?: { label: string; href: string }[];
}

// const APPLE_BADGE =
//   "https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg";
// const GOOGLE_BADGE =
//   "https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png";

function LinkList({ links }: { links: FooterLinkGroup["links"] }) {
  return (
    <ul className="flex flex-col gap-2">
      {links.map((link) => (
        <li key={link.label}>
          <Link
            href={link.href}
            className="text-sm text-footer-muted no-underline transition-colors duration-150 hover:text-footer-fg hover:underline"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Footer({
  brandName = "TicketGo",
  brandTagline = "Let's connect",
  socialLinks = [],
  linkGroups = [],
  legalText,
  copyrightText,
  bottomLinks = [],
}: FooterProps) {
  // const hasAppBadges = appStoreUrl || googlePlayUrl;

  return (
    <>
      <footer className="w-full bg-footer-bg text-footer-fg">
        <div className="mx-auto max-w-6xl px-4 pt-10">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1fr_repeat(4,1fr)]">
            <div className="flex flex-col gap-5 pb-10 sm:col-span-2 lg:col-span-1 lg:pb-10">
              <span className="font-sans text-2xl font-bold">{brandName}</span>

              <div className="flex flex-col gap-2">
                <span className="text-sm text-footer-muted">
                  {brandTagline}
                </span>
                {socialLinks.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {socialLinks.map((s) => (
                      <a
                        key={s.platform}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.platform}
                        className="flex h-8 w-8 items-center justify-center text-footer-fg transition-colors duration-150 hover:text-primary"
                      >
                        {s.icon}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* {hasAppBadges && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-footer-muted">
                    Download Our Apps
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {appStoreUrl && (
                      <a
                        href={appStoreUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Image
                          src={APPLE_BADGE}
                          alt="Download on the App Store"
                          width={140}
                          height={42}
                          className="h-auto max-w-35 rounded-sm border border-footer-border"
                        />
                      </a>
                    )}
                    {googlePlayUrl && (
                      <a
                        href={googlePlayUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Image
                          src={GOOGLE_BADGE}
                          alt="Get it on Google Play"
                          width={140}
                          height={42}
                          className="h-auto max-w-35 rounded-sm border border-footer-border"
                        />
                      </a>
                    )}
                  </div>
                </div>
              )} */}

              {legalText && (
                <p className="text-xs leading-relaxed text-footer-muted [&_a]:text-footer-fg [&_a]:underline [&_a:hover]:text-primary">
                  {legalText}
                </p>
              )}
            </div>

            {linkGroups.map((group) => (
              <React.Fragment key={group.heading}>
                <details className="group border-t border-footer-border sm:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-sm font-semibold text-footer-fg [&::-webkit-details-marker]:hidden">
                    {group.heading}
                    <ChevronDown className="w-5 h-5 shrink-0 transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <div className="pb-4">
                    <LinkList links={group.links} />
                  </div>
                </details>

                <div className="hidden pb-10 sm:block">
                  <p className="mb-4 text-base font-semibold text-footer-fg">
                    {group.heading}
                  </p>
                  <LinkList links={group.links} />
                </div>
              </React.Fragment>
            ))}
          </div>

          <Separator className="bg-footer-border" />

          {/* Bottom bar */}
          <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center">
              {bottomLinks.map((link, i) => (
                <React.Fragment key={link.label}>
                  {i > 0 && (
                    <span className="px-1 text-xs text-footer-muted">|</span>
                  )}
                  <Link
                    href={link.href}
                    className="text-xs text-footer-muted hover:underline"
                  >
                    {link.label}
                  </Link>
                </React.Fragment>
              ))}
            </div>

            {copyrightText && (
              <p className="text-xs text-footer-muted">{copyrightText}</p>
            )}
          </div>
        </div>
      </footer>
    </>
  );
}
