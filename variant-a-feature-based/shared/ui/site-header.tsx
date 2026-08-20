import Link from "next/link";
import type { ReactNode, ReactElement } from "react";

const navigationLinks = [
  { href: "/leaderboard", label: "Rang-lista" },
  { href: "/matches/new", label: "Evidentiraj meč" },
];

type SiteHeaderProps = {
  userMenu?: ReactNode;
};

export function SiteHeader({ userMenu }: SiteHeaderProps = {}): ReactElement {
  return (
    <header
      data-testid="site-header"
      className="border-b border-border bg-surface"
    >
      <div className="mx-auto flex w-full max-w-content flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-2">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center font-semibold tracking-tight"
        >
          SplitScore
        </Link>

        <nav aria-label="Glavna navigacija">
          <ul className="flex items-center gap-1 sm:gap-2">
            {navigationLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex min-h-11 items-center rounded-control px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-primary-soft hover:text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              {userMenu ?? (
                <Link
                  href="/sign-in"
                  className="inline-flex min-h-11 items-center rounded-control bg-primary px-4 text-sm font-semibold text-surface transition-colors hover:bg-primary-hover"
                >
                  Prijava
                </Link>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
