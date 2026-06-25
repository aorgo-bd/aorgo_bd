import { config } from "dotenv";
config({ path: ".env.local" });

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

if (getApps().length === 0) {
  const decoded = Buffer.from(
    process.env.FIREBASE_ADMIN_CREDENTIALS_BASE64!,
    "base64"
  ).toString("utf-8");
  initializeApp({ credential: cert(JSON.parse(decoded)) });
}
const db = getFirestore();
const auth = getAuth();

const UID = "xeN4U5u2PuXV3JX2XY5myABPbiX2";
const EMAIL = "aorgobd@gmail.com";

async function makeAdmin() {
  console.log(`Setting role to admin for UID: ${UID}, Email: ${EMAIL}...`);
  
  // 1. Update Firestore user document
  const userRef = db.collection("users").doc(UID);
  const userSnap = await userRef.get();
  
  if (userSnap.exists) {
    await userRef.update({
      role: "admin",
      updatedAt: Date.now()
    });
    console.log("✅ Updated user role to 'admin' in Firestore.");
  } else {
    // If user document doesn't exist, create it
    await userRef.set({
      uid: UID,
      email: EMAIL,
      role: "admin",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      addresses: []
    });
    console.log("✅ User document did not exist. Created new admin user document in Firestore.");
  }

  // 2. Set Firebase Auth custom claims
  await auth.setCustomUserClaims(UID, { role: "admin" });
  console.log("✅ Set Custom User Claims to { role: 'admin' } in Firebase Auth.");

  console.log("🎉 Successfully made user admin!");
}

makeAdmin()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ Failed to set user as admin:", e);
    process.exit(1);
  });
