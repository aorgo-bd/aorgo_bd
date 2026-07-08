import { useQuery } from "@tanstack/react-query";
import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit as firestoreLimit,
  orderBy,
  query,
  QueryConstraint,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Product } from "@/lib/types";
import { MOCK_PRODUCTS } from "@/lib/data/mock-db";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

export interface ProductFilter {
  category?: string;
  subcategories?: string[];
  featured?: boolean;
  limit?: number;
  sortBy?: "price" | "rating" | "createdAt" | "totalSold";
  sortOrder?: "asc" | "desc";
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  colors?: string[];
  sizes?: string[];
}

function applyClientOnlyFilters(products: Product[], filter?: ProductFilter) {
  let filtered = products;

  if (filter?.featured !== undefined) {
    filtered = filtered.filter((p) => p.featured === filter.featured);
  }

  if (filter?.category) {
    filtered = filtered.filter(
      (p) =>
        p.category === filter.category ||
        (MOCK_PRODUCTS.find((mp) => mp.slug === p.slug)?.category === filter.category)
    );
  } else if (filter?.subcategories?.length) {
    filtered = filtered.filter((p) => filter.subcategories!.includes(p.category));
  }

  if (filter?.search) {
    const tokens = filter.search.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (tokens.length > 0) {
      filtered = filtered.filter((p) => {
        const haystack = [p.title, p.brand, p.description, ...(p.keywords ?? [])]
          .join(" ")
          .toLowerCase();
        return tokens.every((token) => haystack.includes(token));
      });
    }
  }

  if (filter?.minPrice !== undefined) {
    filtered = filtered.filter((p) => p.price >= filter.minPrice!);
  }

  if (filter?.maxPrice !== undefined) {
    filtered = filtered.filter((p) => p.price <= filter.maxPrice!);
  }

  if (filter?.colors?.length) {
    const lowerColors = filter.colors.map((c) => c.toLowerCase());
    filtered = filtered.filter((p) =>
      p.variants?.some((v) => lowerColors.includes(v.color.toLowerCase()))
    );
  }

  if (filter?.sizes?.length) {
    filtered = filtered.filter((p) =>
      p.variants?.some((v) => filter.sizes!.includes(v.size))
    );
  }

  return filtered;
}

function applyProductSort(products: Product[], filter?: ProductFilter) {
  const hasPriceRange = filter?.minPrice !== undefined || filter?.maxPrice !== undefined;
  const sortBy = hasPriceRange ? "price" : filter?.sortBy ?? "createdAt";
  const sortOrder = filter?.sortOrder ?? "desc";

  return [...products].sort((a, b) => {
    const valueA = a[sortBy] ?? 0;
    const valueB = b[sortBy] ?? 0;
    if (valueA === valueB) return 0;
    return sortOrder === "asc" ? (valueA > valueB ? 1 : -1) : (valueA < valueB ? 1 : -1);
  });
}

function buildProductConstraints(filter?: ProductFilter): QueryConstraint[] {
  const constraints: QueryConstraint[] = [where("status", "==", "approved")];

  if (filter?.featured !== undefined) {
    constraints.push(where("featured", "==", filter.featured));
  }

  if (filter?.category) {
    constraints.push(where("category", "==", filter.category));
  } else if (filter?.subcategories?.length) {
    constraints.push(where("category", "in", filter.subcategories.slice(0, 10)));
  }

  const searchToken = filter?.search?.trim().toLowerCase().split(/\s+/).filter(Boolean)[0];
  if (searchToken) {
    constraints.push(where("keywords", "array-contains", searchToken));
  }

  const hasPriceRange = filter?.minPrice !== undefined || filter?.maxPrice !== undefined;
  const sortBy = hasPriceRange ? "price" : filter?.sortBy ?? "createdAt";
  const sortOrder = filter?.sortOrder ?? "desc";

  if (hasPriceRange) {
    if (filter?.minPrice !== undefined) constraints.push(where("price", ">=", filter.minPrice));
    if (filter?.maxPrice !== undefined) constraints.push(where("price", "<=", filter.maxPrice));
  }

  constraints.push(orderBy(sortBy, sortOrder));

  const needsClientPostFilter =
    (filter?.colors?.length ?? 0) > 0 ||
    (filter?.sizes?.length ?? 0) > 0 ||
    (filter?.search?.trim().split(/\s+/).filter(Boolean).length ?? 0) > 1;
  constraints.push(firestoreLimit(needsClientPostFilter ? 100 : filter?.limit ?? 24));

  return constraints;
}

export function useProducts(filter?: ProductFilter, initialData?: Product[]) {
  return useQuery<Product[]>({
    queryKey: ["products", filter],
    initialData,
    queryFn: async () => {
      const productsRef = collection(db, "products");
      let products: Product[] = [];

      try {
        const q = query(productsRef, ...buildProductConstraints(filter));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          products = USE_MOCKS ? MOCK_PRODUCTS : [];
        } else {
          products = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Product[];
        }
      } catch (err) {
        console.warn("[useProducts] product query failed:", err);
        products = USE_MOCKS ? MOCK_PRODUCTS : [];
      }

      products = applyClientOnlyFilters(products, filter);
      products = applyProductSort(products, filter);

      if (filter?.limit) {
        products = products.slice(0, filter.limit);
      }

      return products;
    },
    staleTime: initialData ? 1000 * 60 * 5 : 0,
  });
}

/**
 * Fetch products by their document IDs (used by the wishlist so that saved
 * items are shown regardless of whether they fall inside the default product
 * query window). Firestore `in` queries are limited to 10 values, so IDs are
 * fetched in batches of 10.
 */
export function useProductsByIds(ids: string[]) {
  const sortedIds = [...ids].sort();
  return useQuery<Product[]>({
    queryKey: ["products-by-ids", sortedIds],
    queryFn: async () => {
      if (sortedIds.length === 0) return [];
      try {
        const productsRef = collection(db, "products");
        const batches: string[][] = [];
        for (let i = 0; i < sortedIds.length; i += 10) {
          batches.push(sortedIds.slice(i, i + 10));
        }

        const results = await Promise.all(
          batches.map(async (batch) => {
            const q = query(productsRef, where(documentId(), "in", batch));
            const snapshot = await getDocs(q);
            return snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            })) as Product[];
          })
        );

        const found = results.flat();
        if (found.length === 0 && USE_MOCKS) {
          return MOCK_PRODUCTS.filter((p) => sortedIds.includes(p.id));
        }
        return found;
      } catch (err) {
        console.warn("[useProductsByIds] product query failed:", err);
        return USE_MOCKS ? MOCK_PRODUCTS.filter((p) => sortedIds.includes(p.id)) : [];
      }
    },
    enabled: sortedIds.length > 0,
  });
}

export function useProductBySlug(slug: string) {
  return useQuery<Product | null>({
    queryKey: ["product", slug],
    queryFn: async () => {
      if (!slug) return null;
      try {
        const productsRef = collection(db, "products");
        const q = query(
          productsRef,
          where("slug", "==", slug),
          where("status", "==", "approved")
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          return USE_MOCKS ? MOCK_PRODUCTS.find((p) => p.slug === slug) || null : null;
        }
        const doc = snapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data(),
        } as Product;
      } catch (err) {
        console.warn("[useProductBySlug] product query failed:", err);
        return USE_MOCKS ? MOCK_PRODUCTS.find((p) => p.slug === slug) || null : null;
      }
    },
    enabled: !!slug,
  });
}

export function useSellerProducts(sellerUid: string) {
  return useQuery<Product[]>({
    queryKey: ["seller-products", sellerUid],
    queryFn: async () => {
      if (!sellerUid) return [];
      try {
        const productsRef = collection(db, "products");
        const q = query(productsRef, where("sellerUid", "==", sellerUid));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          return USE_MOCKS ? MOCK_PRODUCTS.filter((p) => p.sellerUid === sellerUid) : [];
        }
        return snapshot.docs.map((doc) => {
          return {
            id: doc.id,
            ...doc.data(),
          } as Product;
        }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      } catch (err) {
        console.warn("[useSellerProducts] product query failed:", err);
        return USE_MOCKS ? MOCK_PRODUCTS.filter((p) => p.sellerUid === sellerUid) : [];
      }
    },
    enabled: !!sellerUid,
  });
}

/**
 * Fetch a store's publicly visible (approved) products for its storefront
 * profile page. Unlike `useSellerProducts` (seller dashboard, all statuses),
 * this only returns approved products so shoppers never see drafts.
 */
export function useStoreProducts(storeId: string) {
  return useQuery<Product[]>({
    queryKey: ["store-products", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      try {
        const productsRef = collection(db, "products");
        const q = query(
          productsRef,
          where("storeId", "==", storeId),
          where("status", "==", "approved")
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          return USE_MOCKS
            ? MOCK_PRODUCTS.filter(
                (p) => p.storeId === storeId && p.status === "approved"
              )
            : [];
        }
        return snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }) as Product)
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      } catch (err) {
        console.warn("[useStoreProducts] product query failed:", err);
        return USE_MOCKS
          ? MOCK_PRODUCTS.filter(
              (p) => p.storeId === storeId && p.status === "approved"
            )
          : [];
      }
    },
    enabled: !!storeId,
  });
}

export function useSellerProduct(productId: string) {
  return useQuery<Product | null>({
    queryKey: ["seller-product", productId],
    queryFn: async () => {
      if (!productId) return null;
      try {
        const docRef = doc(db, "products", productId);
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) {
          return USE_MOCKS ? MOCK_PRODUCTS.find((p) => p.id === productId) || null : null;
        }
        return {
          id: snapshot.id,
          ...snapshot.data(),
        } as Product;
      } catch (err) {
        console.warn("[useSellerProduct] product query failed:", err);
        return USE_MOCKS ? MOCK_PRODUCTS.find((p) => p.id === productId) || null : null;
      }
    },
    enabled: !!productId,
  });
}