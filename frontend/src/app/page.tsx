"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ApiError, api } from "@/lib/api";
import type { Term } from "@/lib/types";
import { StateMessage } from "@/components/StateMessage";

export default function Home() {
  const router = useRouter();
  const [terms, setTerms] = useState<Term[] | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  const loadTerms = () => {
    setError(null);
    setTerms(null);
    api<Term[]>("/terms").then(setTerms).catch((reason: unknown) => {
      setError(reason instanceof ApiError ? reason : new ApiError("Couldn’t load semesters."));
    });
  };

  useEffect(() => {
    loadTerms();
  }, []);

  return (
    <section className="hero-panel py-4 sm:py-10">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Your study shelf</p>
      <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-6xl">Study smarter, one subject at a time.</h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-ink/70">
        Previous-year papers and notes, organised by semester and subject.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <a href="#semester-picker" className="inline-flex min-h-11 items-center rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2">
          Browse semesters
        </a>
        <Link href="/papers" className="inline-flex min-h-11 items-center rounded-lg border border-brand/30 px-4 py-3 text-sm font-semibold text-brand transition hover:bg-brand/5 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2">
          Find papers
        </Link>
      </div>
      <div id="semester-picker" className="mt-10 max-w-md scroll-mt-24">
        <label htmlFor="term" className="block text-sm font-medium">
          Choose a semester
        </label>
        {!terms && !error && <div className="mt-2"><StateMessage title="Loading semesters…" /></div>}
        {terms && (
          <select
            id="term"
            defaultValue=""
            onChange={(event) => event.target.value && router.push(`/terms/${event.target.value}`)}
            className="mt-2 min-h-12 w-full rounded-lg border border-ink/20 bg-white px-3 py-3 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
          >
            <option value="" disabled>
              -- Choose Semester --
            </option>
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
              </option>
            ))}
          </select>
        )}
        {error && (
          <div className="mt-3">
            <StateMessage
              title="We couldn’t load the semesters."
              description={
                error.status === null
                  ? process.env.NODE_ENV === "development"
                    ? "Check that the backend is running on port 8000, then try again."
                    : "Something went wrong while loading this page. Please try again in a moment."
                  : "Please try again in a moment."
              }
              tone="error"
              action={{ label: "Retry", onClick: loadTerms }}
            />
          </div>
        )}
      </div>
      <div className="stagger-list mt-12 grid gap-4 sm:grid-cols-3">
        {[
          { href: "/papers", icon: "⌕", label: "Papers", text: "Search CAT and FAT papers." },
          { href: "/faculty", icon: "◎", label: "Faculty", text: "Find teaching contacts." },
          { href: "/advice", icon: "✦", label: "Advice", text: "Read practical student notes." },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="card-interactive block border border-ink/10 bg-white p-5 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-xl text-brand" aria-hidden="true">{item.icon}</span>
            <h2 className="mt-4 font-semibold">{item.label}</h2>
            <p className="mt-1 text-sm leading-6 text-ink/65">{item.text}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
