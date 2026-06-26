"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { onIdTokenChanged, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";
import { User } from "@/lib/types";

function clearAuthCookies() {
  document.cookie = "firebase-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  document.cookie = "user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
}

export function useUser() {
  const queryClient = useQueryClient();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (!user) {
        clearAuthCookies();
        queryClient.setQueryData(["user"], null);
        setLoadingAuth(false);
        return;
      }

      try {
        const idToken = await user.getIdToken();
        document.cookie = `firebase-token=${idToken}; path=/; max-age=3600; SameSite=Lax`;

        const userDocSnap = await getDoc(doc(db, "users", user.uid));
        const role = userDocSnap.exists()
          ? ((userDocSnap.data() as User).role || "customer")
          : "customer";

        document.cookie = `user-role=${role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        queryClient.invalidateQueries({ queryKey: ["user", user.uid] });
      } catch (error) {
        console.error("Error syncing auth cookies:", error);
      } finally {
        setLoadingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [queryClient]);

  const {
    data: user,
    isLoading: isLoadingQuery,
    error,
    refetch,
  } = useQuery<User | null>({
    queryKey: ["user", firebaseUser?.uid],
    queryFn: async () => {
      if (!firebaseUser) return null;
      const userRef = doc(db, "users", firebaseUser.uid);
      const snapshot = await getDoc(userRef);
      if (!snapshot.exists()) {
        return null;
      }
      return snapshot.data() as User;
    },
    enabled: !loadingAuth && !!firebaseUser,
  });

  return {
    user: user ?? null,
    firebaseUser,
    isLoading: loadingAuth || isLoadingQuery,
    isAuthenticated: !!firebaseUser,
    role: user?.role ?? null,
    error,
    refetch,
  };
}