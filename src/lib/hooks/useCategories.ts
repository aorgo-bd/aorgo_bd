import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Category } from "@/lib/types";

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const categoriesRef = collection(db, "categories");
      const q = query(categoriesRef, orderBy("order", "asc"));
      const snapshot = await getDocs(q);
      
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
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache since categories rarely change
  });
}
