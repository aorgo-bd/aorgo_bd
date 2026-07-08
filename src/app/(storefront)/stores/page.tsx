import { Metadata } from "next";
import StoresClient from "./StoresClient";

export const metadata: Metadata = {
  title: "Stores | AORGO",
  description:
    "Discover verified fashion & lifestyle vendors on AORGO. Browse every store, explore their collections and shop directly from your favourite sellers across Bangladesh.",
  openGraph: {
    title: "Stores | AORGO",
    description:
      "Discover verified fashion & lifestyle vendors on AORGO and shop directly from their stores.",
    type: "website",
  },
};

export default function StoresPage() {
  return <StoresClient />;
}
