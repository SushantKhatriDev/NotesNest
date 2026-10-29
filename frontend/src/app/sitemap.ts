import type { MetadataRoute } from "next";
import type { Subject } from "@/lib/types";
import { api } from "@/lib/api";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://notes-nest-frontend-nu.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/papers",
    "/advice",
    "/faculty",
  ];

  const pages: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
  }));

  try {
    const subjects = await api<Subject[]>("/subjects", {
      cache: "no-store",
    });

    pages.push(
      ...subjects.map((subject) => ({
        url: `${siteUrl}/subjects/${subject.id}`,
      })),
    );
  } catch {
    // Keep static pages available if the subjects API is unavailable.
  }

  return pages;
}