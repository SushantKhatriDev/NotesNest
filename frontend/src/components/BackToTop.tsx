"use client";

import { useEffect, useState } from "react";

const SHOW_AFTER_PX = 240;

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      setVisible(window.scrollY > SHOW_AFTER_PX);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-40 rounded-full bg-brand px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
      aria-label="Back to top"
    >
      ↑ Top
    </button>
  );
}
