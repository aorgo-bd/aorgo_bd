import { useQuery } from "@tanstack/react-query";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Product } from "@/lib/types";

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

export function useProducts(filter?: ProductFilter) {
  return useQuery<Product[]>({
    queryKey: ["products", filter],
    queryFn: async () => {
      const productsRef = collection(db, "products");
      
      // Filter by 'approved' status in Firestore (single-field query, doesn't need composite indexes)
      const q = query(productsRef, where("status", "==", "approved"));
      const snapshot = await getDocs(q);
      
      let products = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        } as Product;
      });

      // 1. Featured filter
      if (filter?.featured !== undefined) {
        products = products.filter((p) => p.featured === filter.featured);
      }

      // 2. Category / Subcategory filter
      if (filter?.subcategories && filter.subcategories.length > 0) {
        products = products.filter((p) => filter.subcategories!.includes(p.category));
      } else if (filter?.category) {
        products = products.filter((p) => p.category === filter.category);
      }

      // 3. Search query filter (case-insensitive title and keywords search)
      if (filter?.search) {
        const searchLower = filter.search.toLowerCase().trim();
        products = products.filter(
          (p) =>
            p.title.toLowerCase().includes(searchLower) ||
            p.brand.toLowerCase().includes(searchLower) ||
            p.description.toLowerCase().includes(searchLower) ||
            (p.keywords && p.keywords.some((k) => k.toLowerCase().includes(searchLower)))
        );
      }

      // 4. Price range filter
      if (filter?.minPrice !== undefined) {
        products = products.filter((p) => p.price >= filter.minPrice!);
      }
      if (filter?.maxPrice !== undefined) {
        products = products.filter((p) => p.price <= filter.maxPrice!);
      }

      // 5. Colors filter
      if (filter?.colors && filter.colors.length > 0) {
        const lowerColors = filter.colors.map((c) => c.toLowerCase());
        products = products.filter((p) =>
          p.variants?.some((v) => lowerColors.includes(v.color.toLowerCase()))
        );
      }

      // 6. Sizes filter
      if (filter?.sizes && filter.sizes.length > 0) {
        products = products.filter((p) =>
          p.variants?.some((v) => filter.sizes!.includes(v.size))
        );
      }

      // 7. Sorting
      if (filter?.sortBy) {
        const sortBy = filter.sortBy;
        const sortOrder = filter.sortOrder || "desc";
        products.sort((a, b) => {
          const valA = a[sortBy] ?? 0;
          const valB = b[sortBy] ?? 0;
          if (sortOrder === "asc") {
            return valA > valB ? 1 : -1;
          } else {
            return valA < valB ? 1 : -1;
          }
        });
      } else {
        // Default sort by newest createdAt
        products.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      }

      // 8. Limit
      if (filter?.limit) {
        products = products.slice(0, filter.limit);
      }

      return products;
    },
  });
}

export function useProductBySlug(slug: string) {
  return useQuery<Product | null>({
    queryKey: ["product", slug],
    queryFn: async () => {
      if (!slug) return null;
      const productsRef = collection(db, "products");
      const q = query(
        productsRef,
        where("slug", "==", slug),
        where("status", "==", "approved")
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as Product;
    },
    enabled: !!slug,
  });
}

export function useSellerProducts(sellerUid: string) {
  return useQuery<Product[]>({
    queryKey: ["seller-products", sellerUid],
    queryFn: async () => {
      if (!sellerUid) return [];
      const productsRef = collection(db, "products");
      const q = query(productsRef, where("sellerUid", "==", sellerUid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        return {
          id: doc.id,
          ...doc.data(),
        } as Product;
      }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    },
    enabled: !!sellerUid,
  });
}

export function useSellerProduct(productId: string) {
  return useQuery<Product | null>({
    queryKey: ["seller-product", productId],
    queryFn: async () => {
      if (!productId) return null;
      const docRef = doc(db, "products", productId);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) return null;
      return {
        id: snapshot.id,
        ...snapshot.data(),
      } as Product;
    },
    enabled: !!productId,
  });
}


