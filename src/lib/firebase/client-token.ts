import { auth } from "./client";

export async function getFreshIdToken() {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) {
    throw new Error("You must be signed in to perform this action.");
  }
  return idToken;
}