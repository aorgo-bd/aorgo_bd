import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/lib/types";

interface WishlistStore {
  items: Product[];
  toggleItem: (product: Product) => void;
  hasItem: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      toggleItem: (product) =>
        set((state) => {
          const exists = state.items.some((item) => item.id === product.id);
          if (exists) {
            return {
              items: state.items.filter((item) => item.id !== product.id),
            };
          }
          return { items: [...state.items, product] };
        }),
      hasItem: (productId) => {
        return get().items.some((item) => item.id === productId);
      },
    }),
    {
      name: "aorgo-wishlist-store",
    }
  )
);
