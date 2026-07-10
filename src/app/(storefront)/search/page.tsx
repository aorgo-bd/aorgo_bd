import { Metadata } from "next";
import SearchClient from "./SearchClient";
import { Suspense } from "react";

interface Props {
  searchParams: Promise<{ q?: string; search?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q, search } = await searchParams;
  const queryVal = q || search || "";
  return {
    title: queryVal ? `Search results for "${queryVal}" | AORGO` : "Search Products | AORGO",
    description: `Search and filter multi-vendor apparel, footwear, and lifestyle listings on AORGO Bangladesh.`,
  };
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchClient />
    </Suspense>
  );
}
