import { config } from "dotenv";
config({ path: ".env.local" });

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

/**
 * Grant (or revoke) admin access to a user.
 *
 * Usage:
 *   npx tsx scripts/make-admin.ts <email> [role]
 *
 * Examples:
 *   npx tsx scripts/make-admin.ts aorgobd@gmail.com          # grant admin
 *   npx tsx scripts/make-admin.ts someone@shop.com seller    # set role to seller
 *   npx tsx scripts/make-admin.ts someone@shop.com customer  # revoke admin
 *
 * Both the Firestore `users/{uid}.role` (read by the app/UI) and the Firebase
 * Auth custom claim `role` (read by middleware + Firestore rules) are updated,
 * so the session cookie carries the role on the user's next sign-in.
 */

const VALID_ROLES = ["customer", "seller", "admin"] as const;
type Role = (typeof VALID_ROLES)[number];

// Fallback keeps the original one-shot behaviour when no args are passed.
const DEFAULT_EMAIL = "aorgobd@gmail.com";

const email = (process.argv[2] || DEFAULT_EMAIL).trim();
const role = (process.argv[3] || "admin").trim() as Role;

if (!VALID_ROLES.includes(role)) {
  console.error(`❌ Invalid role "${role}". Must be one of: ${VALID_ROLES.join(", ")}`);
  process.exit(1);
}

if (getApps().length === 0) {
  const base64 = process.env.FIREBASE_ADMIN_CREDENTIALS_BASE64;
  if (!base64) {
    console.error("❌ FIREBASE_ADMIN_CREDENTIALS_BASE64 is not set in .env.local");
    process.exit(1);
  }
  const decoded = Buffer.from(base64, "base64").toString("utf-8");
  initializeApp({ credential: cert(JSON.parse(decoded)) });
}

const db = getFirestore();
const auth = getAuth();

async function setRole() {
  console.log(`Setting role "${role}" for ${email}...`);

  // 1. Resolve the Auth user by email.
  const authUser = await auth.getUserByEmail(email);
  const uid = authUser.uid;
  console.log(`   Resolved UID: ${uid}`);

  // 2. Upsert the Firestore user document.
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  if (userSnap.exists) {
    await userRef.update({ role, updatedAt: Date.now() });
    console.log(`✅ Updated users/${uid}.role → '${role}'.`);
  } else {
    await userRef.set({
      uid,
      email,
      role,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      addresses: [],
    });
    console.log(`✅ Created users/${uid} with role '${role}'.`);
  }

  // 3. Set (or clear) the Auth custom claim consumed by middleware + rules.
  await auth.setCustomUserClaims(uid, role === "customer" ? null : { role });
  console.log(`✅ Custom claims set to ${role === "customer" ? "{} (cleared)" : `{ role: '${role}' }`}.`);

  console.log(`🎉 Done. ${email} must sign out and back in to refresh their session token.`);
}

setRole()
  .then(() => process.exit(0))
  .catch((e) => {
    if (e?.code === "auth/user-not-found") {
      console.error(`❌ No Firebase Auth user found for "${email}". They must register/sign in first.`);
    } else {
      console.error("❌ Failed to set role:", e);
    }
    process.exit(1);
  });
