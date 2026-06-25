"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";
import { User } from "@/lib/types";
import { useDispatch } from "react-redux";
import { setUser } from "@/fetures/user/userSlice";

export function useUser() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setLoadingAuth(false);

      if (user) {
        try {
          // Set firebase token cookie for middleware routing protection
          const idToken = await user.getIdToken();
          document.cookie = `firebase-token=${idToken}; path=/; max-age=${
            60 * 60 * 24 * 7
          }; SameSite=Lax`;

          // Fetch the corresponding Firestore document
          const userDocSnap = await getDoc(doc(db, "users", user.uid));
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as User;
            const role = userData.role || "customer";
            
            // Set user role cookie for role-based middleware check
            document.cookie = `user-role=${role}; path=/; max-age=${
              60 * 60 * 24 * 7
            }; SameSite=Lax`;

            const parseDate = (val: any): string => {
              if (!val) return new Date().toISOString();
              if (typeof val.toDate === "function") {
                return val.toDate().toISOString();
              }
              const date = new Date(val);
              if (!isNaN(date.getTime())) {
                return date.toISOString();
              }
              return new Date().toISOString();
            };

            // Keep Redux auth slice synced for reverse compatibility
            dispatch(
              setUser({
                uid: userData.uid,
                email: userData.email,
                displayName: userData.displayName || null,
                photoURL: userData.photoURL || null,
                role: userData.role === "admin" ? "admin" : "user",
                isActive: true,
                createdAt: parseDate(userData.createdAt),
                updatedAt: parseDate(userData.updatedAt),
              })
            );
          } else {
            // Default role is customer
            document.cookie = `user-role=customer; path=/; max-age=${
              60 * 60 * 24 * 7
            }; SameSite=Lax`;
          }
        } catch (error) {
          console.error("Error fetching user document in auth state change:", error);
        }
      } else {
        // Clear auth cookies
        document.cookie =
          "firebase-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        document.cookie =
          "user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";

        // Clear Redux auth state
        dispatch(setUser(null));
        // Clear React Query cache
        queryClient.setQueryData(["user"], null);
      }
    });

    return () => unsubscribe();
  }, [queryClient, dispatch]);

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
