import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Banner } from "@/lib/types";

export function useBanners(position: "hero" | "mid" | "footer" = "hero") {
  return useQuery<Banner[]>({
    queryKey: ["banners", position],
    queryFn: async () => {
      const bannersRef = collection(db, "banners");
      
      // Fetch active banners from Firestore (single-field query)
      const q = query(bannersRef, where("active", "==", true));
      const snapshot = await getDocs(q);
      
      const banners = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        } as Banner;
      });

      // Filter by position and sort by order client-side to avoid composite indexes requirement
      return banners
        .filter((b) => b.position === position)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    },
  });
}
