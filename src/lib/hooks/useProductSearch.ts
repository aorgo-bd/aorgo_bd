import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Product } from "@/lib/types";

export interface SearchFilters {
  category?: string;
  subcategories?: string[];
  colors?: string[];
  sizes?: string[];
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  gender?: string;
}

export interface SearchOptions {
  searchTerm?: string;
  filters?: SearchFilters;
  sortBy?: "newest" | "price-asc" | "price-desc" | "rating-desc" | "popular";
  limitCount?: number;
}

/**
 * Hook to retrieve fast autocomplete search suggestions.
 */
export function useProductSuggestions(searchTerm: string) {
  return useQuery<Product[]>({
    queryKey: ["product-suggestions", searchTerm],
    queryFn: async () => {
      const trimmed = searchTerm.trim();
      if (!trimmed) return [];

      const productsRef = collection(db, "products");
      const tokens = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
      if (tokens.length === 0) return [];
      const primaryToken = tokens[0];

      // Query products containing the first search token in keywords list
      const q = query(
        productsRef,
        where("status", "==", "approved"),
        where("keywords", "array-contains", primaryToken),
        limit(8)
      );

      const snapshot = await getDocs(q);
      const suggestions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];

      // Post-filter suggestions client-side if multiple tokens are typed
      if (tokens.length > 1) {
        return suggestions.filter((p) => {
          const titleLower = p.title.toLowerCase();
          const descLower = p.description.toLowerCase();
          const brandLower = p.brand.toLowerCase();
          return tokens.every(
            (token) =>
              titleLower.includes(token) ||
              descLower.includes(token) ||
              brandLower.includes(token)
          );
        });
      }

      return suggestions;
    },
    enabled: searchTerm.trim().length > 0,
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
  });
}

/**
 * Hook to execute composite paginated search and filters via Firestore + post-filters.
 */
export function useProductSearch(options: SearchOptions) {
  const { searchTerm = "", filters = {}, sortBy = "newest", limitCount = 24 } = options;

  return useInfiniteQuery({
    queryKey: ["products-search", searchTerm, filters, sortBy, limitCount],
    queryFn: async ({ pageParam }) => {
      const productsRef = collection(db, "products");

      // Base query: approved products
      let firestoreQuery = query(
        productsRef,
        where("status", "==", "approved")
      );

      // 1. Text Search query:
      const tokens = searchTerm.trim().toLowerCase().split(/\s+/).filter(Boolean);
      if (tokens.length > 0) {
        firestoreQuery = query(firestoreQuery, where("keywords", "array-contains", tokens[0]));
      }

      // 2. Category matching:
      if (filters.category) {
        firestoreQuery = query(firestoreQuery, where("category", "==", filters.category));
      }

      // 3. Sorting (orderBy):
      if (sortBy === "price-asc") {
        firestoreQuery = query(firestoreQuery, orderBy("price", "asc"));
      } else if (sortBy === "price-desc") {
        firestoreQuery = query(firestoreQuery, orderBy("price", "desc"));
      } else if (sortBy === "rating-desc") {
        firestoreQuery = query(firestoreQuery, orderBy("rating", "desc"));
      } else if (sortBy === "popular") {
        firestoreQuery = query(firestoreQuery, orderBy("totalSold", "desc"));
      } else {
        firestoreQuery = query(firestoreQuery, orderBy("createdAt", "desc"));
      }

      // 4. Pagination:
      if (pageParam) {
        firestoreQuery = query(firestoreQuery, startAfter(pageParam));
      }

      // 5. Batch limit determination:
      const hasSubFilters =
        (filters.colors && filters.colors.length > 0) ||
        (filters.sizes && filters.sizes.length > 0) ||
        (filters.subcategories && filters.subcategories.length > 0) ||
        filters.brand ||
        filters.gender ||
        filters.minPrice !== undefined ||
        filters.maxPrice !== undefined ||
        tokens.length > 1;

      // If complex post-filtering is active, fetch a larger window to ensure results
      const fetchLimit = hasSubFilters ? 100 : limitCount;
      firestoreQuery = query(firestoreQuery, limit(fetchLimit));

      const snapshot = await getDocs(firestoreQuery);
      const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

      let products = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];

      // --- Post-Filtering (Client-Side) ---

      // Multi-token text search refine
      if (tokens.length > 1) {
        products = products.filter((p) => {
          const titleLower = p.title.toLowerCase();
          const descLower = p.description.toLowerCase();
          const brandLower = p.brand.toLowerCase();
          return tokens.every(
            (token) =>
              titleLower.includes(token) ||
              descLower.includes(token) ||
              brandLower.includes(token)
          );
        });
      }

      // Subcategories selection
      if (filters.subcategories && filters.subcategories.length > 0) {
        products = products.filter((p) => filters.subcategories!.includes(p.category));
      }

      // Gender
      if (filters.gender) {
        products = products.filter((p) => p.gender === filters.gender);
      }

      // Brand
      if (filters.brand) {
        products = products.filter((p) => p.brand.toLowerCase() === filters.brand!.toLowerCase());
      }

      // Price ranges
      if (filters.minPrice !== undefined) {
        products = products.filter((p) => p.price >= filters.minPrice!);
      }
      if (filters.maxPrice !== undefined) {
        products = products.filter((p) => p.price <= filters.maxPrice!);
      }

      // Variant Colors matching
      if (filters.colors && filters.colors.length > 0) {
        const lowerColors = filters.colors.map((c) => c.toLowerCase());
        products = products.filter((p) =>
          p.variants?.some((v) => lowerColors.includes(v.color.toLowerCase()))
        );
      }

      // Variant Sizes matching
      if (filters.sizes && filters.sizes.length > 0) {
        products = products.filter((p) =>
          p.variants?.some((v) => filters.sizes!.includes(v.size))
        );
      }

      // Truncate to desired limit
      if (hasSubFilters) {
        products = products.slice(0, limitCount);
      }

      return {
        products,
        lastDoc,
      };
    },
    initialPageParam: null as QueryDocumentSnapshot<DocumentData> | null,
    getNextPageParam: (lastPage) => lastPage.lastDoc,
  });
}
