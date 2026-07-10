import Link from "next/link";
import { LegalPage } from "@/components/storefront/LegalPage";

export const metadata = {
  title: "Returns & Order Tracking | AORGO",
  description: "AORGO's return, exchange, and order tracking policy.",
};

export default function ReturnsPage() {
  return (
    <LegalPage title="Returns & Order Tracking" updated="July 2026">
      <h2>Tracking Your Order</h2>
      <p>
        You can track any order from your <Link href="/orders">Orders</Link> page. Each order shows a live
        status timeline — Pending, Confirmed, Processing, Shipped, and Delivered — along with the
        courier and tracking reference once your parcel is dispatched.
      </p>

      <h2>7-Day Easy Returns</h2>
      <p>
        Most items can be returned within <strong>7 days</strong> of delivery if they meet the
        conditions below:
      </p>
      <ul>
        <li>The item is unused, unwashed, and in its original condition with tags attached.</li>
        <li>Original packaging is intact.</li>
        <li>You have proof of purchase (your AORGO order ID).</li>
      </ul>

      <h2>Non-Returnable Items</h2>
      <ul>
        <li>Innerwear, lingerie, and cosmetics for hygiene reasons.</li>
        <li>Items marked &quot;Final Sale&quot; on the product page.</li>
        <li>Products damaged due to misuse.</li>
      </ul>

      <h2>How to Request a Return</h2>
      <ul>
        <li>Open the delivered order from your <Link href="/orders">Orders</Link> page.</li>
        <li>Choose &quot;Return / Replace&quot; within the 7-day window.</li>
        <li>Our team and the seller will arrange a pickup or drop-off.</li>
      </ul>

      <h2>Refunds</h2>
      <p>
        As Cash on Delivery is the current payment method, approved refunds are issued via bKash /
        Nagad / bank transfer to the account you provide, typically within 5–7 business days of the
        returned item being received and inspected.
      </p>

      <h2>Need Help?</h2>
      <p>
        Visit our <Link href="/support">Support</Link> page or check the <Link href="/faq">FAQ</Link>.
      </p>
    </LegalPage>
  );
}
