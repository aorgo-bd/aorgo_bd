import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Banner } from "@/lib/types";

export function useBanners(
  position: "hero" | "mid" | "footer" = "hero",
  initialData?: Banner[]
) {
  return useQuery<Banner[]>({
    queryKey: ["banners", position],
    initialData,
    queryFn: async () => {
      const bannersRef = collection(db, "banners");
      const q = query(
        bannersRef,
        where("active", "==", true),
        where("position", "==", position),
        orderBy("order", "asc")
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Banner[];
    },
    staleTime: 1000 * 60 * 5,
  });
}