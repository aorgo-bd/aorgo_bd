import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Category } from "@/lib/types";
import { MOCK_CATEGORIES } from "@/lib/data/mock-db";

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const categoriesRef = collection(db, "categories");
        const q = query(categoriesRef, orderBy("order", "asc"));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return MOCK_CATEGORIES;
        
        return snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            slug: doc.id,
            name: data.name,
            nameBn: data.nameBn,
            parent: data.parent || null,
            image: data.image,
            order: data.order ?? 0,
            productCount: data.productCount ?? 0,
          } as Category;
        });
      } catch (err) {
        console.warn("[useCategories] falling back to mock categories:", err);
        return MOCK_CATEGORIES;
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache since categories rarely change
  });
}
