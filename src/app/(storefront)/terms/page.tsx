import Link from "next/link";
import { LegalPage } from "@/components/storefront/LegalPage";

export const metadata = {
  title: "Terms & Conditions | AORGO",
  description: "The terms governing your use of the AORGO marketplace.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions" updated="July 2026">
      <p>
        Welcome to AORGO. By accessing or using our website and services you agree to be bound by
        these Terms & Conditions. Please read them carefully. If you do not agree, please do not use
        the platform.
      </p>

      <h2>1. About AORGO</h2>
      <p>
        AORGO is a multi-vendor fashion and lifestyle marketplace operating in Bangladesh. Products
        are sold by independent verified sellers. AORGO facilitates the transaction but the seller is
        responsible for the products they list.
      </p>

      <h2>2. Accounts</h2>
      <ul>
        <li>You must provide accurate information when creating an account.</li>
        <li>You are responsible for keeping your login credentials secure.</li>
        <li>You must be at least 18 years old, or use the platform under the supervision of a guardian.</li>
      </ul>

      <h2>3. Orders & Payment</h2>
      <ul>
        <li>All prices are shown in Bangladeshi Taka (৳) and are inclusive of applicable taxes.</li>
        <li>Currently, Cash on Delivery (COD) is the supported payment method.</li>
        <li>An order is confirmed only after it is accepted by the seller. AORGO may cancel any order in case of pricing errors, stock issues, or suspected fraud.</li>
      </ul>

      <h2>4. Sellers</h2>
      <p>
        Sellers must comply with all applicable laws, provide genuine products, and honour the
        return and delivery commitments described on the platform. Listings are subject to admin
        approval and may be removed at AORGO&apos;s discretion.
      </p>

      <h2>5. Prohibited Use</h2>
      <ul>
        <li>Do not use the platform for unlawful purposes or to sell counterfeit goods.</li>
        <li>Do not attempt to disrupt, reverse-engineer, or gain unauthorized access to our systems.</li>
      </ul>

      <h2>6. Limitation of Liability</h2>
      <p>
        AORGO provides the platform on an &quot;as is&quot; basis. To the extent permitted by law, we are not
        liable for indirect or consequential losses arising from your use of the marketplace.
      </p>

      <h2>7. Changes</h2>
      <p>
        We may update these terms from time to time. Continued use of the platform after changes
        constitutes acceptance of the revised terms.
      </p>

      <h2>8. Contact</h2>
      <p>
        Questions about these terms? Visit our <Link href="/support">Support</Link> page.
      </p>
    </LegalPage>
  );
}
