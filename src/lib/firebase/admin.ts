import 'server-only';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;
let adminAuthInstance: Auth | null = null;
let adminDbInstance: Firestore | null = null;

try {
  if (!getApps().length) {
    const b64 = process.env.FIREBASE_ADMIN_CREDENTIALS_BASE64;
    if (b64) {
      // Remove any whitespace or newlines from the base64 string
      const sanitizedB64 = b64.replace(/\s/g, '');
      const decoded = Buffer.from(sanitizedB64, 'base64').toString('utf-8');
      const sa = JSON.parse(decoded);
      adminApp = initializeApp({ credential: cert(sa) });
    } else {
      console.warn("FIREBASE_ADMIN_CREDENTIALS_BASE64 is not set");
    }
  } else {
    adminApp = getApps()[0]!;
  }

  if (adminApp) {
    adminAuthInstance = getAuth(adminApp);
    adminDbInstance   = getFirestore(adminApp);
  }
} catch (error) {
  console.error("Firebase Admin initialization failed:", error);
}

export const adminAuth = adminAuthInstance as Auth;
export const adminDb   = adminDbInstance as Firestore;
