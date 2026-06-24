"use client";

import { useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { useWishlistStore } from "@/lib/stores/wishlist";

export default function AuthSync() {
  const syncWishlist = useWishlistStore((state) => state.setIds);
  const prevUserUid = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Sync wishlist on login transition (only if it's a new login session)
        if (prevUserUid.current !== user.uid) {
          prevUserUid.current = user.uid;

          try {
            // Get local IDs
            const localIds = useWishlistStore.getState().ids;

            // Fetch server IDs
            const wishlistRef = doc(db, "wishlists", user.uid);
            const snapshot = await getDoc(wishlistRef);

            let serverIds: string[] = [];
            if (snapshot.exists()) {
              serverIds = snapshot.data().productIds || [];
            }

            // Merge local and server IDs (removing duplicates)
            const mergedIds = Array.from(new Set([...localIds, ...serverIds]));

            // Update Firestore with the merged list
            await setDoc(
              wishlistRef,
              {
                userId: user.uid,
                productIds: mergedIds,
                updatedAt: Date.now(),
              },
              { merge: true }
            );

            // Update local Zustand store
            syncWishlist(mergedIds);
          } catch (error) {
            console.error("Error syncing wishlist on login:", error);
          }
        }
      } else {
        if (prevUserUid.current !== null) {
          prevUserUid.current = null;
          // Clear local wishlist store on logout to prevent leakage
          syncWishlist([]);
        }
      }
    });

    return () => unsubscribe();
  }, [syncWishlist]);

  return null;
}
