"use client";

import { useEffect, useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { onIdTokenChanged, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { User } from "@/lib/types";
import { useWishlistStore } from "@/lib/stores/wishlist";
import { useCartStore, CartItem } from "@/lib/stores/cart";

function clearAuthCookies() {
  document.cookie = "firebase-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  document.cookie = "user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
}

export function useUser() {
  const queryClient = useQueryClient();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const hasResolvedOnce = useRef(false);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      hasResolvedOnce.current = true;
      setFirebaseUser(user);

      if (!user) {
        clearAuthCookies();
        queryClient.setQueryData(["user"], null);
        setLoadingAuth(false);
        return;
      }

      try {
        const idToken = await user.getIdToken();
        document.cookie = `firebase-token=${idToken}; path=/; max-age=3600; SameSite=Lax`;

        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.exists() ? (userDocSnap.data() as User) : null;
        const role = userData?.role || "customer";

        document.cookie = `user-role=${role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        queryClient.invalidateQueries({ queryKey: ["user", user.uid] });

        // ===== SYNC WISHLIST (BUG-U17) =====
        const wishlistRef = doc(db, "wishlists", user.uid);
        const wishlistSnap = await getDoc(wishlistRef);
        let mergedWishlistIds: string[] = [];
        if (wishlistSnap.exists()) {
          const cloudIds = wishlistSnap.data().productIds || [];
          const localIds = useWishlistStore.getState().ids;
          mergedWishlistIds = Array.from(new Set([...localIds, ...cloudIds]));
        } else {
          mergedWishlistIds = useWishlistStore.getState().ids;
        }
        useWishlistStore.getState().setIds(mergedWishlistIds);
        if (mergedWishlistIds.length > 0) {
          await setDoc(wishlistRef, {
            userId: user.uid,
            productIds: mergedWishlistIds,
            updatedAt: Date.now()
          }, { merge: true });
        }

        // ===== SYNC CART (BUG-U17) =====
        const cartRef = doc(db, "carts", user.uid);
        const cartSnap = await getDoc(cartRef);
        let mergedCartItems: CartItem[] = [];
        if (cartSnap.exists()) {
          const cloudItems = (cartSnap.data().items || []) as CartItem[];
          const localItems = useCartStore.getState().items;

          const mergedItemsMap = new Map<string, CartItem>();
          localItems.forEach(item => mergedItemsMap.set(item.variantSku, item));
          cloudItems.forEach(cItem => {
            const existing = mergedItemsMap.get(cItem.variantSku);
            if (existing) {
              mergedItemsMap.set(cItem.variantSku, {
                ...existing,
                qty: Math.max(existing.qty, cItem.qty)
              });
            } else {
              mergedItemsMap.set(cItem.variantSku, cItem);
            }
          });
          mergedCartItems = Array.from(mergedItemsMap.values());
        } else {
          mergedCartItems = useCartStore.getState().items;
        }
        useCartStore.getState().setItems(mergedCartItems);
        if (mergedCartItems.length > 0) {
          await setDoc(cartRef, {
            items: mergedCartItems,
            updatedAt: Date.now()
          }, { merge: true });
        }
      } catch (error) {
        console.error("Error syncing auth cookies and state:", error);
      } finally {
        setLoadingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [queryClient]);

  const {
    data: user,
    isLoading: isLoadingQuery,
    error,
    refetch,
  } = useQuery<User | null>({
    queryKey: ["user", firebaseUser?.uid],
    queryFn: async () => {
      if (!firebaseUser) return null;
      const userRef = doc(db, "users", firebaseUser.uid);
      const snapshot = await getDoc(userRef);
      if (!snapshot.exists()) {
        return null;
      }
      return snapshot.data() as User;
    },
    enabled: !loadingAuth && !!firebaseUser,
  });

  return {
    user: user ?? null,
    firebaseUser,
    isLoading: loadingAuth || isLoadingQuery,
    isAuthenticated: !!firebaseUser,
    role: user?.role ?? null,
    error,
    refetch,
  };
}