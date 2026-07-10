import Link from "next/link";
import { LegalPage } from "@/components/storefront/LegalPage";

export const metadata = {
  title: "Privacy Policy | AORGO",
  description: "How AORGO collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="July 2026">
      <p>
        This Privacy Policy explains how AORGO collects, uses, and protects your personal information
        when you use our marketplace.
      </p>

      <h2>1. Information We Collect</h2>
      <ul>
        <li><strong>Account data:</strong> name, email, phone number, and password.</li>
        <li><strong>Order data:</strong> delivery address, order history, and contact details.</li>
        <li><strong>Usage data:</strong> pages visited and interactions, used to improve the service.</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To process and deliver your orders.</li>
        <li>To provide customer support and communicate order updates.</li>
        <li>To detect and prevent fraud and abuse.</li>
        <li>To improve our products and marketing (aggregated, non-identifying analytics).</li>
      </ul>

      <h2>3. Sharing</h2>
      <p>
        We share delivery details with the relevant seller and courier only to fulfil your order. We
        do not sell your personal data to third parties.
      </p>

      <h2>4. Data Security</h2>
      <p>
        We use industry-standard security measures, including access controls and encryption in
        transit. Passwords are managed by Firebase Authentication and are never stored in plain text
        by AORGO.
      </p>

      <h2>5. Your Rights</h2>
      <ul>
        <li>You may access and update your account information at any time from your profile.</li>
        <li>You may request deletion of your account by contacting support.</li>
      </ul>

      <h2>6. Cookies & Analytics</h2>
      <p>
        We use essential cookies to keep you signed in and may use analytics tools to understand how
        the site is used. You can control cookies through your browser settings.
      </p>

      <h2>7. Contact</h2>
      <p>
        For privacy questions, please reach us via the <Link href="/support">Support</Link> page.
      </p>
    </LegalPage>
  );
}
