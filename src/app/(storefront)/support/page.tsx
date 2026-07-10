import Link from "next/link";
import { LegalPage } from "@/components/storefront/LegalPage";
import { adminDb } from "@/lib/firebase/admin";
import type { StorefrontSettings } from "@/lib/types";

export const metadata = {
  title: "Contact & Support | AORGO",
  description: "Get help with your AORGO orders, returns, and account.",
};

const DEFAULTS = {
  supportEmail: "support@aorgo.com",
  supportPhone: "01700000000",
};

async function getSupportContact() {
  try {
    if (!adminDb) return DEFAULTS;
    const snap = await adminDb.collection("settings").doc("storefront").get();
    if (!snap.exists) return DEFAULTS;
    const data = snap.data() as Partial<StorefrontSettings>;
    return {
      supportEmail: data.supportEmail || DEFAULTS.supportEmail,
      supportPhone: data.supportPhone || DEFAULTS.supportPhone,
    };
  } catch {
    return DEFAULTS;
  }
}

export default async function SupportPage() {
  const { supportEmail, supportPhone } = await getSupportContact();

  return (
    <LegalPage title="Contact & Support">
      <p>
        We&apos;re here to help. Reach the AORGO customer care team through any of the channels below,
        and we&apos;ll get back to you as quickly as we can.
      </p>

      <h2>Get in Touch</h2>
      <ul>
        <li>
          <strong>Email:</strong> <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
        </li>
        <li>
          <strong>Phone / WhatsApp:</strong> <a href={`tel:${supportPhone}`}>{supportPhone}</a>
        </li>
        <li>
          <strong>Hours:</strong> Saturday–Thursday, 10:00 AM – 8:00 PM (BST)
        </li>
      </ul>

      <h2>Quick Links</h2>
      <ul>
        <li>Track an order on your <Link href="/orders">Orders</Link> page.</li>
        <li>Read our <Link href="/returns">Returns &amp; Order Tracking</Link> policy.</li>
        <li>Browse the <Link href="/faq">FAQ</Link> for instant answers.</li>
      </ul>

      <h2>For Sellers</h2>
      <p>
        Seller-related queries (onboarding, payouts, product approvals) can be sent to the same
        support email — mention &quot;Seller&quot; in the subject line so we can route it to the right team.
      </p>
    </LegalPage>
  );
}
