import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Banner } from "@/lib/types";
import { MOCK_BANNERS } from "@/lib/data/mock-db";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

export function useBanners(
  position: "hero" | "mid" | "footer" = "hero",
  initialData?: Banner[]
) {
  return useQuery<Banner[]>({
    queryKey: ["banners", position],
    initialData,
    queryFn: async () => {
      try {
        const bannersRef = collection(db, "banners");
        const q = query(
          bannersRef,
          where("active", "==", true),
          where("position", "==", position),
          orderBy("order", "asc")
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          return USE_MOCKS ? MOCK_BANNERS.filter((b) => b.position === position) : [];
        }

        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Banner[];
      } catch (err) {
        console.warn("[useBanners] banner query failed:", err);
        return USE_MOCKS ? MOCK_BANNERS.filter((b) => b.position === position) : [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });
}