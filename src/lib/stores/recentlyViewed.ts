import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/lib/types";

const MAX_ITEMS = 12;

interface RecentlyViewedStore {
  items: Product[];
  /** Record a product view — moves it to the front, dedupes, caps the list. */
  add: (product: Product) => void;
  clear: () => void;
}

/**
 * Client-side "Recently Viewed" history (spec #13). Persists a compact list of
 * the last products the shopper opened so the PDP can show a horizontal rail.
 * Stored in localStorage; no auth or Firestore needed.
 */
export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      items: [],
      add: (product) => {
        if (!product?.id) return;
        const withoutCurrent = get().items.filter((p) => p.id !== product.id);
        set({ items: [product, ...withoutCurrent].slice(0, MAX_ITEMS) });
      },
      clear: () => set({ items: [] }),
    }),
    {
      name: "aorgo-recently-viewed",
    }
  )
);
