import { useQuery } from "@tanstack/react-query";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Store } from "@/lib/types";
import { MOCK_STORES } from "@/lib/data/mock-db";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

/**
 * Fetch every approved store for the public "Stores" directory. Suspended /
 * pending stores are never surfaced to shoppers.
 */
export function useStores() {
  return useQuery<Store[]>({
    queryKey: ["stores"],
    queryFn: async () => {
      try {
        const storesRef = collection(db, "stores");
        const q = query(storesRef, where("status", "==", "approved"));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return USE_MOCKS ? MOCK_STORES : [];
        return snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }) as Store)
          .sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0));
      } catch (err) {
        console.warn("[useStores] store query failed:", err);
        return USE_MOCKS ? MOCK_STORES : [];
      }
    },
    staleTime: 1000 * 60 * 10, // stores change rarely
  });
}

/**
 * Fetch a single approved store by its public slug (used by the store profile
 * page at /stores/[slug]).
 */
export function useStoreBySlug(slug: string) {
  return useQuery<Store | null>({
    queryKey: ["store", slug],
    queryFn: async () => {
      if (!slug) return null;
      try {
        const storesRef = collection(db, "stores");
        const q = query(
          storesRef,
          where("slug", "==", slug),
          where("status", "==", "approved")
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          return USE_MOCKS
            ? MOCK_STORES.find((s) => s.slug === slug) || null
            : null;
        }
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Store;
      } catch (err) {
        console.warn("[useStoreBySlug] store query failed:", err);
        return USE_MOCKS
          ? MOCK_STORES.find((s) => s.slug === slug) || null
          : null;
      }
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Fetch a single store by its document id. Used by the product detail page to
 * resolve a product's `storeId` into a linkable store profile (slug, name,
 * rating). Any store status is returned here because the seller who owns the
 * product may be reviewing their own listing; the store profile page itself
 * still gates on `status === "approved"`.
 */
export function useStoreById(storeId: string) {
  return useQuery<Store | null>({
    queryKey: ["store-by-id", storeId],
    queryFn: async () => {
      if (!storeId) return null;
      try {
        const snapshot = await getDoc(doc(db, "stores", storeId));
        if (!snapshot.exists()) {
          return USE_MOCKS
            ? MOCK_STORES.find((s) => s.id === storeId) || null
            : null;
        }
        return { id: snapshot.id, ...snapshot.data() } as Store;
      } catch (err) {
        console.warn("[useStoreById] store query failed:", err);
        return USE_MOCKS
          ? MOCK_STORES.find((s) => s.id === storeId) || null
          : null;
      }
    },
    enabled: !!storeId,
    staleTime: 1000 * 60 * 10,
  });
}
