import React from "react";

/**
 * Shared presentational shell for static legal / info pages (Terms, Privacy,
 * Returns, FAQ, Support). Keeps typography and spacing consistent.
 */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <h1 className="font-display text-3xl sm:text-4xl tracking-wide text-ink-900 uppercase">
        {title}
      </h1>
      {updated && (
        <p className="mt-2 text-xs font-semibold text-ink-400">Last updated: {updated}</p>
      )}
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink-700 [&_h2]:font-bold [&_h2]:text-ink-900 [&_h2]:text-lg [&_h2]:mt-8 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-pink-500 [&_a]:font-semibold hover:[&_a]:underline">
        {children}
      </div>
    </div>
  );
}
