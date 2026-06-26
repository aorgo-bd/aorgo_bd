import { db } from "./client";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { User, Role } from "../types";

export async function createOrGetUserDocument(
  firebaseUser: any,
  additionalData?: { displayName?: string; intendedRole?: Role }
): Promise<User | null> {
  if (!firebaseUser) return null;

  try {
    const userRef = doc(db, "users", firebaseUser.uid);
    const snapshot = await getDoc(userRef);

    // EXISTING USER — return as-is, NEVER mutate role on login
    if (snapshot.exists()) {
      return snapshot.data() as User;
    }

    // BRAND-NEW USER — create with intendedRole, default to 'customer'
    const displayName = additionalData?.displayName || firebaseUser.displayName || "";
    const email = firebaseUser.email || "";
    const photoURL = firebaseUser.photoURL || "";
    const now = Date.now();

    const newUserData: User = {
      uid: firebaseUser.uid,
      role: "customer",
      email,
      displayName,
      photoURL,
      addresses: [],
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(userRef, newUserData);
    return newUserData;
  } catch (error) {
    console.error("Error in createOrGetUserDocument:", error);
    throw error;
  }
}
