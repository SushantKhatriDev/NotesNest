import type { Metadata, Viewport } from "next";
import { Navigation } from "@/components/Navigation";
import { BackToTop } from "@/components/BackToTop";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      "https://notes-nest-frontend-nu.vercel.app",
  ),
  title: {
    default: "NotesNest",
    template: "%s | NotesNest",
  },
  description:
    "Find previous-year papers, notes, faculty information, and study advice for BSc students.",
  openGraph: {
    type: "website",
    siteName: "NotesNest",
    title: "NotesNest",
    description:
      "Find previous-year papers, notes, faculty information, and study advice for BSc students.",
    url: "/",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "NotesNest — course materials and study resources",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NotesNest",
    description:
      "Find previous-year papers, notes, faculty information, and study advice for BSc students.",
    images: ["/opengraph-image.png"],
  },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <header className="nav-shell">
          <Navigation />
        </header>
        <main className="page-shell mx-auto min-h-[calc(100vh-145px)] max-w-5xl px-4 py-8 sm:py-12">
          {children}
        </main>
        <footer className="border-t border-ink/10">
          <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-ink/60">
            NotesNest · A simpler way to find your course materials.
          </div>
        </footer>
        <BackToTop />
        <Analytics />
      </body>
    </html>
  );
}