import { db } from "./client";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { User } from "../types";

export async function createOrGetUserDocument(
  firebaseUser: any,
  additionalData?: { displayName?: string }
): Promise<User | null> {
  if (!firebaseUser) return null;

  try {
    const userRef = doc(db, "users", firebaseUser.uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      const displayName = additionalData?.displayName || firebaseUser.displayName || "";
      const email = firebaseUser.email || "";
      const photoURL = firebaseUser.photoURL || "";
      const now = Date.now();

      const newUserData: User = {
        uid: firebaseUser.uid,
        role: "customer", // Default role is 'customer'
        email,
        displayName,
        photoURL,
        addresses: [],
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(userRef, newUserData);
      return newUserData;
    }

    return snapshot.data() as User;
  } catch (error) {
    console.error("Error in createOrGetUserDocument:", error);
    throw error;
  }
}
