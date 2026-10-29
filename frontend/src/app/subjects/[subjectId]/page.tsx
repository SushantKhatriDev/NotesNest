
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { api } from "@/lib/api";
import type { Subject } from "@/lib/types";
import SubjectPageClient from "./SubjectPageClient";

type Props = {
  params: { subjectId: string };
};

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://notes-nest-frontend-nu.vercel.app";

async function getSubject(subjectId: string): Promise<Subject | null> {
  if (!/^\d+$/.test(subjectId) || Number(subjectId) <= 0) {
    return null;
  }

  try {
    return await api<Subject>(`/subjects/${subjectId}`, {
      cache: "no-store",
    });
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const subject = await getSubject(params.subjectId);

  if (!subject) {
    return {
      title: "Subject not found",
      description: "This subject could not be found on NotesNest.",
      robots: { index: false, follow: false },
    };
  }

  const title = `${subject.code} ${subject.name} – NotesNest`;
  const description = `Find previous-year question papers, notes, and study resources for ${subject.code} ${subject.name} on NotesNest.`;
  const url = `/subjects/${subject.id}`;

  return {
    title: `${subject.code} ${subject.name}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: "NotesNest",
      title,
      description,
      url,
      images: [
        {
          url: "/opengraph-image.png",
          width: 1200,
          height: 630,
          alt: `NotesNest resources for ${subject.code} ${subject.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image.png"],
    },
    metadataBase: new URL(siteUrl),
  };
}

export default async function SubjectPage({ params }: Props) {
  const subject = await getSubject(params.subjectId);

  if (!subject) {
    notFound();
  }

  return <SubjectPageClient params={params} />;
}
