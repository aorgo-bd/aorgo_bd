import { Metadata } from "next";
import SearchClient from "./SearchClient";
import { Suspense } from "react";

interface Props {
  searchParams: { q?: string; search?: string };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const queryVal = searchParams.q || searchParams.search || "";
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
