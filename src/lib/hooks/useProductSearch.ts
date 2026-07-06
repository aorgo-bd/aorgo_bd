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
import { MOCK_PRODUCTS } from "@/lib/data/mock-db";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

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

export function useProductSuggestions(searchTerm: string) {
  return useQuery<Product[]>({
    queryKey: ["product-suggestions", searchTerm],
    queryFn: async () => {
      const trimmed = searchTerm.trim();
      if (!trimmed) return [];

      let products: Product[] = [];
      try {
        const productsRef = collection(db, "products");
        const tokens = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
        if (tokens.length === 0) return [];
        const primaryToken = tokens[0];

        const q = query(
          productsRef,
          where("status", "==", "approved"),
          where("keywords", "array-contains", primaryToken),
          limit(8)
        );

        const snapshot = await getDocs(q);
        products = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        if (snapshot.empty) {
          products = USE_MOCKS ? MOCK_PRODUCTS : [];
        }
      } catch (err) {
        console.warn("[useProductSuggestions] product query failed:", err);
        products = USE_MOCKS ? MOCK_PRODUCTS : [];
      }

      const tokens = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
      return products.filter((p) => {
        const titleLower = p.title.toLowerCase();
        const descLower = p.description.toLowerCase();
        const brandLower = p.brand.toLowerCase();
        return tokens.every(
          (token) =>
            titleLower.includes(token) ||
            descLower.includes(token) ||
            brandLower.includes(token)
        );
      }).slice(0, 8);
    },
    enabled: searchTerm.trim().length > 0,
    staleTime: 1000 * 60 * 2,
  });
}

export function useProductSearch(options: SearchOptions) {
  const { searchTerm = "", filters = {}, sortBy = "newest", limitCount = 24 } = options;

  return useInfiniteQuery({
    queryKey: ["products-search", searchTerm, filters, sortBy, limitCount],
    queryFn: async ({ pageParam }) => {
      const productsRef = collection(db, "products");
      let products: Product[] = [];
      let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;

      // Base query: approved products
      let firestoreQuery = query(
        productsRef,
        where("status", "==", "approved")
      );

      const tokens = searchTerm.trim().toLowerCase().split(/\s+/).filter(Boolean);
      if (tokens.length > 0) {
        firestoreQuery = query(firestoreQuery, where("keywords", "array-contains", tokens[0]));
      }

      if (filters.category) {
        firestoreQuery = query(firestoreQuery, where("category", "==", filters.category));
      }

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

      if (pageParam) {
        firestoreQuery = query(firestoreQuery, startAfter(pageParam));
      }

      const hasSubFilters =
        (filters.colors && filters.colors.length > 0) ||
        (filters.sizes && filters.sizes.length > 0) ||
        (filters.subcategories && filters.subcategories.length > 0) ||
        filters.brand ||
        filters.gender ||
        filters.minPrice !== undefined ||
        filters.maxPrice !== undefined ||
        tokens.length > 1;

      const fetchLimit = hasSubFilters ? 100 : limitCount;
      firestoreQuery = query(firestoreQuery, limit(fetchLimit));

      try {
        const snapshot = await getDocs(firestoreQuery);
        lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
        products = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        if (snapshot.empty) {
          products = USE_MOCKS ? MOCK_PRODUCTS : [];
        }
      } catch (err) {
        console.warn("[useProductSearch] product query failed:", err);
        products = USE_MOCKS ? MOCK_PRODUCTS : [];
      }

      // Filter products based on search term
      if (tokens.length > 0) {
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

      // Category matching
      if (filters.category) {
        products = products.filter((p) => p.category === filters.category);
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

      // Sort
      if (sortBy === "price-asc") {
        products.sort((a, b) => a.price - b.price);
      } else if (sortBy === "price-desc") {
        products.sort((a, b) => b.price - a.price);
      } else if (sortBy === "rating-desc") {
        products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else if (sortBy === "popular") {
        products.sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0));
      } else {
        products.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
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
