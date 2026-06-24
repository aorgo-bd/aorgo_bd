import { create } from "zustand";
import { persist } from "zustand/middleware";
import { doc, setDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/client";

interface WishlistStore {
  ids: string[];
  toggle: (productId: string) => Promise<void>;
  has: (productId: string) => boolean;
  setIds: (ids: string[]) => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: async (productId) => {
        const state = get();
        const exists = state.ids.includes(productId);
        const newIds = exists
          ? state.ids.filter((id) => id !== productId)
          : [...state.ids, productId];

        set({ ids: newIds });

        // If user is authenticated, write to Firestore
        const currentUser = auth.currentUser;
        if (currentUser) {
          try {
            const wishlistRef = doc(db, "wishlists", currentUser.uid);
            await setDoc(
              wishlistRef,
              {
                userId: currentUser.uid,
                productIds: newIds,
                updatedAt: Date.now(),
              },
              { merge: true }
            );
          } catch (error) {
            console.error("Error updating wishlist in Firestore:", error);
          }
        }
      },
      has: (productId) => {
        return get().ids.includes(productId);
      },
      setIds: (ids) => set({ ids }),
    }),
    {
      name: "aorgo-wishlist-store",
    }
  )
);
