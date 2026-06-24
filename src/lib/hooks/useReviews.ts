import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Review } from "@/lib/types";

export function useReviews(productId: string) {
  return useQuery<Review[]>({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      if (!productId) return [];
      const reviewsRef = collection(db, "reviews");
      const q = query(reviewsRef, where("productId", "==", productId));
      const snapshot = await getDocs(q);
      
      const reviews = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        } as Review;
      });

      // Sort in-memory by newest to avoid index requirement
      reviews.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      return reviews;
    },
    enabled: !!productId,
  });
}
