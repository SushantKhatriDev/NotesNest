import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search papers by subject | NotesNest",
  description: "Find CAT and FAT papers by subject code or name.",
};

export default function PapersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
