"use client";

import { useEffect, useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { User } from "@/lib/types";
import { useWishlistStore } from "@/lib/stores/wishlist";
import { useCartStore, CartItem } from "@/lib/stores/cart";

async function clearServerSession() {
  try {
    await fetch("/api/auth/session", { method: "DELETE" });
  } catch {
    // Best effort: Firebase sign-out still clears the client session.
  }
}

async function refreshServerSession(user: FirebaseUser) {
  const idToken = await user.getIdToken(true);
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Failed to refresh session");
  }
}

export function useUser() {
  const queryClient = useQueryClient();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const lastSyncedUid = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (!user) {
        lastSyncedUid.current = null;
        await clearServerSession();
        queryClient.setQueryData(["user"], null);
        useWishlistStore.getState().setIds([]);
        setLoadingAuth(false);
        return;
      }

      try {
        await refreshServerSession(user);

        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.exists() ? (userDocSnap.data() as User & { suspended?: boolean }) : null;

        if (userData?.suspended) {
          await signOut(auth);
          throw new Error("Account suspended");
        }

        queryClient.invalidateQueries({ queryKey: ["user", user.uid] });

        if (lastSyncedUid.current !== user.uid) {
          lastSyncedUid.current = user.uid;

          const wishlistRef = doc(db, "wishlists", user.uid);
          const wishlistSnap = await getDoc(wishlistRef);
          const localIds = useWishlistStore.getState().ids;
          const cloudIds = wishlistSnap.exists() ? wishlistSnap.data().productIds || [] : [];
          const mergedWishlistIds = Array.from(new Set([...localIds, ...cloudIds]));
          useWishlistStore.getState().setIds(mergedWishlistIds);
          await setDoc(wishlistRef, {
            userId: user.uid,
            productIds: mergedWishlistIds,
            updatedAt: Date.now()
          }, { merge: true });

          const cartRef = doc(db, "carts", user.uid);
          const cartSnap = await getDoc(cartRef);
          const localItems = useCartStore.getState().items;
          const cloudItems = cartSnap.exists() ? ((cartSnap.data().items || []) as CartItem[]) : [];
          const mergedItemsMap = new Map<string, CartItem>();
          localItems.forEach(item => mergedItemsMap.set(item.variantSku, item));
          cloudItems.forEach(cloudItem => {
            const existing = mergedItemsMap.get(cloudItem.variantSku);
            mergedItemsMap.set(cloudItem.variantSku, existing ? {
              ...existing,
              qty: Math.max(existing.qty, cloudItem.qty)
            } : cloudItem);
          });
          const mergedCartItems = Array.from(mergedItemsMap.values());
          useCartStore.getState().setItems(mergedCartItems);
          await setDoc(cartRef, {
            items: mergedCartItems,
            updatedAt: Date.now()
          }, { merge: true });
        }
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