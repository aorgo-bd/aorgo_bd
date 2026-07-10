import "server-only";

/**
 * Startup environment contract. Validated once on the server so a
 * missing/misspelled variable fails fast at boot with an actionable message,
 * instead of surfacing as a cryptic "Cannot read properties of null" deep
 * inside a request handler.
 *
 * Only imported from server code (layout, admin SDK). Client code reads the
 * NEXT_PUBLIC_* values directly from process.env as usual.
 */

const REQUIRED_PUBLIC = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
  "NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET",
] as const;

const REQUIRED_SERVER = ["FIREBASE_ADMIN_CREDENTIALS_BASE64"] as const;

function collectMissing(keys: readonly string[]): string[] {
  return keys.filter((k) => {
    const v = process.env[k];
    return !v || v.trim() === "";
  });
}

function validateAdminCredentials(): string | null {
  const b64 = process.env.FIREBASE_ADMIN_CREDENTIALS_BASE64;
  if (!b64) return null; // absence already reported by REQUIRED_SERVER
  try {
    const decoded = Buffer.from(b64.replace(/\s/g, ""), "base64").toString("utf-8");
    const sa = JSON.parse(decoded);
    if (!sa.project_id || !sa.client_email || !sa.private_key) {
      return "FIREBASE_ADMIN_CREDENTIALS_BASE64 is missing project_id/client_email/private_key.";
    }
    return null;
  } catch {
    return "FIREBASE_ADMIN_CREDENTIALS_BASE64 is not valid base64-encoded service-account JSON.";
  }
}

let validated = false;

export function validateServerEnv() {
  if (validated) return;

  const missing = [...collectMissing(REQUIRED_PUBLIC), ...collectMissing(REQUIRED_SERVER)];
  const errors: string[] = [];
  if (missing.length) {
    errors.push(`Missing required environment variables: ${missing.join(", ")}`);
  }
  const credError = validateAdminCredentials();
  if (credError) errors.push(credError);

  if (errors.length) {
    const message =
      "❌ AORGO environment validation failed:\n  - " +
      errors.join("\n  - ") +
      "\nSee .env.example / HANDOVER.md for where each value comes from.";
    // Fail fast at boot rather than deep inside a request.
    throw new Error(message);
  }

  validated = true;
}

// Validate on import (server boot / build data-collection).
validateServerEnv();
