import Link from "next/link";
import { LegalPage } from "@/components/storefront/LegalPage";

export const metadata = {
  title: "FAQ | AORGO",
  description: "Frequently asked questions about shopping and selling on AORGO.",
};

const FAQS: { q: string; a: string }[] = [
  {
    q: "How do I place an order?",
    a: "Browse or search for a product, select your size and colour, add it to your bag, and proceed to checkout. Enter your delivery address and confirm — that's it.",
  },
  {
    q: "What payment methods are supported?",
    a: "Cash on Delivery (COD) is currently available across Bangladesh. bKash, Nagad, and card payments are coming soon.",
  },
  {
    q: "How much is delivery?",
    a: "Delivery fees are calculated at checkout based on your order value. Orders above the free-shipping threshold qualify for free delivery, and first orders may receive a free-shipping benefit.",
  },
  {
    q: "How long will delivery take?",
    a: "Most orders are delivered within 3–5 business days depending on your location and the seller's dispatch time.",
  },
  {
    q: "Can I return an item?",
    a: "Yes. Most items can be returned within 7 days of delivery. See our Returns page for full details.",
  },
  {
    q: "How do I track my order?",
    a: "Go to your Orders page to see a live status timeline and courier tracking reference once your order ships.",
  },
  {
    q: "How do I become a seller?",
    a: "Click 'Become a Seller', complete the registration form with your store details, trade licence, and NID. Once approved by our team, you can start listing products.",
  },
];

export default function FaqPage() {
  return (
    <LegalPage title="Frequently Asked Questions">
      {FAQS.map((item) => (
        <div key={item.q}>
          <h2>{item.q}</h2>
          <p>{item.a}</p>
        </div>
      ))}
      <p>
        Still need help? Visit our <Link href="/support">Support</Link> page.
      </p>
    </LegalPage>
  );
}
