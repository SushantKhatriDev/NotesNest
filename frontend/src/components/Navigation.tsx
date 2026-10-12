"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { REPO_URL } from "@/lib/config";

export function Navigation() {
  const pathname = usePathname();
  const links = [
    { href: "/papers", label: "Papers" },
    { href: "/faculty", label: "Faculty" },
    { href: "/advice", label: "Advice" },
  ];

  return (
    <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5" aria-label="Main navigation">
      <Link href="/" className="text-lg font-semibold tracking-tight text-brand focus:outline-none focus:ring-2 focus:ring-brand">
        NotesNest
      </Link>
      <div className="flex items-center gap-1">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`min-h-11 rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand ${
                active ? "text-brand" : "text-ink/70 hover:text-brand"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="NotesNest on GitHub (opens in a new tab)"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium text-ink/70 hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand sm:px-3"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 shrink-0"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.25c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.74.08-.74 1.2.08 1.83 1.23 1.83 1.23 1.07 1.83 2.8 1.3 3.48.99.11-.77.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.17 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.29-1.23 3.29-1.23.65 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.22 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z" />
          </svg>
          <span className="hidden sm:inline">GitHub</span>
        </a>
      </div>
    </nav>
  );
}
