import 'server-only';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App;
if (!getApps().length) {
  const decoded = Buffer.from(process.env.FIREBASE_ADMIN_CREDENTIALS_BASE64!, 'base64').toString('utf-8');
  const sa = JSON.parse(decoded);
  adminApp = initializeApp({ credential: cert(sa) });
} else {
  adminApp = getApps()[0]!;
}

export const adminAuth = getAuth(adminApp);
export const adminDb   = getFirestore(adminApp);
